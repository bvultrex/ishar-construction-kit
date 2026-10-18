import {readOriginalDosNumericOperand} from './original-dos-numeric-operand.ts';
import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
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

/** Shared-memory variant: later operands observe earlier global writes, even
 * when the script/context aliases SS. Input SI points after opcode186/191.
 */
export function writeOriginalDosPhysicalGlobalOperands(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,opcode=186){
 if(source.length!==0x100000||![ss,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||![186,191].includes(opcode))throw Error('Expected1MiB memory, word registers and global operand opcode');
 const memory=source.slice(),window=(segment:number)=>{const at=segment*16;if(at+65536>memory.length)throw Error('Global operand segment exceeds bounded physical window');return at;};
 const globalAt=window(ss),scriptAt=window(input.ds),contextAt=window(input.es);let si=input.si,dx=input.dx,cx=input.cx;
 const targets=opcode===186?[[0xba8,2],[0xba0,2],[0xba2,1],[0xba4,1],[0xba6,2]]:[[0xc02,2],[0xc04,2],[0xc06,2],[0xc0e,1]];
 for(const [at,size] of targets){
  const next=readOriginalDosNumericOperand(memory.slice(scriptAt,scriptAt+65536),memory.slice(contextAt,contextAt+65536),si,input.bp,memory.slice(globalAt,globalAt+65536));
  si=next.si;cx=dx;dx=next.value;memory[globalAt+at]=dx&255;if(size===2)memory[globalAt+at+1]=dx>>>8;
 }
 return {memory,registers:{...input,si,dx,cx}};
}
