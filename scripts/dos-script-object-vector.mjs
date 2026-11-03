import {createOriginalDosScriptObject} from '../src/lib/ishar/original-dos-script-object.ts';
import {createHash} from 'node:crypto';
let input='';for await(const chunk of process.stdin)input+=chunk;
const request=JSON.parse(input),result=createOriginalDosScriptObject(new Uint8Array(Buffer.from(request.memory,'base64')),request.ss,request.registers);
result.memory.fill(0,request.ss*16+0xfec0,request.ss*16+0xff10);
console.log(JSON.stringify({registers:result.registers,error:result.error,stackDelta:result.stackDelta,hash:createHash('sha256').update(result.memory).digest('hex')}));
