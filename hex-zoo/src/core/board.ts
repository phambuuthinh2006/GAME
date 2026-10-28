import type { Cell } from './types';
export const DIRECTIONS=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]] as const;
export function distance(a:{q:number;r:number},b={q:0,r:0}):number{return Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs(a.q+a.r-b.q-b.r))}
export function adjacent(a:Cell,b:Cell):boolean{return distance(a,b)===1}
export function neighbours(board:Cell[],cell:Cell):Cell[]{return board.filter(c=>adjacent(c,cell))}
export function isEdge(cell:Cell):boolean{return distance(cell)===2}
export function isCorner(cell:Cell):boolean{return isEdge(cell)&&(cell.q===0||cell.r===0||cell.q+cell.r===0)}
export function makeBoard():Cell[]{const cells:Cell[]=[];for(let r=-2;r<=2;r++)for(let q=-2;q<=2;q++)if(distance({q,r})<=2)cells.push({id:`${q},${r}`,q,r,bonus:0,mult:1,blocked:false});return cells}
