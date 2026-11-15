import {runOriginalDosFileIo,type OriginalDosIoRequest,type OriginalDosIoResponse} from './original-dos-file-io.ts';
import type {OriginalRenderedCpu} from './original-dos-rendered-frame-return.ts';
/** Successful compressed-load tail795C..79A0, stopping before registry8182.
 * Only a matching loaded/requested ID; alternate-ID lookup remains separate.
 */
export function closeOriginalDosDecodedModule(source:Uint8Array,ss:number,input:OriginalRenderedCpu,dos:(r:OriginalDosIoRequest)=>OriginalDosIoResponse){
 if(source.length!==0x100000||ss!==0x1c0b||![...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid decoded module close state');
 const memory=source.slice(),g=ss*16,at=input.ds*16+input.dx;
 if(input.dx===65535||at+2>memory.length)throw Error('Decoded module ID outside bounded window');
 const id=memory[at]|memory[at+1]<<8;
 if(id!==(memory[g+0xb04]|memory[g+0xb05]<<8))throw Error('Alternate module ID requires original lookup path');
 memory[g+0xc4a]=1;
 const globals=memory.slice(g,g+65536),result=runOriginalDosFileIo(globals,globals,{ax:input.ax,bx:input.bx,cx:input.cx,dx:input.dx,ds:input.ds},'close',dos,true);
 if(result.error!==null)throw Error(`Original module close error ${result.error}`);
 memory.set(result.globals,g);
 return {memory,registers:{...input,ax:id,bx:result.registers.bx},events:result.events,entry:0x79a0,stackDelta:0,phase:'register' as const};
}
