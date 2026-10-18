import {readOriginalDosNumericOperand} from './original-dos-numeric-operand.ts';
/** Opcode188,5C08..5D0B up to RET or an explicit graphics/INT0 boundary.
 * Graphics calls5B4A and1E97:0EC9 are not replaced with successful stubs.
 * Numeric0/2/6/8/30/32 only; DF0. No flags/scratch/CPU-stack byte contract.
 */
export function prepareOriginalDosPaletteControl(source:Uint8Array,ss:number,input:{ds:number;es:number;si:number;bp:number;dx:number;cx:number}){
 if(source.length!==0x100000||![ss,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Expected1MiB memory and word registers');
 const window=(s:number)=>{const at=s*16;if(at+65536>source.length)throw Error('Palette control segment exceeds physical window');return at;};
 const g=window(ss),scriptAt=window(input.ds),contextAt=window(input.es),memory=source.slice();
 const next=readOriginalDosNumericOperand(memory.slice(scriptAt,scriptAt+65536),memory.slice(contextAt,contextAt+65536),input.si,input.bp,memory.slice(g,g+65536));
 const registers={...input,si:next.si,cx:next.value},word=(at:number)=>memory[g+at]|memory[g+at+1]<<8;
 const result=(phase:'return'|'upload'|'fade'|'divide-error',entry:number)=>({memory,registers,phase,entry,stackDelta:0});
 if(memory[g+0x2898]===0){
  if(memory[g+0x2897]!==0&&memory[g+0xbf4]===0){
   for(let n=0;n<32;n+=2){const value=word(0x1743+n);memory[g+0xe43+n]=value&255;memory[g+0xe44+n]=value>>>8;}
   return result('upload',0x5c4c);
  }
  memory[g+0xbf4]=0;return result('return',0x5c55);
 }
 const cx=registers.cx;memory[g+0xcbe]=1;
 if(cx!==0){
  if(cx>=32768||cx<63){
   const divisor=cx&255;if(divisor===0)return result('divide-error',0x5c69);
   memory[g+0xcbe]=Math.floor(63/divisor)+1;memory[g+0xcbb]=cx&255;memory[g+0xcbc]=1;memory[g+0xcbd]=1;
  }else{
   memory[g+0xcbb]=63;const quotient=Math.floor(cx/63);
   if(quotient>255)return result('divide-error',0x5c8d);
   memory[g+0xcbc]=quotient;memory[g+0xcbd]=quotient;
  }
 }
 registers.dx=cx;memory.fill(0,g+0x1443,g+0x1743);
 const mode=word(0x2894),raw=word(0xc9f),scaled=mode===2||mode===7?raw:Math.floor(((raw*2)&65535)/3);
 if(scaled<=200||cx===0){
  memory[g+0xcbc]=0;memory[g+0xcbd]=0;memory[g+0xcbb]=0;memory.fill(0,g+0xe43,g+0x1143);
 }
 memory[g+0xcb9]=1;return result('fade',0x5cf4);
}

/** VGA1E97:0EC9..0F29: one768-byte signed-color convergence pass.
 * Uses the literal original DS/ES1C0B, not a fabricated timer progression.
 */
export function stepOriginalDosPaletteFade(source:Uint8Array){
 if(source.length!==0x100000)throw Error('Invalid palette fade memory');
 const memory=source.slice(),g=0x1c0b0,step=memory[g+0xcbe],signed=(x:number)=>x&128?x-256:x;
 memory[g+0xcb8]=0;
 for(let n=0;n<768;n++){
  const target=memory[g+0x1443+n],current=memory[g+0xe43+n];if(target===current)continue;
  memory[g+0xcb8]=1;let value:number;
  if(signed(target)>signed(current)){value=(current+step)&255;if(signed(value)>=signed(target))value=target;}
  else{value=(current-step)&255;if(signed(value)<=signed(target))value=target;}
  memory[g+0xe43+n]=value;
 }
 return {memory,directionFlag:false};
}

/** Complete188 fade branch5CF4..5D0B; upload/divide boundaries stay explicit. */
export function executeOriginalDosPaletteControl(source:Uint8Array,ss:number,input:{ds:number;es:number;si:number;bp:number;dx:number;cx:number}){
 const prepared=prepareOriginalDosPaletteControl(source,ss,input);if(prepared.phase!=='fade')return prepared;
 if(ss!==0x1c0b)throw Error('Palette fade requires original literal global segment');
 const {memory}=stepOriginalDosPaletteFade(prepared.memory),g=ss*16;memory[g+0xcb8]=1;memory[g+0xcb9]=0;memory[g+0xbf4]=0;
 return {...prepared,memory,phase:'return' as const,entry:0x5d0b,directionFlag:false};
}
