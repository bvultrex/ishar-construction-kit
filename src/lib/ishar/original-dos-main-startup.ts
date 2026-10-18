import {openOriginalDosFile} from './original-dos-file-open.ts';
import {runOriginalDosFileIo} from './original-dos-file-io.ts';
import {planOriginalDosResourceTables} from './original-dos-resource-memory.ts';
import {initializeOriginalDosResourceRuntime} from './original-dos-resource-initialize.ts';
/** Original CALL7641 ->78F9 (B040 path) ->76BC..77F5.
 * Success-only explicit DOS replies; stops before decode setup77F6.
 * No reset of the startup globals, graphics state or resource base.
 */
export function prepareOriginalDosMainStartup(source:Uint8Array,header:Uint8Array,handle:number){
 if(source.length!==0x100000||header.length!==22||!Number.isInteger(handle)||handle<0||handle>65535)throw Error('Invalid MAIN startup inputs');
 let memory=source.slice();const g=0x1c0b0,events:Array<Record<string,number|string>>=[];
 let v=new DataView(memory.buffer);v.setUint16(g+0xb04,0,true);v.setUint16(g+0xb02,0,true);v.setUint16(g+0x7ec,0x2607,true);
 const opened=openOriginalDosFile(memory.slice(g,g+65536),{ax:2,bx:0,cx:0,dx:0x7857,ds:0x1000},()=>({ax:handle,carry:false}));
 // BX/CX are not zero on the actual caller, but are preserved by open;
 // only DOS-visible handle/count/path and helper memory effects matter here.
 memory.set(opened.memory,g);
 for(const e of opened.events)if(e.operation==='select-drive')events.push({service:'select-drive',drive:e.drive!});else if(e.operation==='open')events.push({service:'open',access:e.ax&255,segment:e.ds,offset:e.dx});else throw Error('Unexpected MAIN open branch');
 let position=0;
 for(const [dx,cx] of [[0x2480,6],[0x2486,16]]){
  const globals=memory.slice(g,g+65536),data=header.slice(position,position+cx);position+=cx;
  const read=runOriginalDosFileIo(globals,globals,{ax:position===6?0x1c0b:6,bx:handle,cx,dx,ds:0x1c0b},'read',()=>({ax:data.length,carry:false,data}),true);memory.set(read.globals,g);
  events.push({service:'read',handle,count:cx,segment:0x1c0b,offset:dx});
 }
 v=new DataView(memory.buffer);const word=(at:number)=>v.getUint16(g+at,true),base=word(0xb92),plan=planOriginalDosResourceTables(memory.slice(g+0x2486,g+0x2496),base,word(0xb90),word(0xb96),word(0xb94));
 for(const [at,value] of Object.entries(plan.words))v.setUint16(g+Number(at),value,true);
 const initialized=initializeOriginalDosResourceRuntime(memory,0x1c0b,base),h=new DataView(header.buffer,header.byteOffset,header.byteLength),product=((h.getUint16(18,true)+3)&65535)*38;
 const paragraphs=plan.bounds.paragraphs,cx=h.getUint16(10,true)>>>4;
 return {...initialized,events,boundary:0x77f6,registers:{ax:plan.bounds.candidate,bx:paragraphs,cx,dx:product>>>16,ds:plan.words[0xbca],es:base},plan};
}
