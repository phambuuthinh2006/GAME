import type { RunState } from '../core/types';
export function canResumeDaily(run:RunState|undefined,date:string):boolean {
 return !!run&&run.daily&&run.seed===`daily-${date}`&&['playing','reward','shop'].includes(run.phase);
}
export function shouldRecordResult(seed:string,recorded:string[]):boolean{return !recorded.includes(seed);}
