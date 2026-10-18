import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** 71 selects the relative object at context[-22]; 192/193/194 gate two-word
 * writes on nonzero selection, with different original base addressing.
 * Numeric69A6/699E forms0/2/6/8/30/32 only.
 * The null selection still consumes both operands. Original DF=0 required.
 */
export function updateOriginalDosSelectedObject(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,opcode:number){
 if(source.length!==0x100000||![ss,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||![71,192,193,194].includes(opcode))throw Error('Invalid selected object inputs');
 const memory=source.slice(),u=(v:number)=>v&65535;
 const address=(s:number,o:number,wide=false)=>{o=u(o);const at=s*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Selected object access outside bounded real-mode window');return at;};
 const b=(s:number,o:number,value?:number)=>{const at=address(s,o);if(value!==undefined)memory[at]=value&255;return memory[at];};
 const w=(s:number,o:number,value?:number)=>{const at=address(s,o,true);if(value!==undefined){memory[at]=value&255;memory[at+1]=(value>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 const {ds,es,bp}=input;let si=input.si,dx=input.dx,cx=input.cx;
 if(opcode===71){const selected=w(ds,si);si=u(si+2);if(w(es,u(bp-22))!==selected)w(es,u(bp-22),selected);}
 else{
  const operand=()=>{
   const tag=b(ds,si);si=u(si+1);let value:number;
   if(tag===0){value=b(ds,si);si=u(si+1);return value&128?value+65280:value;}
   if(![2,6,8,30,32].includes(tag))throw Error(`Selected object numeric tag${tag} is not reconstructed`);
   const raw=w(ds,si);si=u(si+2);if(tag===2)return raw;
   const at=u((tag>=30?w(ss,0xbf6):bp)+raw);
   if(tag===8||tag===32)return w(es,at);
   value=b(es,at);return value&128?value+65280:value;
  };
  dx=operand();cx=operand();const selected=w(es,u(bp-22));
  if(selected!==0){
   // Only192 adds the selected relative pointer;193/194 use BF6 directly.
   const record=u(w(ss,0xbf6)+(opcode===192?selected:0)),offset=opcode===192?10:opcode===193?14:18;
   w(es,u(record+offset),dx);w(es,u(record+offset+2),cx);b(es,record,b(es,record)|0x80);
  }
 }
 return {memory,registers:{...input,si,dx,cx}};
}
