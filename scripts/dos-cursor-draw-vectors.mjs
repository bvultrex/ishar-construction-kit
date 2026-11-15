import {drawOriginalDosCursor} from '../src/lib/ishar/original-dos-cursor-draw.ts';
import {createHash} from 'node:crypto';
const cases=[];
for(const format of [0,16,1,255])for(const palette of [0,250])for(const x of [0,303,304,305,318,319])for(const y of [0,183,184,199]){
 const sprite=new Uint8Array(264);sprite[0]=format;sprite[6]=palette;
 const header=format===0?6:8;
 for(let i=header;i<264;i++)sprite[i]=((i-header)*17)&255;
 // Format16 palette is in header; the other formats ignore it.
 if(format===16)sprite[6]=palette;
 const screen=Uint8Array.from({length:65536},(_,i)=>(i*13+7)&255),result=drawOriginalDosCursor(screen,sprite,x,y,320,0);
 cases.push({format,palette,x,y,sprite:[...sprite],sha256:createHash('sha256').update(result).digest('hex')});
}
console.log(JSON.stringify(cases));
