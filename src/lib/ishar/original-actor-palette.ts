/** Values written by the Ishar-2 MAIN DOS settings branch, not a full platform
 * detector or boot execution. Caller must establish that this branch applies. */
export function readIshar2DosPaletteSettings(image:Uint8Array):{enabled:number;duration:number}{
 const view=new DataView(image.buffer,image.byteOffset,image.byteLength);
 const store=(at:number,address:number)=>{
  if(at<0||at+2>image.length||image[at]!==0x1e)throw Error('Missing original palette settings store');
  const operand=image[at+1],width=operand===0?1:operand===2?2:0;if(!width)throw Error('Unsupported palette settings immediate');
  const target=at+2+width;
  if(target+3>image.length||image[target]!==6||view.getUint16(target+1,true)!==address)throw Error('Unexpected palette settings destination');
  return (width===1?image[at+2]!:view.getUint16(at+2,true))&255;
 };
 return {enabled:store(0x4bb,0x51a1),duration:store(0x4ae,0x51a2)};
}
