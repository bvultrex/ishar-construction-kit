import { DIRECTION_VECTORS, turnRight } from "./dungeon.ts";
import type { AuthoredLocation, Direction } from "./types";

export interface SwampFeature {
  cellId:string;
  kind:"tree"|"plant";
  family:0|1;
  worldX:number;
  worldY:number;
}

/** Stable authored-grid scenery. Camera changes must not choose a new tree. */
export function swampFeatureForCell(cell:AuthoredLocation):SwampFeature|undefined {
  if(cell.sceneKind!=="outdoor" || cell.outdoorSurface==="water") return undefined;
  const hash=Math.abs(cell.x*73+cell.y*139+17);
  return {
    cellId:cell.id,
    kind:hash%4===0 || hash%7===0 ? "tree" : "plant",
    family:Math.floor(hash/4)%2 as 0|1,
    worldX:cell.x+(2-hash%5)*.15,
    worldY:cell.y+(Math.floor(hash/5)%5-2)*.15,
  };
}

export interface SwampProjection {
  center:number;
  foot:number;
  forwardDistance:number;
  lateralDistance:number;
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
  if(forwardDistance<-.2 || forwardDistance>3.8) return undefined;
  // A tree rooted near a walkable tile's corner remains at the side when the
  // player enters that tile; it must not vanish at depth zero.
  if(feature.kind==="tree" && feature.cellId===origin.id && Math.abs(lateralDistance)>=.1) {
    return {center:lateralDistance<0 ? -130 : 770,foot:400,forwardDistance:0,lateralDistance,distanceBand:0};
  }
  if(forwardDistance<.35 && Math.abs(lateralDistance)<.5) return undefined;
  const distanceBand:0|1|2|3=forwardDistance<.75 ? 0 : forwardDistance<1.65 ? 1 : forwardDistance<2.65 ? 2 : 3;
  const center=320+260*lateralDistance/(Math.max(0,forwardDistance)+.75);
  const foot=224+176/(1+.72*Math.max(0,forwardDistance));
  return {center,foot,forwardDistance,lateralDistance,distanceBand};
}

/** Surface extent for a visible water cell; nearby water reaches the viewport edge. */
export function swampWaterExtent(depth:number,lateral:number) {
  const width=[1040,840,640,460][depth] ?? 460;
  const center=320+lateral*([350,215,118,65][depth] ?? 65);
  const top=[224,232,235,238][depth] ?? 238;
  const bottom=[400,372,330,286][depth] ?? 286;
  return {x:center-width/2,width,top,bottom};
}
