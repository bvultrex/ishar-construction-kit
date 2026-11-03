import {createHash} from 'node:crypto';
import {runOriginalDosIdleFrame} from '../src/lib/ishar/original-dos-frame-idle.ts';
const cases=[];
for(const target of [0,1,255])for(const counter of [0,1,255])for(const [mode,objects] of [[0,0],[1,0],[1,1]])for(const dirty of [0,1])for(const key of [0,0x72]){
 const globals=new Uint8Array(65536).fill(0xa5);globals[0xc4a]=dirty;globals[0x2898]=0;globals[0xc99]=target;globals[0xc9a]=counter;globals[0xc37]=mode;globals[0xcb0]=objects;new DataView(globals.buffer).setUint16(0xc16,0,true);
 const {memory,phase}=runOriginalDosIdleFrame(globals,key);cases.push({target,counter,mode,objects,dirty,key,expected:{phase,globalsSha256:createHash('sha256').update(memory.subarray(0,0x3000)).digest('hex')}});
}
console.log(JSON.stringify(cases));
