/** 1000:291B dispatcher, result tags6/8/18/20 ->715A/7161/71C1/71CA.
 * DF0, disjoint bounded segments. Other targets (strings/indexed) remain unsupported.
 */
export function storeOriginalDosScriptResult(script:Uint8Array,context:Uint8Array,globals:Uint8Array,si:number,bp:number,value:number){
 if([script,context,globals].some(v=>v.length!==65536)||![si,bp,value].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid native result inputs');
 const tag=script[si],short=tag===18||tag===20,length=short?2:[6,8].includes(tag)?3:0;
 if(!length)throw Error(`Native result tag ${tag} is not reconstructed here`);
 if(si+length>65536)throw Error('Result operand straddles host segment window');
 const offset=script[si+1]|(short?0:script[si+2]<<8),at=(bp+offset)&65535,wide=tag===8||tag===20;
 if(wide&&at===65535)throw Error('Result word straddles host segment window');
 const memory=context.slice(),nextGlobals=globals.slice();
 for(let i=0;i<2;i++){nextGlobals[0xc58+i]=globals[0xc5c+i];nextGlobals[0xc5c+i]=globals[0xc58+i];}
 memory[at]=value&255;if(wide)memory[at+1]=value>>>8;
 return {memory,globals:nextGlobals,si:(si+length)&65535,tag,offset};
}
