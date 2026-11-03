/** Native expression66..72 and86..94 after the nested69A9 call.
 * CX/DX are the actual returned registers, not a saved JavaScript left operand.
 */
export function applyOriginalDosNumericBinary(tag:number,cx:number,dx:number){
 if(![cx,dx].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Expected word operands');
 const u=(v:number)=>v&65535,s=(v:number)=>v&32768?v-65536:v;
 if(tag===66)dx&=cx;
 else if(tag===68)dx|=cx;
 else if(tag===70)dx^=cx;
 else if(tag===72)dx=u(~(dx^cx));
 else if(tag===86)dx=u(dx+cx);
 else if(tag===88){cx=u(cx-dx);dx=cx;}
 else if(tag===90||tag===92){
  const dividend=s(cx);cx=dx===0?1:dx;const divisor=s(cx),quotient=Math.trunc(dividend/divisor);
  if(quotient< -32768||quotient>32767)throw Error('Original signed division reaches INT0 overflow boundary');
  dx=u(tag===90?dividend%divisor:quotient);
 }else if(tag===94)dx=u(s(dx)*s(cx));
 else throw Error(`Numeric binary tag${tag} is not reconstructed`);
 return {dx,cx};
}
