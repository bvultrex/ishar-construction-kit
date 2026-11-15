import {prepareOriginalDosModuleHeader} from './original-dos-module-header.ts';
import {decodeOriginalDosPhysicalA1} from './original-dos-physical-a1.ts';
import {closeOriginalDosDecodedModule} from './original-dos-module-close.ts';
import {prepareOriginalDosPhysicalModuleRegistration} from './original-dos-physical-module-register.ts';
import {returnOriginalDosEmptyModule} from './original-dos-empty-module-return.ts';
import type {OriginalRenderedCpu} from './original-dos-rendered-frame-return.ts';
import type {OriginalDosIoRequest,OriginalDosIoResponse} from './original-dos-file-io.ts';
/** Compose verified successful7917->26F7 path. Caller supplies successful
 * open handle/header and explicit DOS payload/close replies. No filesystem,
 * allocation, alternate-ID or nonempty resource notification shortcuts.
 */
export function loadOriginalDosCompressedModule(source:Uint8Array,ss:number,input:OriginalRenderedCpu,header:Uint8Array,handle:number,dos:(r:OriginalDosIoRequest)=>OriginalDosIoResponse){
 const opened=prepareOriginalDosModuleHeader(source,ss,input,header,handle);
 if(opened.phase!=='compressed')throw Error(`Original module requires ${opened.phase} path`);
 const decoded=decodeOriginalDosPhysicalA1(opened.memory,ss,opened.registers,dos);
 const closed=closeOriginalDosDecodedModule(decoded.memory,ss,decoded.registers,dos);
 const registered=prepareOriginalDosPhysicalModuleRegistration(closed.memory,ss,closed.registers);
 const returned=returnOriginalDosEmptyModule(registered.memory,ss,closed.registers);
 return {...returned,events:[...opened.events,...decoded.events,...closed.events],reads:decoded.reads,outputWrites:decoded.outputWrites,endSegment:decoded.endSegment,endOffset:decoded.endOffset};
}
