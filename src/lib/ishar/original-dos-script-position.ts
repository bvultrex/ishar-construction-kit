import {readOriginalDosNumericOperand} from './original-dos-numeric-operand.ts';
/** Opcode76, 1000:3B86..3B9B, both identified DOS captures.
 * Three sequential numeric reads and writes at ES:BP,+2,+4. Later reads see earlier writes.
 * DF0, disjoint bounded segments. Only operand forms proven by the numeric reader.
 */
export function writeOriginalDosScriptPosition(script:Uint8Array,context:Uint8Array,si:number,bp:number){
 if(script.length!==65536||context.length!==65536||![si,bp].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid native position inputs');
 const memory=context.slice(),values:number[]=[];
 for(let i=0;i<3;i++){
  const at=(bp+i*2)&65535;if(at===65535)throw Error('Position word straddles host segment window');
  const next=readOriginalDosNumericOperand(script,memory,si,bp);si=next.si;values.push(next.value);
  memory[at]=next.value&255;memory[at+1]=next.value>>>8;
 }
 return {memory,si,values};
}
