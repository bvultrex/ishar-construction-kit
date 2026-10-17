/** Separate ALIS C reference script_init nibble expansion, before invdigit.
 * Not a complete native sample importer: type-2 fixups and mixer remain separate. */
export function expandReferenceDosSampleDelta(packed:Uint8Array,declaredLength:number):Uint8Array {
 if(!Number.isInteger(declaredLength)||declaredLength<20||declaredLength>16*1024*1024)throw Error('Invalid reference sample length');
 const count=Math.floor((declaredLength-16)/2);
 if(packed.length<count)throw Error('Truncated reference delta sample');
 const delta=[-34,-21,-13,-8,-5,-3,-2,-1,1,2,3,5,8,13,21,34];
 // C writes 1 + 2*(count-1) decoded bytes, then two zero bytes;
 // its following length update excludes one of those marker bytes.
 const out=new Uint8Array(count*2+1);let value=packed[0]!;out[0]=value;
 for(let i=1;i<count;i++){
  value=(value+delta[packed[i]!>>4]!)&255;out[2*i-1]=value;
  value=(value+delta[packed[i]!&15]!)&255;out[2*i]=value;
 }
 return out;
}
