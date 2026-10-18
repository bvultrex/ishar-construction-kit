import {prepareOriginalDosSharedScheduler} from './original-dos-shared-scheduler.ts';
import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** Original264C/264F continuation, including physical segment aliases. */
export function prepareOriginalDosPhysicalContext(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,entry:'frame-return'|'context'|'next'='frame-return'){
 if(source.length!==0x100000||![ss,...Object.values(input)].every(x=>Number.isInteger(x)&&x>=0&&x<=65535)||ss*16+0xb04>source.length||!['frame-return','context','next'].includes(entry))throw Error('Invalid physical context state');
 const g=ss*16,slot=source[g+0xb02]|source[g+0xb03]<<8;
 if(entry==='next'){
  const memory=source.slice(),u=(v:number)=>v&65535;
  const word=(segment:number,offset:number,value?:number)=>{offset=u(offset);const at=segment*16+offset;if(offset===65535||at+1>=memory.length)throw Error('Next context outside bounded window');if(value!==undefined){memory[at]=value&255;memory[at+1]=value>>>8;}return memory[at]|memory[at+1]<<8;};
  const table=word(ss,0xbd2),link=word(input.es,table+slot+4);word(ss,0xb02,link);
  const registers={...input,si:table};if(link!==0)registers.bp=word(input.es,table+link);
  return {memory,registers,phase:link===0?'frame':'context',entry:link===0?0x2649:0x264f,stackDelta:0};
 }
 const next=prepareOriginalDosSharedScheduler(source,ss,input.es,{bp:input.bp,si:input.si,bx:slot,ds:input.ds},entry==='frame-return');
 return {memory:next.memory,registers:{...input,bp:next.bp,si:next.si,ds:next.ds},phase:next.phase,entry:next.entry,stackDelta:next.stackDelta};
}
