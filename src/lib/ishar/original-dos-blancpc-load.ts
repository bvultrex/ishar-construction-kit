import {openOriginalDosFile,type OriginalDosOpenResponse} from './original-dos-file-open.ts';
import {runOriginalDosFileIo,type OriginalDosIoResponse} from './original-dos-file-io.ts';
import {transformOriginalBlancpcLoadWindow} from './original-blancpc-load-transform.ts';
export interface OriginalBlancpcLoadReplies{opens:OriginalDosOpenResponse[];read:OriginalDosIoResponse;close:OriginalDosIoResponse}
/** Engine0833..0852, including06B2's complete load/copy/transform.
 * Uses the existing DOS helper contracts on shared physical memory. Original
 * short reads leave existing bytes intact; the transform consumes2560 bytes
 * starting at resource+0036, not merely the file's payload.
 */
export function initializeOriginalDosBlancpc(source:Uint8Array,ss:number,replies:OriginalBlancpcLoadReplies){
 if(source.length!==0x100000||!Number.isInteger(ss)||ss<0||ss>65535||ss*16+65536>source.length)throw Error('Invalid physical BLANCPC startup state');
 let memory=source.slice();const g=ss*16,events:Array<Record<string,number|string>>=[];
 const word=(at:number,value?:number)=>{const v=new DataView(memory.buffer);if(value!==undefined)v.setUint16(g+at,value&65535,true);return v.getUint16(g+at,true);};
 const resource=word(0x28a2),frontier=(resource+0x148)&65535,destination=(resource+0xa0)&65535;
 if(resource*16+65536>memory.length||destination*16+0x36+0xa00>memory.length)throw Error('BLANCPC bounded physical window exceeded');
 word(0xe1e,resource);word(0xe1c,0);
 let opens=0;
 const opened=openOriginalDosFile(memory.slice(g,g+65536),{ax:2,bx:0,cx:0,dx:0x6a7,ds:0x1000},()=>{const reply=replies.opens[opens++];if(!reply)throw Error('BLANCPC needs another DOS open reply');return reply;});memory.set(opened.memory,g);
 for(const event of opened.events)events.push(event.operation==='select-drive'?{service:'select-drive',drive:event.drive}:{service:event.operation,access:event.ax&255,segment:event.ds,offset:event.dx});
 const error=(value:number)=>({memory,events,phase:'error',boundary:0x8468,error:value,opens});
 if(opened.error!==null)return error(opened.error);
 let registers={...opened.registers,ds:resource,dx:0,cx:2500};
 for(const operation of ['read','close'] as const){
  const globals=memory.slice(g,g+65536),segment=resource===ss?globals:memory.slice(resource*16,resource*16+65536);
  const io=runOriginalDosFileIo(globals,segment,registers,operation,()=>operation==='read'?replies.read:replies.close,resource===ss);
  memory.set(io.globals,g);memory.set(io.memory,resource*16);registers=io.registers;
  for(const event of io.events)events.push(event.operation==='select-drive'?{service:'select-drive',drive:event.drive}:event.operation==='read'?{service:'read',handle:event.bx,count:event.cx,segment:event.ds,offset:event.dx}:{service:'close',handle:event.bx});
  if(io.error!==null)return error(io.error);
 }
 word(0xe20,0x36);word(0xe24,0x36);word(0xe22,resource);word(0xe26,destination);
 const transformed=transformOriginalBlancpcLoadWindow(memory.slice(resource*16+0x36,resource*16+0x36+0xa00));memory.set(transformed,destination*16+0x36);
 word(0xb92,frontier);word(0xb90,0);
 return {memory,events,phase:'return',boundary:0x853,error:null,opens};
}
