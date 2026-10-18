import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** Native43..45,2837..2884 via2943 and direct add-result handlers.
 * Decrement target6/8/18/20; branch when typed ADD result is nonzero.
 * DF0, shared memory; preserves actual C54/buffer-swap ordering and DXFFFF.
 */
export function decrementOriginalDosScript(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,opcode:number){
 if(source.length!==0x100000||![ss,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||![43,44,45].includes(opcode))throw Error('Invalid native decrement inputs');
 const memory=source.slice(),u=(v:number)=>v&65535;
 const addr=(s:number,o:number,wide=false)=>{o=u(o);const at=s*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Decrement access outside bounded real-mode window');return at;};
 const b=(s:number,o:number,v?:number)=>{const at=addr(s,o);if(v!==undefined)memory[at]=v&255;return memory[at];};
 const w=(s:number,o:number,v?:number)=>{const at=addr(s,o,true);if(v!==undefined){memory[at]=v&255;memory[at+1]=(v>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 const {ds,es,bp}=input,width=opcode-42;w(ss,0xc54,input.si);let si=u(input.si+width);
 const first=w(ss,0xc58);w(ss,0xc58,w(ss,0xc5c));w(ss,0xc5c,first);
 const tag=b(ds,si);si=u(si+1);
 if(![6,8,18,20].includes(tag))throw Error(`Decrement target${tag} is not reconstructed`);
 const short=tag>=18,wide=tag===8||tag===20,offset=short?b(ds,si):w(ds,si);si=u(si+(short?1:2));
 const at=u(bp+offset),value=wide?u(w(es,at)+65535):(b(es,at)+255)&255;
 if(wide)w(es,at,value);else b(es,at,value);
 const taken=value!==0;
 if(taken){
  si=w(ss,0xc54);let delta:number;
  if(width===1){const raw=b(ds,si);delta=raw&128?raw-256:raw;}
  else delta=w(ds,si);
  si=u(si+width+delta);
 }
 return {memory,registers:{...input,si,dx:65535},taken,targetTag:tag,value};
}
