import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** Opcode134/6649 ->1259 snapshot and three291B scalar local result stores.
 * Original saved callback fields, no invented INT33 or host cursor response.
 */
export function readOriginalDosScriptMouse(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,engineSegment=0x1000){
 if(source.length!==0x100000||![ss,engineSegment,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid script mouse state');
 const memory=source.slice(),u=(v:number)=>v&65535;
 const at=(s:number,o:number,wide=false)=>{o=u(o);const a=s*16+o;if(wide&&o===65535||a+(wide?2:1)>memory.length)throw Error('Mouse operand outside bounded memory');return a;};
 const b=(s:number,o:number,value?:number)=>{const a=at(s,o);if(value!==undefined)memory[a]=value&255;return memory[a];};
 const w=(s:number,o:number,value?:number)=>{const a=at(s,o,true);if(value!==undefined){memory[a]=value&255;memory[a+1]=value>>>8;}return memory[a]|memory[a+1]<<8;};
 let x=65535,y=65535,buttons=0;
 if(b(ss,0xca3)===0){
  x=w(engineSegment,0x11bd);y=w(engineSegment,0x11bf);buttons=w(engineSegment,0x11c1);
  const mode=b(ss,0x2896);if(mode!==1)x>>>=1;if(mode===0){x=u(x+1);y=u(y+1);}
 }
 let si=input.si;
 for(const value of [x,y,buttons]){
  const first=w(ss,0xc58);w(ss,0xc58,w(ss,0xc5c));w(ss,0xc5c,first);
  const tag=b(input.ds,si);si=u(si+1);
  if(![6,8,18,20].includes(tag))throw Error(`Mouse result tag${tag} unsupported`);
  const short=tag===18||tag===20,offset=short?b(input.ds,si):w(input.ds,si);si=u(si+(short?1:2));
  if(tag===8||tag===20)w(input.es,input.bp+offset,value);else b(input.es,input.bp+offset,value);
 }
 return {memory,registers:{...input,si,dx:buttons,cx:buttons},entry:0x26f7,x,y,buttons};
}
