import {quiesceOriginalDosAudio} from '../src/lib/ishar/original-dos-audio-quiesce.ts';
import {createHash} from 'node:crypto';
let text='';for await(const chunk of process.stdin)text+=chunk;const r=JSON.parse(text),source=new Uint8Array(Buffer.from(r.memory,'base64')),before=source.slice();
const next=quiesceOriginalDosAudio(source,0x1000,()=>r.port61);if(!source.every((v,i)=>v===before[i]))throw Error('Quiesce input mutated');next.memory.fill(0,0x1c0b0+0xfec0,0x1c0b0+0xff10);
console.log(JSON.stringify({events:next.events,hash:createHash('sha256').update(next.memory).digest('hex')}));
