import { describe,it,expect } from 'vitest';
import { createRun,placeTile,continueRun,chooseOffer,removeTile,useSnack,buyOffer,lockOffer,rerollShop,goalForDay,legalMoves } from './game';
import { scoreTile,previewPlacement } from './score';
import { makeBoard,neighbours,isCorner } from './board';
import { ANIMALS } from './content/animals';
import { CHARMS,SNACKS } from './content/items';
import { EVENTS,KEEPERS,dailySeed,tomorrowEvent } from './content/keepers';
import { RNG } from './rng';
import type { RunState,Tile,Ability } from './types';
const t=(animalId='moss-marten',uid='a'):Tile=>({uid,animalId,bonus:0,mult:1});
function blank():RunState{const s=createRun('test','oren');s.board=makeBoard();s.charms=[];return s}
function ability(kind:Ability){return ANIMALS.find(a=>a.family==='grove'&&a.ability===kind)!}
describe('determinism and board',()=>{
 it('uses seeded RNG with reproducible shuffles',()=>{expect(new RNG('seed').shuffle([1,2,3,4])).toEqual(new RNG('seed').shuffle([1,2,3,4]));expect(createRun('abc')).toEqual(createRun('abc'))});
 it('has19 unique axial cells,6 corners and6 centre neighbours',()=>{const b=makeBoard();expect(b).toHaveLength(19);expect(new Set(b.map(c=>c.id)).size).toBe(19);expect(b.filter(isCorner)).toHaveLength(6);expect(neighbours(b,b.find(c=>c.id==='0,0')!)).toHaveLength(6)});
 it('all content has distinct IDs and plain rules',()=>{expect(ANIMALS).toHaveLength(40);expect(SNACKS).toHaveLength(12);expect(CHARMS).toHaveLength(20);expect(KEEPERS).toHaveLength(3);expect(EVENTS).toHaveLength(6);for(const list of [ANIMALS,SNACKS,CHARMS,KEEPERS,EVENTS]){expect(new Set(list.map(a=>a.id)).size).toBe(list.length);expect(list.every(a=>a.text.length>9)).toBe(true)}});
});
describe('score order and every animal ability',()=>{
 it('applies base,cell,neighbours,charms,multipliers in order with no mutation',()=>{const s=blank(),cell=s.board.find(c=>c.id==='0,0')!;cell.bonus=3;cell.mult=2;s.board.find(c=>c.id==='1,0')!.tile=t();s.charms=['picnic-cloth'];const tile={...t(),bonus:2,mult:2};const before=structuredClone(s);const r=scoreTile(s,tile,cell);expect(r.total).toBe(126);expect(r.steps.map(x=>x.stage)).toEqual(['base','cell','neighbours','charms','multipliers','multipliers','multipliers']);expect(s).toEqual(before)});
 it('adjacency counts only matching neighbours',()=>{const s=blank();s.board.find(c=>c.id==='1,0')!.tile=t();s.board.find(c=>c.id==='-1,0')!.tile=t('brook-otter');const a=ability('adjacent');expect(scoreTile(s,t(a.id),s.board.find(c=>c.id==='0,0')!).total).toBe((a.base+5)*1.5|0)});
 it('count repeats for all same family on board, never recursively',()=>{const s=blank();s.board[0].tile=t();s.board[1].tile=t();const a=ability('count');expect(scoreTile(s,t(a.id),s.board.find(c=>c.id==='0,0')!).total).toBe(a.base*3)});
 it('edge adds points on outside spaces',()=>{const s=blank(),a=ability('edge');expect(scoreTile(s,t(a.id),s.board[0]).total).toBe(a.base+12+4)});
 it('corner triples after additive keeper and cell points',()=>{const s=blank(),a=ability('corner'),c=s.board.find(isCorner)!;c.bonus=3;expect(scoreTile(s,t(a.id),c).total).toBe((a.base+3+4)*3)});
 it('bonus ability checks neighbouring bonus spaces',()=>{const s=blank(),a=ability('bonus');s.board.find(c=>c.id==='1,0')!.bonus=5;expect(scoreTile(s,t(a.id),s.board.find(c=>c.id==='0,0')!).total).toBe(a.base+8)});
 it('deck ability counts current permanent animals',()=>{const s=blank(),a=ability('deck');expect(scoreTile(s,t(a.id),s.board.find(c=>c.id==='0,0')!).total).toBe(a.base+s.deck.length)});
 it('echo repeats by occupied neighbour count across families',()=>{const s=blank(),a=ability('echo');s.board.find(c=>c.id==='1,0')!.tile=t('brook-otter');expect(scoreTile(s,t(a.id),s.board.find(c=>c.id==='0,0')!).total).toBe(a.base*2)});
 it('diverse needs all four families including the arriving animal',()=>{const s=blank(),a=ability('diverse');['dune-fennec','brook-otter','velvet-genet'].forEach((id,i)=>s.board[i].tile=t(id));expect(scoreTile(s,t(a.id),s.board.find(c=>c.id==='0,0')!).total).toBe(a.base*2)});
 it('garden adds5 to a deterministic free neighbour after scoring',()=>{const s=blank();s.hand=[t(ability('garden').id)];s.goal=999;const r=placeTile(s,0,'0,0');expect(r.state.board.filter(c=>c.bonus===5)).toHaveLength(1);expect(s.board.every(c=>c.bonus===0)).toBe(true)});
 it('gift leaves deck and adds one unique charm after scoring',()=>{const s=blank(),gift=t(ability('gift').id);s.hand=[gift];s.deck.push(gift);s.goal=999;const {state}=placeTile(s,0,'0,0');expect(state.deck.some(t=>t.uid===gift.uid)).toBe(false);expect(state.charms).toHaveLength(1)});
});
describe('day,reward,shop,snack flows',()=>{
 it('rejects illegal placements and never mutates a run',()=>{const s=createRun('abc');const before=structuredClone(s);const r=placeTile(s,0,'0,0');expect(s).toEqual(before);if(r.state.phase==='playing')expect(()=>placeTile(r.state,0,'0,0')).toThrow();expect(()=>previewPlacement(s,0,'99,99')).toThrow()});
 it('tutorial arrows always permit three placements or an earlier win over100seeds',()=>{for(let i=0;i<100;i++){let s=createRun(`tutorial-${i}`);for(const id of ['0,0','1,0','0,1'])if(s.phase==='playing')s=placeTile(s,0,id).state;expect(s.phase).toBe('reward')}});
 it('requires one pick and permits one deck removal',()=>{let s=blank();s.goal=1;s=placeTile(s,0,'0,0').state;expect(s.phase).toBe('reward');expect(()=>continueRun(s)).toThrow();s=removeTile(s,s.deck[0].uid);expect(()=>removeTile(s,s.deck[0].uid)).toThrow();s=chooseOffer(s,0);expect(()=>chooseOffer(s,1)).toThrow();s=continueRun(s);expect(s.day).toBe(2);expect(s.hand).toHaveLength(5)});
 it('opens shop after3,6,9; buys,locks and restocks',()=>{let s=blank();s.day=3;s.goal=1;s.coins=100;s=placeTile(s,0,'0,0').state;s=chooseOffer(s,0);s=continueRun(s);expect(s.phase).toBe('shop');s=lockOffer(s,0);const id=s.shop[0].id;s=rerollShop(s);expect(s.shop[0].id).toBe(id);s=buyOffer(s,0);expect(s.shop[0].sold).toBe(true);expect(s.lockedOffer).toBeUndefined();s=continueRun(s);expect(s.day).toBe(4);expect(s.eventId).toBeTruthy()});
 it('consumes buffs once and resets hand buffs the following day',()=>{let s=blank();s.snacks=['berry-bite'];s=useSnack(s,0,0);expect(s.hand[0].bonus).toBe(8);expect(s.snacks).toHaveLength(0);s.goal=1;s=placeTile(s,0,'0,0').state;s=continueRun(chooseOffer(s,0));expect(s.hand.every(t=>t.bonus===0)).toBe(true)});
 it('lost runs stop,won runs continue to day13 without skipping',()=>{let s=blank();s.places=1;s.goal=1e9;s=placeTile(s,0,'0,0').state;expect(s.phase).toBe('lost');expect(legalMoves(s)).toHaveLength(0);s=blank();s.day=12;s.goal=1;s=placeTile(s,0,'0,0').state;expect(s.phase).toBe('won');expect(s.won).toBe(true);s=continueRun(s);s=chooseOffer(s,0);s=continueRun(s);expect(s.day).toBe(13)});
 it('goals scale from tens to six figures and daily naming is UTC stable',()=>{expect(goalForDay(1)).toBe(36);expect(goalForDay(12)).toBeGreaterThan(10000);expect(dailySeed(new Date('2026-10-28T23:59Z'))).toBe('daily-2026-10-28');expect(tomorrowEvent(new Date('2026-10-28')).name).toBeTruthy()});
});

describe('snack and charm effect families',()=>{
 it('snack multiply, garden, coins, family and place each apply exactly once',()=>{for(const id of ['orchard-slice','kelp-roll','plum-pouch','fern-wafer','trail-biscuit']){const s=blank();s.hand=[t()];s.snacks=[id];s.places--;const r=useSnack(s,0,0);expect(r.snacks).toHaveLength(0);if(id==='orchard-slice')expect(r.hand[0].mult).toBe(2);if(id==='kelp-roll')expect(r.board.every(c=>c.bonus===5)).toBe(true);if(id==='plum-pouch')expect(r.coins-s.coins).toBe(8);if(id==='fern-wafer')expect(r.hand[0].bonus).toBe(6);if(id==='trail-biscuit')expect(r.places).toBe(r.maxPlaces)}});
 it('all passive charm families produce finite deterministic results',()=>{for(const charm of CHARMS){const s=blank();s.day=8;s.charms=[charm.id];['moss-marten','dune-fennec','brook-otter','velvet-genet'].forEach((id,i)=>s.board[i].tile=t(id));const cell=s.board.find(c=>c.id==='0,0')!;cell.bonus=8;const a=scoreTile(s,t(),cell);expect(a.total).toBeGreaterThan(0);expect(a).toEqual(scoreTile(s,t(),cell));expect(Number.isFinite(a.total)).toBe(true)}});
 it('every event can be generated from a seeded run with5–8places',()=>{const seen=new Set<string>();for(let i=0;i<200;i++){let s=blank();s.seed=`event-${i}`;s.rng=new RNG(s.seed).state;s.day=3;s.phase='shop';s=continueRun(s);seen.add(s.eventId!);expect(s.places).toBeGreaterThanOrEqual(5);expect(s.places).toBeLessThanOrEqual(8);if(s.eventId==='frost-pockets')expect(s.board.filter(c=>c.blocked)).toHaveLength(3);if(s.eventId==='lily-pond')expect(s.board.find(c=>c.id==='0,0')!.blocked).toBe(true)}expect(seen.size).toBe(6)});
 it('gift cannot exceed five charm slots or duplicate an owned charm',()=>{const s=blank();s.charms=CHARMS.slice(0,5).map(c=>c.id);s.hand=[t('bloom-binturong')];const r=placeTile(s,0,'0,0').state;expect(r.charms).toEqual(s.charms)});
});

describe('passive effect activation',()=>{
 it('every scoring charm increases a score when its printed condition holds',()=>{for(const charm of CHARMS.filter(c=>c.effect!=='coins')){const s=blank();s.day=8;const family=charm.family||'grove';const arriving=ANIMALS.find(a=>a.family===family&&a.ability==='adjacent')!;const families=['grove','sun','tide','dusk'] as const;const same=t(arriving.id);s.board.find(c=>c.id==='1,-2')!.tile=same;families.filter(f=>f!==family).forEach((f,i)=>{const a=ANIMALS.find(a=>a.family===f)!;s.board.find(c=>c.id===['0,-1','-1,-1','2,0'][i])!.tile=t(a.id)});const c=s.board.find(c=>c.id==='0,-2')!;c.bonus=8;const before=scoreTile(s,t(arriving.id),c).total;s.charms=[charm.id];expect(scoreTile(s,t(arriving.id),c).total,`${charm.name} activates`).toBeGreaterThan(before)}});
 it('coin charms pay on completed days only',()=>{const s=blank();s.goal=1;s.charms=['ticket-stamp'];expect(placeTile(s,0,'0,0').state.coins).toBe(8)});
});

describe('keeper starting rosters',()=>{
 it('uses distinct reproducible rosters matching each passive',()=>{const a=createRun('keeper-check','mira'),b=createRun('keeper-check','oren'),c=createRun('keeper-check','niko');expect(a.deck).toEqual(createRun('keeper-check','mira').deck);expect(a.deck.map(t=>t.animalId)).not.toEqual(b.deck.map(t=>t.animalId));expect(b.deck.map(t=>t.animalId)).not.toEqual(c.deck.map(t=>t.animalId));expect(b.deck.filter(t=>['edge','corner'].includes(ANIMALS.find(a=>a.id===t.animalId)!.ability))).toHaveLength(6);for(const f of ['grove','sun','tide','dusk'])expect(c.deck.filter(t=>ANIMALS.find(a=>a.id===t.animalId)!.family===f).length).toBeGreaterThanOrEqual(2)});
});
