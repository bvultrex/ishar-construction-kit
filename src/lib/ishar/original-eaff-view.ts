/** Ishar 2 EAFF geometry 0x60..0x2da and facing helper 0xba5..0xc87.
 * Does not test map occlusion, terrain height, dispatch or allocate entities. */
export interface EaffViewInput {row:number;col:number;facing:number;map:number;scene:number}
export interface EaffActorInput {row:number;col:number;facing:number;scene:number;hp:number}
const byte=(n:number)=>((n&255)^128)-128;
const word=(n:number)=>((n&65535)^32768)-32768;
export function originalEaffViewGate(view:EaffViewInput,actor:EaffActorInput):{distance:number;lateral:number;placementKey:number;facing:number;facingWrite:boolean}|null{
 if(![view.row,view.col,view.facing,view.map,view.scene,actor.row,actor.col,actor.facing,actor.scene,actor.hp].every(Number.isInteger))throw Error('Invalid EAFF view input');
 if(byte(actor.scene)!==byte(view.scene)||word(actor.hp)<=0)return null;
 const dx=byte(word(actor.row)-byte(view.row)),dy=byte(word(actor.col)-byte(view.col));
 let forward:number,lateral:number;
 switch(byte(view.facing)){
  case 1:forward=dy;lateral=dx;break;
  case 2:forward=dx;lateral=dy;break;
  case 3:forward=dy;lateral=dx;break;
  case 4:forward=dx;lateral=dy;break;
  default:return null;
 }
 if((view.facing===1||view.facing===4)?forward>0:forward<0)return null;
 const distance=Math.abs(forward);if(distance>=6||Math.abs(lateral)>distance)return null;
 // This helper runs BEFORE the later facing gate. It writes orientation even
 // when later terrain/occlusion rejects the actor. Caller owns that MAIN write.
 let facing=word(actor.facing),facingWrite=false;
 if(byte(view.map)!==1&&(dx!==0||dy!==0)){
  facingWrite=true;
  if(dx>0&&Math.abs(dy)<Math.abs(dx))facing=2;
  else if(dx<0&&Math.abs(dy)<Math.abs(dx))facing=4;
  else if(dy>0&&Math.abs(dy)>Math.abs(dx))facing=3;
  else if(dy<0&&Math.abs(dy)>Math.abs(dx))facing=1;
  else facing=byte(view.facing);
 }
 // Map-dependent facing check belongs to 0x2db onward; this gate deliberately
 // returns candidates first, including their ordered orientation-write intent.
 return {distance,lateral:(view.facing===3||view.facing===4)?byte(-lateral):lateral,placementKey:distance*99,facing,facingWrite};
}
