/** DOS ALIS (< v30) cdim/tabchar/tabint. Metadata contains BYTE strides,
 * not element counts. Extra indices are popped in declaration order. */
export interface AlisArrayDeclaration { address:number; elementBytes:number; strides:number[] }
/** Import required declarations from complete cdim instruction bytes in a local
 * listing. Truncated disassembler previews must never become guessed strides. */
export function readRequiredAlisArrays(listing:string,addresses:readonly number[]):Map<number,AlisArrayDeclaration>{
 const result=new Map<number,AlisArrayDeclaration>();
 for(const line of listing.split(/\r?\n/)){
  const m=line.match(/^\s*[\da-f]{5}\s+([\da-f]+)\s+cdim\s+var=0x([\da-f]+)/);if(!m||!addresses.includes(parseInt(m[2]!,16)))continue;
  if(m[1]!.length%2)throw Error('Incomplete cdim hex bytes');
  const bytes=Uint8Array.from(m[1]!.match(/../g)!.map(v=>parseInt(v,16))),declaration=readAlisArrayDeclaration(bytes,0);
  if(declaration.address!==parseInt(m[2]!,16)||result.has(declaration.address))throw Error('Ambiguous cdim listing');result.set(declaration.address,declaration);
 }
 for(const address of addresses)if(!result.has(address))throw Error(`Missing MAIN array declaration ${address.toString(16)}`);
 return result;
}
export function readAlisArrayDeclaration(image:Uint8Array,offset:number):AlisArrayDeclaration {
 if(!Number.isInteger(offset)||offset<0||offset+5>image.length||image[offset]!==0x29)throw Error('Expected complete DOS cdim instruction');
 const view=new DataView(image.buffer,image.byteOffset,image.byteLength),count=image[offset+3]!;
 if(count>=128)throw Error('Indirect/version-30 ALIS arrays are unsupported');
 if(offset+5+count*2>image.length)throw Error('Truncated DOS cdim strides');
 const address=view.getInt16(offset+1,true),elementBytes=image[offset+4]!;
 return {address,elementBytes,strides:Array.from({length:count},(_,i)=>view.getUint16(offset+5+i*2,true))};
}
export function originalAlisArrayAddress(declaration:AlisArrayDeclaration,index:number,stack:number[],width:1|2):number {
 if(!Number.isInteger(index)||!Number.isInteger(declaration.address)||!declaration.strides.every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid DOS array address operands');
 if(stack.length<declaration.strides.length)throw Error('Missing DOS array dimension operands');
 // Validate before consuming any operands, including when a later index is bad.
 for(let i=0;i<declaration.strides.length;i++)if(!Number.isInteger(stack[stack.length-1-i]))throw Error('Invalid DOS array dimension operand');
 let result=declaration.address+index*width;
 for(const stride of declaration.strides)result+=stride*stack.pop()!;
 if(!Number.isSafeInteger(result))throw Error('DOS array address overflow');
 return result;
}
