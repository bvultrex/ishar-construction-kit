import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** Original98..103:588A..58B2 and570B. Raw context bits/words;
 * shared physical memory, no invented lifecycle semantics or callback body.
 * SI is after the opcode; CPU scratch AX/flags are not an ALIS-state contract.
 */
export function controlOriginalDosContext(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,opcode:number){
 if(source.length!==0x100000||![ss,...Object.values(input)].every(x=>Number.isInteger(x)&&x>=0&&x<=65535)||![98,99,100,101,102,103].includes(opcode))throw Error('Invalid context-control state');
 const memory=source.slice(),u=(x:number)=>x&65535,es=input.es,bp=input.bp;
 const at=(s:number,o:number,wide=false)=>{o=u(o);const a=s*16+o;if(wide&&o===65535||a+(wide?2:1)>memory.length)throw Error('Context control outside bounded physical window');return a;};
 const flag=()=>at(es,bp-36);
 if(opcode===98)memory[flag()]&=254;
 else if(opcode===100)memory[flag()]&=253;
 else if(opcode===101)memory[flag()]|=2;
 else if(opcode===103)memory[at(ss,0xc96)]=1;
 else{
  if(opcode===99)memory[flag()]|=1;
  const from=at(es,bp-28,true),low=memory[from],high=memory[from+1],to=at(es,bp-30,true);memory[to]=low;memory[to+1]=high;memory[flag()]&=127;
 }
 return {memory,registers:{...input},entry:0x26f7,stackDelta:0};
}
