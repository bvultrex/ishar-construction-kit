import {readOriginalDosNumericOperand} from './original-dos-numeric-operand.ts';
/** Native1000:296B..2993: five numeric operands, mixed word/byte globals.
 * Field purposes remain unassigned until their consumers are traced.
 * Register contract includes69A6's CX=previous DX on every operand.
 */
export function writeOriginalDosOpcode186(script:Uint8Array,context:Uint8Array,globals:Uint8Array,si:number,bp:number,dx:number){
 if(globals.length!==65536||!Number.isInteger(dx)||dx<0||dx>65535)throw Error('Expected global segment and word DX');
 const memory=globals.slice(),targets=[[0xba8,2],[0xba0,2],[0xba2,1],[0xba4,1],[0xba6,2]];
 let cx=dx;
 for(const [at,size] of targets){
  const operand=readOriginalDosNumericOperand(script,context,si,bp);si=operand.si;cx=dx;dx=operand.value;
  memory[at]=dx&255;if(size===2)memory[at+1]=dx>>>8;
 }
 return {memory,si,dx,cx};
}
