/** Native 1E97:105D..109E, DF=0 and bounded nonwrapping buffers only.
 * Header is read in engine DS; payload is read in the segment from DS:0CAC.
 */
export function restoreOriginalDosCursor(destination: Uint8Array, payload: Uint8Array, offset: number, width: number, rows: number, stride: number) {
  if (![offset,width,rows,stride].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||rows===0) throw new Error('Invalid native cursor rectangle');
  if (destination.length!==65536 || offset+(rows-1)*stride+width>65536 || payload.length!==width*rows) throw new Error('Cursor restore outside supported nonwrapping window');
  const bytes=Uint8Array.from(destination);
  for(let y=0;y<rows;y++) bytes.set(payload.subarray(y*width,(y+1)*width),offset+y*stride);
  return bytes;
}
