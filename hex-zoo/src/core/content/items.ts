import type { Snack, Charm } from '../types';
export const SNACKS:Snack[]=[
{id:'berry-bite',name:'Berry Bite',effect:'points',amount:8,price:3,text:'Give one animal in hand +8 for this day.'},
{id:'crunchy-root',name:'Crunchy Root',effect:'points',amount:15,price:5,text:'Give one animal in hand +15 for this day.'},
{id:'orchard-slice',name:'Orchard Slice',effect:'multiply',amount:2,price:6,text:'Double one animal in hand for this day.'},
{id:'river-melon',name:'River Melon',effect:'multiply',amount:3,price:9,text:'Triple one animal in hand for this day.'},
{id:'fern-wafer',name:'Fern Wafer',effect:'family',amount:6,price:5,text:'Give all Grove animals in hand +6 for this day.'},
{id:'sunseed-crisp',name:'Sunseed Crisp',effect:'points',amount:20,price:6,text:'Give one animal in hand +20 for this day.'},
{id:'kelp-roll',name:'Kelp Roll',effect:'garden',amount:5,price:4,text:'Add +5 to every free board space.'},
{id:'plum-pouch',name:'Plum Pouch',effect:'coins',amount:8,price:4,text:'Gain 8 zoo coins.'},
{id:'trail-biscuit',name:'Trail Biscuit',effect:'place',amount:1,price:7,text:'Restore one used place, up to the daily limit.'},
{id:'coconut-cup',name:'Coconut Cup',effect:'points',amount:30,price:8,text:'Give one animal in hand +30 for this day.'},
{id:'nectar-drop',name:'Nectar Drop',effect:'multiply',amount:2,price:6,text:'Double one animal in hand for this day.'},
{id:'garden-cracker',name:'Garden Cracker',effect:'garden',amount:8,price:7,text:'Add +8 to every free board space.'}];
export const CHARMS:Charm[]=[
{id:'leaf-brooch',name:'Leaf Brooch',effect:'family',family:'grove',amount:7,price:7,text:'Grove animals gain +7.'},
{id:'sun-pendant',name:'Sun Pendant',effect:'family',family:'sun',amount:7,price:7,text:'Sun animals gain +7.'},
{id:'shell-pin',name:'Shell Pin',effect:'family',family:'tide',amount:7,price:7,text:'Tide animals gain +7.'},
{id:'violet-ribbon',name:'Violet Ribbon',effect:'family',family:'dusk',amount:7,price:7,text:'Dusk animals gain +7.'},
{id:'picnic-cloth',name:'Picnic Cloth',effect:'points',amount:5,price:6,text:'Every animal gains +5.'},
{id:'painted-fence',name:'Painted Fence',effect:'edge',amount:10,price:7,text:'Animals on an outside edge gain +10.'},
{id:'rainbow-bell',name:'Rainbow Bell',effect:'diverse',amount:1.5,price:9,text:'All four families on board: score ×1.5.'},
{id:'braided-vine',name:'Braided Vine',effect:'chain',amount:0.35,price:10,text:'Score ×(1 + 0.35 per matching neighbour).'},
{id:'copper-spade',name:'Copper Spade',effect:'bonus',amount:8,price:7,text:'Animals on +point spaces gain +8.'},
{id:'field-journal',name:'Field Journal',effect:'deck',amount:1,price:8,text:'Every animal gains +1 per animal in your deck.'},
{id:'ticket-stamp',name:'Ticket Stamp',effect:'coins',amount:2,price:6,text:'Earn 2 extra zoo coins each completed day.'},
{id:'echo-chime',name:'Echo Chime',effect:'repeat',amount:0.2,price:11,text:'Score ×(1 + 0.2 per occupied neighbour).'},
{id:'glass-acorn',name:'Glass Acorn',effect:'growth',amount:0.08,price:10,text:'Score ×(1 + 0.08 per day reached).'},
{id:'soft-blanket',name:'Soft Blanket',effect:'points',amount:9,price:9,text:'Every animal gains +9.'},
{id:'trail-marker',name:'Trail Marker',effect:'edge',amount:16,price:10,text:'Animals on an outside edge gain +16.'},
{id:'prism-feather',name:'Prism Feather',effect:'diverse',amount:1.8,price:12,text:'All four families on board: score ×1.8.'},
{id:'friendship-knot',name:'Friendship Knot',effect:'chain',amount:0.5,price:12,text:'Score ×(1 + 0.5 per matching neighbour).'},
{id:'rain-bucket',name:'Rain Bucket',effect:'bonus',amount:14,price:10,text:'Animals on +point spaces gain +14.'},
{id:'keeper-notebook',name:'Keeper Notebook',effect:'deck',amount:2,price:12,text:'Every animal gains +2 per animal in your deck.'},
{id:'wind-mobile',name:'Wind Mobile',effect:'repeat',amount:0.3,price:12,text:'Score ×(1 + 0.3 per occupied neighbour).'}];
export const snackById=(id:string):Snack=>{const s=SNACKS.find(s=>s.id===id);if(!s)throw new Error(`Unknown snack: ${id}`);return s};
export const charmById=(id:string):Charm=>{const c=CHARMS.find(c=>c.id===id);if(!c)throw new Error(`Unknown charm: ${id}`);return c};
