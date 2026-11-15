import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {selectOriginalDosVideoModule as select} from '../src/lib/ishar/original-dos-video-selection.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const graphics of [0,1,255])for(const inputMode of [0,1,255]){
 const m=source.slice();m[0x1c0b0+0x2898]=graphics;m[0x1c0b0+0x2896]=inputMode;
 const before=m.slice(),{memory,...result}=select(m,0x1c0b);
 if(!m.every((v,i)=>v===before[i]))throw Error('Selection mutated input');
 memory.fill(0,0x1c0b0+0xfec0,0x1c0b0+0xff10);
 cases.push({graphics,inputMode,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
