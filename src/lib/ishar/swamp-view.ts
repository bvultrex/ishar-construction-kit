import { DIRECTION_VECTORS, turnRight } from "./dungeon.ts";
import type { AuthoredLocation, Direction } from "./types";

export interface SwampFeature {
  cellId:string;
  kind:"tree"|"plant";
  family:0|1;
  worldX:number;
  worldY:number;
}

// FORET1 #24–30 and #31–37 are distinct near-to-far source families.
// Four samples from each family fit the current four-band CK projection.
const SWAMP_TREE_DISTANCE_ASSETS=[[25,26,28,30],[32,33,35,37]] as const;

export function swampTreeAssetIndex(family:0|1,band:0|1|2|3):number {
  return SWAMP_TREE_DISTANCE_ASSETS[family][band];
}

/** Near FORET1 trunks have no crown bitmap; their cut top belongs above the viewport. */
export function swampTreeDisplayHeight(sourceHeight:number,foot:number,band:0|1|2|3):number {
  const nativeHeight=sourceHeight*400/113;
  return band<=1 ? Math.max(nativeHeight,foot+8) : nativeHeight;
}

/** Stable authored-grid scenery. Camera changes must not choose a new tree. */
export function swampFeatureForCell(cell:AuthoredLocation):SwampFeature|undefined {
  if(cell.sceneKind!=="outdoor" || cell.outdoorSurface==="water") return undefined;
  const hash=Math.abs(cell.x*73+cell.y*139+17);
  const kind=hash%4===0 || hash%7===0 ? "tree" : "plant";
  // A corner tree belongs to one cell but stands on its north-west vertex.
  // This avoids duplicate trees at shared vertices and gives all four adjacent
  // camera cells exactly the same world point and distance variant.
  const cornerTree=kind==="tree" && hash%3!==0 && cell.x>0 && cell.y>0;
  return {
    cellId:cell.id,
    kind,
    family:Math.floor(hash/4)%2 as 0|1,
    worldX:kind==="tree" ? cell.x-(cornerTree ? .5 : 0) : cell.x+(2-hash%5)*.15,
    worldY:kind==="tree" ? cell.y-(cornerTree ? .5 : 0) : cell.y+(Math.floor(hash/5)%5-2)*.15,
  };
}

/** A second, low plant cluster with its own fixed ground position. */
export function swampGroundFeatureForCell(cell:AuthoredLocation):SwampFeature|undefined {
  if(cell.sceneKind!=="outdoor" || cell.outdoorSurface==="water") return undefined;
  const hash=Math.abs(cell.x*101+cell.y*61+29);
  return {
    cellId:`${cell.id}-ground`,
    kind:"plant",
    family:Math.floor(hash/3)%2 as 0|1,
    worldX:cell.x+(hash%5-2)*.17,
    worldY:cell.y+(Math.floor(hash/5)%5-2)*.17,
  };
}

export interface SwampProjection {
  center:number;
  foot:number;
  forwardDistance:number;
  lateralDistance:number;
  radialDistance:number;
  distanceBand:0|1|2|3;
}

/** Perspective projection of one fixed world point into the 640×400 viewport. */
export function projectSwampFeature(feature:SwampFeature,origin:AuthoredLocation,facing:Direction):SwampProjection|undefined {
  const forward=DIRECTION_VECTORS[facing];
  const right=DIRECTION_VECTORS[turnRight(facing)];
  const dx=feature.worldX-origin.x;
  const dy=feature.worldY-origin.y;
  const forwardDistance=dx*forward.x+dy*forward.y;
  const lateralDistance=dx*right.x+dy*right.y;
  const radialDistance=Math.hypot(dx,dy);
  // A tree shared by four cells uses the same close projection when viewed
  // from either side of its vertex. Trees behind the camera remain occluded.
  // Cell ownership must never change its projected position or source size.
  if(feature.kind==="tree" && radialDistance>0 && radialDistance<.8 && forwardDistance>=-.2) {
    const center=320+700*lateralDistance/(Math.max(0,forwardDistance)+.75);
    return {center,foot:400,forwardDistance,lateralDistance,radialDistance,distanceBand:0};
  }
  // The camera may occupy a passable tree cell; keep its trunk in the near view.
  if(feature.kind==="tree" && radialDistance===0) {
    return {center:320,foot:400,forwardDistance,lateralDistance,radialDistance,distanceBand:0};
  }
  if(forwardDistance<-.2 || forwardDistance>3.8) return undefined;
  if(forwardDistance<.35 && Math.abs(lateralDistance)<.5) return undefined;
  // Rotating in place changes forward depth, but never the real distance to
  // this world point. Source distance variants must therefore use the radius.
  const distanceBand:0|1|2|3=radialDistance<1.35 ? 0 : radialDistance<2.5 ? 1 : radialDistance<3.65 ? 2 : 3;
  const center=320+260*lateralDistance/(Math.max(0,forwardDistance)+.75);
  const foot=224+176/(1+.72*Math.max(0,forwardDistance));
  return {center,foot,forwardDistance,lateralDistance,radialDistance,distanceBand};
}

/** Surface extent for a visible water cell; nearby water reaches the viewport edge. */
export function swampWaterExtent(depth:number,lateral:number) {
  const width=[1040,840,640,460][depth] ?? 460;
  const center=320+lateral*([350,215,118,65][depth] ?? 65);
  const top=[224,232,235,238][depth] ?? 238;
  const bottom=[400,372,330,286][depth] ?? 286;
  return {x:center-width/2,width,top,bottom};
}
