// Drive actual UI buttons with the same immediate-score policy as the headless bot.
import { launch, preparePage, qaReady, show, assertClean, report } from './browser.mjs';
const browser=await launch();
const sessions=[];
try{
 const {page,context,errors}=await preparePage(browser,{width:907,height:510});
 await qaReady(page);
 await page.evaluate(async()=>{window.__coreQA=await import('/src/core/index.ts');});
 let won=false;
 for(let seed=0;seed<12&&!won;seed++){
  await show(page,'run');
  await page.evaluate(seed=>{Object.assign(window.hexZooQA.state(),window.__coreQA.createRun('balance-v1-'+seed));document.querySelector('[data-action="pause"]').click();document.querySelector('[data-action="close"]').click();},seed);
  const phases=new Set();let actions=0,stalled=0;
  for(let guard=0;guard<1000;guard++){
   const state=await page.evaluate(()=>window.hexZooQA.state());phases.add(state.phase);
   if(['lost','won'].includes(state.phase)){won=state.phase==='won';break;}
   const decision=await page.evaluate(()=>{
    const C=window.__coreQA,s=window.hexZooQA.state();
    const av=a=>a.base+({adjacent:8,count:23,edge:9,corner:20,bonus:6,deck:15,gift:6,garden:4,echo:23,diverse:9}[a.ability]);
    const cv=id=>{const c=C.charmById(id);return({points:c.amount*2,family:c.amount,edge:c.amount,diverse:c.amount*9,chain:c.amount*65,bonus:c.amount,deck:c.amount*25,coins:8,repeat:c.amount*85,growth:c.amount*220}[c.effect]);};
    const ov=o=>o.kind==='animal'?av(C.animalById(o.id)):o.kind==='charm'?cv(o.id):C.snackById(o.id).price+7;
    if(s.phase==='playing'){
     if(s.snacks.length&&s.day>=2){const snack=C.snackById(s.snacks[0]);if(snack.effect!=='place'||s.places<s.maxPlaces)return{type:'snack',hand:s.hand.reduce((b,t,i,a)=>av(C.animalById(t.animalId))>av(C.animalById(a[b].animalId))?i:b,0)};}
     const moves=C.legalMoves(s);if(!moves.length)return{type:'stalled'};
     return{type:'place',...moves.reduce((b,m)=>C.previewPlacement(s,m.handIndex,m.cellId).total>C.previewPlacement(s,b.handIndex,b.cellId).total?m:b,moves[0])};
    }
    if(s.phase==='reward'){
     if(!s.rewardChosen)return{type:'choose',index:s.offers.reduce((b,o,i,a)=>ov(o)>ov(a[b])?i:b,0)};
     if(!s.removed&&s.deck.length>7)return{type:'remove',uid:s.deck.reduce((a,b)=>av(C.animalById(a.animalId))<av(C.animalById(b.animalId))?a:b).uid};
     return{type:'continue'};
    }
    if(s.phase==='shop'){
     const stock=s.shop.map((o,i)=>({o,i})).filter(({o})=>!o.sold&&s.coins>=o.price&&(o.kind!=='charm'||s.charms.length<5));
     stock.sort((a,b)=>(b.o.kind==='charm'?cv(b.o.id):C.snackById(b.o.id).price/2)-(a.o.kind==='charm'?cv(a.o.id):C.snackById(a.o.id).price/2));
     return stock.length?{type:'buy',index:stock[0].i}:{type:'continue'};
    }
   });
   if(decision.type==='stalled'){stalled++;throw new Error('No legal action in UI run');}
   switch(decision.type){
    case'place':await page.locator(`.hand [data-index="${decision.handIndex}"]`).click();await page.locator(`[data-cell="${decision.cellId}"]`).click();break;
    case'snack':await page.locator(`.hand [data-index="${decision.hand}"]`).click();await page.locator('[data-action="snacks"]').click();await page.locator('[data-action="snack"]').first().click();break;
    case'choose':await page.locator(`[data-action="choose"][data-index="${decision.index}"]`).click();break;
    case'remove':await page.locator('[data-action="remove"]').click();await page.locator(`[data-action="release"][data-id="${decision.uid}"]`).click();break;
    case'buy':await page.locator(`[data-action="buy"][data-index="${decision.index}"]`).click();break;
    case'continue':await page.locator('[data-action="continue"]').click();break;
   }
   actions++;
  }
  const final=await page.evaluate(()=>window.hexZooQA.state());
  sessions.push({seed:final.seed,phase:final.phase,day:final.day,placements:final.placements,actions,stalled,phases:[...phases]});
  if(won){
   await page.locator('[data-action="continue"]').click();
   // Victory offers the day-12 reward before the first Endless board.
   await page.locator('[data-action="choose"]').first().click();
   await page.locator('[data-action="continue"]').click();
   const endless=await page.evaluate(()=>window.hexZooQA.state());
   if(endless.day!==13||endless.phase!=='playing')throw new Error('Endless did not start after victory');
   sessions[sessions.length-1].endless=true;
  }
 }
 if(!won)throw new Error('No victorious UI run in 12 fixed seeds');
 assertClean(errors,'Full UI run');
 await report('ui-run.json',{status:'PASS',sessions,errors});
 console.log(`PASS: ${sessions.length} complete UI runs, draft/release/shop/snacks and Endless; no stalled states or console/page errors.`);
 await context.close();
}finally{await browser.close();}
