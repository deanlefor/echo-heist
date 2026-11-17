// Small integer-pixel drawing library shared by the facility, portraits and contract art.
export class Pixels{
 ctx:CanvasRenderingContext2D; w:number;h:number;
 constructor(canvas:HTMLCanvasElement,w:number,h:number){
   canvas.width=this.w=w;canvas.height=this.h=h;this.ctx=canvas.getContext('2d')!;
   this.ctx.imageSmoothingEnabled=false;
 }
 rect(x:number,y:number,w:number,h:number,color:string){
   this.ctx.fillStyle=color;this.ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
 }
 line(x:number,y:number,a:number,b:number,color:string){
   x=Math.round(x);y=Math.round(y);a=Math.round(a);b=Math.round(b);
   const dx=Math.abs(a-x),dy=-Math.abs(b-y),sx=x<a?1:-1,sy=y<b?1:-1;let error=dx+dy;
   for(;;){this.rect(x,y,1,1,color);if(x===a&&y===b)break;
     const e=2*error;if(e>=dy){error+=dy;x+=sx}if(e<=dx){error+=dx;y+=sy}}
 }
 stamp(x:number,y:number,rows:string[],palette:Record<string,string>,scale=1){
   rows.forEach((row,j)=>[...row].forEach((v,i)=>{if(palette[v])this.rect(x+i*scale,y+j*scale,scale,scale,palette[v])}));
 }
 glow(x:number,y:number,r:number,col:string){
   const g=this.ctx.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');
   this.ctx.fillStyle=g;this.ctx.fillRect(x-r,y-r,r*2,r*2);
 }
 label(x:number,y:number,value:string,color:string,scale=1,spacing=1){
   for(const ch of value.toUpperCase()){const cols=letters[ch]||letters[' '];
     cols.forEach((bits,i)=>{for(let j=0;j<7;j++)if(bits&(1<<j))this.rect(x+i*scale,y+j*scale,scale,scale,color)});
     x+=(cols.length+spacing)*scale;
   }
 }
}
const letters:Record<string,number[]>={
 A:[126,9,9,9,126],B:[127,73,73,73,54],C:[62,65,65,65,34],D:[127,65,65,34,28],E:[127,73,73,73,65],
 F:[127,9,9,9,1],G:[62,65,73,73,122],H:[127,8,8,8,127],I:[65,127,65],J:[32,64,65,63,1],
 K:[127,8,20,34,65],L:[127,64,64,64,64],M:[127,2,12,2,127],N:[127,4,8,16,127],O:[62,65,65,65,62],
 P:[127,9,9,9,6],Q:[62,65,81,33,94],R:[127,9,25,41,70],S:[70,73,73,73,49],T:[1,1,127,1,1],
 U:[63,64,64,64,63],V:[31,32,64,32,31],W:[127,32,24,32,127],X:[99,20,8,20,99],Y:[3,4,120,4,3],Z:[97,81,73,69,67],
 '0':[62,81,73,69,62],'1':[66,127,64],'2':[98,81,73,73,70],'3':[34,65,73,73,54],'4':[24,20,18,127,16],
 '5':[39,69,69,69,57],'6':[60,74,73,73,48],'7':[1,113,9,5,3],'8':[54,73,73,73,54],'9':[6,73,73,41,30],
 ' ':[0,0,0],'-':[8,8,8],'.':[64],'/':[96,16,8,4,3],'!':[95],'?':[2,1,81,9,6],':':[36],
};
export function noise(x:number,y:number,seed=0){
 let n=Math.imul(x+1,374761393)+Math.imul(y+1,668265263)+seed*1447;
 n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0;
}
export const sprite=[
 '....kkkkkkk....','...klllllllk...','..klhhhhhlhlk..','..klhhhhhhlhk..',
 '.kllkkkffffkk..','.kllkgggggfgk..','..klkggggggkk..','...kkfffkfkk...',
 '..kllvvvvvllk..','.klhlvvvlllhhk.','.klhlhhhlllhkk.','..kfkllhbbbfk..',
 '..kkklbbabblk..','....klllkkllk..','....kllk.kllk..','...kkkkk.kkkkk.'
];
export function runner(g:Pixels,x:number,y:number,color:string,tick:number,moving:boolean,face=2){
 const swing=moving&&Math.floor(tick/6)%2?1:0;
 const body=sprite.slice();if(swing){body[14]='...klllk..kllk.';body[15]='..kkkkkk..kkkk.'}
 if(face===1){body[4]='.klllhhhhhhkk..';body[5]='.kllhhhhhhhlk..';body[6]='..klllhhhhlkk..';body[7]='...kklllllkk...'}
 const palette={k:'#090e1a',l:'#354461',h:'#69769a',f:'#c7a990',g:color,v:color,b:'#222d43',a:'#e6bd73'};
 g.rect(x-7,y+5,14,3,'#0a1019');g.stamp(x-7,y-10-swing,body,palette);
 g.rect(x-4,y-11-swing,5,1,'#a0afc5');
}
export const ECHO_COLORS=['#b79aff','#ff91b4','#77c9ff','#f7ca74','#a2e1bd'];
