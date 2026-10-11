/** Ishar 2 DOS v2: file offsets from IO.IO's sequential save loader.
 * These are file offsets, not the similarly named ALIS memory addresses.
 * MAIN.IO 0x00a7d initializes the actor upper bound to 110; EAFF starts at 50.
 * These are candidates: sprite dispatch and occlusion remain separate. */
export interface SaveActor {
  id: number; row: number; col: number; facing: number;
  hp: number; type: number; scene: number;
}
export interface ActorSave {
  row: number; col: number; facing: number; map: number; scene: number;
  actors: SaveActor[];
}
export function readActorSave(bytes: Uint8Array): ActorSave | null {
  if(bytes.length!==8359) return null;
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const word=(offset:number)=>view.getUint16(offset,false);
  if(word(0)!==2) return null;
  const actors:SaveActor[]=[];
  for(let id=50;id<110;id++) actors.push({id,
    row:word(2601+id*2),col:word(2821+id*2),facing:word(3041+id*2),
    // EAFF 0x00664 dispatches MAIN 0x3d2e, saved at 4911 (memory != file offset).
    hp:view.getInt16(3261+id*2,false),type:bytes[4911+id]!,scene:bytes[6781+id]!,
  });
  return {row:word(2),col:word(4),facing:word(6),map:word(8),scene:word(18),actors};
}
/** EAFF's geometric and scene gate only. Occlusion, map-specific height,
 * spawn exceptions and animation remain separate. */
export function actorViewCandidate(save:ActorSave,actor:SaveActor) {
  if(actor.hp<=0 || actor.scene!==save.scene) return null;
  const dr=actor.row-save.row,dc=actor.col-save.col;
  const relative:Record<number,[number,number]>={1:[-dc,dr],2:[dr,dc],3:[dc,-dr],4:[-dr,-dc]};
  const pair=relative[save.facing];
  if(!pair) return null;
  const [distance,lateral]=pair;
  if(distance<0 || distance>=6 || Math.abs(lateral)>distance) return null;
  if(save.map!==1 && actor.facing!==save.facing) return null;
  return {distance,lateral,placementKey:(distance+(save.map===1 ? 0 : 1))*99};
}
