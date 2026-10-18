import {prepareOriginalDosResourceGraphics} from '../src/lib/ishar/original-dos-resource-graphics.ts';
import {createHash} from 'node:crypto';
let input='';for await(const chunk of process.stdin)input+=chunk;
const request=JSON.parse(input);
const result=prepareOriginalDosResourceGraphics(new Uint8Array(Buffer.from(request.memory,'base64')),request.ss,request.cs,request.ds,request.dx);
result.memory.fill(0,request.ss*16+0xfec0,request.ss*16+0xff10);
console.log(JSON.stringify({assets:result.assets,groups:result.groups,hash:createHash('sha256').update(result.memory).digest('hex')}));
