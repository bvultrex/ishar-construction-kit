import {createHash} from 'node:crypto';
import {advanceOriginalDosPixelObjects} from '../src/lib/ishar/original-dos-pixel-objects-end.ts';
let text='';for await(const chunk of process.stdin)text+=chunk;const r=JSON.parse(text);
const {memory,...result}=advanceOriginalDosPixelObjects(new Uint8Array(Buffer.from(r.memory,'base64')),r.ss,r.registers,r.bx,r.di);
memory.fill(0,r.ss*16+(r.stackMaskStart??0xfec0),r.ss*16+(r.stackMaskEnd??0xff10));console.log(JSON.stringify({...result,hash:createHash('sha256').update(memory).digest('hex')}));
