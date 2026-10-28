import type { RunState, Tile, Cell, ScoreResult, ScoreStep } from './types';
import { animalById } from './content/animals';
import { charmById } from './content/items';
import { KEEPERS, EVENTS } from './content/keepers';
import { neighbours, isEdge, isCorner } from './board';
/** Fixed order: base → cell points → neighbour/positional/deck effects → additive charms → every multiplier.
 * Each placement scores the arriving tile once. Count/echo repeat that complete subtotal; they never recurse.
 * Board-changing/gift effects are applied by game.ts after this immutable calculation.
 */
export function scoreTile(state:RunState,tile:Tile,cell:Cell):ScoreResult{
 const animal=animalById(tile.animalId), near=neighbours(state.board,cell), occupied=near.filter(c=>c.tile);
 const same=occupied.filter(c=>animalById(c.tile!.animalId).family===animal.family).length;
 const onBoard=state.board.filter(c=>c.tile); const familyCount=onBoard.filter(c=>animalById(c.tile!.animalId).family===animal.family).length;
 const families=new Set(onBoard.map(c=>animalById(c.tile!.animalId).family));families.add(animal.family);
 const steps:ScoreStep[]=[];let total=0;
 const add=(stage:ScoreStep['stage'],label:string,n:number)=>{total+=n;steps.push({stage,label,amount:n,subtotal:total})};
 const mul=(label:string,n:number)=>{if(n===1)return;total*=n;steps.push({stage:'multipliers',label,amount:n,subtotal:Math.floor(total)})};
 add('base',`${animal.name} base`,animal.base+tile.bonus);
 add('cell',cell.bonus?`Space +${cell.bonus}`:'Space',cell.bonus);
 let ability=0;if(animal.ability==='adjacent')ability=same*animal.amount;
 if(animal.ability==='edge'&&isEdge(cell))ability=animal.amount;
 if(animal.ability==='bonus'&&near.some(c=>c.bonus>0||c.mult>1))ability=animal.amount;
 if(animal.ability==='deck')ability=state.deck.length;
 add('neighbours',animal.ability==='adjacent'?`${same} matching neighbours`:animal.text,ability);
 const keeper=KEEPERS.find(k=>k.id===state.keeperId)!;
 let keeperBonus=0;if(keeper.passive==='family'&&animal.family===keeper.family)keeperBonus=2;
 if(keeper.passive==='edge'&&isEdge(cell))keeperBonus=4;
 if(keeper.passive==='diverse'&&families.size>=3)keeperBonus=6;
 if(keeperBonus)add('charms',`${keeper.name}'s care`,keeperBonus);
 const multipliers:[string,number][]=[];
 for(const id of state.charms){const c=charmById(id);let bonus=0;
 if(c.effect==='points')bonus=c.amount;
 if(c.effect==='family'&&c.family===animal.family)bonus=c.amount;
 if(c.effect==='edge'&&isEdge(cell))bonus=c.amount;
 if(c.effect==='bonus'&&cell.bonus>0)bonus=c.amount;
 if(c.effect==='deck')bonus=c.amount*state.deck.length;
 if(bonus)add('charms',c.name,bonus);
 if(c.effect==='chain')multipliers.push([c.name,1+c.amount*same]);
 if(c.effect==='repeat')multipliers.push([c.name,1+c.amount*occupied.length]);
 if(c.effect==='diverse'&&families.size===4)multipliers.push([c.name,c.amount]);
 if(c.effect==='growth')multipliers.push([c.name,1+c.amount*state.day]);
 }
 mul('Space multiplier',cell.mult);mul('Snack boost',tile.mult);
 if(same)mul(`${same} family links`,1+same*.5);
 if(animal.ability==='count')mul(`${familyCount} family echoes`,1+familyCount);
 if(animal.ability==='echo')mul(`${occupied.length} neighbour echoes`,1+occupied.length);
 if(animal.ability==='corner'&&isCorner(cell))mul('Corner perch',3);
 if(animal.ability==='diverse'&&families.size===4)mul('Four-family gathering',2);
 for(const [label,n]of multipliers)mul(label,n);
 const event=EVENTS.find(e=>e.id===state.eventId);
 if(event?.effect==='family'&&animal.family===event.family)mul(event.name,2);
 if(event?.effect==='hole'&&isEdge(cell))mul(event.name,1.5);
 if(event?.effect==='diverse'&&families.size>=3)mul(event.name,1.5);
 mul('Zoo reputation',Math.pow(1.65,state.day-1));
 return {total:Math.max(1,Math.floor(total)),steps,remove:animal.ability==='gift',garden:animal.ability==='garden',gift:animal.ability==='gift'};
}
export function previewPlacement(state:RunState,handIndex:number,cellId:string):ScoreResult{const tile=state.hand[handIndex],cell=state.board.find(c=>c.id===cellId);if(!tile||!cell||cell.blocked||cell.tile)throw new Error('Choose an empty, open space.');return scoreTile(state,tile,cell)}
export function formatNumber(n:number):string{if(!Number.isFinite(n))return '∞';for(const [v,s]of [[1e12,'T'],[1e9,'B'],[1e6,'M'],[1e3,'K']]as const)if(Math.abs(n)>=v)return `${(n/v).toFixed(n/v>=100?0:1).replace(/\.0$/,'')}${s}`;return String(Math.floor(n))}
