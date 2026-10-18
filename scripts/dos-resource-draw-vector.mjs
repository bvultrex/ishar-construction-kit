import {createHash} from 'node:crypto';
import {prepareOriginalDosResourceDraw} from '../src/lib/ishar/original-dos-resource-draw.ts';
let input='';for await(const chunk of process.stdin)input+=chunk;
const r=JSON.parse(input),source=new Uint8Array(Buffer.from(r.memory,'base64')),opcode=source[r.registers.ds*16+r.registers.si];
const next=prepareOriginalDosResourceDraw(source,r.ss,{...r.registers,si:(r.registers.si+1)&65535},opcode,r.complete??false);
next.memory.fill(0,r.ss*16+0xfec0,r.ss*16+0xff10);const {memory,...result}=next;
console.log(JSON.stringify({...result,hash:createHash('sha256').update(memory).digest('hex')}));
