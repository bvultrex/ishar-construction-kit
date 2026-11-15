import type {OriginalDosOpenRegisters} from './original-dos-file-open.ts';
export type OriginalDosIoOperation='read'|'write'|'close';
export type OriginalDosIoRequest=OriginalDosOpenRegisters&{operation:OriginalDosIoOperation;data?:Uint8Array};
export interface OriginalDosIoResponse {ax:number;carry:boolean;data?:Uint8Array}
/** Read212D,write213F,close20B5 through RET or error8468.
 * DOS effects are explicit inputs, not actual host file access. BX/CX/DX/DS
 * survive DOS; AX/CF and any read bytes come from the supplied response.
 * No short-transfer retry or padding exists in these engine helpers.
 */
export function runOriginalDosFileIo(globals:Uint8Array,segment:Uint8Array,input:OriginalDosOpenRegisters,operation:OriginalDosIoOperation,dos:(request:OriginalDosIoRequest)=>OriginalDosIoResponse,segmentIsGlobals=false){
 if(globals.length!==65536||segment.length!==65536||!Object.values(input).every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Expected two segments and word registers');
 if(!['read','write','close'].includes(operation))throw Error('Unknown DOS I/O helper');
 if(segmentIsGlobals&&segment!==globals)throw Error('Aliased global segment must be supplied as the same buffer');
 if(operation!=='close'&&input.dx+input.cx>65536)throw Error('DOS transfer crosses bounded host segment window');
 const request:OriginalDosIoRequest={...input,bx:globals[0xbbe]|(globals[0xbbf]<<8),ax:((operation==='read'?0x3f:operation==='write'?0x40:0x3e)<<8)|(input.ax&255),operation};
 if(operation==='write')request.data=segment.slice(input.dx,input.dx+input.cx);
 const response=dos({...request,data:request.data?.slice()});
 if(!Number.isInteger(response.ax)||response.ax<0||response.ax>65535||typeof response.carry!=='boolean')throw Error('Invalid DOS I/O response');
 const memory=segment.slice(),nextGlobals=segmentIsGlobals?memory:globals.slice(),events:Array<OriginalDosIoRequest|{operation:'select-drive';drive:number}>=[request];
 if(response.data!==undefined){
  if(operation!=='read'||!(response.data instanceof Uint8Array)||input.dx+response.data.length>65536)throw Error('Invalid explicit read memory effect');
  memory.set(response.data,input.dx);
 }
 const error=response.carry?(operation==='read'?13:operation==='write'?7:14):null;
 if(operation==='close'&&!response.carry&&nextGlobals[0x289b]===1)events.push({operation:'select-drive',drive:nextGlobals[0x289c]});
 // Successful close compares fallback flag with1 after checking DOS carry.
 // Thus flag0 returns CF1 even though the close itself succeeded. The explicit
 // drive-selection boundary preserves flags in this controlled contract.
 const carry=operation==='close'&&!response.carry?nextGlobals[0x289b]<1:response.carry;
 return {memory,globals:nextGlobals,registers:{...input,bx:request.bx,ax:error??response.ax},events,error,carry,phase:error===null?'return' as const:'error' as const,stackDelta:error===null?2:0};
}
