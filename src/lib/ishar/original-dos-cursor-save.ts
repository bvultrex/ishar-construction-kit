/** Native graphics 1E97:0FFA..105C, DF=0, valid 320x200 coordinates.
 * Six-byte LE header then tightly packed background bytes.
 */
export function saveOriginalDosCursor(screen: Uint8Array, x: number, y: number, stride: number, base: number) {
  if (screen.length!==65536 || !Number.isInteger(x)||x<0||x>=320||!Number.isInteger(y)||y<0||y>=200||!Number.isInteger(stride)||stride<0||stride>65535||!Number.isInteger(base)||base<0||base>65535) throw new Error('Unsupported native cursor save window');
  const width=x<304?16:320-x,rows=y<184?16:200-y,offset=base+y*stride+x;
  if(offset+(rows-1)*stride+width>65536)throw new Error('Native cursor save would wrap segment');
  const bytes=new Uint8Array(6+width*rows),view=new DataView(bytes.buffer);
  view.setUint16(0,offset,true);view.setUint16(2,width,true);view.setUint16(4,rows,true);
  for(let row=0;row<rows;row++)bytes.set(screen.subarray(offset+row*stride,offset+row*stride+width),6+row*width);
  return bytes;
}
