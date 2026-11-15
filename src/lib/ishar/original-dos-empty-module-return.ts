import type {OriginalRenderedCpu} from './original-dos-rendered-frame-return.ts';
/** Original8205 notification/registry return and2DCF filename skip. Narrow
 * case:185E disabled,16CE table count zero; saved caller is opcode69.
 * Input registers are those before CALL8182 (79A0), not inside its frame.
 */
export function returnOriginalDosEmptyModule(source:Uint8Array,ss:number,input:OriginalRenderedCpu){
 if(source.length!==0x100000||ss!==0x1c0b||!Object.values(input).every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid empty module return state');
 const memory=source.slice(),u=(v:number)=>v&65535;
 const at=(s:number,o:number,wide=false)=>{o=u(o);const a=s*16+o;if(wide&&o===65535||a+(wide?2:1)>memory.length)throw Error('Module return outside bounded memory');return a;};
 const b=(s:number,o:number,value?:number)=>{const a=at(s,o);if(value!==undefined)memory[a]=value&255;return memory[a];};
 const w=(s:number,o:number,value?:number)=>{const a=at(s,o,true);if(value!==undefined){memory[a]=value&255;memory[a+1]=value>>>8;}return memory[a]|memory[a+1]<<8;};
 if(b(ss,0x2898)===0)throw Error('Original185E notification remains unsupported');
 b(0x1000,0x16cc,b(input.ds,input.si+5));
 const sum=input.dx+w(input.ds,input.dx+14),offset=u(sum),high=u(w(input.ds,input.dx+16)+Number(sum>65535));
 const swapped=((high&255)<<8)|(high>>>8),segment=u(input.ds+u(swapped*16)+(offset>>>4)),di=offset&15;
 const count=u(w(segment,di+16)-1);w(ss,0xb16,count);
 if(count!==65535)throw Error('Nonempty16CE notification table remains unsupported');
 if(w(ss,input.sp)!==0x2dcf||w(ss,input.sp+4)!==0x26f7)throw Error('Module return requires original opcode69 caller frames');
 const ds=w(ss,input.sp+2);let si=input.si,found=false;
 for(let n=0;n<65536;n++){const value=b(ds,si);si=u(si+1);if(value===0){found=true;break;}}
 if(!found)throw Error('Module filename exceeds host bound');
 return {memory,registers:{...input,ax:0,ds,si,sp:u(input.sp+6)},entry:0x26f7,stackDelta:6,phase:'script' as const};
}
