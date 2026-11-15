/** Native 1000:26EB..26F2, through the indirect near CALL.
 * Handler table comes from the identified runtime, never a guessed opcode map.
 * No handler body is executed by this function.
 */
export function readOriginalDosOpcodeDispatch(codeSegment:Uint8Array,scriptSegment:Uint8Array,si:number,directionFlag:boolean=false){
 if(codeSegment.length!==65536||scriptSegment.length!==65536||!Number.isInteger(si)||si<0||si>65535||typeof directionFlag!=='boolean')throw Error('Opcode dispatch requires two 64KiB segments, word SI and boolean DF');
 const opcode=scriptSegment[si],index=opcode*2,tableOffset=0x24+index;
 return {opcode,index,tableOffset,target:codeSegment[tableOffset]|(codeSegment[tableOffset+1]<<8),si:(si+(directionFlag?-1:1))&65535,returnOffset:0x26f7};
}
