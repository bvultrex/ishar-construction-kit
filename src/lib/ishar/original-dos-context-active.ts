import {readOriginalDosNumericOperand} from './original-dos-numeric-operand.ts';
/** Opcode62, 1000:57C1..57D8. Nonnegative slot -> context byte[-4]=1.
 * No native null-pointer check: pointer0 writes atFFFCh. Negative words do nothing.
 * DF0, disjoint bounded buffers, supported numeric forms only.
 */
export function activateOriginalDosScriptContext(script:Uint8Array,context:Uint8Array,globals:Uint8Array,si:number,bp:number){
 if(globals.length!==65536)throw Error('Invalid native activation globals');
 const next=readOriginalDosNumericOperand(script,context,si,bp),memory=context.slice();let pointer:number|null=null;
 if(next.value<32768){
  const table=globals[0xbd2]|(globals[0xbd3]<<8),at=(table+next.value)&65535;
  if(at===65535)throw Error('Activation table word straddles host segment window');
  pointer=memory[at]|(memory[at+1]<<8);memory[(pointer-4)&65535]=1;
 }
 return {memory,si:next.si,dx:next.value,pointer};
}
