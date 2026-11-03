import {restoreOriginalDosCursor} from './original-dos-cursor-restore.ts';
import {runOriginalDosIdleFrame} from './original-dos-frame-idle.ts';
/** Captured graphics entry1E97:0028 ->0C9B ->109F.
 * 4000 word copies then opaque saved-rectangle restore into destination.
 * DF0, disjoint segments, non-wrapping windows; later code patching unproven.
 */
export function copyOriginalDosFrame(source:Uint8Array,destination:Uint8Array,sourceOffset:number,destinationOffset:number,payload:Uint8Array,rectangleOffset:number,width:number,rows:number,stride:number){
 if(source.length!==65536||destination.length!==65536||![sourceOffset,destinationOffset].every(v=>Number.isInteger(v)&&v>=0&&v+8000<=65536))throw Error('Native frame copy outside supported 8000-byte window');
 const memory=destination.slice();memory.set(source.subarray(sourceOffset,sourceOffset+8000),destinationOffset);
 return restoreOriginalDosCursor(memory,payload,rectangleOffset,width,rows,stride);
}
/** Frame caller3D3C plus captured graphics callback; remaining render work
 * follows the explicit idle-frame contract. Copy occurs BEFORE timer wait.
 */
export function runOriginalDosFrameCopyService(globals:Uint8Array,source:Uint8Array,destination:Uint8Array,payload:Uint8Array,keyboardByte:number){
 if(globals.length!==65536)throw Error('Expected full native globals segment');
 const memory=globals.slice(),w=(at:number)=>memory[at]|(memory[at+1]<<8);
 let target=destination.slice(),copied=false;
 if(memory[0xc4a]!==0&&memory[0x2898]!==0){
  const header=w(0xcaa);if(header+6>65536)throw Error('Native rectangle header outside host window');
  target=copyOriginalDosFrame(source,destination,w(0xb84),w(0xb88),payload,w(header),w(header+2),w(header+4),w(0x1dd5));
  memory[0xc4a]=0;copied=true;
 }
 const frame=runOriginalDosIdleFrame(memory,keyboardByte);
 return {...frame,destination:target,copied};
}
