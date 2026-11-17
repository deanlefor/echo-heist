export type Point={x:number,y:number};
export type Gate=Point & {kind:'plate'|'pulse',source:Point};
export interface Patrol {from:Point;to:Point;look:Point;bell:Point}
export interface Level {
 title:string;site:string;item:string;brief:string;hint:string;quip:string;
 tiles:string[];start:Point;exit:Point;loot:Point;bonus:Point;
 gates:Gate[];patrol?:Patrol;par:number;target:number;
}
export const p=(x:number,y:number):Point=>({x,y});
export const gate=(x:number,y:number,sx:number,sy:number,kind:Gate['kind']='plate'):Gate=>({x,y,source:p(sx,sy),kind});
export const company:Level={
 title:"Three’s Company",site:"Relay Exchange",item:"Bearer bonds",
 brief:"Chain two pressure locks together and bring the bonds back to extraction.",
 hint:"Record a runner on pad A. Follow them through A, then record a second runner holding B.",
 quip:"Three accomplices. One suspiciously familiar alibi.",
 tiles:[
 "#######################","##......#.......#....##","#.......#.......#.....#",
 "#.......#.......#.....#","#.......#..##...#.....#","#.......#.......#.....#",
 "#.....................#","#.......#.......#.....#","#.......#.......#.....#",
 "#..##...#.......#.....#","##......#......##....##","#######################"],
 start:p(3,6),exit:p(2,7),loot:p(20,6),bonus:p(19,2),gates:[gate(8,6,5,3),gate(16,6,13,8)],par:3,target:24
};
export const levels:Level[]=[company];
