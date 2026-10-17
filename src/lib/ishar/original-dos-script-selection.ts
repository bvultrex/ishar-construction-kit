/** Opcode71, 1000:2EF3..2EFE in both identified DOS captures.
 * Store a raw literal word at ES:[BP-16h]. Its higher-level meaning is not inferred.
 * DF0, disjoint segments, bounded word accesses.
 */
export function selectOriginalDosScriptWord(script:Uint8Array,context:Uint8Array,si:number,bp:number){
 if(script.length!==65536||context.length!==65536||![si,bp].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid native selection inputs');
 const at=(bp-0x16)&65535;
 if(si===65535||at===65535)throw Error('Selection word straddles host segment window');
 const value=script[si]|(script[si+1]<<8),memory=context.slice();
 if((memory[at]|(memory[at+1]<<8))!==value){memory[at]=value&255;memory[at+1]=value>>>8;}
 return {memory,si:(si+2)&65535,value};
}
