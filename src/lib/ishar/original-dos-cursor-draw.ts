/** Native 1E97:0F48..0FF9. Valid 320x200 coords, DF=0, nonwrapping RAM. */
export function drawOriginalDosCursor(screen: Uint8Array, sprite: Uint8Array, x: number, y: number, stride: number, base: number) {
  if(screen.length!==65536 || !Number.isInteger(x)||x<0||x>=320||!Number.isInteger(y)||y<0||y>=200||![stride,base].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||sprite.length<8)throw new Error('Unsupported native cursor drawing inputs');
  const width=Math.min(16,320-x),rows=Math.min(16,200-y),offset=base+y*stride+x;
  if(offset+(rows-1)*stride+width>65536)throw new Error('Cursor draw would wrap destination');
  const packed=sprite[0]===0||sprite[0]===16,header=sprite[0]===0?6:8,rowBytes=packed?8:16;
  if(sprite.length<header+rows*rowBytes)throw new Error('Truncated native cursor sprite');
  const paletteBase=sprite[0]===16?sprite[6]:0,result=Uint8Array.from(screen);
  for(let row=0;row<rows;row++)for(let col=0;col<width;col++){
    const value=packed?(sprite[header+row*8+(col>>>1)]>>>(col%2===0?4:0))&15:sprite[header+row*16+col];
    if(value!==0)result[offset+row*stride+col]=(value+paletteBase)&255;
  }
  return result;
}
