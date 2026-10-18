import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** 72/73 preamble and39F5 resource lookup, through the native type branch.
 * Follows first-child compound recursion; stops before record allocation or FE.
 * Input SI is after the opcode. Five pushed CPU words remain at this boundary.
 */
export function prepareOriginalDosResourceDraw(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,opcode:number){
 if(source.length!==0x100000||![ss,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||![72,73].includes(opcode))throw Error('Invalid resource draw inputs');
 const memory=source.slice(),u=(v:number)=>v&65535;
 const address=(s:number,o:number,wide=false)=>{o=u(o);const at=s*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Resource draw access outside bounded real-mode window');return at;};
 const b=(s:number,o:number,value?:number)=>{const at=address(s,o);if(value!==undefined)memory[at]=value&255;return memory[at];};
 const w=(s:number,o:number,value?:number)=>{const at=address(s,o,true);if(value!==undefined){memory[at]=value&255;memory[at+1]=(value>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 const {ds,es,bp}=input;let si=input.si,dx=input.dx,cx=input.cx;
 const operand=()=>{
  cx=dx;const tag=b(ds,si);si=u(si+1);let value:number;
  if(tag===0){value=b(ds,si);si=u(si+1);dx=value&128?value+65280:value;return dx;}
  if(![2,6,8,30,32].includes(tag))throw Error(`Resource draw numeric tag${tag} is not reconstructed`);
  const raw=w(ds,si);si=u(si+2);
  if(tag===2)dx=raw;
  else{const at=u((tag>=30?w(ss,0xbf6):bp)+raw);if(tag===8||tag===32)dx=w(es,at);else{value=b(es,at);dx=value&128?value+65280:value;}}
  return dx;
 };
 b(ss,0xc15,0);b(ss,0xc12,b(es,u(bp-3)));
 if(opcode===73){for(const at of [0xc02,0xc04,0xc06])w(ss,at,operand());operand();const resource=dx;operand();cx=dx;dx=resource;w(ss,0xc0e,cx);}
 else{operand();for(const at of [0xc02,0xc04,0xc06,0xc0e])w(ss,at,0);}
 b(ss,0xc13,0);
 const lookup=()=>{
  let offset=w(es,u(bp-20));const segment=w(es,u(bp-18));
  offset=u(offset+w(segment,u(offset+14)));offset=u(offset+w(segment,offset));offset=u(offset+4*dx);
  const relative=w(segment,offset);let high=w(segment,u(offset+2)),sum=offset+relative;offset=u(sum);if(sum>65535)high=u(high+1);
  high=u(((high&255)<<8|(high>>>8))<<4);cx=offset>>>4;
  return {segment:u(segment+high+cx),offset:offset&15};
 };
 let resource=lookup(),type=b(resource.segment,resource.offset);const pending=[];const seen=new Set<string>();
 while(type>=128&&type!==254){
  const key=`${resource.segment}:${resource.offset}`;if(seen.has(key))throw Error('Compound resource first-child cycle');seen.add(key);
  if(pending.length>=32)throw Error('Compound resource host depth bound');
  const remaining=b(resource.segment,u(resource.offset+1));
  // Native jumps to LOOP before the first body: zero means no children.
  if(remaining===0)return {memory,registers:{...input,ds:resource.segment,si,dx,cx:0},phase:'empty-compound',entry:0x34af,stackDelta:-10-20*pending.length,resourceOffset:resource.offset,resourceType:type,pending};
  pending.push({segment:resource.segment,offset:resource.offset,remaining,flip:w(ss,0xc12),x:w(ss,0xc02),y:w(ss,0xc04),z:w(ss,0xc06)});
  b(ss,0xc13,1);dx=w(resource.segment,u(resource.offset+2));let x=w(resource.segment,u(resource.offset+4));if(b(ss,0xc12)!==0)x=u(-x);
  w(ss,0xc02,u(w(ss,0xc02)+x));w(ss,0xc04,u(w(ss,0xc04)+w(resource.segment,u(resource.offset+6))));w(ss,0xc06,u(w(ss,0xc06)+w(resource.segment,u(resource.offset+8))));
  if(dx&0x8000){dx&=0x7fff;b(ss,0xc12,b(ss,0xc12)^1);}
  resource=lookup();type=b(resource.segment,resource.offset);
 }
 const phase=type<128?'record':'special',entry=phase==='record'?0x3432:0x342f;
 return {memory,registers:{...input,ds:resource.segment,si,dx,cx},phase,entry,stackDelta:-10-20*pending.length,resourceOffset:resource.offset,resourceType:type,pending};
}
