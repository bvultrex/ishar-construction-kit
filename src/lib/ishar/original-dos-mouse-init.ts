/** Native CS:11C3..1248. INT33 requests only; driver implementation external. */
export function planOriginalDosMouseInit(blocked: number, mode: number, resetAX: number, flags: number, cursorOffset: number, cursorSegment: number, codeSegment: number) {
  if (![blocked,mode].every(v=>Number.isInteger(v)&&v>=0&&v<=255)||![resetAX,flags,cursorOffset,cursorSegment,codeSegment].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)) throw new Error('Invalid native mouse initialization state');
  const calls: {ax:number;cx?:number;dx?:number;es?:number}[]=[];
  if (blocked===0) {
    blocked=1;calls.push({ax:0});
    if (resetAX!==0) {
      calls.push({ax:15,cx:16,dx:32});cursorOffset=0x2780;cursorSegment=0x1c0b;
      if(mode===1) calls.push({ax:4,cx:160,dx:100},{ax:7,cx:0,dx:319},{ax:8,cx:0,dx:199},{ax:15,cx:32,dx:32},{ax:12,cx:63,dx:0x1249,es:codeSegment});
      blocked=0;flags|=4;
    }
  }
  return {calls,blocked,flags,cursorOffset,cursorSegment,hiddenByte:255};
}
