import {company} from './levels.ts';
import {Heist,Clock,UP,DOWN,LEFT,RIGHT,USE,UNIT} from './sim.ts';
let s=new Heist(company);
const c=document.querySelector('canvas')!.getContext('2d')!;
let input=0,use=0,last=performance.now();const clock=new Clock();
const keys:Record<string,number>={w:UP,a:LEFT,s:DOWN,d:RIGHT,arrowup:UP,arrowdown:DOWN,arrowleft:LEFT,arrowright:RIGHT};
onkeydown=e=>{const k=e.key.toLowerCase();if(keys[k]){e.preventDefault();input|=keys[k]}
 if(e.repeat)return;if(k==='e')use=USE;if(k==='r')s.rewind();if(k==='z')s.undo();if(k==='p')s.paused=!s.paused;if(k==='x')s=new Heist(company)};
onkeyup=e=>{input&=~(keys[e.key.toLowerCase()]||0)};
function frame(t:number){
 clock.advance((t-last)/1000,()=>{s.step(input|use);use=0});last=t;
 const box=(x:number,y:number,col:string,size=30)=>{c.fillStyle=col;c.fillRect(x*32+(32-size)/2,y*32+(32-size)/2,size,size)};
 s.level.tiles.forEach((row,y)=>[...row].forEach((v,x)=>box(x,y,v==='#'?'#334451':'#192229',32)));
 s.level.gates.forEach((g,i)=>{box(g.source.x,g.source.y,'#a34deb',22);box(g.x,g.y,s.doors[i]?'#327b64':'#e65f58')});
 box(s.level.exit.x,s.level.exit.y,'#61bf96');if(!s.loot)box(s.level.loot.x,s.level.loot.y,'#ffbc3f',15);
 s.actors.forEach((a,i)=>box(a.x/UNIT-.5,a.y/UNIT-.5,i===s.tracks.length?'#69f7f0':'#b285ff',16));
 document.querySelector('#info')!.textContent=s.won?'ESCAPED':('Loop '+(s.tracks.length+1)+' | '+((1800-s.tick)/60).toFixed(1)+' seconds'+(s.paused?' | PAUSED':''));
 requestAnimationFrame(frame)
}requestAnimationFrame(frame);
