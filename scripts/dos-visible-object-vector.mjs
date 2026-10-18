import {createHash} from 'node:crypto';
import {prepareOriginalDosVisibleObject} from '../src/lib/ishar/original-dos-visible-object.ts';
let input='';for await(const chunk of process.stdin)input+=chunk;
const r=JSON.parse(input),next=prepareOriginalDosVisibleObject(new Uint8Array(Buffer.from(r.memory,'base64')),r.ss,r.registers,r.object);
next.memory.fill(0,r.ss*16+(r.stackMaskStart??0xfec0),r.ss*16+(r.stackMaskEnd??0xff10));const {memory,...result}=next;
console.log(JSON.stringify({...result,hash:createHash('sha256').update(memory).digest('hex')}));
