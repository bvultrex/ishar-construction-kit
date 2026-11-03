export interface OriginalDosTimerStartupReplies{vectorOffset:number;vectorSegment:number;retraceReads:number[];pitCounterWord:number;noInterrupts:true}
/** Original08FC ->0BFA through the first IRQ-dependent wait0CFE.
 * Explicit no-delivered-IRQ prefix; finite retrace replies and PIT count.
 * Never manufactures completion of the wait. DIV0 retains the real fault state.
 */
export function prepareOriginalDosTimerStartup(source:Uint8Array,ss:number,r:OriginalDosTimerStartupReplies){
 if(source.length!==0x100000||!Number.isInteger(ss)||ss<0||ss>65535||ss*16+65536>source.length||![r.vectorOffset,r.vectorSegment,r.pitCounterWord].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||!r.retraceReads.every(v=>Number.isInteger(v)&&v>=0&&v<=255)||r.noInterrupts!==true)throw Error('Invalid timer startup replies');
 const memory=source.slice(),g=ss*16,v=new DataView(memory.buffer),events:Array<Record<string,number|string>>=[],word=(at:number,value:number)=>v.setUint16(at,value&65535,true);
 const output=(port:number,value:number)=>events.push({kind:'out',port,value});
 const input=(port:number,value:number)=>{const last=events.at(-1);if(last?.kind==='in'&&last.port===port&&last.value===value)last.repeat=Number(last.repeat)+1;else events.push({kind:'in',port,value,repeat:1});};
 const vector=(offset:number)=>{events.push({service:'set-vector',number:8,segment:0x1000,offset});word(32,offset);word(34,0x1000);};
 events.push({service:'get-vector',number:8});word(0x10bf2,r.vectorOffset);word(0x10bf4,r.vectorSegment);vector(0xd54);
 // No calibration IRQ: the original65000-iteration poll expires.
 word(0x10bf6,0xffff);let reads=0,period=0x5d2a,handler=0xd98;
 if(v.getUint16(g+0x2894,true)!==7){
  const retrace=(set:boolean)=>{for(;;){if(reads>=r.retraceReads.length)throw Error('Timer startup needs another retrace reply');const value=r.retraceReads[reads++];input(0x3da,value);if(Boolean(value&8)===set)break;}};
  retrace(false);retrace(true);output(0x43,0x36);output(0x40,255);output(0x40,255);retrace(false);retrace(true);output(0x43,6);input(0x40,r.pitCounterWord&255);input(0x40,r.pitCounterWord>>>8);
  period=(((0xffff-r.pitCounterWord)>>>1)-100)&65535;handler=0xd6d;
 }
 word(0x10bf8,period);memory[g+0xc97]=1;memory[g+0xc98]=1;
 if(period===0){events.push({interrupt:0});return {memory,events,phase:'divide-error',boundary:0xcba,stackDelta:-4,timerPolls:65000,retraceReplies:reads,period};}
 const ratio=Math.trunc(65535/period);if(ratio!==0){memory[g+0xc97]=ratio&255;memory[g+0xc98]=ratio&255;}
 output(0x43,0x36);word(g+0x288c,period);output(0x40,period&255);output(0x40,period>>>8);
 memory[g+0xc9b]=16;memory[g+0xc9c]=16;vector(handler);memory[g+0xc9a]=0;
 return {memory,events,phase:'wait',boundary:0xcfe,stackDelta:-2,timerPolls:65000,retraceReplies:reads,period,interruptsEnabled:true};
}
