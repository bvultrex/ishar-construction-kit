import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** Frame CALL3DE4 ->3E55, dirty-object3CEB and first active-record selection.
 * Stops after4170 before record-specific projection/removal, or before clip3EEA.
 * Empty objects complete their original return to3DE7. CPU stack saves omitted.
 */
export function prepareOriginalDosVisibleObject(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,object:number){
 if(source.length!==0x100000||![ss,object,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid visible object inputs');
 const memory=source.slice(),u=(v:number)=>v&65535;
 const address=(s:number,o:number,wide=false)=>{o=u(o);const at=s*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Visible object access outside bounded real-mode window');return at;};
 const b=(s:number,o:number,value?:number)=>{const at=address(s,o);if(value!==undefined)memory[at]=value&255;return memory[at];};
 const w=(s:number,o:number,value?:number)=>{const at=address(s,o,true);if(value!==undefined){memory[at]=value&255;memory[at+1]=(value>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 b(ss,0xc48,0);const pool=w(ss,0xbea),base=w(ss,0xbe8);w(ss,0xb26,base);
 let marked=0,visited=0;
 if(b(ss,0xc49)!==0||(b(input.es,object)&128)!==0){
  const delta=[42,44,46].map(at=>w(input.es,u(object+at)));
  delta.forEach((value,i)=>w(input.es,u(object+22+i*2),u(w(input.es,u(object+22+i*2))+value)));
  for(const at of [42,44,46])w(input.es,u(object+at),0);
  let record=w(ss,0xb18);const seen=new Set<number>();
  while(true){record=w(pool,u(record+6));if(record===0)break;if(seen.has(record))throw Error('Visible dirty-object record cycle');seen.add(record);if(b(pool,record)===0){b(pool,record,2);marked++;}}
  b(input.es,object,b(input.es,object)&127);
 }
 b(ss,0x1da6,0);if(b(input.es,u(object+1))&4)b(ss,0x1da6,1);
 const result=(phase:string,entry:number,stackDelta:number,extra:{di?:number;bx?:number;status?:number}={})=>({memory,registers:phase==='return'?{...input}:{...input,ds:pool},phase,entry,stackDelta,marked,visited,...extra});
 if(b(input.es,u(object+1))&16)return result('clip',0x3eea,-20,{bx:object});
 let di=input.cx,bx=object;const seen=new Set<number>();
 while(true){
  bx=di;di=u(di+w(ss,0xb26));di=w(pool,u(di+6));
  if(di===0)return result('return',0x3de7,0);
  if(seen.has(di))throw Error('Visible object record selection cycle');seen.add(di);visited++;b(ss,0xc18,0);
  const status=b(pool,di);if(status===0)continue;
  b(ss,0xb56,0);b(ss,0xc48,1);
  w(ss,0xb22,w(pool,u(di+30)));w(ss,0xc2c,0x7fff);w(ss,0xc2e,0x7fff);w(ss,0xc30,0x8000);w(ss,0xc32,0x8000);
  return result(status===255?'new-record':status===2?'changed-record':'other-record',status===255?0x408a:status===2?0x40a1:0x40ba,-26,{di,bx,status});
 }
}
