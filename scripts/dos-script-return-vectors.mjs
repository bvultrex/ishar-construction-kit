import {createHash} from 'node:crypto';
import {returnOriginalDosScript} from '../src/lib/ishar/original-dos-script-return.ts';
const cases=[];
for(const mode of [0,1,255])for(const stack of [0,16,32768,65534])for(const boundary of [0,16,32768,65535])for(const same of [false,true]){
 const memory=new Uint8Array(65536).fill(0xa5),v=new DataView(memory.buffer),bp=0x200;
 v.setUint16(bp-10,stack,true);v.setUint16(bp-12,same?stack:123,true);v.setUint16((bp+stack)&65535,0x1234,true);
 const {memory:out,...expected}=returnOriginalDosScript(memory,bp,0x101,mode,boundary);
 cases.push({mode,stack,boundary,same,expected:{...expected,memorySha256:createHash('sha256').update(out).digest('hex')}});
}
console.log(JSON.stringify(cases));
