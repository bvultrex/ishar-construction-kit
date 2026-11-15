import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {stepOriginalDosPaletteFade} from '../src/lib/ishar/original-dos-palette-control.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const step of [0,1,2,63,127,128,255])for(const offset of [0,1,127,128,255])for(const reverse of [false,true]){
 const m=source.slice(),g=0x1c0b0;m[g+0xcbe]=step;
 for(let n=0;n<768;n++){m[g+0xe43+n]=n&255;m[g+0x1443+n]=((reverse?255-(n&255):n)+offset)&255;}
 const before=m.slice(),{memory}=stepOriginalDosPaletteFade(m);if(!m.every((x,i)=>x===before[i]))throw Error('Palette pass mutated source');memory.fill(0,g+0xfee0,g+0xff04);
 cases.push({step,offset,reverse,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
