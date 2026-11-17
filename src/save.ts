import type {Heist} from './sim.ts';
export type Result={loops:number;ticks:number;bonus:boolean;medal:number};
export type Save={selected:number;muted:boolean;records:Record<number,Result>};
const key='echo-heist.v1';
export function readSave():Save{
 const fallback:Save={selected:0,muted:false,records:{}};
 try{const data=JSON.parse(localStorage.getItem(key)||'null');
 if(!data||typeof data!=='object')return fallback;
 if(Number.isInteger(data.selected)&&data.selected>=0&&data.selected<5)fallback.selected=data.selected;
 fallback.muted=data.muted===true;
 for(const [k,r] of Object.entries(data.records||{}) as [string,Result][]){
  if(r&&Number.isInteger(r.loops)&&r.loops>0&&Number.isInteger(r.ticks)&&r.ticks>0&&[1,2,3].includes(r.medal)&&typeof r.bonus==='boolean')fallback.records[Number(k)]=r;
 }
 }catch{/* Private storage and invalid saves still allow local play. */}
 return fallback;
}
export function writeSave(s:Save){try{localStorage.setItem(key,JSON.stringify(s))}catch{/* Storage can be disabled. */}}
export function result(s:Heist):Result{
 const efficient=s.attempts<=s.level.par,fast=s.elapsed<=s.level.target*60;
 return {loops:s.attempts,ticks:s.elapsed,bonus:s.bonus,medal:efficient&&fast&&s.bonus?3:efficient||fast?2:1};
}
export function better(a:Result,b?:Result){return !b||a.medal>b.medal||(a.medal===b.medal&&(a.loops<b.loops||(a.loops===b.loops&&a.ticks<b.ticks)))}
export const medals=['','Bronze','Silver','Gold'];
