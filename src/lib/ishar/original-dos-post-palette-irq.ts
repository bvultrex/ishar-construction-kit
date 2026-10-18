import {selectOriginalDosTimerRecord} from './original-dos-timer-selection.ts';
import {planOriginalDosTimerReturn} from './original-dos-timer-return.ts';
import type {OriginalRenderedCpu} from './original-dos-rendered-frame-return.ts';
/** Original0DC9..0E46 after the actual palette far return. Active audio,
 * timer records and cursor bodies remain explicit boundaries. Saved BIOS
 * handler is a real far target, never replaced with an IRET success stub.
 */
export function finishOriginalDosPostPaletteIrq(source:Uint8Array,ss:number,input:OriginalRenderedCpu){
 if(source.length!==0x100000||ss!==0x1c0b||!Object.values(input).every(x=>Number.isInteger(x)&&x>=0&&x<=65535)||input.ds!==0x1c0b)throw Error('Invalid post-palette IRQ state');
 const memory=source.slice(),g=ss*16,r={...input},v=new DataView(memory.buffer);
 const word=(offset:number)=>{if(offset===65535||g+offset+2>memory.length)throw Error('IRQ stack word outside memory');return v.getUint16(g+offset,true);};
 const stop=(phase:string,entry:number,stackDelta=0)=>({memory,registers:r,phase,entry,segment:0x1000,stackDelta});
 if(memory[0x19414]!==0)return stop('audio',0xdd1);
 const selected=selectOriginalDosTimerRecord([memory[g+0x1dfe],memory[g+0x1e0e],memory[g+0x1e1e]]);memory[g+0xcd7]=selected;const signed=(x:number)=>x&128?x-256:x,first=memory[g+0x1dfe],second=memory[g+0x1e0e];
 //222A updates AH for record1, but the final record2 branch only writes CD7.
 r.ax=((signed(second)>signed(first)?second:first)<<8)|(r.ax&255);
 for(const [index,at,entry] of [[0,0x1dfd,0xde9],[1,0x1e0d,0xdfc],[2,0x1e1d,0xe0f]])if(memory[g+at]>0&&memory[g+at]<128){r.bx=index;r.di=at;return stop('record',entry);}
 if(memory[g+0x2896]!==0&&memory[g+0xcb1]<128){r.sp=(r.sp-2)&65535;return stop('cursor',0x670d,-2);}
 const tail=planOriginalDosTimerReturn(memory[g+0xc97],memory[g+0xc98],memory[g+0xcd8],memory[g+0xcc5]);memory[g+0xc97]=tail.counter;
 const pop=()=>{const value=word(r.sp);r.sp=(r.sp+2)&65535;return value;};
 for(const key of ['bp','es','ds','si','di','dx','cx','bx','ax'] as const)r[key]=pop();
 if(tail.exit==='saved-handler')return {memory,registers:r,phase:'saved-handler',entry:v.getUint16(0x10bf2,true),segment:v.getUint16(0x10bf4,true),stackDelta:18};
 const entry=pop(),segment=pop(),flags=pop();return {memory,registers:r,phase:'iret',entry,segment,flags,stackDelta:24};
}
