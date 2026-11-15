import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {stepOriginalDosPhysicalScript} from '../src/lib/ishar/original-dos-physical-script.ts';
let text='';for await(const chunk of process.stdin)text+=chunk;
const q=JSON.parse(text),source=new Uint8Array(Buffer.from(q.memory,'base64')),before=source.slice(),result=stepOriginalDosPhysicalScript(source,q.ss,q.registers);
assert.deepEqual(source,before);result.memory.fill(0,0x1c0b0+0x780,0x1c0b0+0x7ec);
console.log(JSON.stringify({registers:result.registers,hash:createHash('sha256').update(result.memory).digest('hex')}));
