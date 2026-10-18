import {finishOriginalDosPhysicalYield} from '../src/lib/ishar/original-dos-physical-yield.ts';
import {createHash} from 'node:crypto';
let input='';for await(const chunk of process.stdin)input+=chunk;
const request=JSON.parse(input),next=finishOriginalDosPhysicalYield(new Uint8Array(Buffer.from(request.memory,'base64')),request.ss,request.registers,request.entry??'yield');
next.memory.fill(0,request.ss*16+(request.stackMask?.[0]??0xfec0),request.ss*16+(request.stackMask?.[1]??0xff10));
const {memory,...result}=next;
console.log(JSON.stringify({...result,hash:createHash('sha256').update(memory).digest('hex')}));
