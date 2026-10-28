import { launch, preparePage, qaReady, assertClean, report } from './browser.mjs';
const browser=await launch();
const results=[];
try{
  for(const [width,height] of [[390,844],[1280,720]]){
    const{page,context,errors}=await preparePage(browser,{width,height},{hasTouch:width<700});
    await page.addInitScript(()=>localStorage.clear());
    const started=Date.now();
    await qaReady(page);
    await page.locator('[data-action="play"]').click();
    await page.locator('.game').waitFor();
    if(await page.locator('[role="dialog"]').count())throw new Error('First play opened a popup');
    let firstPlacement=0,arrows=0;
    while(arrows<3){
      const guide=page.locator('.hex-cell.guided');
      if(!await guide.count())break;
      if(width<700)await guide.tap();else await guide.click();
      arrows++;
      if(!firstPlacement)firstPlacement=(Date.now()-started)/1000;
      const state=await page.evaluate(()=>window.hexZooQA.state());
      if(state.phase!=='playing')break;
    }
    const state=await page.evaluate(()=>window.hexZooQA.state());
    if(state.phase!=='reward')throw new Error(`${width}x${height}: arrow tutorial did not win day 1 after ${arrows} placements (score ${state.score}/${state.goal})`);
    if(firstPlacement>=10)throw new Error('First placement exceeded 10 seconds');
    await page.locator('[data-action="choose"]').first().click();
    await page.locator('[data-action="continue"]').click();
    const beforeDrag=await page.evaluate(()=>window.hexZooQA.state().placements);
    const source=await page.locator('.hand [data-action="select"]').first().boundingBox();
    const target=await page.locator('.hex-cell:not(.occupied):not(.blocked)').first().boundingBox();
    await page.mouse.move(source.x+source.width/2,source.y+source.height/2);
    await page.mouse.down();
    await page.mouse.move(target.x+target.width/2,target.y+target.height/2,{steps:8});
    await page.mouse.up();
    const afterDrag=await page.evaluate(()=>window.hexZooQA.state().placements);
    if(afterDrag!==beforeDrag+1)throw new Error(`${width}x${height}: drag failed to place an animal`);
    // A loaded local game continues offline: no SDK or remote asset request is needed.
    await context.setOffline(true);
    await page.waitForTimeout(150);
    const beforeOffline=await page.evaluate(()=>window.hexZooQA.state().placements);
    const empty=page.locator('.hex-cell:not(.occupied):not(.blocked)').first();
    if(width<700)await empty.tap();else await empty.click();
    const afterOffline=await page.evaluate(()=>window.hexZooQA.state().placements);
    if(afterOffline!==beforeOffline+1)throw new Error(`${width}x${height}: local offline placement failed`);
    await context.setOffline(false);
    assertClean(errors,`${width}x${height}`);
    results.push({width,height,firstPlacementSeconds:firstPlacement,arrowPlacements:arrows,day1Won:true,clicksToGameplay:1,dragPlacement:true,offlineAfterLoad:true});
    await context.close();
  }
  await report('firstplay.json',{status:'PASS',results});
  console.log('PASS: one click to gameplay; arrow tutorial wins. '+results.map(r=>r.width+'x'+r.height+': '+r.firstPlacementSeconds.toFixed(2)+' s to first placement').join('; '));
}finally{await browser.close();}
