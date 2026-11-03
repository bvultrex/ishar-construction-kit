import { DIRECTION_VECTORS, DIRECTIONS, locationAt } from "./dungeon.ts";
import type { AuthoredGame, AuthoredLocation } from "./types";

/** Adds an authored outdoor test grid without changing existing locations. */
export function createSwampTestArea(game: AuthoredGame, portalFromId: string) {
  const portalFrom=game.locations.find((location)=>location.id===portalFromId);
  if(!portalFrom) return undefined;
  let number=game.levels.length+1;
  while(game.levels.some((level)=>level.id===`level-${number}`)) number++;
  const levelId=`level-${number}`;
  const size=5;
  const cells:AuthoredLocation[]=[];
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) cells.push({
    id:`${levelId}-swamp-${x}-${y}`,
    name:x===2 && y===4 ? "Sumpf-Eingang" : `Sumpf ${x+1},${y+1}`,
    description:"Offenes Sumpfgelände; Bewuchs behindert die Sicht, Wasser sperrt den Weg.",
    x,y,levelId,exits:[],itemIds:[],sceneKind:"outdoor",
    outdoorSurface:y===2 && (x===0 || x===4) ? "water" : "grass",
  });
  for(const cell of cells) cell.exits=DIRECTIONS.flatMap((direction)=>{
    const vector=DIRECTION_VECTORS[direction];
    const neighbor=locationAt(cells,cell.x+vector.x,cell.y+vector.y,levelId);
    return neighbor && cell.outdoorSurface!=="water" && neighbor.outdoorSurface!=="water" ? [neighbor.id] : [];
  });
  const entranceId=`${levelId}-swamp-2-4`;
  return {
    game:{
      ...game,
      levels:[...game.levels,{id:levelId,name:"Sumpf-Testgebiet",kind:"outdoor" as const,biome:"swamp" as const}],
      locations:[...game.locations,...cells],
      portals:[...game.portals,{id:`portal-${levelId}`,fromLocationId:portalFrom.id,toLocationId:entranceId,label:"Zum Sumpf"}],
    },
    levelId,entranceId,
  };
}
