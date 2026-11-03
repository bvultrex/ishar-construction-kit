/** Deterministic DOS A1 writer, inverse of the verified bitstream decoder.
 * Format semantics: literal count sum(2-bit chunks, continuation=3)+1;
 * selector 1/2/3 -> copy 2/3/4 bytes, selector 0 -> sum(3-bit chunks,7)+5.
 * This is a new encoder for the original format, not the original compressor.
 * No claim of identical compressed bytes or proven original execution. */
const WINDOW=32768,MAX_COPY=1024,MAX_LITERAL=65536;
class Bits {
 private bytes:Uint8Array;private bit=0;
 constructor(size:number){this.bytes=new Uint8Array(size);}
 put(value:number,width:number){
  if(!Number.isInteger(value)||value<0||value>=2**width)throw Error('A1 writer bit value invalid');
  if(this.bit+width>this.bytes.length*8)throw Error('A1 writer output bound exceeded');
  for(let shift=width-1;shift>=0;shift--){this.bytes[this.bit>>3]!|=((value>>>shift)&1)<<(7-(this.bit&7));this.bit++;}
 }
 count(value:number,width:number,continuation:number){
  while(value>=continuation){this.put(continuation,width);value-=continuation;}
  this.put(value,width);
 }
 finish(){
  // Original implementations fetch 16-bit words. Supply full-word zero padding.
  const length=Math.ceil(this.bit/16)*2+2;return this.bytes.slice(0,length);
 }
}
export function packSilmA1(image:Uint8Array,envelope:Uint8Array=Uint8Array.of(0,0,0,0xa1,1,0)):Uint8Array {
 if(![6,22].includes(envelope.length))throw Error('A1 envelope must contain 6 or 22 bytes');
 const main=envelope[4]===0&&envelope[5]===0;
 if(main!==(envelope.length===22))throw Error('A1 MAIN marker and VM specs disagree');
 if(!image.length||image.length+envelope.length>0xffffff)throw Error('A1 image size outside 24-bit envelope');
 const bits=new Bits(image.length*2+1024),last=new Int32Array(65536);last.fill(-1);
 const index=(position:number)=>{if(position+1<image.length)last[(image[position]!<<8)|image[position+1]!]=position;};
 let position=0,anchor=0;
 const literals=(start:number,end:number)=>{
  const length=end-start;if(length>MAX_LITERAL)throw Error('A1 writer requires a match before 65536 literal bytes; unsupported input pattern');
  bits.put(length?1:0,1);
  if(length){bits.count(length-1,2,3);for(let i=start;i<end;i++)bits.put(image[i]!,8);}
 };
 while(position<image.length){
  const candidate=position+1<image.length?last[(image[position]!<<8)|image[position+1]!]!:-1;
  const distance=position-candidate;let length=0;
  if(candidate>=0&&distance<=WINDOW){
   while(length<MAX_COPY&&position+length<image.length&&image[candidate+length]===image[position+length])length++;
  }
  if(length>=2){
   literals(anchor,position);
   const selector=length<5?length-1:0;
   bits.put(selector,3);bits.put(distance-1,15);
   if(selector===0)bits.count(length-5,3,7);
   for(let i=0;i<length;i++)index(position+i);
   position+=length;anchor=position;
  }else{
   index(position++);
   if(position-anchor>MAX_LITERAL)throw Error('A1 writer requires a match before 65536 literal bytes; unsupported input pattern');
  }
 }
 if(anchor<image.length)literals(anchor,image.length);
 const stream=bits.finish(),result=new Uint8Array(envelope.length+8+stream.length);
 result.set(envelope);new DataView(result.buffer).setUint32(0,0xa1000000+image.length+envelope.length,true);
 // All eight distance widths are 15; only selectors 0..3 are emitted.
 result.fill(15,envelope.length,envelope.length+8);result.set(stream,envelope.length+8);
 return result;
}
