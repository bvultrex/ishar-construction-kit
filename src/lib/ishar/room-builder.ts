import { locationAt } from "./dungeon.ts";
import type { AuthoredGame, AuthoredLocation } from "./types";

export function createRoomBlock(game:AuthoredGame,anchorId:string,width:number,height:number):
  {ok:true;game:AuthoredGame;createdIds:string[]}|{ok:false;error:string} {
  const anchor=game.locations.find((location)=>location.id===anchorId);
  if(!anchor) return {ok:false,error:"Der ausgewählte Ort existiert nicht."};
  if(anchor.roomGroupId) return {ok:false,error:"Diese Zelle gehört bereits zu einer Raumfläche. Wähle eine freie Einzelzelle als Ecke."};
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2||width>5||height>5)
    return {ok:false,error:"Raumflächen müssen zwischen 2×2 und 5×5 Feldern groß sein."};
  for(let dy=0;dy<height;dy++) for(let dx=0;dx<width;dx++) {
    if(dx===0&&dy===0) continue;
    const occupied=locationAt(game.locations,anchor.x+dx,anchor.y+dy,anchor.levelId || "level-1");
    if(occupied) return {ok:false,error:`Rasterfeld ${anchor.x+dx},${anchor.y+dy} ist bereits durch „${occupied.name}“ belegt.`};
  }
  const usedIds=new Set(game.locations.map((location)=>location.id));
  let roomNumber=1;
  while(game.locations.some((location)=>location.roomGroupId===`room-group-${roomNumber}`)) roomNumber++;
  const roomGroupId=`room-group-${roomNumber}`;
  let nextNumber=game.locations.length+1;
  const createdIds:string[]=[];
  const additions:AuthoredLocation[]=[];
  for(let dy=0;dy<height;dy++) for(let dx=0;dx<width;dx++) {
    if(dx===0&&dy===0) continue;
    let id=`location-${nextNumber++}`;
    while(usedIds.has(id)) id=`location-${nextNumber++}`;
    usedIds.add(id);
    createdIds.push(id);
    additions.push({id,name:`${anchor.name} ${dx+1}/${dy+1}`,description:anchor.description,
      x:anchor.x+dx,y:anchor.y+dy,levelId:anchor.levelId || "level-1",exits:[],itemIds:[],tilesetId:anchor.tilesetId,
      wallAssetId:anchor.wallAssetId,floorAssetId:anchor.floorAssetId,ceilingAssetId:anchor.ceilingAssetId,
      sceneKind:"room",roomGroupId});
  }
  const blockIds=new Set([anchor.id,...createdIds]);
  const all=[...game.locations.map((location)=>location.id===anchor.id ? {...location,sceneKind:"room" as const,roomGroupId} : location),...additions];
  const locations=all.map((location)=>{
    if(!blockIds.has(location.id)) return location;
    const exits=new Set(location.exits);
    for(const other of all) if(blockIds.has(other.id) && Math.abs(other.x-location.x)+Math.abs(other.y-location.y)===1) exits.add(other.id);
    return {...location,exits:[...exits]};
  });
  return {ok:true,game:{...game,locations},createdIds};
}
