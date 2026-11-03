import type { DungeonAssetDepth, DungeonAssetRole } from "./types";

export const DUNGEON_FRAMES = [
  { l: 0, t: 0, r: 640, b: 400 },
  { l: 72, t: 46, r: 568, b: 354 },
  { l: 148, t: 92, r: 492, b: 308 },
  { l: 210, t: 128, r: 430, b: 272 },
  { l: 254, t: 154, r: 386, b: 246 },
];

// Fallback projection for packs without native Ishar scene coordinates.
export const DUNGEON_ROOM_FRAMES = [
  {l:0,t:0,r:640,b:400},
  {l:30,t:30,r:610,b:370},
  {l:90,t:78,r:550,b:322},
  {l:154,t:118,r:486,b:282},
  {l:213,t:148,r:427,b:252},
];

// Rooms and corridors share the same camera and distance tiers. A room changes
// which walls are drawn, not the position or scale of the source sprites.
export function usesNativeDungeonProjection(sceneLayoutVersion:number|undefined,tilesetId:string|undefined) {
  return (sceneLayoutVersion??0)>=4 && /^ishar2-dj[12]$/.test(tilesetId??"");
}

// Resource expressions in DJ1: 47+d / 59+d; DJ2: 35+d / 47+d.
// Roles and fitting to the CK camera are a reconstruction, not original layout evidence.
export function dungeonSceneAssignments(sourcePath: string, index: number) {
  const name=sourcePath.replace(/\\/g,"/").split("/").pop()?.toUpperCase();
  if(name==="PCAVE.IO") return pcaveDoorAssignments(index);
  const base=name==="DJ1.IO" ? 47 : name==="DJ2.IO" ? 35 : undefined;
  if(base===undefined) return [];
  const tilesetId=name==="DJ1.IO" ? "ishar2-dj1" : "ishar2-dj2";
  const entry=(role:DungeonAssetRole,depth:number,mirror=false)=>({tilesetId,role,depth:depth as DungeonAssetDepth,x:0,y:0,width:0,height:0,mirror});
  // #71/#72 are side reveals of edge walls (DJ1 elements 5-8, lateral ±1,
  // resource #71+(d-2) for script depth d>=2; alis/CONT-FIC.md §2/§5). They are
  // NOT room passages (user-rejected). Registered only; not drawn as openings.
  const revealDepth=name==="DJ1.IO" ? index===71 ? 2 : index===72 ? 3 : undefined : undefined;
  if(revealDepth!==undefined) {
    return [entry("wall.reveal.right",revealDepth),entry("wall.reveal.left",revealDepth,true)];
  }
  if(name==="DJ1.IO" && index>=73 && index<=76) {
    const depth=index-73;
    return [entry("opening.right",depth),entry("opening.left",depth,true)];
  }
  const side=index-base, front=index-(base+12), doorway=index-(base+16);
  const depth=side>=0 && side<4 ? side : front>=0 && front<4 ? front : doorway>=0 && doorway<4 ? doorway : undefined;
  if(depth===undefined) return [];

  const outer=DUNGEON_FRAMES[depth]!, inner=DUNGEON_FRAMES[depth+1]!;
  const rect=(role:DungeonAssetRole,x:number,y:number,width:number,height:number,mirror=false)=>
    ({tilesetId,role,depth:depth as DungeonAssetDepth,x,y,width,height,mirror});
  return side>=0 && side<4 ? [
    rect("wall.right",inner.r,outer.t,outer.r-inner.r,outer.b-outer.t),
    rect("wall.left",outer.l,outer.t,inner.l-outer.l,outer.b-outer.t,true),
  ] : [rect(doorway>=0 && doorway<4 ? "door.front.open" : "wall.front",inner.l,inner.t,inner.r-inner.l,inner.b-inner.t)];
}

// ALIS sprites are centered; Z points upwards, Y is scene depth.
export function dungeonSpritePosition(x:number,z:number,width:number,height:number) {
  return {x:x-Math.floor((width-1)/2),y:-z-Math.floor((height-1)/2)};
}

// CK camera adaptation, deliberately not an assertion about the original camera.
export function wallColumnEdges(depth:number,left:boolean,column:number,width:number) {
  const outer=DUNGEON_FRAMES[depth]!, inner=DUNGEON_FRAMES[depth+1]!;
  const fraction=column/width;
  const t=left ? fraction : 1-fraction;
  return {top:(inner.t-outer.t)*t,bottom:outer.b-outer.t+(inner.b-outer.b)*t};
}

// DJ1 code 0x2270ff, also cross-checked by joins of front composites.
// Screen origin (127,65) is reconstructed from contiguous bitmap boundaries.
export const DUNGEON_NATIVE_Z = [-42,-25,-12,-7];
export const DUNGEON_NATIVE_FRAMES = [
  {l:0,t:0,r:256,b:113},{l:32,t:0,r:224,b:102},
  {l:82,t:0,r:174,b:81},{l:98,t:0,r:158,b:75},{l:106,t:0,r:150,b:71},
].map(f=>({l:f.l*640/256,r:f.r*640/256,t:f.t*400/113,b:f.b*400/113}));

// PCAVE.IO (entity 0x43) draws door leaves in DJ1/DJ2 scenes, only for depth<4
// (alis/CONT-FIC.md §3). Closed: even door number #8+d (wooden planks), odd
// #12+d (grate). Open: #40 / #46; the extracted pack only has depth 0 for these
// (#41-#44 are special-door composites), so open leaves are depth 0 only.
export function pcaveDoorAssignments(index:number) {
  const roles:[DungeonAssetRole,number][]=[];
  if(index>=8&&index<=11) roles.push(["door.leaf.closed.wood",index-8]);
  else if(index>=12&&index<=15) roles.push(["door.leaf.closed.grate",index-12]);
  else if(index===40) roles.push(["door.leaf.open.wood",0]);
  else if(index===46) roles.push(["door.leaf.open.grate",0]);
  return roles.flatMap(([role,depth])=>["ishar2-dj1","ishar2-dj2"].map((tilesetId)=>
    ({tilesetId,role,depth:depth as DungeonAssetDepth,x:0,y:0,width:0,height:0,mirror:false})));
}

/** Leaf choice follows the original door number parity; without one, keep the tileset look. */
export function doorLeafKind(originalIndex:number|undefined,tilesetId:string|undefined):"wood"|"grate" {
  if(Number.isInteger(originalIndex)) return originalIndex!%2===0 ? "wood" : "grate";
  return tilesetId==="ishar2-dj2" ? "grate" : "wood";
}
