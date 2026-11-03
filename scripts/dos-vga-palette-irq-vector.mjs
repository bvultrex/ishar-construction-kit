import {createHash} from 'node:crypto';
import {stepOriginalDosVgaPaletteIrq} from '../src/lib/ishar/original-dos-vga-palette-irq.ts';
let text='';for await(const chunk of process.stdin)text+=chunk;const r=JSON.parse(text);
const {memory,...result}=stepOriginalDosVgaPaletteIrq(new Uint8Array(Buffer.from(r.memory,'base64')),r.replies);
memory.fill(0,r.ss*16+(r.stackMaskStart??0xfec0),r.ss*16+(r.stackMaskEnd??0xff10));console.log(JSON.stringify({...result,hash:createHash('sha256').update(memory).digest('hex')}));
