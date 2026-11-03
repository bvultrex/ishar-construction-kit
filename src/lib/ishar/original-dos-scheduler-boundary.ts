import {prepareOriginalDosScriptDispatch} from './original-dos-script-schedule.ts';

/** Native264C root reload after a frame, then264F preparation through the first
 * dispatch or2632. Input segments are explicit: this does not resolve modules,
 * execute callback bodies, or replace a null root with a host-created context.
 */
export function prepareOriginalDosSchedulerBoundary(
 context:Uint8Array,module:Uint8Array,globals:Uint8Array,
 registers:{bp:number;si:number;bx:number;ds:number},entry:'frame-return'|'context',
){
 if(context.length!==65536||globals.length!==65536||module.length!==65536)throw Error('Expected three 64KiB segments');
 if(!Object.values(registers).every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Expected word registers');
 let bp=registers.bp;
 if(entry==='frame-return'){
  const at=(registers.bx+registers.si)&65535;
  if(at===65535)throw Error('Straddling native root word outside host contract');
  bp=context[at]|(context[at+1]<<8);
 }
 const next=prepareOriginalDosScriptDispatch(context,module,bp,registers.ds,registers.si),memory=globals.slice();
 for(const [address,value] of Object.entries(next.globals)){
  const at=Number(address);memory[at]=value&255;
  if(at!==0xc96&&at!==0xc19)memory[at+1]=value>>>8;
 }
 return {context:next.memory,globals:memory,bp,si:next.si,ds:next.ds,phase:next.phase};
}
