/** Operand110/6DD6 ->1334/1137/13F1. Explicit finite port201 replies.
 * Selector is original DX; keyboard fallback tests full DX, axis choice DL.
 * No host input or elapsed-time approximation. AX110 at entry comes from
 * the operand dispatcher and is retained by1137 for a nonzero selector.
 */
export function queryOriginalDosJoystick(source:Uint8Array,ss:number,selector:number,replies:readonly number[],engineSegment=0x1000){
 if(source.length!==0x100000||![ss,selector,engineSegment].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||!replies.every(v=>Number.isInteger(v)&&v>=0&&v<=255))throw Error('Invalid original joystick query');
 const at=(s:number,o:number)=>{const a=s*16+o;if(a>=source.length)throw Error('Joystick snapshot outside memory');return a;};
 const b=(s:number,o:number)=>source[at(s,o)],w=(s:number,o:number)=>b(s,o)|(b(s,o+1)<<8),events:Array<{kind:string;port:number;value:number}>=[];
 let consumed=0;
 const result=(value:number)=>({value,events,repliesConsumed:consumed});
 if(b(ss,0xca1)!==0)return result(0);
 if(b(ss,(selector&255)===0?0x288a:0x288b)===0){
  if(selector!==0)return result(110);
  let value=0;for(const [o,mask] of [[0x395,1],[0x394,2],[0x393,4],[0x392,8],[0x391,128],[0x390,128]])if(b(engineSegment,o)&1)value|=mask;
  return result(value);
 }
 const read=()=>{if(consumed===replies.length)throw Error('Joystick query requires another port201 reply');const value=replies[consumed++];events.push({kind:'in',port:0x201,value});return value;};
 const axis=(mask:number)=>{
  let count=0,value=0;
  do{value=read();count=(count-1)&65535;}while((value&mask)!==0&&count!==0);
  if(count===0)return 65535;
  events.push({kind:'out',port:0x201,value});count=0;
  do{value=read();count=(count-1)&65535;}while((value&mask)!==0&&count!==0);
  return count===0?65535:(-count)&65535;
 };
 const sar=(v:number)=>(((v&32768?v-65536:v)>>1)&65535);
 let flags=0,value=axis((selector&255)===0?2:8);if(value===65535)return result(0);
 let calibration=w(ss,0x2888);if(value<sar(calibration))flags|=1;else if(value>=((calibration*2)&65535))flags|=2;
 value=axis((selector&255)===0?1:4);if(value===65535)return result(0);
 calibration=w(ss,0x2886);if(value<sar(calibration))flags|=4;else if(value>=((calibration*2)&65535))flags|=8;
 const buttons=(~read())&255;if(buttons&((selector&255)===0?0x30:0xc0))flags|=128;
 return result(flags);
}
