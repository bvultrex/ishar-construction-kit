import {createHash} from 'node:crypto';
import {prepareOriginalDosPixelBatch} from '../src/lib/ishar/original-dos-pixel-batch.ts';
let input='';for await(const chunk of process.stdin)input+=chunk;
const r=JSON.parse(input),next=prepareOriginalDosPixelBatch(new Uint8Array(Buffer.from(r.memory,'base64')),r.ss,r.registers,r.bx,r.di,r.callerEntry??0x4168),stackMaskStart=r.stackMaskStart??0xfec0;
next.memory.fill(0,r.ss*16+stackMaskStart,r.ss*16+(r.stackMaskEnd??0xff10));const {memory,...result}=next;
console.log(JSON.stringify({...result,stackMaskStart,hash:createHash('sha256').update(memory).digest('hex')}));
