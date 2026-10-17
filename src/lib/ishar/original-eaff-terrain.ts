/** Ishar-2 MAIN 0x3cd0/0x3cd5 loads CONT A/B into 0x80/0x159c.
 * EAFF 0x302..0x324 reads signed B bytes and stores their difference as a byte.
 * This does not infer terrain type from texture or implement occlusion. */
export function originalEaffTerrainDelta(cont:Uint8Array,view:{row:number;col:number},actor:{row:number;col:number}):number{
 if(cont.length!==10800)throw Error('Ishar-2 CONT requires exactly two 5400-byte layers');
 const read=(position:{row:number;col:number})=>{
  if(!Number.isInteger(position.row)||!Number.isInteger(position.col)||position.row<0||position.row>=90||position.col<0||position.col>=60)throw Error('Terrain position outside Ishar-2 CONT');
  return ((cont[5400+position.row*60+position.col]!&255)^128)-128;
 };
 return (((read(actor)-read(view))&255)^128)-128;
}
