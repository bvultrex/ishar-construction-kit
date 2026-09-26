import type { DungeonAssetDepth, DungeonAssetRole } from "./types";

export const DUNGEON_FRAMES = [
  { l: 0, t: 0, r: 640, b: 400 },
  { l: 72, t: 46, r: 568, b: 354 },
  { l: 148, t: 92, r: 492, b: 308 },
  { l: 210, t: 128, r: 430, b: 272 },
  { l: 254, t: 154, r: 386, b: 246 },
];

// Resource expressions in DJ1: 47+d / 59+d; DJ2: 35+d / 47+d.
// Roles and fitting to the CK camera are a reconstruction, not original layout evidence.
export function dungeonSceneAssignments(sourcePath: string, index: number) {
  const name=sourcePath.replace(/\\/g,"/").split("/").pop()?.toUpperCase();
  const base=name==="DJ1.IO" ? 47 : name==="DJ2.IO" ? 35 : undefined;
  if(base===undefined) return [];
  const side=index-base, front=index-(base+12), doorway=index-(base+16);
  const depth=side>=0 && side<4 ? side : front>=0 && front<4 ? front : doorway>=0 && doorway<4 ? doorway : undefined;
  if(depth===undefined) return [];

  const outer=DUNGEON_FRAMES[depth]!, inner=DUNGEON_FRAMES[depth+1]!;
  const tilesetId=name==="DJ1.IO" ? "ishar2-dj1" : "ishar2-dj2";
  const rect=(role:DungeonAssetRole,x:number,y:number,width:number,height:number,mirror=false)=>
    ({tilesetId,role,depth:depth as DungeonAssetDepth,x,y,width,height,mirror});
  return side>=0 && side<4 ? [
    rect("wall.right",inner.r,outer.t,outer.r-inner.r,outer.b-outer.t),
    rect("wall.left",outer.l,outer.t,inner.l-outer.l,outer.b-outer.t,true),
  ] : [rect(doorway>=0 && doorway<4 ? "door.front.open" : "wall.front",inner.l,inner.t,inner.r-inner.l,inner.b-inner.t)];
}

// ALIS sprites are centered; Z points upwards, Y is scene depth.
export function dungeonSpritePosition(x:number,z:number,width:number,height:number) {
  return {x:x-Math.floor(width/2),y:-z-Math.floor(height/2)};
}

// CK camera adaptation, deliberately not an assertion about the original camera.
export function wallColumnEdges(depth:number,left:boolean,column:number,width:number) {
  const outer=DUNGEON_FRAMES[depth]!, inner=DUNGEON_FRAMES[depth+1]!;
  const fraction=column/width;
  const t=left ? fraction : 1-fraction;
  return {top:(inner.t-outer.t)*t,bottom:outer.b-outer.t+(inner.b-outer.b)*t};
}
