import {branchOriginalDosScript} from './original-dos-script-branch.ts';
import {branchOriginalDosScriptConditional} from './original-dos-script-conditional.ts';
import {returnOriginalDosScript} from './original-dos-script-return.ts';
import {evaluateOriginalDosScriptExpression} from './original-dos-script-expression.ts';
import {createOriginalDosScriptObject} from './original-dos-script-object.ts';
import {writeOriginalDosPhysicalScriptBlock} from './original-dos-script-block.ts';
import {assignOriginalDosIndexedValue} from './original-dos-indexed-assignment.ts';

export interface OriginalDosPhysicalScriptRegisters {ds:number;es:number;si:number;bp:number;dx:number;cx:number}
/** Bounded original-script step on physical memory. Only the listed ALIS state
 * registers are a contract; CPU scratch AX/BX/DI, flags and stack save bytes are
 * not modeled. No skipped opcodes, scheduler or invented external services.
 */
export function stepOriginalDosPhysicalScript(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters){
 if(source.length!==0x100000||![ss,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Expected1MiB memory and word registers');
 const window=(segment:number)=>{const at=segment*16;if(at+65536>source.length)throw Error('Script segment exceeds bounded physical window');return at;};
 const scriptAt=window(input.ds),contextAt=window(input.es),globalAt=window(ss);
 const opcode=source[scriptAt+input.si],after=(input.si+1)&65535;
 const registers={...input,si:after};let memory=source.slice(),status:'ready'|'yield'='ready';
 const context=()=>memory.slice(contextAt,contextAt+65536),script=()=>memory.slice(scriptAt,scriptAt+65536),globals=()=>memory.slice(globalAt,globalAt+65536);
 const word=(at:number)=>memory[globalAt+at]|memory[globalAt+at+1]<<8;
 if(opcode>=5&&opcode<=10){const next=branchOriginalDosScript(script(),context(),opcode,after,input.bp);memory.set(next.memory,contextAt);registers.si=next.si;}
 else if(opcode>=18&&opcode<=29)registers.si=branchOriginalDosScriptConditional(script(),opcode,after,input.dx,input.cx).si;
 else if(opcode===17){const next=returnOriginalDosScript(context(),input.bp,after,memory[globalAt+0xc19],word(0xc56));memory.set(next.memory,contextAt);registers.si=next.si;if(next.phase==='yield')status='yield';}
 else if(opcode===66)status='yield';
 else if(opcode===41){const next=writeOriginalDosPhysicalScriptBlock(memory,input.ds,input.es,after,input.bp);memory=next.memory;registers.si=next.si;}
 else if(opcode===70){
  const next=createOriginalDosScriptObject(memory,ss,{ds:input.ds,es:input.es,si:after,bx:140,di:0,dx:input.dx});
  if(next.error)throw Error(`Original object handler reaches error${next.error}; explicit error boundary required`);
  memory=next.memory;registers.si=next.registers.si;registers.dx=next.registers.dx;registers.cx=next.registers.cx;
 }else if(opcode===30){const next=assignOriginalDosIndexedValue(memory,ss,{ds:input.ds,es:input.es,si:after,bp:input.bp,dx:input.dx});memory=next.memory;Object.assign(registers,{si:next.registers.si,dx:next.registers.dx,cx:next.registers.cx});}
 else if(opcode===31){
  if(globalAt<contextAt+65536&&contextAt<globalAt+65536||globalAt<scriptAt+65536&&scriptAt<globalAt+65536)throw Error('Expression globals alias needs shared operand reconstruction');
  const next=evaluateOriginalDosScriptExpression(script(),context(),after,input.bp,input.dx,65536,globals());
  memory.set(next.globals!,globalAt);registers.si=next.si;registers.dx=next.dx;registers.cx=next.cx;
 }else throw Error(`Original opcode${opcode} is not connected to physical script execution`);
 return {memory,registers,status,opcode};
}
