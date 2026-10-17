import {saveOriginalDosCursor} from '../src/lib/ishar/original-dos-cursor-save.ts';
import {createHash} from 'node:crypto';
const cases=[];
for(const x of [0,1,303,304,305,319])for(const y of [0,183,184,185,199])for(const base of [0,17]){
 const screen=Uint8Array.from({length:65536},(_,i)=>(i*13+7)&255),saved=saveOriginalDosCursor(screen,x,y,320,base),window=new Uint8Array(262).fill(0xa5);window.set(saved);
 cases.push({x,y,base,sha256:createHash('sha256').update(window).digest('hex')});
}
console.log(JSON.stringify(cases));
