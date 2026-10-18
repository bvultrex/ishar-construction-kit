import {prepareOriginalDosPhysicalContext} from '../src/lib/ishar/original-dos-physical-context.ts';
import {createHash} from 'node:crypto';
let input='';for await(const chunk of process.stdin)input+=chunk;
const request=JSON.parse(input),next=prepareOriginalDosPhysicalContext(new Uint8Array(Buffer.from(request.memory,'base64')),request.ss,request.registers,request.entry??'frame-return');
next.memory.fill(0,request.ss*16+0xfec0,request.ss*16+0xff10);const {memory,...result}=next;
console.log(JSON.stringify({...result,hash:createHash('sha256').update(memory).digest('hex')}));
