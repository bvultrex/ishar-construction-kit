import {prepareOriginalDosSchedulerBoundary} from './original-dos-scheduler-boundary.ts';
import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/**264C/264F continuation using the existing physical root and scheduler globals.
 * No startup resets or fabricated root links. Disjoint globals are required by
 * the composed segment helper; scan callbacks stop before their dispatch.
 */
export function prepareOriginalDosPhysicalContext(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,entry:'frame-return'|'context'='frame-return'){
 if(source.length!==0x100000||![ss,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Expected1MiB memory and word registers');
 const window=(segment:number)=>{const at=segment*16;if(at+65536>source.length)throw Error('Scheduler segment exceeds physical window');return at;};
 const g=window(ss),c=window(input.es),word=(at:number)=>source[at]|source[at+1]<<8;
 if(g<c+65536&&c<g+65536)throw Error('Globals/context alias needs shared scheduler preparation');
 const slot=word(g+0xb02),at=(slot+input.si)&65535;
 if(entry==='frame-return'&&at===65535)throw Error('Scheduler root straddles segment');
 const bp=entry==='frame-return'?word(c+at):input.bp,flag=source[c+((bp-36)&65535)];
 const headerAt=(bp-18)&65535;if(headerAt===65535)throw Error('Scheduler module pointer straddles segment');
 const moduleSegment=(flag&128)!==0&&(flag&2)===0?word(c+headerAt):input.ds,m=window(moduleSegment);
 if(g<m+65536&&m<g+65536)throw Error('Globals/module alias needs shared scheduler preparation');
 const next=prepareOriginalDosSchedulerBoundary(source.slice(c,c+65536),source.slice(m,m+65536),source.slice(g,g+65536),{bp:input.bp,si:input.si,bx:slot,ds:input.ds},entry);
 const memory=source.slice();memory.set(next.context,c);memory.set(next.globals,g);
 return {memory,registers:{...input,bp:next.bp,si:next.si,ds:next.ds},phase:next.phase,entry:next.phase==='skip'?0x2632:0x26eb,stackDelta:next.phase==='skip'?0:-2};
}
