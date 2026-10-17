/** Numeric forms reached through69A6: tags0/2/6/8 in identified DOS captures.
 * DF0, bounded source; string/indexed/expression forms are not guessed.
 */
export function readOriginalDosNumericOperand(script:Uint8Array,context:Uint8Array,si:number,bp:number){
 if(script.length!==65536||context.length!==65536||![si,bp].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid native numeric operand inputs');
 const tag=script[si],length=tag===0?2:[2,6,8].includes(tag)?3:0;
 if(!length)throw Error(`Native numeric operand tag ${tag} is not reconstructed here`);
 if(si+length>65536)throw Error('Operand straddles host segment window');
 const signedByte=(v:number)=>(v>=128?v+65280:v),raw=script[si+1]|((script[si+2]??0)<<8);
 if(tag===0)return {value:signedByte(script[si+1]),si:(si+2)&65535,tag};
 if(tag===2)return {value:raw,si:(si+3)&65535,tag};
 const at=(bp+raw)&65535;if(tag===8&&at===65535)throw Error('Context word straddles host segment window');
 return {value:tag===6?signedByte(context[at]):context[at]|(context[at+1]<<8),si:(si+3)&65535,tag};
}
