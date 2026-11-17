import {Pixels,noise,runner,ECHO_COLORS} from './pixels.ts';
import {Heist,UNIT,near,center,LIMIT} from './sim.ts';
import type {Point,Level} from './levels.ts';
const T=24,OX=23,OY=23,W=598,H=334;
const mint='#74f4cc',amber='#ffcc65',violet='#bd9afa';
const pos=(p:Point)=>({x:OX+(p.x+.5)*T,y:OY+(p.y+.5)*T});
const world=(p:Point)=>({x:Math.round(OX+p.x*T/UNIT),y:Math.round(OY+p.y*T/UNIT)});
const floor=(l:Level,x:number,y:number)=>l.tiles[y]?.[x]==='.';
function tag(g:Pixels,x:number,y:number,s:string,col:string){
 const w=s.length*6+5;g.rect(x-w/2,y-1,w,10,'#0a111ced');g.rect(x-w/2,y-1,1,10,col);
 g.label(Math.round(x-w/2+3),y,s,col);
}
function crate(g:Pixels,x:number,y:number,gold:boolean){
 const top=gold?'#615642':'#374b61',rim=gold?'#918068':'#597187';
 g.rect(x+1,y+3,22,20,'#0d1824');g.rect(x+2,y,20,17,top);g.rect(x+2,y,20,2,rim);
 g.rect(x+3,y+3,18,12,'#1d2c3b');g.rect(x+5,y+4,14,9,top);
 g.line(x+5,y+4,x+17,y+12,rim);g.line(x+17,y+4,x+5,y+12,rim);
 g.rect(x+2,y+17,20,5,'#273541');g.rect(x+4,y+17,2,4,rim);g.rect(x+18,y+17,2,4,rim);
 g.rect(x+9,y+16,6,2,gold?amber:'#93a7b8');
}
function server(g:Pixels,x:number,y:number,n:number){
 g.rect(x+1,y+2,22,21,'#101c2c');g.rect(x+2,y,20,3,'#465d72');g.rect(x+3,y+3,18,17,'#24374c');
 for(let j=0;j<4;j++){g.rect(x+5,y+4+j*4,14,3,'#0d1b2b');g.rect(x+6,y+5+j*4,5,1,'#4f6a79');
 g.rect(x+15,y+5+j*4,2,1,(n+j)%3===0?amber:'#62c6bc')}
}
function surface(g:Pixels,l:Level){
 g.rect(0,0,W,H,'#0b111b');
 for(let x=3;x<W;x+=8)for(let y=3;y<H;y+=8)g.rect(x,y,1,1,'#263042');
 for(let i=0;i<4;i++){
   const x=i%2?W-9:8,y=i<2?8:H-9;
   g.line(x,y,x+(i%2?-6:6),y,'#5e7487');g.line(x,y,x,y+(i<2?6:-6),'#5e7487');
 }
 const vaultX=l.gates.at(-1)?.x??15;
 for(let r=0;r<l.tiles.length;r++)for(let c=0;c<l.tiles[r].length;c++){
   const x=OX+c*T,y=OY+r*T,n=noise(c,r),gold=c>vaultX;
   if(floor(l,c,r)){
     const fills=gold?['#363c40','#373c41','#333a3e','#343b41']:['#263542','#293744','#283642','#2b3945'];
     g.rect(x,y,T,T,'#17232f');g.rect(x+1,y+1,T-1,T-1,fills[n%4]);
     g.rect(x+1,y+1,T-2,1,gold?'#45494a':'#34434e');g.rect(x+1,y+2,1,T-4,'#31404a');
     if(n%4===0){g.rect(x+3,y+3,2,1,'#52616a');g.rect(x+20,y+20,1,1,'#17252f')}
     if(n%7===0){g.rect(x+6,y+14,7,1,'#34424b');g.rect(x+13,y+13,3,1,'#34424b')}
     if(n%29===0){g.rect(x+5,y+6,14,11,'#1b2935');for(let i=0;i<4;i++)g.rect(x+7,y+7+i*2,10,1,'#42525e')}
     if(!floor(l,c,r-1)){g.rect(x,y,24,5,'#101b2680');g.rect(x,y+5,24,2,'#15222d55')}
     if(!floor(l,c-1,r))g.rect(x,y,3,24,'#121e2a77');
   }else{
     const edge=[-1,0,1].some(d=>[-1,0,1].some(e=>floor(l,c+d,r+e)));if(!edge)continue;
     if(l.tiles[r][c]==='C'){crate(g,x,y,gold);continue}if(l.tiles[r][c]==='S'){server(g,x,y,n);continue}
     g.rect(x,y,T,T,'#0c1420');g.rect(x+1,y+1,23,17,gold?'#444950':'#334557');
     g.rect(x+1,y+1,22,2,gold?'#747674':'#566a7b');g.rect(x+2,y+4,20,11,gold?'#383f46':'#2a394c');
     g.rect(x+3,y+5,18,1,'#435362');g.rect(x+2,y+16,20,2,'#172333');
     g.rect(x+1,y+18,22,4,'#1c2a38');g.rect(x+2,y+19,20,1,'#354454');
     if(floor(l,c,r+1)){
       if(n%4===0){g.rect(x+3,y+14,17,6,'#172534');g.rect(x+5,y+15,13,2,gold?'#ddad63':'#74c5cc');}
       else{for(let k=0;k<5;k++)g.rect(x+4+k*3,y+16,2,4,'#0c1927')}
     }
     if(n%3===0)for(let k=0;k<4;k++)g.rect(x+5+k*4,y+5,2,7,'#1b2a39');
     if(!floor(l,c,r+1)&&n%5===0){g.rect(x+4,y+11,4,2,'#768595');g.rect(x+9,y+11,2,2,'#9da6aa')}
   }
 }
 // Conduits mark which input controls each door.
 l.gates.forEach((gk,i)=>{
  const a=pos(gk.source),b=pos(gk),col=i%2?'#6f627f':'#47726e';
  g.line(a.x,a.y,b.x,a.y,col);g.line(b.x,a.y,b.x,b.y,col);
  for(let x=Math.min(a.x,b.x)+5;x<Math.max(a.x,b.x);x+=11)g.rect(x,a.y-1,3,3,col);
 });
}
function diamond(g:Pixels,x:number,y:number,small:boolean,t:number){
 const dy=Math.floor(Math.sin(t/15)*1.5),s=small?1:2;
 g.glow(x,y,small?12:27,small?'#ab89fb26':'#ffc94746');
 g.rect(x-(small?4:9),y+6,small?8:18,3,'#101820');
 const art=['...aaa...','..abcca..','.abddcca.','abdeedcca','.acddcca.','..accca..','...aca...','....a....'];
 g.stamp(x-4*s,y-5*s+dy,art,small?{a:'#8d66b6',b:'#d4b8ff',c:'#9977d6',d:'#d4baee',e:'#eee4ff'}:
 {a:'#bc7c38',b:'#fff4b5',c:'#e8a64b',d:'#ffd86a',e:'#ffffda'},s);
}
export class Feed {
 g:Pixels;cache:HTMLCanvasElement;level:Level;flash=0;doors:number[]=[];endGlow=0;
 constructor(canvas:HTMLCanvasElement,l:Level){
  this.g=new Pixels(canvas,W,H);this.cache=document.createElement('canvas');this.level=l;this.setLevel(l);
 }
 setLevel(l:Level){this.level=l;this.doors=l.gates.map(()=>0);surface(new Pixels(this.cache,W,H),l)}
 draw(s:Heist,frame:number,reduced:boolean){
  const g=this.g,l=s.level,t=reduced?0:frame;g.ctx.drawImage(this.cache,0,0);
  const ex=pos(l.exit);g.rect(ex.x-10,ex.y-9,20,18,'#102b2c');
  for(const a of [-1,1])for(const b of [-1,1]){const x=ex.x+9*a,y=ex.y+8*b;g.rect(x-(a>0?4:0),y,5,2,mint);g.rect(x,y-(b>0?4:0),2,5,mint)}
  for(let j=-1;j<=1;j++)for(let i=0;i<3;i++)g.rect(ex.x+i-2,ex.y+j*4+Math.abs(i-1),1,1,mint);
  tag(g,ex.x,ex.y+13,'EXIT','#84c7b8');
  l.gates.forEach((k,i)=>{
   const a=pos(k.source),b=pos(k),on=s.actors.some(e=>!e.caught&&near(e,k.source,112)),col=k.kind==='pulse'?'#8ebdff':violet;
   g.rect(a.x-10,a.y-7,20,16,'#111725');g.rect(a.x-9,a.y-8,18,14,on?'#9880c6':'#726086');
   g.rect(a.x-7,a.y-6,14,10,'#352e46');g.rect(a.x-5,a.y-5,10,8,on?col:'#675375');
   for(let j=0;j<3;j++)g.rect(a.x-4,a.y-3+j*2,8,1,col);
   tag(g,a.x,a.y+11,(k.kind==='pulse'?'PULSE ':'PAD ')+String.fromCharCode(65+i),col);
   g.rect(b.x-12,b.y-12,24,24,'#13212c');
   for(let j=0;j<6;j++){g.rect(b.x-12+j*4,b.y-12,2,2,amber);g.rect(b.x-12+j*4,b.y+10,2,2,amber)}
   const goal=s.doors[i]?1:0;this.doors[i]=reduced?goal:this.doors[i]+(goal-this.doors[i])*.3;
   const h=Math.round(10*(1-this.doors[i]));
   for(const side of [-1,1]){
    const y=side===-1?b.y-10:b.y+10-h;
    if(h){g.rect(b.x-11,y,22,h,'#5c5660');g.rect(b.x-9,y,8,h,'#403d4b');g.rect(b.x+2,y,7,h,'#4b4653')}
    g.rect(b.x-11,side===-1?b.y-10+h:b.y+9-h,22,1,goal?mint:'#ff7779');
   }
   if(l.gates.length===1&&!s.doors[i])tag(g,b.x,b.y+14,'LOCKED','#f39395');
   if(k.kind==='pulse'&&s.doors[i])g.rect(b.x-10,b.y-14,20*Math.max(0,s.pulses[i]-s.tick)/150,2,'#9ac6ff');
  });
  if(l.patrol){
   const b=pos(l.patrol.bell);g.rect(b.x-8,b.y-7,16,14,'#382c2c');for(let i=0;i<4;i++)g.rect(b.x-6+i*3,b.y-5,2,10,'#d68d64');
   tag(g,b.x,b.y+11,'BUZZER',amber);
   const q=world(s.guard);
   if(!s.distracted){
    // Sample the exact sight predicate at pixel-grid intervals, including wall occlusion.
    for(let y=q.y-107;y<=q.y+107;y+=3)for(let x=q.x-107;x<=q.x+107;x+=3){
      const probe={...s.player,x:(x-OX)*UNIT/T,y:(y-OY)*UNIT/T,caught:false};
      if(s.sees(probe,l.patrol))g.rect(x,y,3,3,'#ff777433')
    }
   }
   runner(g,q.x,q.y,'#fb7e87',t,true);tag(g,q.x,q.y-23,s.distracted?'?':'SEC','#fb979e');
  }
  const tr=pos(l.loot);
  g.rect(tr.x-14,tr.y+3,28,11,'#151d27');g.rect(tr.x-12,tr.y,24,10,'#6c624b');
  g.rect(tr.x-10,tr.y+1,20,6,'#292c30');g.rect(tr.x-8,tr.y+8,16,1,amber);
  if(!s.loot){diamond(g,tr.x,tr.y-5,false,t);tag(g,tr.x,tr.y+14,'LOOT',amber)}
  if(!s.bonus){const b=pos(l.bonus);diamond(g,b.x,b.y,true,t)}
  s.actors.forEach((actor,i)=>{
   const live=actor===s.player,q=world(actor),col=live?mint:ECHO_COLORS[i%ECHO_COLORS.length];
   g.ctx.globalAlpha=actor.caught?.4:live?1:.88;
   g.glow(q.x,q.y,live?22:16,live?'#64f7c731':'#ae86f72f');
   if(!live){g.rect(q.x-8,q.y+6,16,1,col);g.rect(q.x-6,q.y+8,12,1,col)}
   runner(g,q.x,q.y,col,t,actor.walking&&s.started,actor.face);
   if(live){g.rect(q.x-6,q.y+7,12,1,mint);tag(g,q.x,q.y-25,'YOU',mint)}
   else if(!near(s.player,{x:actor.x/UNIT-.5,y:actor.y/UNIT-.5},155)){tag(g,q.x,q.y-22,'E'+(i+1),col)}
   g.ctx.globalAlpha=1;
  });
  if(this.flash>0){
    if(!reduced){g.rect(0,0,W,H,'rgba(161,140,245,'+this.flash*.23+')');
     for(let j=0;j<7;j++){const y=(j*53+Math.floor(this.flash*80))%H;g.rect(0,y,W,2,'#c7b7ff70')}}
    this.flash=Math.max(0,this.flash-.05);
  }
  if(this.endGlow>0){g.glow(tr.x,tr.y,40,'#ffd66f55');this.endGlow-=.02}
  if(s.tick>LIMIT-300)g.rect(0,H-2,W,2,'#ee787e');
 }
}
