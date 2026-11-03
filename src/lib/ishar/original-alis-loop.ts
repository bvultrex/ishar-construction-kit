/** Old-DOS cloop with scalar aloc/adir byte/word counter; source opcodes.c
 * cloop/save_loop_pc and addnames.c zero-flag handlers. No VM mutation here. */
export interface DosAlisLoop {offset:number;width:1|2|3;counterStart:number;next:number;target:number;counterAddress:number;counterBytes:1|2;counterMode:'local'|'direct';displacement:number}
export function readDosAlisLoop(image:Uint8Array,offset:number):DosAlisLoop{
 if(!Number.isInteger(offset)||offset<0||offset>=image.length||image[offset]!<0x2b||image[offset]!>0x2d)throw Error('Expected DOS cloop');
 const width=(image[offset]!-0x2b+1) as 1|2|3,counterStart=offset+1+width;
 if(counterStart>=image.length)throw Error('Truncated DOS loop');
 let raw=0;for(let i=0;i<width;i++)raw+=image[offset+1+i]!*2**(8*i);
 const displacement=raw>=2**(width*8-1)?raw-2**(width*8):raw,target=counterStart+displacement,op=image[counterStart],local=op===6||op===8,direct=op===0x12||op===0x14;
 if(!local&&!direct)throw Error('Unsupported DOS loop counter');
 const next=counterStart+1+(local?2:1);if(next>image.length)throw Error('Truncated DOS loop counter');
 if(target<0||target>=image.length)throw Error('DOS loop target outside image');
 const counterAddress=local?new DataView(image.buffer,image.byteOffset,image.byteLength).getInt16(counterStart+1,true):image[counterStart+1]!;
 return {offset,width,counterStart,next,target,counterAddress,counterBytes:op===6||op===0x12?1:2,counterMode:local?'local':'direct',displacement};
}
export function stepOriginalDosLoop(loop:Pick<DosAlisLoop,'counterBytes'|'next'|'target'>,value:number):{value:number;zero:boolean;next:number}{
 const bits=loop.counterBytes*8;if(!Number.isInteger(value)||value< -(2**(bits-1))||value>=2**bits)throw Error('Invalid DOS loop counter value');
 const result=(value-1)&(2**bits-1),zero=result===0;
 return {value:result,zero,next:zero?loop.next:loop.target};
}
