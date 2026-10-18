/** Reconstruction of original BLANCPC native image+64..140, hash documented in
 * ALIS_SOUNDS.md. Pure state projection: no I/O, CPU execution or timing model. */
export interface BlancpcInterruptState {operandAX:number;samplePointer:number;counter:number}
export function stepOriginalBlancpcInterrupt(state:BlancpcInterruptState,readCodeByte:(offset:number)=>number){
 if([state.operandAX,state.samplePointer,state.counter].some(n=>!Number.isInteger(n)||n<0||n>65535))throw Error('Invalid BLANCPC word state');
 const next={...state},ports=[{port:0x42,value:state.operandAX&255}];
 const high=state.operandAX>>>8,rotated=((high<<1)|(high>>>7))&255;
 if((high&128)===0){
  next.operandAX=(rotated<<8)|(state.operandAX&255);
  ports.push({port:0x20,value:0x20});return {state:next,ports,exit:'iret' as const,path:'rotate' as const};
 }
 const sample=readCodeByte(state.samplePointer);
 if(!Number.isInteger(sample)||sample<0||sample>255)throw Error('Invalid BLANCPC sample byte');
 if(sample!==0){
  next.operandAX=(rotated<<8)|sample;next.samplePointer=(state.samplePointer+1)&65535;
  ports.push({port:0x20,value:0x20});return {state:next,ports,exit:'iret' as const,path:'sample' as const};
 }
 next.samplePointer=0x8000;next.counter=(state.counter-1)&65535;
 if(next.counter===0)return {state:next,ports,exit:'far-jump' as const,path:'end' as const};
 // DEC's sign flag feeds JNS. Negative counters are incremented back, even
 // though this may resemble an infinite-loop sentinel rather than a count.
 if(next.counter&0x8000)next.counter=(next.counter+1)&65535;
 ports.push({port:0x20,value:0x20});return {state:next,ports,exit:'iret' as const,path:'repeat' as const};
}
