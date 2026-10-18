/** Native handlers26FE..2743, opcodes5..10 in the identified captures.
 * DF=0, disjoint 64KiB script/context segments. Word operand may not straddle
 * segment end in this host API. CPU flags are not modeled.
 */
export function branchOriginalDosScript(script:Uint8Array,context:Uint8Array,opcode:number,si:number,bp:number){
 if(script.length!==65536||context.length!==65536||![si,bp].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||!Number.isInteger(opcode)||opcode<5||opcode>10)throw Error('Invalid native branch inputs');
 const kind=(opcode-5)%3,isCall=opcode<=7,u=(n:number)=>n&65535,memory=context.slice();
 if(kind!==0&&si===65535)throw Error('Straddling word operand is outside host branch contract');
 const raw=kind===0?script[si]:script[si]|(script[si+1]<<8),delta=kind===0?(raw>=128?raw-256:raw):raw;
 const after=u(si+(kind===0?1:kind===1?2:3));let di:number|null=null;
 const word=(at:number,v:number)=>{memory[u(at)]=v&255;memory[u(at+1)]=(v>>>8)&255;};
 if(isCall){const at=u(bp-10),stack=memory[at]|(memory[u(at+1)]<<8);di=u(stack-2);word(at,di);word(bp+di,after);}
 return {memory,si:u(after+delta),ax:u(delta),di,returnPointer:isCall?after:null};
}
