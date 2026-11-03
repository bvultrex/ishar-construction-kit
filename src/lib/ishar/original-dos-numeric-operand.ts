/** Numeric forms reached through69A6: tags0/2/6/8/18/20 and30/32 in identified DOS captures.
 * Tags30/32 use the explicit SS:0BF6 base, never an assumed BP or zero base.
 * DF0, bounded source; string/indexed/expression forms are not guessed.
 */
export function readOriginalDosNumericOperand(script:Uint8Array,context:Uint8Array,si:number,bp:number,globals?:Uint8Array){
 if(script.length!==65536||context.length!==65536||![si,bp].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid native numeric operand inputs');
 const tag=script[si],short=tag===18||tag===20,length=tag===0||short?2:[2,6,8,30,32].includes(tag)?3:0;
 if(!length)throw Error(`Native numeric operand tag ${tag} is not reconstructed here`);
 if(si+length>65536)throw Error('Operand straddles host segment window');
 const signedByte=(v:number)=>(v>=128?v+65280:v),raw=script[si+1]|((script[si+2]??0)<<8);
 if(tag===0)return {value:signedByte(script[si+1]),si:(si+2)&65535,tag};
 if(tag===2)return {value:raw,si:(si+3)&65535,tag};
 if((tag===30||tag===32)&&globals?.length!==65536)throw Error('Numeric tags30/32 require the original global segment');
 const base=tag===30||tag===32?globals![0xbf6]|(globals![0xbf7]<<8):bp;
 const at=(base+(short?script[si+1]:raw))&65535;if((tag===8||tag===20||tag===32)&&at===65535)throw Error('Context word straddles host segment window');
 return {value:tag===6||tag===18||tag===30?signedByte(context[at]):context[at]|(context[at+1]<<8),si:(si+length)&65535,tag};
}
