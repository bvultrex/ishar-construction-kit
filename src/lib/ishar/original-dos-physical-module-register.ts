import type {OriginalRenderedCpu} from './original-dos-rendered-frame-return.ts';
/** CALL8182 at79A0 through8205, before device notifications. Physical pointer
 * table insertion, no descriptor simplification. Successful bounded path only.
 */
export function prepareOriginalDosPhysicalModuleRegistration(source:Uint8Array,ss:number,input:OriginalRenderedCpu){
 if(source.length!==0x100000||ss!==0x1c0b||!Object.values(input).every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid module registration state');
 const memory=source.slice(),u=(n:number)=>n&65535;
 const w=(segment:number,offset:number,value?:number)=>{
  offset=u(offset);const at=segment*16+offset;
  if(offset===65535||at+2>memory.length)throw Error('Module registry word outside bounded memory');
  if(value!==undefined){memory[at]=value&255;memory[at+1]=value>>>8;}
  return memory[at]|memory[at+1]<<8;
 };
 const lower=u((input.cx>>>4)+1+w(ss,0xb14));w(ss,0xbca,lower);
 if(lower>w(ss,0xb96))throw Error('Original registry error11 boundary');
 let cx=w(input.ds,input.dx),di=w(ss,0xbc2),si=lower,ds=input.ds,visited=0;
 for(;;){
  si=w(input.es,di);ds=w(input.es,di+2);di=u(di+4);
  if(di>w(ss,0xbd0))break;
  if(++visited>16384)throw Error('Module registry scan exceeds host bound');
  if(cx>w(ds,si))continue;
  si=w(ss,0xbd0);let shifted=0;
  do{
   w(input.es,si,w(input.es,si-4));w(input.es,si+2,w(input.es,si-2));si=u(si-4);
   if(++shifted>16384)throw Error('Module registry shift exceeds host bound');
  }while(si>=di);
  break;
 }
 di=u(di-4);w(input.es,di,input.dx);di=u(di+2);w(input.es,di,input.ds);
 w(ss,0xbd0,u(w(ss,0xbd0)+4));const bx=u(w(ss,0xbce)+1);w(ss,0xbce,bx);
 const signed=(n:number)=>n&32768?n-65536:n;
 if(signed(bx)>signed(w(ss,0xbcc)))throw Error('Original registry error4 boundary');
 return {memory,registers:{...input,bx,cx,di,si,sp:u(input.sp-10)},entry:0x8205,stackDelta:-10,phase:'device-notification' as const};
}
