import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** Original442F..4458 /44A3..44F5, after one record chain ends.
 * Stops before another owner clip, special record, final restore or present.
 */
export function advanceOriginalDosPixelObjects(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,inputBx:number,inputDi:number){
 if(source.length!==0x100000||![ss,inputBx,inputDi,...Object.values(input)].every(x=>Number.isInteger(x)&&x>=0&&x<=65535))throw Error('Invalid pixel object continuation');
 const memory=source.slice(),u=(x:number)=>x&65535;
 const b=(s:number,o:number)=>{const at=s*16+u(o);if(at>=memory.length)throw Error('Pixel object access outside memory');return memory[at];};
 const w=(s:number,o:number)=>{o=u(o);if(o===65535)throw Error('Pixel object word straddles segment');return b(s,o)|b(s,o+1)<<8;};
 const registers={...input};let bx=inputBx,di=inputDi,visited=0;const seen=new Set<number>();
 for(;;){bx=u(w(ss,0xbf6)+registers.cx);registers.cx=w(input.es,bx+4);if(registers.cx===0)break;
  if(seen.has(registers.cx))throw Error('Active pixel object cycle');seen.add(registers.cx);visited++;bx=u(w(ss,0xbf6)+registers.cx);
  if(b(input.es,bx)&64)continue;di=w(input.es,bx+2);if(di===0)continue;
  return {memory,registers,bx,di,phase:'owner',entry:0x4458,stackDelta:0,visited};
 }
 if(b(ss,0xcb0)!==0)return {memory,registers,bx,di,phase:'special-record',entry:0x44ab,stackDelta:0,visited};
 const noPresent=(b(w(ss,0xb34),w(ss,0xb32)+1)&32)!==0;
 return {memory,registers,bx,di,phase:noPresent?'restore':'present',entry:noPresent?0x44f5:0x431f,stackDelta:noPresent?0:-2,visited};
}
