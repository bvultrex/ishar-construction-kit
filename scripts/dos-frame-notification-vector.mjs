import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {notifyOriginalDosFrameGraphics} from '../src/lib/ishar/original-dos-frame-notification.ts';
import {runOriginalDosPhysicalFrame} from '../src/lib/ishar/original-dos-physical-frame.ts';
let text='';for await(const chunk of process.stdin)text+=chunk;
const q=JSON.parse(text),source=new Uint8Array(Buffer.from(q.memory,'base64')),before=source.slice();
let result=notifyOriginalDosFrameGraphics(source,q.ss,q.registers);assert.deepEqual(source,before);
if(q.resumeFrame){
 const registers=Object.fromEntries(['ds','es','si','bp','dx','cx'].map(k=>[k,q.registers[k]]));
 const cachedAx=(q.registers.ax&0xff00)|result.memory[q.ss*16+0xc99];
 const next=runOriginalDosPhysicalFrame(result.memory,q.ss,registers,0x1000,true,{ax:cachedAx,sp:q.registers.sp});
 result={...result,...next,registers:{...next.registers,sp:(q.registers.sp+next.stackDelta)&65535}};
}
result.memory.fill(0,0x1c0b0+0x780,0x1c0b0+q.registers.sp);
const {memory,...metadata}=result;console.log(JSON.stringify({...metadata,hash:createHash('sha256').update(memory).digest('hex')}));
