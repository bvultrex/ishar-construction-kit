import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {blitOriginalDosByteSprite} from '../src/lib/ishar/original-dos-byte-blit.ts';
let text='';for await(const chunk of process.stdin)text+=chunk;const r=JSON.parse(text),source=new Uint8Array(Buffer.from(r.memory,'base64')),before=source.slice();
const {memory,...result}=blitOriginalDosByteSprite(source,r.ss,r.registers,r.di);assert.deepEqual(source,before);
memory.fill(0,r.ss*16+(r.stackMaskStart??0xfec0),r.ss*16+(r.stackMaskEnd??0xff10));
console.log(JSON.stringify({...result,hash:createHash('sha256').update(memory).digest('hex')}));
