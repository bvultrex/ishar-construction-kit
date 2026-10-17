/** Native opcode41, 1000:5713..5737. DF0; source operands do not wrap.
 * Raw byte/word layout is retained; no unproven variable-type interpretation.
 */
export function writeOriginalDosScriptBlock(script:Uint8Array,context:Uint8Array,si:number,bp:number){
 if(script.length!==65536||context.length!==65536||![si,bp].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||si+4>65536)throw Error('Invalid native block operands');
 const count=script[si+2],length=4+count*2;if(si+length>65536)throw Error('Native block operands cross host segment window');
 const memory=context.slice(),u=(v:number)=>v&65535,offset=script[si]|(script[si+1]<<8);
 memory[u(bp+offset-1)]=count;memory[u(bp+offset-2)]=script[si+3];
 for(let index=0;index<count;index++){
  const at=u(bp+offset-4-index*2);if(at===65535)throw Error('Native destination word straddles host segment window');
  memory[at]=script[si+4+index*2];memory[at+1]=script[si+5+index*2];
 }
 return {memory,si:u(si+length),count,length};
}
