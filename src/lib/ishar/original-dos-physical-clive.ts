import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** Opcode64/2CE2: module lookup,8224 context allocation,8268 initialization,
 * inherited fields and scalar result291B. Sequential physical alias effects.
 * Unsupported result/error paths throw without changing the source.
 */
export function executeOriginalDosPhysicalClive(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters){
 if(source.length!==0x100000||!Object.values({...input,ss}).every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid clive state');
 const memory=source.slice(),u=(v:number)=>v&65535,es=input.es;
 const at=(s:number,o:number,wide=false)=>{o=u(o);const a=s*16+o;if(wide&&o===65535||a+(wide?2:1)>memory.length)throw Error('Clive access outside bounded memory');return a;};
 const b=(s:number,o:number,value?:number)=>{const a=at(s,o);if(value!==undefined)memory[a]=value&255;return memory[a];};
 const w=(s:number,o:number,value?:number)=>{const a=at(s,o,true);if(value!==undefined){memory[a]=value&255;memory[a+1]=value>>>8;}return memory[a]|memory[a+1]<<8;};
 for(const a of [0xc6a,0xc6c,0xc6e])w(ss,a,0);
 const id=w(input.ds,input.si);let si=u(input.si+2),di=w(ss,0xbc2),cx=u(di+u(w(ss,0xbce)*4)),moduleOffset=0,moduleSegment=0,found=false;
 for(let n=0;n<16385;n++){
  moduleOffset=w(es,di);moduleSegment=w(es,di+2);di=u(di+4);
  if(di>cx)break;
  const current=w(moduleSegment,moduleOffset);if(id>current){if(n===16384)throw Error('Clive lookup exceeds bound');continue;}
  found=id===current;break;
 }
 let dx=65535,context:number|undefined;
 if(found){
  const table=w(ss,0xbd2),currentSlot=w(ss,0xb02),next=w(es,currentSlot+table+4),slot=w(ss,0xbde);
  cx=next;
  w(es,currentSlot+table+4,slot);w(ss,0xbde,w(es,slot+table+4));w(es,slot+table+4,next);
  w(ss,0xbdc,u(w(ss,0xbdc)+1));const signed=(v:number)=>v&32768?v-65536:v;
  if(signed(w(ss,0xbdc))>signed(w(ss,0xbda)))throw Error('Original clive error5');
  w(ss,0xb06,slot);
  const header=(o:number)=>w(moduleSegment,moduleOffset+o);
  let value=u(w(ss,0xbd8)+header(18));w(ss,0xb0c,value);
  value=u(value+header(22)+52);w(es,w(ss,0xbd2)+w(ss,0xb06),value);w(ss,0xb0e,value);
  let length=header(20);w(ss,0xbd8,u(value+length));
  const candidate=u((w(ss,0xbd8)>>>4)+1+w(ss,0xbd6));
  if(candidate>=w(ss,0xbe2))throw Error('Original clive error12');
  if(length&1)throw Error('Odd clive variable length does not terminate');
  const base=w(ss,0xb0e);context=base;
  do{w(es,base+length-2,0);length=u(length-2);}while(length!==0);
  const relative=u(w(ss,0xb0c)-base);
  for(const o of [-10,-28,-30])w(es,base+o,relative);
  w(es,base-8,u(moduleOffset+2+header(2)));w(es,base-6,moduleSegment);
  w(es,base-16,header(0));w(es,base-20,0);w(es,base-18,moduleSegment);
  b(es,base-46,b(moduleSegment,moduleOffset+5));b(es,base-2,1);b(es,base-1,1);b(es,base-4,255);w(es,base-26,65535);
  w(es,base-14,w(ss,0xb06));b(es,base-36,2);
  for(const o of [-24,-12,-34,-32])w(es,base+o,0);
  for(const [o,v] of [[-3,0],[-37,0],[-38,255],[-42,0],[-40,0],[-44,0],[-45,0],[-47,0]])b(es,base+o,v);
  w(es,base-50,0);w(es,base-52,0);b(es,base-48,0);
  dx=w(ss,0xb06);
  for(const o of [0,2,4])w(es,base+o,w(es,input.bp+o));
  for(const o of [9,10,11])b(es,base+o,b(es,input.bp+o));
  w(es,base-40,w(es,input.bp-14));
  for(const [o,a] of [[0,0xc6a],[2,0xc6c],[4,0xc6e]])w(es,base+o,u(w(es,base+o)+w(ss,a)));
  w(es,base-22,w(es,input.bp-22));w(es,base-34,w(es,input.bp-34));w(es,base-42,w(es,base-14));
 }
 // Shared291B result dispatch, scalar local targets only.
 const swap=w(ss,0xc58);w(ss,0xc58,w(ss,0xc5c));w(ss,0xc5c,swap);
 const tag=b(input.ds,si),short=tag===18||tag===20,wide=tag===8||tag===20;
 if(![6,8,18,20].includes(tag))throw Error(`Clive result tag${tag} unsupported`);
 const offset=short?b(input.ds,si+1):w(input.ds,si+1);si=u(si+(short?2:3));
 if(wide)w(es,input.bp+offset,dx);else b(es,input.bp+offset,dx);
 return {memory,registers:{...input,si,dx,cx},context,found,entry:0x26f7};
}
