/** Original DOS loader at CS:06B2, transform CS:0709..0721 in captured profiles.
 * Requires the actual full memory window, NOT just BLANCPC's file payload:
 * surrounding bytes depend on loader allocation/read behavior still under study. */
export function transformOriginalBlancpcLoadWindow(source:Uint8Array):Uint8Array{
 if(source.length!==0xa00)throw Error('BLANCPC transform requires explicit 2560-byte memory window');
 const result=Uint8Array.from(source);
 for(let i=0x74;i<0xa00;i++){
  const value=source[i]!;if(value===0)continue;
  const bits=(value-0x20)&255,signed=bits>=128?bits-256:bits;
  result[i]=((signed>>2)+0x20)&255;
 }
 return result;
}
