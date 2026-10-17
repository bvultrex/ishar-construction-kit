/** DOS ALIS (< v30) cdim/tabchar/tabint. Metadata contains BYTE strides,
 * not element counts. Extra indices are popped in declaration order. */
export interface AlisArrayDeclaration { address:number; elementBytes:number; strides:number[] }
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
