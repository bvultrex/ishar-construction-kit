import {openOriginalDosFile} from './original-dos-file-open.ts';
import {runOriginalDosFileIo} from './original-dos-file-io.ts';
import type {OriginalRenderedCpu} from './original-dos-rendered-frame-return.ts';
/** Success-only7917..7959/7968/76CF using existing original DOS helpers.
 * Explicit six-byte read and handle; no allocation/decode success assumed.
 * Caller already holds the69/78F9 save frames; SP remains at their real value.
 */
export function prepareOriginalDosModuleHeader(source:Uint8Array,ss:number,input:OriginalRenderedCpu,header:Uint8Array,handle:number){
 if(source.length!==0x100000||ss!==0x1c0b||input.ax!==2||input.cx!==6||header.length!==6||!Number.isInteger(handle)||handle<0||handle>65535||!Object.values(input).every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid module-header state');
 const memory=source.slice(),g=ss*16,open=openOriginalDosFile(memory.slice(g,g+65536),{ax:input.ax,bx:input.bx,cx:input.cx,dx:input.dx,ds:input.ds},()=>({ax:handle,carry:false}));
 if(open.error!==null||open.events.some(e=>e.operation!=='open'&&e.operation!=='select-drive'))throw Error('Module header requires successful original open branch');
 memory.set(open.memory,g);const globals=memory.slice(g,g+65536),read=runOriginalDosFileIo(globals,globals,{ax:ss,bx:input.bx,ds:ss,dx:0x2480,cx:6},'read',()=>({ax:6,carry:false,data:header}),true);memory.set(read.globals,g);
 const r={...input,ax:6,bx:handle,ds:ss,dx:0x2480,cx:6},v=new DataView(memory.buffer),word=(o:number)=>v.getUint16(g+o,true),events=[...open.events,...read.events];
 if(word(0x2484)===0)return {memory,registers:r,events,phase:'main-header',entry:0x76cf,stackDelta:0};
 r.ds=word(0xbca);r.dx=word(0xbc8);r.ax=word(0x2482)&0xfeff;r.cx=(word(0x2480)-6)&65535;memory[g+0xb57]=r.ax>>>8;
 if(memory[g+0xb57]&128){r.ax&=255;return {memory,registers:r,events,phase:'compressed',entry:0x7959,stackDelta:0};}
 return {memory,registers:r,events,phase:'allocate',entry:0x7968,stackDelta:0};
}
