import {stepOriginalDosIdleTimerIrq} from './original-dos-idle-timer-irq.ts';
/** Original installed IRQ8 at0D6D/0D98 through IRET, idle callbacks only.
 * Shared image includes the actual vector, code state and literal DS1C0B.
 * No nested IRQ, BIOS chain, active graphics/audio callback is synthesized.
 */
export function stepOriginalDosStartupTimerIrq(source:Uint8Array,ss:number,retraceReads:readonly number[]){
 if(source.length!==0x100000||ss!==0x1c0b||!retraceReads.every(v=>Number.isInteger(v)&&v>=0&&v<=255))throw Error('Invalid startup IRQ state');
 const memory=source.slice(),v=new DataView(memory.buffer),segment=v.getUint16(34,true),offset=v.getUint16(32,true),events:Array<Record<string,number|string>>=[];let reads=0;
 if(segment!==0x1000||![0xd6d,0xd98].includes(offset))throw Error('Unknown startup timer vector');
 if(offset===0xd6d){
  for(;;){if(reads>=retraceReads.length)throw Error('Startup timer IRQ requires another retrace reply');const value=retraceReads[reads++],last=events.at(-1);if(last?.kind==='in'&&last.value===value)last.repeat=Number(last.repeat)+1;else events.push({kind:'in',port:0x3da,value,repeat:1});if(value&8)break;}
  const period=v.getUint16(0x10bf8,true);events.push({kind:'out',port:0x43,value:0x36},{kind:'out',port:0x40,value:period&255},{kind:'out',port:0x40,value:period>>>8});v.setUint16(ss*16+0x288c,period,true);
 }
 const result=stepOriginalDosIdleTimerIrq(memory.slice(ss*16,ss*16+65536),memory[0x19414]);memory.set(result.memory,ss*16);
 for(const port of result.ports)events.push({kind:'out',...port});
 return {memory,events,retraceReplies:reads,exit:'iret'};
}

/** Original0CFE..0D35 with three explicitly scheduled IRQ deliveries.
 * Starts at the verified wait with AX0 and the timer call on the CPU stack.
 * Loop indices count completed0D0C iterations; no wall-clock speed is inferred.
 */
export function completeOriginalDosTimerStartup(source:Uint8Array,ss:number,r:{secondAt:number;thirdAt:number;retraceReads:readonly (readonly number[])[]}){
 if(![r.secondAt,r.thirdAt].every(v=>Number.isInteger(v)&&v>=0&&v<=1000000)||r.secondAt>r.thirdAt||r.retraceReads.length!==3)throw Error('Invalid startup IRQ delivery schedule');
 let memory=source.slice();const g=ss*16,events:Array<Record<string,number|string>>=[];
 if(source.length!==0x100000||ss!==0x1c0b||memory[g+0xc9a]!==0)throw Error('Timer completion requires the initial IRQ wait state');
 for(let index=0;index<3;index++){
  events.push({kind:'irq',vector:8,loop:index===0?-1:index===1?r.secondAt:r.thirdAt});
  const irq=stepOriginalDosStartupTimerIrq(memory,ss,r.retraceReads[index]);memory=irq.memory;events.push(...irq.events);
  if(index===0)memory[g+0xc9a]=0; // Original0D06, after the first IRQ exits0CFE.
 }
 const iterations=r.thirdAt+1,count=Math.min(iterations,0x7fff),measurement=Math.trunc(count/40),remainder=count%40;
 new DataView(memory.buffer).setUint16(g+0xc9f,measurement,true);
 return {memory,events,iterations,measurement,registers:{ax:measurement,bx:40,dx:remainder},boundary:0x8ff,stackDelta:2,irqCount:3};
}
