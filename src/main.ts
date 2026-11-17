import {company} from './levels.ts';
import {Heist,Clock,UP,DOWN,LEFT,RIGHT,USE,UNIT} from './sim.ts';
import {Feed} from './render.ts';
import {AudioDeck} from './audio.ts';
let s=new Heist(company);
const feed=new Feed(document.querySelector('canvas')!,company),audio=new AudioDeck();
let input=0,use=0,last=performance.now();const clock=new Clock();
const keys:Record<string,number>={w:UP,a:LEFT,s:DOWN,d:RIGHT,arrowup:UP,arrowdown:DOWN,arrowleft:LEFT,arrowright:RIGHT};
onkeydown=e=>{audio.wake();const k=e.key.toLowerCase();if(k==='m'&&!e.repeat)audio.toggle();if(keys[k]){e.preventDefault();input|=keys[k]}
 if(e.repeat)return;if(k==='e')use=USE;if(k==='r')s.rewind();if(k==='z')s.undo();if(k==='p')s.paused=!s.paused;if(k==='x')s=new Heist(company)};
onkeyup=e=>{input&=~(keys[e.key.toLowerCase()]||0)};
function frame(t:number){
 clock.advance((t-last)/1000,()=>{s.step(input|use);use=0});last=t;
 for(const cue of s.cues.splice(0)){audio.effect(cue);if(['rewind','undo'].includes(cue))feed.flash=1}
 audio.active=s.started&&!s.paused&&!s.won;audio.music();feed.draw(s,t*.06,false);
 document.querySelector('#info')!.textContent=s.won?'ESCAPED':('Loop '+(s.tracks.length+1)+' | '+((1800-s.tick)/60).toFixed(1)+' seconds'+(s.paused?' | PAUSED':''));
 requestAnimationFrame(frame)
}requestAnimationFrame(frame);
