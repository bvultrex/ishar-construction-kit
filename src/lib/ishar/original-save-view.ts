import {isOriginalSave} from './original-commerce.ts';

export interface OriginalSaveView {row:number;col:number;facing:number;map:number;scene:number}
/** IO.IO writer 0x00aa1..0x00ac1: MAIN 2ab4/2ab5/2ab6/2d18/4ef2.
 * Each byte scalar is stored as signed BE16. Preserve even noncanonical high
 * bytes when the value has not changed, as the raw MAIN field editor does.
 */
export function patchOriginalSaveView(bytes:Uint8Array,view:OriginalSaveView):Uint8Array {
  if(!isOriginalSave(bytes))throw Error('Ungültiger Ishar-2-Spielstand.');
  if(!view || ![view.row,view.col,view.facing,view.map,view.scene].every(n=>Number.isInteger(n)&&n>=0&&n<=255) || view.facing<1 || view.facing>4 || view.map===0)throw Error('Ungültige Originalposition.');
  const copy=Uint8Array.from(bytes),words=new DataView(copy.buffer);
  const fields:readonly (readonly [number,number])[]=[[2,view.row],[4,view.col],[6,view.facing],[8,view.map],[18,view.scene]];
  for(const [at,value] of fields) {
    if(copy[at+1]===value)continue;
    words.setInt16(at,value<128?value:value-256,false);
  }
  return copy;
}
