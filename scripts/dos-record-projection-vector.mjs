import {createHash} from 'node:crypto';
import {projectOriginalDosRecord} from '../src/lib/ishar/original-dos-record-projection.ts';
let input='';for await(const chunk of process.stdin)input+=chunk;
const r=JSON.parse(input),next=projectOriginalDosRecord(new Uint8Array(Buffer.from(r.memory,'base64')),r.ss,r.registers.ds,r.registers.es,r.di);
const stackMaskStart=Math.min(0xfec0,r.stackMaskStart??0xfec0);next.memory.fill(0,r.ss*16+stackMaskStart,r.ss*16+0xff10);const {memory,...result}=next;
console.log(JSON.stringify({...result,registers:r.registers,stackMaskStart,hash:createHash('sha256').update(memory).digest('hex')}));
