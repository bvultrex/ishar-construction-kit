import {saveOriginalDosCursor} from '../src/lib/ishar/original-dos-cursor-save.ts';
import {restoreOriginalDosCursor} from '../src/lib/ishar/original-dos-cursor-restore.ts';
import {drawOriginalDosCursor} from '../src/lib/ishar/original-dos-cursor-draw.ts';
import {createHash} from 'node:crypto';
const hash=v=>createHash('sha256').update(v).digest('hex'),cases=[];
for(const format of [0,16,1])for(const guard of [0,255])for(const mode of [0,1])for(const hidden of [0,255]){
 const sprite=new Uint8Array(264);sprite[0]=format;sprite[6]=250;const header=format===0?6:8;
 for(let i=header;i<264;i++)sprite[i]=((i-header)*17)&255;
 let screen=Uint8Array.from({length:65536},(_,i)=>(i*13+7)&255),x=10,y=10;
 const backup=new Uint8Array(262).fill(165);backup.set(saveOriginalDosCursor(screen,x,y,320,0));screen=drawOriginalDosCursor(screen,sprite,x,y,320,0);
 const frames=[];
 for(const [nextX,nextY] of [[10,10],[11,11],[305,185],[319,199],[10,10]]){
  if(mode!==0 && hidden<128 && guard===255 && (x!==nextX||y!==nextY)){
   const view=new DataView(backup.buffer),width=view.getUint16(2,true),rows=view.getUint16(4,true);
   screen=restoreOriginalDosCursor(screen,backup.slice(6,6+width*rows),view.getUint16(0,true),width,rows,320);
   x=nextX;y=nextY;backup.set(saveOriginalDosCursor(screen,x,y,320,0));screen=drawOriginalDosCursor(screen,sprite,x,y,320,0);
  }
  frames.push({nextX,nextY,x,y,screen:hash(screen),backup:hash(backup)});
 }
 cases.push({sprite:[...sprite],mode,hidden,guard,frames});
}
console.log(JSON.stringify(cases));
