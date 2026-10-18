import {deliverOriginalDosRuntimeTimerIrq} from '../src/lib/ishar/original-dos-runtime-timer-irq.ts';
import {createHash} from 'node:crypto';
import {completeDosPlatformBiosTimer} from '../src/lib/ishar/dos-platform-bios-timer.ts';
let text='';for await(const chunk of process.stdin)text+=chunk;const r=JSON.parse(text),source=new Uint8Array(Buffer.from(r.memory,'base64')),before=source.slice();
let {memory,...result}=deliverOriginalDosRuntimeTimerIrq(source,r.ss,r.registers,r.retraceReads);
if(r.biosProfile){
 if(result.phase!=='saved-handler')throw Error('Explicit BIOS adapter requires actual saved-handler boundary');
 const service=completeDosPlatformBiosTimer(memory,r.ss,{...result.registers,cs:result.segment,ip:result.entry},r.biosProfile);
 const {cs,ip,flags,...registers}=service.registers;
 result={...result,registers,phase:'iret',entry:ip,segment:cs,flags,stackDelta:registers.sp-r.registers.sp,platformService:{profile:service.platform,ticks:service.ticks,savedHandler:{segment:result.segment,entry:result.entry}},events:[...result.events,...service.events.filter(e=>e.kind==='out')]};memory=service.memory;
}
if(!source.every((v,i)=>v===before[i]))throw Error('Runtime IRQ mutated input');memory.fill(0,r.ss*16+r.stackMaskStart,r.ss*16+r.stackMaskEnd);
console.log(JSON.stringify({...result,hash:createHash('sha256').update(memory).digest('hex')}));
