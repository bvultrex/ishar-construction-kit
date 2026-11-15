import type {ActorFrame} from './original-actor-frame.ts';
import type {DosAlisEntities} from './original-alis-entities.ts';
/** Explicit EAFF class-35 visual binding. Never derive live handle from SAV id.
 * Caller has already run EAFF's placement and supplied an active frame. */
export function applyOriginalActorEntityFrame(entities:DosAlisEntities,handle:number,frame:ActorFrame){
 if(entities.readByte(handle,12)!==35||entities.readByte(handle,13)!==frame.actorId)throw Error('Actor frame/live entity binding mismatch');
 if(![frame.x,frame.z,frame.y].every(n=>Number.isInteger(n)&&n>=-32768&&n<=32767)||typeof frame.mirror!=='boolean'||(frame.form!==undefined&&(!Number.isInteger(frame.form)||frame.form<0||frame.form>32767)))throw Error('Invalid original actor entity frame');
 entities.writeWord(handle,0,frame.x);entities.writeWord(handle,2,frame.z);entities.writeWord(handle,4,frame.y);entities.setMirror(handle,frame.mirror);entities.setForm(handle,frame.form??-1);
}
