/** Native1000:2885..2914, opcodes18..29. DF0, bounded operand reads.
 * Byte displacements are signed; word displacements wrap modulo65536.
 * Third encoding consumes an extra byte without reading it.
 */
export function branchOriginalDosScriptConditional(script:Uint8Array,opcode:number,si:number,dx:number,cx:number){
 if(script.length!==65536||![si,dx,cx].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||!Number.isInteger(opcode)||opcode<18||opcode>29)throw Error('Invalid native conditional inputs');
 const kind=(opcode-18)%3,group=Math.floor((opcode-18)/3),taken=group===0?dx===0:group===1?dx!==0:group===2?dx===cx:dx!==cx,length=kind+1;
 let delta=0,ax:number|null=null;
 if(taken){
  if(kind!==0&&si===65535)throw Error('Conditional word straddles host segment window');
  const raw=kind===0?script[si]:script[si]|(script[si+1]<<8);delta=kind===0&&raw>=128?raw-256:raw;ax=delta&65535;
 }
 return {si:(si+length+delta)&65535,taken,ax};
}
