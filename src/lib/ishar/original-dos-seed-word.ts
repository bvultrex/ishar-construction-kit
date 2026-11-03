import {readOriginalDosNumericOperand} from './original-dos-numeric-operand.ts';
import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** Original42:2AFC..2B13, numeric entry69AB (does not set CX=DX).
 * Writes raw C4E; zero operand selects BIOS data-area word0040:006C.
 * No host random value or invented clock tick is substituted.
 */
export function setOriginalDosSeedWord(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters){
 if(source.length!==0x100000||![ss,...Object.values(input)].every(x=>Number.isInteger(x)&&x>=0&&x<=65535)||[ss,input.ds,input.es].some(s=>s*16+65536>source.length))throw Error('Invalid seed-word state');
 const memory=source.slice(),g=ss*16,next=readOriginalDosNumericOperand(memory.subarray(input.ds*16,input.ds*16+65536),memory.subarray(input.es*16,input.es*16+65536),input.si,input.bp,memory.subarray(g,g+65536));
 const value=next.value===0?memory[0x46c]|memory[0x46d]<<8:next.value;memory[g+0xc4e]=value&255;memory[g+0xc4f]=value>>>8;
 return {memory,registers:{...input,si:next.si,dx:next.value},value,entry:0x26f7,stackDelta:0};
}
