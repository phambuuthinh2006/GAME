import type { RunState, Offer, Tile, ScoreResult } from './types';
import { ANIMALS, animalById } from './content/animals';
import { SNACKS, CHARMS, snackById, charmById } from './content/items';
import { KEEPERS, EVENTS } from './content/keepers';
import { RNG, hashSeed } from './rng';
import { makeBoard, neighbours, isEdge } from './board';
import { previewPlacement } from './score';
export const GOAL_UNITS=[36,140,190,240,260,290,330,370,420,480,560,650];
export function goalForDay(day:number):number{return Math.round((GOAL_UNITS[Math.min(day,12)-1]*Math.pow(1.32,Math.max(0,day-12)))*Math.pow(1.65,day-1))}
function random<T>(s:RunState,fn:(rng:RNG)=>T):T{const rng=new RNG(s.rng);const value=fn(rng);s.rng=rng.state;return value}
function tile(s:RunState,animalId:string):Tile{return {uid:`tile-${s.serial++}`,animalId,bonus:0,mult:1}}
function draw(s:RunState){while(s.hand.length<5&&s.draw.length)s.hand.push(s.draw.pop()!)}
function clone(s:RunState):RunState{return structuredClone(s)}
function offers(s:RunState):Offer[]{return random(s,r=>{const animals=r.shuffle(ANIMALS).slice(0,2);const snack=r.pick(SNACKS);return r.shuffle([...animals.map(a=>({kind:'animal' as const,id:a.id,price:0})),{kind:'snack' as const,id:snack.id,price:0}])})}
function stock(s:RunState):Offer[]{const locked=s.lockedOffer?{...s.lockedOffer,locked:false,sold:false}:undefined;s.lockedOffer=undefined;return random(s,r=>{const charms=r.shuffle(CHARMS.filter(c=>!s.charms.includes(c.id))).slice(0,2);const snacks=r.shuffle(SNACKS).slice(0,2);const result:Offer[]=[...charms.map(c=>({kind:'charm' as const,id:c.id,price:c.price})),...snacks.map(c=>({kind:'snack' as const,id:c.id,price:c.price}))];if(locked)result[0]=locked;return result})}
function beginDay(s:RunState):RunState{
 s.phase='playing';s.board=makeBoard();s.score=0;s.goal=goalForDay(s.day);s.maxPlaces=s.day===1?8:s.day>=8?7:8;s.places=s.maxPlaces;s.offers=[];s.rewardChosen=false;s.removed=false;s.eventId=undefined;
 const bonusCells=random(s,r=>r.shuffle(s.board));bonusCells[0].mult=2;bonusCells[1].bonus=8;bonusCells[2].bonus=5;bonusCells[3].bonus=5;
 if(s.day===1){for(const id of ['0,0','1,0','0,1'])s.board.find(c=>c.id===id)!.bonus=8}
 if(s.day%4===0){const index=s.daily?(Math.floor(Date.parse(s.seed.replace('daily-',''))/86400000)||hashSeed(s.seed))%EVENTS.length:random(s,r=>r.int(EVENTS.length));const ev=EVENTS[(index+Math.floor(s.day/4)-1)%EVENTS.length];s.eventId=ev.id;
 if(ev.effect==='frozen'){const cells=random(s,r=>r.shuffle(s.board.filter(isEdge))).slice(0,3);cells.forEach(c=>c.blocked=true)}
 if(ev.effect==='short'){s.maxPlaces--;s.places--;s.board.filter(c=>c.bonus>0).forEach(c=>c.bonus+=12)}
 if(ev.effect==='hole')s.board.find(c=>c.id==='0,0')!.blocked=true;
 if(ev.effect==='bonus')s.board.forEach(c=>c.bonus+=8);
 }
 s.hand=[];s.discard=[];s.draw=random(s,r=>r.shuffle(s.deck.map(t=>({...t,bonus:0,mult:1}))));draw(s);return s;
}
export function createRun(seed:string,keeperId='mira',daily=false):RunState{
 if(!KEEPERS.some(k=>k.id===keeperId))throw new Error('Unknown keeper');
 const s:RunState={seed,rng:hashSeed(seed),keeperId,daily,day:1,score:0,goal:36,places:8,maxPlaces:8,board:[],deck:[],draw:[],hand:[],discard:[],charms:[],snacks:[],coins:0,phase:'playing',offers:[],shop:[],rewardChosen:false,removed:false,totalScore:0,placements:0,won:false,serial:1,history:[]};
 // A seeded travelling roster avoids one compulsory animal dominating every winning zoo.
 const keeper=KEEPERS.find(k=>k.id===keeperId)!;
 const pool=random(s,r=>r.shuffle(ANIMALS));const first=pool.filter(a=>a.family===keeper.family).slice(0,3);const rest=pool.filter(a=>!first.includes(a)).slice(0,7);
 s.deck=[...first,...rest].map(a=>tile(s,a.id));return beginDay(s);
}
export function legalMoves(s:RunState):{handIndex:number;cellId:string}[]{if(s.phase!=='playing')return [];return s.hand.flatMap((_,handIndex)=>s.board.filter(c=>!c.blocked&&!c.tile).map(c=>({handIndex,cellId:c.id})))}
export function placeTile(state:RunState,handIndex:number,cellId:string):{state:RunState;result:ScoreResult}{
 if(state.phase!=='playing'||state.places<=0)throw new Error('The day is not open.');const result=previewPlacement(state,handIndex,cellId),s=clone(state);const t=s.hand.splice(handIndex,1)[0],cell=s.board.find(c=>c.id===cellId)!;cell.tile=t;s.discard.push(t);s.places--;s.placements++;s.score+=result.total;s.totalScore+=result.total;
 if(result.remove)s.deck=s.deck.filter(d=>d.uid!==t.uid);
 if(result.garden){const free=neighbours(s.board,cell).filter(c=>!c.blocked&&!c.tile).sort((a,b)=>a.id.localeCompare(b.id));if(free.length)free[0].bonus+=5}
 if(result.gift&&s.charms.length<5){const available=CHARMS.filter(c=>!s.charms.includes(c.id));if(available.length)s.charms.push(random(s,r=>r.pick(available)).id)}
 draw(s);
 if(s.score>=s.goal){s.history.push(s.score);s.coins+=6+Math.floor(s.day/2)+s.charms.map(charmById).filter(c=>c.effect==='coins').reduce((a,c)=>a+c.amount,0);if(s.day===12){s.won=true;s.phase='won'}else{s.phase='reward';s.offers=offers(s)}}
 else if(s.places<=0||!s.hand.length||!s.board.some(c=>!c.blocked&&!c.tile))s.phase='lost';
 return {state:s,result};
}
export function chooseOffer(state:RunState,index:number):RunState{if(state.phase!=='reward'||state.rewardChosen)throw new Error('Choose one reward.');const s=clone(state),o=s.offers[index];if(!o)throw new Error('Choose an offer.');if(o.kind==='animal')s.deck.push(tile(s,o.id));else if(o.kind==='snack')s.snacks.push(o.id);else if(s.charms.length<5&&!s.charms.includes(o.id))s.charms.push(o.id);s.rewardChosen=true;return s}
export function removeTile(state:RunState,uid:string):RunState{if(state.phase!=='reward'||state.removed||state.deck.length<=5)throw new Error('One removal per day; keep at least five animals.');const s=clone(state);if(!s.deck.some(t=>t.uid===uid))throw new Error('Animal not found.');s.deck=s.deck.filter(t=>t.uid!==uid);s.removed=true;return s}
export function continueRun(state:RunState):RunState{const s=clone(state);if(s.phase==='reward'){if(!s.rewardChosen)throw new Error('Pick your reward first.');if([3,6,9].includes(s.day)){s.phase='shop';s.shop=stock(s);return s}s.day++;return beginDay(s)}if(s.phase==='shop'){s.day++;return beginDay(s)}if(s.phase==='won'){s.phase='reward';s.rewardChosen=false;s.offers=offers(s);return s}throw new Error('Finish this day first.')}
export function buyOffer(state:RunState,index:number):RunState{if(state.phase!=='shop')throw new Error('The gift shop is closed.');const s=clone(state),o=s.shop[index];if(!o||o.sold)throw new Error('Offer unavailable.');if(s.coins<o.price)throw new Error('Earn more zoo coins first.');if(o.kind==='charm'&&(s.charms.length>=5||s.charms.includes(o.id)))throw new Error('Five charm slots are full.');s.coins-=o.price;o.sold=true;if(o.kind==='charm')s.charms.push(o.id);else if(o.kind==='snack')s.snacks.push(o.id);else s.deck.push(tile(s,o.id));if(o.locked)s.lockedOffer=undefined;return s}
export function rerollShop(state:RunState):RunState{if(state.phase!=='shop'||state.coins<3)throw new Error('Restock costs 3 coins.');const s=clone(state);s.coins-=3;const keep=s.shop.find(o=>o.locked&&!o.sold);if(keep)s.lockedOffer=keep;s.shop=stock(s);if(keep){s.shop[0].locked=true;s.lockedOffer={...s.shop[0]}}return s}
export function lockOffer(state:RunState,index:number):RunState{if(state.phase!=='shop')throw new Error('The gift shop is closed.');const s=clone(state),o=s.shop[index];if(!o||o.sold)throw new Error('Offer unavailable.');const was=o.locked;s.shop.forEach(o=>o.locked=false);o.locked=!was;s.lockedOffer=o.locked?{...o}:undefined;return s}
export function useSnack(state:RunState,snackIndex:number,handIndex:number):RunState{if(state.phase!=='playing')throw new Error('Use snacks during a day.');const s=clone(state),id=s.snacks[snackIndex],target=s.hand[handIndex];if(!id||!target)throw new Error('Choose a snack and an animal in hand.');const c=snackById(id);if(c.effect==='place'&&s.places>=s.maxPlaces)throw new Error('No places have been used yet.');s.snacks.splice(snackIndex,1);if(c.effect==='points')target.bonus+=c.amount;if(c.effect==='multiply')target.mult*=c.amount;if(c.effect==='family')s.hand.filter(t=>animalById(t.animalId).family==='grove').forEach(t=>t.bonus+=c.amount);if(c.effect==='garden')s.board.filter(c=>!c.blocked&&!c.tile).forEach(cell=>cell.bonus+=c.amount);if(c.effect==='coins')s.coins+=c.amount;if(c.effect==='place')s.places=Math.min(s.maxPlaces,s.places+c.amount);return s}
