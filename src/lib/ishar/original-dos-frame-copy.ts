import {restoreOriginalDosCursor} from './original-dos-cursor-restore.ts';
/** Captured graphics entry1E97:0028 ->0C9B ->109F.
 * 4000 word copies then opaque saved-rectangle restore into destination.
 * DF0, disjoint segments, non-wrapping windows; later code patching unproven.
 */
export function copyOriginalDosFrame(source:Uint8Array,destination:Uint8Array,sourceOffset:number,destinationOffset:number,payload:Uint8Array,rectangleOffset:number,width:number,rows:number,stride:number){
 if(source.length!==65536||destination.length!==65536||![sourceOffset,destinationOffset].every(v=>Number.isInteger(v)&&v>=0&&v+8000<=65536))throw Error('Native frame copy outside supported 8000-byte window');
 const memory=destination.slice();memory.set(source.subarray(sourceOffset,sourceOffset+8000),destinationOffset);
 return restoreOriginalDosCursor(memory,payload,rectangleOffset,width,rows,stride);
}
