import {prepareOriginalDosSchedulerBoundary} from './original-dos-scheduler-boundary.ts';

/** Native2607..262F then264C..26AF, stopping before first dispatch26EB.
 * Entry is AFTER the loader caller's preceding platform/startup services.
 * This does not claim those services have run or initialize their missing state.
 */
export function prepareOriginalDosMainScheduler(source:Uint8Array,ss:number,es:number,initialDs:number){
 if(source.length!==0x100000||![ss,es,initialDs].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Expected1MiB physical memory and word segments');
 const window=(segment:number)=>{const start=segment*16;if(start+65536>source.length)throw Error('Scheduler segment exceeds physical window');return start;};
 const globalAt=window(ss),contextAt=window(es);
 if(globalAt<contextAt+65536&&contextAt<globalAt+65536)throw Error('Overlapping globals/context windows require shared dispatch reconstruction');
 const memory=source.slice(),view=new DataView(memory.buffer),word=(at:number)=>view.getUint16(at,true);
 for(const [at,value] of [[0xc58,0x802],[0xc5a,0x902],[0xc5c,0xa02],[0xc80,0x1e7e],[0xb02,0]])view.setUint16(globalAt+at,value,true);
 const si=word(globalAt+0xbd2);if(si===65535)throw Error('Root pointer straddles context segment');
 const bp=word(contextAt+si),offset=(at:number)=>(bp+at)&65535;
 const contextWord=(at:number)=>{const off=offset(at);if(off===65535)throw Error('Context word straddles segment');return word(contextAt+off);};
 const flag=memory[contextAt+offset(-36)],scan=(flag&128)!==0&&(flag&2)===0;
 for(const at of [-20,-18,-8,-6,0,2,4,6])contextWord(at);
 const headerSegment=scan?contextWord(-18):initialDs;
 const moduleAt=window(headerSegment);
 const next=prepareOriginalDosSchedulerBoundary(memory.slice(contextAt,contextAt+65536),memory.slice(moduleAt,moduleAt+65536),memory.slice(globalAt,globalAt+65536),{bp:0,si,bx:0,ds:initialDs},'frame-return');
 memory.set(next.context,contextAt);memory.set(next.globals,globalAt);
 return {memory,bp:next.bp,si:next.si,ds:next.ds,es,bx:0,phase:next.phase,entry:next.phase==='skip'?0x2632:0x26eb,stackDelta:next.phase==='skip'?0:-2};
}
