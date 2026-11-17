import type {Level,Point,Patrol} from './levels.ts';
export const HZ=60,LIMIT=30*HZ,UNIT=240,SPEED=15,RADIUS=46;
export const UP=1,DOWN=2,LEFT=4,RIGHT=8,USE=16;
export const center=(p:Point)=>({x:p.x*UNIT+UNIT/2,y:p.y*UNIT+UNIT/2});
export const tile=(a:Point)=>({x:Math.floor(a.x/UNIT),y:Math.floor(a.y/UNIT)});
export const near=(a:Point,b:Point,r=125)=>Math.abs(a.x-(b.x+.5)*UNIT)<=r&&Math.abs(a.y-(b.y+.5)*UNIT)<=r;
export type Actor=Point & {face:number;walking:boolean;caught:boolean};
export type Track={commands:number[];activity:number[]};
export type Cue='door'|'lock'|'pulse'|'loot'|'bonus'|'clear'|'caught'|'alarm'|'rewind'|'undo'|'retry'|'empty';
const spawn=(level:Level):Actor=>({...center(level.start),face:DOWN,walking:false,caught:false});
export class Heist {
 level:Level;tracks:Track[]=[];actors:Actor[]=[];tick=0;elapsed=0;attempts=1;
 commands:number[]=[];activity:number[]=[];doors:boolean[]=[];pulses:number[]=[];
 loot=false;bonus=false;won=false;paused=false;started=false;cues:Cue[]=[];
 guard:Point={x:0,y:0};distracted=false;
 constructor(level:Level){this.level=level;this.reset()}
 get player(){return this.actors[this.actors.length-1]}
 reset(){
   this.tick=0;this.commands=[];this.activity=[];this.cues=[];
   this.actors=Array.from({length:this.tracks.length+1},()=>spawn(this.level));
   this.doors=this.level.gates.map(()=>false);this.pulses=this.level.gates.map(()=>0);
   this.guard=this.level.patrol?center(this.level.patrol.from):{x:0,y:0};
   this.distracted=false;this.loot=false;this.bonus=false;this.won=false;this.started=false;
 }
 rewind(){
   if(this.won||this.paused||!this.tick)return;
   this.tracks.push({commands:this.commands,activity:this.activity});this.attempts++;
   this.reset();this.cues.push('rewind');
 }
 undo(){
   if(this.paused||this.won||!this.tracks.length)return;
   this.tracks.pop();this.reset();this.cues.push('undo');
 }
 retry(){if(this.paused||this.won)return;this.reset();this.cues.push('retry')}
 blocked(x:number,y:number){
   const c=Math.floor(x/UNIT),r=Math.floor(y/UNIT);
   return this.level.tiles[r]?.[c]!=='.'||this.level.gates.some((g,i)=>g.x===c&&g.y===r&&!this.doors[i]);
 }
 fits(x:number,y:number){
   return !this.blocked(x-RADIUS,y-RADIUS)&&!this.blocked(x+RADIUS,y-RADIUS)
      &&!this.blocked(x-RADIUS,y+RADIUS)&&!this.blocked(x+RADIUS,y+RADIUS);
 }
 move(a:Actor,cmd:number){
   const dx=Number(!!(cmd&RIGHT))-Number(!!(cmd&LEFT)),dy=Number(!!(cmd&DOWN))-Number(!!(cmd&UP));
   const speed=dx&&dy?11:SPEED,x=a.x+dx*speed,y=a.y+dy*speed,oldX=a.x,oldY=a.y;
   if(dx&&this.fits(x,a.y))a.x=x;
   if(dy&&this.fits(a.x,y))a.y=y;
   a.walking=a.x!==oldX||a.y!==oldY;
   if(dx||dy)a.face=dx?(dx>0?RIGHT:LEFT):(dy>0?DOWN:UP);
 }
 sees(a:Actor,patrol:Patrol){
   if(a.caught||this.distracted)return false;
   const dx=a.x-this.guard.x,dy=a.y-this.guard.y;
   const depth=dx*patrol.look.x+dy*patrol.look.y;
   if(depth<0||depth>UNIT*4.4||Math.abs(dx*patrol.look.y-dy*patrol.look.x)>UNIT*.42+depth*.48)return false;
   const steps=Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/(UNIT/8));
   for(let i=1;i<steps;i++)if(this.blocked(this.guard.x+dx*i/steps,this.guard.y+dy*i/steps))return false;
   return true;
 }
 security(){
   const patrol=this.level.patrol;if(!patrol)return;
   const from=center(patrol.from),to=center(patrol.to),phase=120-Math.abs((this.tick%240)-120);
   this.guard={x:from.x+Math.trunc((to.x-from.x)*phase/120),y:from.y+Math.trunc((to.y-from.y)*phase/120)};
   const divert=this.actors.some(a=>!a.caught&&near(a,patrol.bell));
   if(divert&&!this.distracted)this.cues.push('alarm');
   this.distracted=divert;
   for(const a of this.actors)if(this.sees(a,patrol)){
     a.caught=true;a.walking=false;if(a===this.player)this.cues.push('caught');
   }
 }
 step(input:number){
   if(this.paused||this.won||this.player.caught)return;
   if(!this.started&&!input)return;
   this.started=true;this.commands.push(input);
   const inputs=this.tracks.map(t=>t.commands[this.tick]??0);inputs.push(input);
   this.actors.forEach((a,i)=>{if(!a.caught)this.move(a,inputs[i])});
   this.security();
   this.level.gates.forEach((g,i)=>{
     const onPad=this.actors.some(a=>!a.caught&&near(a,g.source,112));
     if(g.kind==='pulse'&&this.actors.some((a,n)=>!a.caught&&(inputs[n]&USE)&&near(a,g.source,185))){
       this.pulses[i]=this.tick+150;this.cues.push('pulse');
     }
     // Keep a closing door safe until the last overlapping actor has crossed.
     const held=this.doors[i]&&this.actors.some(a=>!a.caught&&near(a,g,UNIT/2+RADIUS));
     const open=(g.kind==='plate'?onPad:this.pulses[i]>this.tick)||held;
     if(open!==this.doors[i])this.cues.push(open?'door':'lock');
     this.doors[i]=open;
   });
   if(!this.player.caught){
     if(input&USE){
       if(!this.loot&&near(this.player,this.level.loot,205)){this.loot=true;this.cues.push('loot')}
       else if(!this.bonus&&near(this.player,this.level.bonus,190)){this.bonus=true;this.cues.push('bonus')}
       else if(!this.level.gates.some(g=>g.kind==='pulse'&&near(this.player,g.source,185)))this.cues.push('empty');
     }
     if(this.loot&&near(this.player,this.level.exit,126)){this.won=true;this.cues.push('clear')}
   }
   this.activity.push(this.level.gates.some(g=>near(this.player,g.source,112))||!!(this.level.patrol&&near(this.player,this.level.patrol.bell))?2:input&USE?3:this.player.walking?1:0);
   this.tick++;this.elapsed++;
   if(this.tick>=LIMIT&&!this.won&&!this.player.caught)this.rewind();
 }
}
export class Clock {
 remainder=0;
 advance(seconds:number,step:()=>void){
   this.remainder+=seconds*HZ;
   const count=Math.floor(this.remainder+1e-8);this.remainder-=count;
   for(let i=0;i<count;i++)step();
 }
 clear(){this.remainder=0}
}
