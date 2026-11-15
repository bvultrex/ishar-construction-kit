import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** Native26B2..26E8 (or callback return26D5) and2632..264F on shared memory. Stops before
 * callback26EB, context264F or frame CALL2649; executes no callback/frame body.
 */
export function finishOriginalDosPhysicalYield(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,entry:'yield'|'callback-return'='yield'){
 if(source.length!==0x100000||![ss,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Expected1MiB memory and word registers');
 const memory=source.slice(),u=(v:number)=>v&65535;
 const address=(s:number,o:number,wide=false)=>{o=u(o);const at=s*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Yield access outside bounded real-mode window');return at;};
 const b=(s:number,o:number,v?:number)=>{const at=address(s,o);if(v!==undefined)memory[at]=v&255;return memory[at];};
 const w=(s:number,o:number,v?:number)=>{const at=address(s,o,true);if(v!==undefined){memory[at]=v&255;memory[at+1]=(v>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 const {es,bp}=input,registers={...input};
 if(entry==='yield'){
  w(es,bp-8,input.si);const base=w(es,bp-20);registers.ds=w(es,bp-18);registers.si=base;
  const callback=w(registers.ds,base+6);
  if(callback!==0){
   b(ss,0xc19,0);registers.si=u(base+6+callback);w(ss,0xc56,w(es,bp-10));
   return {memory,registers,phase:'callback' as const,entry:0x26eb,stackDelta:-2,delta:null,visited:0,contextHead:w(es,bp-24),activeHead:w(ss,0xc16)};
  }
 }else if(entry==='callback-return')w(es,bp-10,w(ss,0xc56));
 else throw Error('Unsupported physical yield entry');
 const contextHead=w(es,bp-24),activeHead=w(ss,0xc16);
 const delta=[0,2,4].map((at,n)=>u(w(es,bp+at)-w(ss,0xbfa+n*2)));let visited=0;
 if(delta.some(v=>v!==0)){
  registers.ds=w(ss,0xbea);let di=w(es,bp-24);const seen=new Set<number>();
  while(di!==0){
   if(seen.has(di))throw Error('Original object chain cycle exceeds host contract');seen.add(di);visited++;
   if(b(registers.ds,di)===0)b(registers.ds,di,2);
   for(let axis=0;axis<3;axis++)w(registers.ds,di+22+axis*2,u(w(registers.ds,di+22+axis*2)+delta[axis]));
   di=w(registers.ds,di+4);
  }
 }
 b(es,bp-1,b(es,bp-2));
 const currentSlot=w(ss,0xb02),table=w(ss,0xbd2),slot=w(es,currentSlot+table+4);w(ss,0xb02,slot);registers.si=table;
 if(slot!==0)registers.bp=w(es,slot+table);
 return {memory,registers,phase:slot===0?'frame' as const:'context' as const,entry:slot===0?0x2649:0x264f,stackDelta:0,delta,visited,contextHead,activeHead};
}
