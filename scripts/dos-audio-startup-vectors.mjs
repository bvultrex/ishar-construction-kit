import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {initializeOriginalDosAudioStartup as initialize} from '../src/lib/ishar/original-dos-audio-startup.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const mode of [0,1,2,3,4,255])for(const soundBlasterRead of [0,0xaa])for(const oldFlags of [0,65535]){
 const m=source.slice(),v=new DataView(m.buffer);m[0x1e940]=mode;v.setUint16(0x1cd4d,oldFlags,true);for(let i=0;i<64;i++)m[0x1c0b0+0x1dfd+i]=(i*7+13)&255;
 const before=m.slice(),{memory,...result}=initialize(m,0x1c0b,{vectorOffset:0x1234,vectorSegment:0x7000,soundBlasterRead});if(!m.every((x,i)=>x===before[i]))throw Error('Audio startup mutated source');
 memory.fill(0,0x1c0b0+0xfec0,0x1c0b0+0xff00);cases.push({mode,soundBlasterRead,oldFlags,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
