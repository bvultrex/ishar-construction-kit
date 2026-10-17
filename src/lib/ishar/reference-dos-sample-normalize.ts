/** Separate C-reference invdigit PC path. Input must already have passed any
 * script_init delta expansion/type-2 marker writes. Never mutates the input. */
export function normalizeReferenceDosSample(prepared:Uint8Array,engineVersion:number) {
 if(!Number.isInteger(engineVersion)||engineVersion<0||engineVersion>65535)throw Error('Invalid ALIS engine version');
 if(prepared.length<16||![1,2].includes(prepared[0]!))throw Error('Unsupported prepared sample');
 const bytes=Uint8Array.from(prepared),v=new DataView(bytes.buffer);
 const range=(at:number,size:number)=>{if(!Number.isSafeInteger(at)||at<0||size<0||at+size>bytes.length)throw Error('Prepared sample range outside buffer');};
 if(bytes[0]===2){
  const total=v.getUint32(2,true),loop=v.getUint32(12,true);
  if(loop!==0){
   const bits=(total-loop-33)&65535,length=bits>=32768?bits-65536:bits;
   if(length>=0){const dst=16+loop;range(dst,length);range(dst+8,length);bytes.copyWithin(dst,dst+8,dst+8+length);}
   v.setUint32(12,(loop-16)>>>0,true);
  }
  v.setUint32(2,(total-16)>>>0,true);
 }
 const length=v.getUint32(2,true)-16;range(16,length);
 if(engineVersion>=20){if(length===0)throw Error('Empty sample cannot carry end marker');bytes[16+length-1]=0;}
 return {bytes,samples:bytes.slice(16,16+length),length,loopField:v.getUint32(12,true),speed:bytes[1]!};
}
