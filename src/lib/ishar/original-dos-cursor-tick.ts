import {readOriginalDosInputSnapshot} from './original-dos-input-snapshot.ts';
import {saveOriginalDosCursor} from './original-dos-cursor-save.ts';
import {restoreOriginalDosCursor} from './original-dos-cursor-restore.ts';
import {drawOriginalDosCursor} from './original-dos-cursor-draw.ts';

export interface OriginalDosCursorState {
  screen: Uint8Array; backup: Uint8Array; x: number; y: number;
  mode: number; hidden: number; guard: number;
}
/** Native 670D composition, normalized engine-DS backup and 320-byte stride.
 * No interrupt scheduling, host mouse, invalid-coordinate or segment-wrap emulation.
 */
export function stepOriginalDosCursor(state: OriginalDosCursorState, sprite: Uint8Array, input: {blocked:number;rawX:number;rawY:number;rawState:number}) {
  if (![state.mode,state.hidden,state.guard].every(v=>Number.isInteger(v)&&v>=0&&v<=255)||state.screen.length!==65536||state.backup.length!==262) throw new Error('Invalid native cursor state');
  const next={...state,screen:Uint8Array.from(state.screen),backup:Uint8Array.from(state.backup)};
  // ADD guard,1 followed eventually by SUB guard,1 preserves its final value.
  if (state.mode===0 || state.hidden>=128 || state.guard!==255) return {state:next,moved:false};
  const snapshot=readOriginalDosInputSnapshot(input.blocked,state.mode,input.rawX,input.rawY,input.rawState);
  if(snapshot.ax===state.x&&snapshot.bx===state.y)return {state:next,moved:false};
  const header=new DataView(next.backup.buffer),width=header.getUint16(2,true),rows=header.getUint16(4,true);
  next.screen=restoreOriginalDosCursor(next.screen,next.backup.slice(6,6+width*rows),header.getUint16(0,true),width,rows,320);
  next.x=snapshot.ax;next.y=snapshot.bx;
  next.backup.set(saveOriginalDosCursor(next.screen,next.x,next.y,320,0));
  next.screen=drawOriginalDosCursor(next.screen,sprite,next.x,next.y,320,0);
  return {state:next,moved:true};
}
