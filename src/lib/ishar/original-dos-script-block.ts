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

/** Same5713 handler on shared physical memory, including overlapping source and
 * destination segments. SI is at operands, DF=0. Saved AX/DI/CX are unchanged;
 * no other register changes. Stack bytes/flags are outside this host contract.
 */
export function writeOriginalDosPhysicalScriptBlock(source:Uint8Array,ds:number,es:number,si:number,bp:number){
 if(source.length!==0x100000||![ds,es,si,bp].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Expected1MiB memory and word registers');
 const memory=source.slice(),u=(v:number)=>v&65535;
 const address=(s:number,o:number,wide=false)=>{o=u(o);const at=s*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Block access outside bounded real-mode window');return at;};
 const byte=(s:number,o:number,value?:number)=>{const at=address(s,o);if(value!==undefined)memory[at]=value&255;return memory[at];};
 const word=(s:number,o:number,value?:number)=>{const at=address(s,o,true);if(value!==undefined){memory[at]=value&255;memory[at+1]=(value>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 let di=u(word(ds,si)-1);si=u(si+2);const count=byte(ds,si);si=u(si+1);
 byte(es,bp+di,count);di=u(di-1);
 const type=byte(ds,si);si=u(si+1);byte(es,bp+di,type);
 for(let index=0;index<count;index++){di=u(di-2);const value=word(ds,si);si=u(si+2);word(es,bp+di,value);}
 return {memory,si,count};
}
