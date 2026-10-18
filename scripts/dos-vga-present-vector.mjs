import {createHash} from 'node:crypto';
import {presentOriginalDosVga} from '../src/lib/ishar/original-dos-vga-present.ts';
let text='';for await(const chunk of process.stdin)text+=chunk;const r=JSON.parse(text);
const {memory,...result}=presentOriginalDosVga(new Uint8Array(Buffer.from(r.memory,'base64')),r.ss);
memory.fill(0,r.ss*16+(r.stackMaskStart??0xfec0),r.ss*16+(r.stackMaskEnd??0xff10));console.log(JSON.stringify({...result,registers:r.registers,hash:createHash('sha256').update(memory).digest('hex')}));
