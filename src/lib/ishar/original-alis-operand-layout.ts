/** Structural extent of the supported old-DOS integer operand grammar.
 * No evaluation or memory access. String/unfinished reference operands reject. */
export function dosAlisIntegerOperandEnd(image:Uint8Array,offset:number):number{
 let budget=4096;
 const fixed=(at:number,count:number)=>{if(at+count>image.length)throw Error('Truncated ALIS operand');return at+count;};
 function operand(at:number,depth:number):number{
  if(!Number.isInteger(at)||at<0||at>=image.length||depth>64||--budget<0)throw Error('ALIS operand bounds/budget exceeded');
  const op=image[at++]!;
  if(op===0)return fixed(at,1);if(op===2)return fixed(at,2);
  if([6,8,0x0e,0x10,0x1e,0x20,0x26,0x28].includes(op))return fixed(at,2);
  if([0x12,0x14,0x1a,0x1c].includes(op))return fixed(at,1);
  if([0x2a,0x2c,0x32,0x34].includes(op))return fixed(at,4);
  if(op===0x38){while(true){if(at>=image.length)throw Error('Unterminated ALIS expression');if(image[at]===0x3a)return at+1;at=operand(at,depth+1);}}
  if(op>=0x42&&op<=0x5e&&op%2===0)return operand(at,depth+1);
  if([0x36,0x40,0x60,0x62,0x64,0x66,0x68,0x6a,0x6e,0x70,0x72,0x74,0x76].includes(op))return at;
  throw Error(`Unsupported ALIS integer operand 0x${op.toString(16)}`);
 }
 return operand(offset,0);
}
