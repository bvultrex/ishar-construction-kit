import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {initializeOriginalDosMouseStartup as initialize} from '../src/lib/ishar/original-dos-mouse-startup.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const skip of [0,1,255])for(const mode of [0,1,2,255])for(const resetAX of [0,1,65535])for(const oldFlags of [0,65535]){
 const m=source.slice(),v=new DataView(m.buffer),g=0x1c0b0;m[g+0xca3]=skip;m[g+0x2896]=mode;v.setUint16(g+0xc9d,oldFlags,true);v.setUint16(g+0xcaa,0xbeef,true);v.setUint16(g+0xcac,0xf00d,true);
 const before=m.slice(),{memory,...result}=initialize(m,0x1c0b,resetAX);if(!m.every((x,i)=>x===before[i]))throw Error('Mouse init mutated source');memory.fill(0,g+0xfefe,g+0xff00);cases.push({skip,mode,resetAX,oldFlags,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
