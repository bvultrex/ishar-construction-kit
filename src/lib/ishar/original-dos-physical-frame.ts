import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
import {prepareOriginalDosVisibleObject} from './original-dos-visible-object.ts';
/** Frame CALL2649 ->3D3C..3E54. Shared physical memory; stop before any
 * unreconstructed graphics/input/record body or timer wait. No device stubs.
 * The return path restores the six script registers; scratch/flags are not modeled.
 */
export function runOriginalDosPhysicalFrame(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,engineSegment=0x1000,traverseEmpty=false){
 if(source.length!==0x100000||![ss,engineSegment,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Expected1MiB memory and word registers');
 const memory=source.slice(),u=(v:number)=>v&65535;
 const addr=(s:number,o:number,wide=false)=>{o=u(o);const at=s*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Frame access outside bounded real-mode window');return at;};
 const b=(s:number,o:number,v?:number)=>{const at=addr(s,o);if(v!==undefined)memory[at]=v&255;return memory[at];};
 const w=(s:number,o:number,v?:number)=>{const at=addr(s,o,true);if(v!==undefined){memory[at]=v&255;memory[at+1]=(v>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 const registers={...input};let visited=0,hidden=0,bx=0;const emptyOwners:number[]=[];
 const result=(phase:'return'|'notification'|'wait'|'keyboard'|'object'|'record',entry:number,extra:Record<string,number>={})=>({memory,registers:phase==='return'?{...input}:registers,phase,entry,stackDelta:phase==='return'?0:-20,visited,hidden,emptyOwners,...extra});
 if(b(ss,0xc4a)!==0&&b(ss,0x2898)!==0)return result('notification',0x3d55);
 if(b(ss,0xc99)>b(ss,0xc9a))return result('wait',0x3d64);
 if(b(engineSegment,0x318)===0x73)return result('keyboard',0x3d6b);
 b(ss,0xc9a,0);
 for(const [from,to] of [[0xb88,0x1dbf],[0xb8a,0x1dc1],[0x1dcd,0x1dc3],[0x1dcf,0x1dc5],[0x1dd1,0x1dc7],[0x1dd3,0x1dc9],[0x1dd5,0x1dcb]])w(ss,to,w(ss,from));
 let link=w(ss,0xc16);const seen=new Set<number>();
 while(link!==0){
  if(seen.has(link))throw Error('Original frame list cycle exceeds host contract');seen.add(link);visited++;
  bx=u(w(ss,0xbf6)+link);
  if((b(input.es,bx)&0x40)===0){
   w(ss,0xb32,bx);w(ss,0xb34,input.es);registers.cx=w(input.es,bx+2);w(ss,0xb18,registers.cx);
   if(traverseEmpty){
    const prepared=prepareOriginalDosVisibleObject(memory,ss,registers,bx);
    if(prepared.phase==='return'){memory.set(prepared.memory);emptyOwners.push(bx);link=w(input.es,bx+4);continue;}
   }
   return result('object',0x3de4,{bx});
  }
  hidden++;link=w(input.es,bx+4);
 }
 b(ss,0xc49,0);
 if(b(ss,0xc37)===0&&b(ss,0xcb0)!==0){
  b(ss,0xc18,0);const ds=w(ss,0xbea),di=u(w(ss,0xbe8)+w(ss,0xcae)),cx=w(ss,0xbee),type=b(ds,di);
  if(type!==0&&type!==0xfe&&[1,2,0xff].includes(type)){
   registers.ds=ds;registers.cx=cx;return result('record',0x3e24,{di,type});
  }
 }
 return result('return',0x264c);
}
