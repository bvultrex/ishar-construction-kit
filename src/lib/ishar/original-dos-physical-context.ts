import {prepareOriginalDosSharedScheduler} from './original-dos-shared-scheduler.ts';
import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** Original264C/264F continuation, including physical segment aliases. */
export function prepareOriginalDosPhysicalContext(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,entry:'frame-return'|'context'='frame-return'){
 if(source.length!==0x100000||![ss,...Object.values(input)].every(x=>Number.isInteger(x)&&x>=0&&x<=65535)||ss*16+0xb04>source.length||!['frame-return','context'].includes(entry))throw Error('Invalid physical context state');
 const g=ss*16,slot=source[g+0xb02]|source[g+0xb03]<<8;
 const next=prepareOriginalDosSharedScheduler(source,ss,input.es,{bp:input.bp,si:input.si,bx:slot,ds:input.ds},entry==='frame-return');
 return {memory:next.memory,registers:{...input,bp:next.bp,si:next.si,ds:next.ds},phase:next.phase,entry:next.entry,stackDelta:next.stackDelta};
}
