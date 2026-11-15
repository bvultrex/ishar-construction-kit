import {prepareOriginalDosSharedScheduler} from './original-dos-shared-scheduler.ts';
/** Original2607..262F then264C..26AF on shared physical memory.
 * Input is the actual loader return; no platform state is synthesized.
 */
export function prepareOriginalDosMainScheduler(source:Uint8Array,ss:number,es:number,initialDs:number){
 if(source.length!==0x100000||![ss,es,initialDs].every(x=>Number.isInteger(x)&&x>=0&&x<=65535)||ss*16+0xc82>source.length)throw Error('Invalid MAIN scheduler state');
 const memory=source.slice(),g=ss*16,v=new DataView(memory.buffer);
 for(const [at,value] of [[0xc58,0x802],[0xc5a,0x902],[0xc5c,0xa02],[0xc80,0x1e7e],[0xb02,0]])v.setUint16(g+at,value,true);
 return prepareOriginalDosSharedScheduler(memory,ss,es,{bp:0,si:v.getUint16(g+0xbd2,true),bx:0,ds:initialDs},true);
}
