import {stepOriginalDosVgaPaletteIrq} from './original-dos-vga-palette-irq.ts';
import {finishOriginalDosPostPaletteIrq} from './original-dos-post-palette-irq.ts';
import type {OriginalRenderedCpu} from './original-dos-rendered-frame-return.ts';
/** Explicit delivery of installed IRQ8, real hardware/save frames, 0D6D/0D98,
 * optional VGA callback and original tail. Saved BIOS target is NOT executed.
 * CPU arithmetic scratch flags excluded; saved IRET flags remain exact.
 */
export function deliverOriginalDosRuntimeTimerIrq(source:Uint8Array,ss:number,input:OriginalRenderedCpu&{cs:number;ip:number;flags:number},retraceReads:readonly number[]){
 if(source.length!==0x100000||ss!==0x1c0b||!Object.values(input).every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||!(input.flags&512)||!retraceReads.every(v=>Number.isInteger(v)&&v>=0&&v<=255))throw Error('Invalid runtime IRQ delivery');
 let memory=source.slice();const g=ss*16,v=new DataView(memory.buffer),segment=v.getUint16(34,true),offset=v.getUint16(32,true);
 if(segment!==0x1000||![0xd6d,0xd98].includes(offset))throw Error('Unknown runtime IRQ8 vector');
 const r:OriginalRenderedCpu={ax:input.ax,bx:input.bx,cx:input.cx,dx:input.dx,di:input.di,si:input.si,bp:input.bp,ds:input.ds,es:input.es,sp:input.sp},events:Array<{kind:string;port:number;value:number}>=[];let reads=0;
 const push=(value:number)=>{r.sp=(r.sp-2)&65535;if(r.sp===65535)throw Error('IRQ stack word straddles bounded segment');new DataView(memory.buffer).setUint16(g+r.sp,value,true);};
 for(const value of [input.flags,input.cs,input.ip])push(value);
 for(const key of ['ax','bx','cx','dx','di','si','ds','es','bp'] as const)push(r[key]);
 r.ax=ss;r.ds=ss;
 if(offset===0xd6d){
  r.dx=0x3da;
  for(;;){if(reads>=retraceReads.length)throw Error('Runtime IRQ requires explicit retrace reply');const value=retraceReads[reads++];events.push({kind:'in',port:0x3da,value});if(value&8)break;}
  const period=new DataView(memory.buffer).getUint16(0x10bf8,true);new DataView(memory.buffer).setUint16(g+0x288c,period,true);
  events.push({kind:'out',port:0x43,value:54},{kind:'out',port:0x40,value:period&255},{kind:'out',port:0x40,value:period>>>8});r.ax=((period&255)<<8)|(period>>>8);
 }
 r.ax=(r.ax&0xff00)|96;events.push({kind:'out',port:0x20,value:96});memory[g+0xc9a]=Math.min(255,memory[g+0xc9a]+1);
 if(memory[g+0x2898]!==0&&memory[g+0xcb8]!==0){
  push(0x1000);push(0xdc9);
  const palette=stepOriginalDosVgaPaletteIrq(memory,{ax:r.ax,interruptFlag:true,retraceReads:retraceReads.slice(reads)});memory=palette.memory;r.ax=palette.ax;reads+=palette.retraceReplies;events.push(...palette.events);r.sp=(r.sp+4)&65535;
 }
 const tail=finishOriginalDosPostPaletteIrq(memory,ss,r);
 return {...tail,events,retraceReplies:reads,installedOffset:offset,interrupted:{cs:input.cs,ip:input.ip,flags:input.flags,sp:input.sp},stackDelta:tail.registers.sp-input.sp};
}
