export type Family = 'grove' | 'sun' | 'tide' | 'dusk';
export type Rarity = 'Common' | 'Rare' | 'Legendary';
export type Ability = 'adjacent' | 'count' | 'edge' | 'corner' | 'bonus' | 'deck' | 'gift' | 'garden' | 'echo' | 'diverse';
export interface Animal { id:string; name:string; species:string; family:Family; rarity:Rarity; base:number; ability:Ability; amount:number; text:string }
export interface Tile { uid:string; animalId:string; bonus:number; mult:number }
export interface Cell { id:string; q:number; r:number; bonus:number; mult:number; blocked:boolean; tile?:Tile }
export interface Snack { id:string; name:string; text:string; effect:'points'|'multiply'|'family'|'garden'|'coins'|'place'; amount:number; price:number }
export interface Charm { id:string; name:string; text:string; effect:'points'|'family'|'edge'|'diverse'|'chain'|'bonus'|'deck'|'coins'|'repeat'|'growth'; amount:number; family?:Family; price:number }
export interface Keeper { id:string; name:string; text:string; wins:number; family:Family; passive:'family'|'edge'|'diverse' }
export interface EventModifier { id:string; name:string; text:string; effect:'frozen'|'family'|'short'|'hole'|'bonus'|'diverse'; family?:Family }
export interface Offer { kind:'animal'|'snack'|'charm'; id:string; price:number; locked?:boolean; sold?:boolean }
export interface ScoreStep { stage:'base'|'cell'|'neighbours'|'charms'|'multipliers'; label:string; amount:number; subtotal:number }
export interface ScoreResult { total:number; steps:ScoreStep[]; remove:boolean; garden:boolean; gift:boolean }
export interface RunState { seed:string; rng:number; keeperId:string; daily:boolean; day:number; score:number; goal:number; places:number; maxPlaces:number; board:Cell[]; deck:Tile[]; draw:Tile[]; hand:Tile[]; discard:Tile[]; charms:string[]; snacks:string[]; coins:number; phase:'playing'|'reward'|'shop'|'won'|'lost'; offers:Offer[]; shop:Offer[]; lockedOffer?:Offer; rewardChosen:boolean; removed:boolean; eventId?:string; totalScore:number; placements:number; won:boolean; serial:number; history:number[] }
