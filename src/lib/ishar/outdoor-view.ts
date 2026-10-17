import { DIRECTION_VECTORS, locationAt, turnRight } from "./dungeon.ts";
import type { AuthoredLocation, Direction } from "./types";

export interface OutdoorVisibleCell {
  location: AuthoredLocation;
  depth: number;
  lateral: number;
}

/** Visual sampling only: vegetation does not alter the movement graph. */
export function visibleOutdoorCells(locations:AuthoredLocation[],origin:AuthoredLocation,facing:Direction):OutdoorVisibleCell[] {
  const forward=DIRECTION_VECTORS[facing];
  const right=DIRECTION_VECTORS[turnRight(facing)];
  const seen:OutdoorVisibleCell[]=[];
  for(let depth=3;depth>=0;depth--) for(let lateral=-2;lateral<=2;lateral++) {
    const cell=locationAt(locations,origin.x+forward.x*depth+right.x*lateral,origin.y+forward.y*depth+right.y*lateral,origin.levelId||"level-1");
    if(cell?.sceneKind==="outdoor") seen.push({location:cell,depth,lateral});
  }
  return seen;
}
