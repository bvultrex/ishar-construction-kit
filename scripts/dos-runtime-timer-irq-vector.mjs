import {deliverOriginalDosRuntimeTimerIrq} from '../src/lib/ishar/original-dos-runtime-timer-irq.ts';
import {createHash} from 'node:crypto';
let text='';for await(const chunk of process.stdin)text+=chunk;const r=JSON.parse(text),source=new Uint8Array(Buffer.from(r.memory,'base64')),before=source.slice(),{memory,...result}=deliverOriginalDosRuntimeTimerIrq(source,r.ss,r.registers,r.retraceReads);
if(!source.every((v,i)=>v===before[i]))throw Error('Runtime IRQ mutated input');memory.fill(0,r.ss*16+r.stackMaskStart,r.ss*16+r.stackMaskEnd);
console.log(JSON.stringify({...result,hash:createHash('sha256').update(memory).digest('hex')}));
