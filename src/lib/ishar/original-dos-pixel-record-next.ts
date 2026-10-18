import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** RET430A ->449C..44A1 ->447A..449B, normal record-loop caller.
 * Existing CPU stack supplies the five saved registers; no fabricated state.
 * Stops before the next graphics call or active-object continuation442F.
 */
export function advanceOriginalDosPixelRecord(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,bx:number,di:number,sp:number){
 if(source.length!==0x100000||![ss,bx,di,sp,...Object.values(input)].every(x=>Number.isInteger(x)&&x>=0&&x<=65535))throw Error('Invalid pixel record continuation');
 const memory=source.slice(),u=(x:number)=>x&65535;
 const w=(s:number,o:number)=>{o=u(o);const at=s*16+o;if(o===65535||at+2>memory.length)throw Error('Pixel continuation outside bounded physical window');return memory[at]|memory[at+1]<<8;};
 const b=(s:number,o:number)=>{const at=s*16+u(o);if(at>=memory.length)throw Error('Pixel continuation outside bounded physical window');return memory[at];};
 let cursor=sp;const pop=()=>{const value=w(ss,cursor);cursor=u(cursor+2);return value;};
 if(pop()!==0x449c)throw Error('Unsupported graphics record return caller');
 const registers={...input};registers.es=pop();registers.ds=pop();registers.cx=pop();registers.si=pop();di=pop();
 const seen=new Set<number>();let skipped=0;
 for(;;){di=w(registers.ds,di+6);if(di===0)return {memory,registers,bx,di,sp:cursor,stackDelta:12,entry:0x442f,phase:'next-object',skipped};
  if(seen.has(di))throw Error('Pixel record cycle exceeds host bound');seen.add(di);
  if(b(registers.ds,di)>=128||b(registers.ds,di+34)>=128||(w(registers.ds,di+16)&32768)!==0){skipped++;continue;}
  const bank=b(ss,0x2898)===0&&b(ss,0x2896)!==0&&b(ss,0xcb1)<128;
  return {memory,registers,bx,di,sp,stackDelta:0,entry:bank?0x4313:0x4305,phase:bank?'record-bank':'record',skipped};
 }
}
