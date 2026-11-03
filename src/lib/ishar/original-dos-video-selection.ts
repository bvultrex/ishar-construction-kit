/** Engine 098F..0A13, captured DOS segment layout shared by both profiles.
 * Select/copy the embedded video module before any graphics entry is called.
 * This does not infer the user's adapter: 2898/2896 are explicit input bytes.
 */
export function selectOriginalDosVideoModule(source:Uint8Array,ss:number){
 if(source.length!==0x100000||!Number.isInteger(ss)||ss<0||ss>65535||ss*16+0x28a4>source.length)throw Error('Invalid DOS video selection memory');
 const memory=source.slice(),base=ss*16,view=new DataView(memory.buffer);
 let mode:number,start:number,end:number;
 if(memory[base+0x2898]===1){mode=5;start=0x1e97;end=0x1fa6;}
 else if(memory[base+0x2896]===1){mode=3;start=0x1fa6;end=0x22ab;}
 else{mode=2;start=0x22ab;end=0x23d7;}
 const paragraphs=end-start,bytes=paragraphs*16;
 view.setUint16(base+0x2894,mode,true);
 if(mode!==5)for(let i=0;i<bytes;i++)memory[0x1e970+i]=memory[start*16+i];
 const allocationStart=(0x1e97+paragraphs)&65535;
 view.setUint16(base+0x28a2,allocationStart,true);
 return {memory,mode,sourceSegment:start,destinationSegment:0x1e97,copiedBytes:mode===5?0:bytes,allocationStart};
}
