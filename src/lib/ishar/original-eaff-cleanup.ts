import type {DosAlisEntities} from './original-alis-entities.ts';
/** Ishar 2 EAFF 0x3a..0x60: snapshot clistent, remove class 35 only.
 * Structural effect only; caller must perform killent audio/render/heap effects.
 * No entity may be spawned concurrently while this synchronous pass runs. */
export function originalEaffStructuralCleanup(entities:DosAlisEntities,current:number):number[]{
 entities.snapshot(current);
 // clistent excludes root but includes its caller, unlike cfindtyp/cfindcla.
 const handles=entities.ordered().slice(1).map(entity=>entity.handle),removed:number[]=[];
 for(const handle of handles){
  if(entities.readByte(handle,12)!==35)continue;
  // EAFF itself is not an actor. Reject unsupported self-stop before any deletion.
  if(handle===current)throw Error('EAFF cleanup caller cannot be class 35');
 }
 for(const handle of handles)if(entities.readByte(handle,12)===35){entities.removeStructure(handle,current);removed.push(handle);}
 return removed;
}
