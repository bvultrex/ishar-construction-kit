import type {OriginalDosDriveServices} from './original-dos-drive-query.ts';
import {prepareOriginalDosModuleLoad} from './original-dos-module-load-prefix.ts';
import {executeOriginalDosPhysicalClive} from './original-dos-physical-clive.ts';
import {readOriginalDosScriptMouse} from './original-dos-script-mouse.ts';
import {setOriginalDosSeedWord} from './original-dos-seed-word.ts';
import {controlOriginalDosContext} from './original-dos-context-control.ts';
import {selectOriginalDosPalette} from './original-dos-palette-select.ts';
import type {OriginalDosFileSearch} from './original-dos-file-probe.ts';
import {branchOriginalDosScript} from './original-dos-script-branch.ts';
import {branchOriginalDosScriptConditional} from './original-dos-script-conditional.ts';
import {returnOriginalDosScript} from './original-dos-script-return.ts';
import {evaluateOriginalDosPhysicalExpression} from './original-dos-script-expression.ts';
import {createOriginalDosScriptObject} from './original-dos-script-object.ts';
import {writeOriginalDosPhysicalScriptBlock} from './original-dos-script-block.ts';
import {assignOriginalDosIndexedValue} from './original-dos-indexed-assignment.ts';
import {readOriginalDosNumericOperand} from './original-dos-numeric-operand.ts';
import {executeOriginalDosPaletteControl} from './original-dos-palette-control.ts';
import {decrementOriginalDosScript} from './original-dos-script-decrement.ts';
import {setOriginalDosObjectVisibility} from './original-dos-object-visibility.ts';
import {updateOriginalDosSelectedObject} from './original-dos-object-selection.ts';
import {executeOriginalDosResourceDraw} from './original-dos-resource-draw.ts';
import {writeOriginalDosPhysicalGlobalOperands} from './original-dos-script-opcode186.ts';
import {outputOriginalDosString} from './original-dos-string-output.ts';

export interface OriginalDosPhysicalScriptRegisters {ds:number;es:number;si:number;bp:number;dx:number;cx:number}
/** Bounded original-script step on physical memory. Only the listed ALIS state
 * registers are a contract; CPU scratch AX/BX/DI, flags and stack save bytes are
 * not modeled. No skipped opcodes, scheduler or invented external services.
 */
export function stepOriginalDosPhysicalScript(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,engineSegment=0x1000,bios?:{driveServices?:OriginalDosDriveServices;joystickReplies?:readonly number[];shiftFlags?:number;fileSearch?:OriginalDosFileSearch;palette?:{retraceReads:readonly number[];interruptFlag:boolean}}){
 if(source.length!==0x100000||![ss,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Expected1MiB memory and word registers');
 const window=(segment:number)=>{const at=segment*16;if(at+65536>source.length)throw Error('Script segment exceeds bounded physical window');return at;};
 const scriptAt=window(input.ds),contextAt=window(input.es),globalAt=window(ss);
 if(!Number.isInteger(engineSegment)||engineSegment<0||engineSegment>65535)throw Error('Expected original engine segment');
 const keyByte=source[window(engineSegment)+0x318];
 const opcode=source[scriptAt+input.si],after=(input.si+1)&65535;
 const registers={...input,si:after};let memory=source.slice(),status:'ready'|'yield'='ready';let events:Array<{kind:string;port:number;value:number}>=[];
 const context=()=>memory.slice(contextAt,contextAt+65536),script=()=>memory.slice(scriptAt,scriptAt+65536),globals=()=>memory.slice(globalAt,globalAt+65536);
 const word=(at:number)=>memory[globalAt+at]|memory[globalAt+at+1]<<8;
 if(opcode>=5&&opcode<=10){const next=branchOriginalDosScript(script(),context(),opcode,after,input.bp);memory.set(next.memory,contextAt);registers.si=next.si;}
 else if(opcode>=18&&opcode<=29)registers.si=branchOriginalDosScriptConditional(script(),opcode,after,input.dx,input.cx).si;
 else if(opcode===17){const next=returnOriginalDosScript(context(),input.bp,after,memory[globalAt+0xc19],word(0xc56));memory.set(next.memory,contextAt);registers.si=next.si;if(next.phase==='yield')status='yield';}
 else if(opcode===66)status='yield';
 else if(opcode===42){const next=setOriginalDosSeedWord(memory,ss,{...input,si:after});memory=next.memory;Object.assign(registers,next.registers);}
 else if(opcode===59){/* Original2E93 is RET; only opcode fetch advances SI. */}
 else if(opcode===134){const next=readOriginalDosScriptMouse(memory,ss,{...input,si:after},engineSegment);memory=next.memory;Object.assign(registers,next.registers);}
 else if(opcode===64){const next=executeOriginalDosPhysicalClive(memory,ss,{...input,si:after});memory=next.memory;Object.assign(registers,next.registers);}
 else if(opcode===69){
  const next=prepareOriginalDosModuleLoad(memory,ss,{...input,si:after},engineSegment);
  if(next.phase!=='return')throw Error(`Original module69 reaches ${next.phase} at${next.entry.toString(16)}`);
  memory=next.memory;Object.assign(registers,next.registers);
 }
 else if(opcode>=43&&opcode<=45){const next=decrementOriginalDosScript(memory,ss,{...input,si:after},opcode);memory=next.memory;Object.assign(registers,next.registers);}
 else if(opcode===78||opcode===79){const next=setOriginalDosObjectVisibility(memory,ss,{...input,si:after},opcode);memory=next.memory;Object.assign(registers,next.registers);}
 else if([71,192,193,194].includes(opcode)){const next=updateOriginalDosSelectedObject(memory,ss,{...input,si:after},opcode);memory=next.memory;Object.assign(registers,next.registers);}
 else if(opcode===72||opcode===73||opcode===167){const next=executeOriginalDosResourceDraw(memory,ss,{...input,si:after},opcode);memory=next.memory;Object.assign(registers,next.registers);}
 else if(opcode===186||opcode===191){const next=writeOriginalDosPhysicalGlobalOperands(memory,ss,{...input,si:after},opcode);memory=next.memory;Object.assign(registers,next.registers);}
 else if(opcode===185){const next=outputOriginalDosString(memory,ss,{...input,si:after});memory=next.memory;Object.assign(registers,next.registers);}
 else if(opcode>=98&&opcode<=103){const next=controlOriginalDosContext(memory,ss,{...input,si:after},opcode);memory=next.memory;Object.assign(registers,next.registers);}
 else if(opcode===104||opcode===190){const next=selectOriginalDosPalette(memory,ss,{...input,si:after},bios?.palette,opcode===190);memory=next.memory;Object.assign(registers,next.registers);events=next.events;}
 else if(opcode===106){const next=readOriginalDosNumericOperand(memory.subarray(scriptAt,scriptAt+65536),memory.subarray(contextAt,contextAt+65536),after,input.bp,memory.subarray(globalAt,globalAt+65536));registers.si=next.si;registers.cx=input.dx;registers.dx=next.value;memory[globalAt+0xc99]=next.value&255;}
 else if(opcode===188){
  const next=executeOriginalDosPaletteControl(memory,ss,{...input,si:after});
  if(next.phase!=='return')throw Error(`Original palette control reaches ${next.phase} boundary at${next.entry.toString(16)}`);
  memory=next.memory;Object.assign(registers,next.registers);
 }
 else if(opcode===215){
  const next=readOriginalDosNumericOperand(script(),context(),after,input.bp,globals());
  registers.si=next.si;registers.cx=input.dx;registers.dx=next.value;
  memory[globalAt+0xbf4]=next.value&255;memory[globalAt+0xbf5]=1;
 }
 else if(opcode===41){const next=writeOriginalDosPhysicalScriptBlock(memory,input.ds,input.es,after,input.bp);memory=next.memory;registers.si=next.si;}
 else if(opcode===70){
  const next=createOriginalDosScriptObject(memory,ss,{ds:input.ds,es:input.es,si:after,bx:140,di:0,dx:input.dx});
  if(next.error)throw Error(`Original object handler reaches error${next.error}; explicit error boundary required`);
  memory=next.memory;registers.si=next.registers.si;registers.dx=next.registers.dx;registers.cx=next.registers.cx;
 }else if(opcode===30||opcode===32||opcode===33){const next=assignOriginalDosIndexedValue(memory,ss,{ds:input.ds,es:input.es,si:after,bp:input.bp,dx:input.dx},opcode===32?'add':opcode===33?'subtract':'store');memory=next.memory;Object.assign(registers,{si:next.registers.si,dx:next.registers.dx,cx:next.registers.cx});}
 else if(opcode===31){
  const next=evaluateOriginalDosPhysicalExpression(memory,ss,{...input,si:after},{keyByte,joystickReplies:bios?.joystickReplies,shiftFlags:bios?.shiftFlags,driveServices:bios?.driveServices,engineSegment},bios?.fileSearch);
  memory=next.memory;registers.si=next.si;registers.dx=next.dx;registers.cx=next.cx;events=next.events;
 }else throw Error(`Original opcode${opcode} is not connected to physical script execution`);
 return {memory,registers,status,opcode,events};
}
