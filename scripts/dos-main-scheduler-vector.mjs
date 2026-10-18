import {prepareOriginalDosMainScheduler} from '../src/lib/ishar/original-dos-main-scheduler.ts';
import {createHash} from 'node:crypto';
let input='';for await(const chunk of process.stdin)input+=chunk;
const request=JSON.parse(input);
const next=prepareOriginalDosMainScheduler(new Uint8Array(Buffer.from(request.memory,'base64')),request.ss,request.es,request.ds);
next.memory.fill(0,request.ss*16+0xfec0,request.ss*16+0xff10);
const {memory,...result}=next;
console.log(JSON.stringify({...result,hash:createHash('sha256').update(memory).digest('hex')}));
