import assert from 'node:assert/strict';
import { createRoomBlock } from '../src/lib/ishar/room-builder.ts';
import { assetCatalogGroup } from '../src/lib/ishar/asset-catalog.ts';
import { normalizeGame, starterGame } from '../src/lib/ishar/project.ts';
import { validateGame } from '../src/lib/ishar/project-validation.ts';
import { canTravel, DIRECTIONS, DIRECTION_VECTORS, locationAt, turnLeft, turnRight } from '../src/lib/ishar/dungeon.ts';
import { roomViewEdges, roomsShareOpenSurface } from '../src/lib/ishar/room-surfaces.ts';
import { createSwampTestArea } from '../src/lib/ishar/swamp-area.ts';
import { projectSwampFeature, swampFeatureForCell, swampGroundFeatureForCell, swampWaterExtent } from '../src/lib/ishar/swamp-view.ts';
import { visibleOutdoorCells } from '../src/lib/ishar/outdoor-view.ts';

const starter=starterGame();
const anchor=starter.locations.find((location)=>location.id==='gate');
assert.ok(anchor);
// Move a copy of the starter anchor to vacant coordinates; preserve its external exit.
const game={...starter,locations:starter.locations.map((location)=>location.id===anchor.id
  ? {...location,x:10,y:10,exits:[]}
  : location.id==='vestibule' ? {...location,exits:location.exits.filter((id)=>id!==anchor.id)} : location)};
const result=createRoomBlock(game,'gate',3,2);
assert.equal(result.ok,true);
if(!result.ok) throw Error(result.error);
assert.equal(result.createdIds.length,5);
const group=result.game.locations.filter((location)=>location.roomGroupId===result.game.locations.find((location)=>location.id==='gate')?.roomGroupId);
assert.equal(group.length,6);
for(const location of group){
  assert.equal(location.sceneKind,'room');
  for(const other of group){
    const adjacent=Math.abs(location.x-other.x)+Math.abs(location.y-other.y)===1;
    assert.equal(location.exits.includes(other.id),adjacent,`${location.id} ↔ ${other.id}`);
  }
}
assert.deepEqual(validateGame(result.game),[]);
const blocked=createRoomBlock(starter,'crossing',2,2);
assert.equal(blocked.ok,false);
assert.equal(starter.locations.length,7,'collision must leave the input untouched');

// A 4×4 room is a single open area: interior grid seams must not acquire
// front or side walls when viewed from any cell or cardinal direction.
const squareSeed={...starter,locations:starter.locations.map((location)=>location.id===anchor.id
  ? {...location,x:20,y:20,exits:[]}
  : location.id==='vestibule' ? {...location,exits:location.exits.filter((id)=>id!==anchor.id)} : location)};
const square=createRoomBlock(squareSeed,'gate',4,4);
assert.equal(square.ok,true);
if(!square.ok) throw Error(square.error);
const squareCells=square.game.locations.filter((location)=>location.roomGroupId===square.game.locations.find((location)=>location.id==='gate')?.roomGroupId);
assert.equal(squareCells.length,16);
assert.deepEqual(validateGame(square.game),[]);
for(const cell of squareCells) for(const facing of DIRECTIONS){
  const edges=roomViewEdges(square.game.locations,cell,facing);
  const leftVector=DIRECTION_VECTORS[turnLeft(facing)];
  const rightVector=DIRECTION_VECTORS[turnRight(facing)];
  const facingVector=DIRECTION_VECTORS[facing];
  const inside=(x,y)=>x>=20&&x<24&&y>=20&&y<24;
  const leftInside=inside(cell.x+leftVector.x,cell.y+leftVector.y);
  const rightInside=inside(cell.x+rightVector.x,cell.y+rightVector.y);
  const farEdge=!inside(cell.x+facingVector.x,cell.y+facingVector.y);
  const sideDistance=(vector)=>{let offset=0;while(inside(cell.x+(offset+1)*vector.x,cell.y+(offset+1)*vector.y)) offset++;return offset;};
  const leftDistance=sideDistance(leftVector),rightDistance=sideDistance(rightVector);
  assert.equal(edges.leftInterior,leftInside,`${cell.x},${cell.y} ${facing}: left seam`);
  assert.equal(edges.rightInterior,rightInside,`${cell.x},${cell.y} ${facing}: right seam`);
  assert.equal(edges.leftPerimeterOffset,leftDistance,`${cell.x},${cell.y} ${facing}: left perimeter`);
  assert.equal(edges.rightPerimeterOffset,rightDistance,`${cell.x},${cell.y} ${facing}: right perimeter`);
  assert.deepEqual(edges.leftFrontWalls,farEdge ? Array.from({length:leftDistance},(_,i)=>i+1) : [],`${cell.x},${cell.y} ${facing}: left back wall`);
  assert.deepEqual(edges.rightFrontWalls,farEdge ? Array.from({length:rightDistance},(_,i)=>i+1) : [],`${cell.x},${cell.y} ${facing}: right back wall`);
}
// Older maps assembled room-by-room have no roomGroupId. Reciprocal room
// connections still form an open floor instead of four miniature corridors.
const legacyOpenSquare=square.game.locations.map((location)=>location.roomGroupId
  ? {...location,roomGroupId:undefined} : location);
for(const cell of legacyOpenSquare.filter((location)=>location.sceneKind==='room' && location.x>=20 && location.x<24 && location.y>=20 && location.y<24)){
  const edges=roomViewEdges(legacyOpenSquare,cell,'north');
  assert.equal(edges.leftInterior,cell.x>20);
  assert.equal(edges.rightInterior,cell.x<23);
  assert.deepEqual(edges.leftFrontWalls,cell.y===20 ? Array.from({length:cell.x-20},(_,i)=>i+1) : []);
  assert.deepEqual(edges.rightFrontWalls,cell.y===20 ? Array.from({length:23-cell.x},(_,i)=>i+1) : []);
}
assert.equal(roomViewEdges(starter.locations,starter.locations[0],'north').leftInterior,false,'corridors remain corridors');
const legacySquare=createRoomBlock(squareSeed,'gate',2,2);
assert.equal(legacySquare.ok,true);
if(!legacySquare.ok) throw Error(legacySquare.error);
const legacyCells=legacySquare.game.locations.map((location)=>location.roomGroupId
  ? {...location,roomGroupId:undefined} : location);
const legacyNear=legacyCells.find((location)=>location.id==='gate');
const legacyFar=legacyCells.find((location)=>location.x===21&&location.y===20&&location.levelId==='level-1');
assert.ok(legacyNear&&legacyFar);
assert.equal(canTravel(legacyCells,legacyNear,'east')?.id,legacyFar.id);
assert.equal(roomViewEdges(legacyCells,legacyNear,'east').rightInterior,true,'near cell has an open lateral neighbor');
assert.deepEqual(roomViewEdges(legacyCells,legacyNear,'east').rightFrontWalls,[],'free cell ahead has no front wall');
assert.deepEqual(roomViewEdges(legacyCells,legacyFar,'east').rightFrontWalls,[1],'both far cells end at one continuous back wall');
const separatelyGrouped=legacyCells.map((location)=>location.sceneKind==='room'&&location.x>=20&&location.x<22&&location.y>=20&&location.y<22
  ? {...location,roomGroupId:`individual-${location.id}`} : location);
const separateNear=separatelyGrouped.find((location)=>location.id==='gate');
const separateFar=separatelyGrouped.find((location)=>location.x===21&&location.y===20&&location.levelId==='level-1');
assert.ok(separateNear&&separateFar);
assert.equal(roomsShareOpenSurface(separateNear,separateFar,[]),true,'different authoring groups do not create an interior wall');
assert.equal(roomViewEdges(separatelyGrouped,separateNear,'east').rightInterior,true,'right neighbor stays open across group ids');
assert.deepEqual(roomViewEdges(separatelyGrouped,separateFar,'east').rightFrontWalls,[1],'back wall continues across group ids');
const interiorDoor={id:'interior-door',fromLocationId:separateNear.id,toLocationId:separateFar.id,initiallyOpen:false};
assert.equal(roomsShareOpenSurface(separateNear,separateFar,[interiorDoor]),false,'an authored door remains a room boundary');

const migrated=normalizeGame({...starter,levels:undefined,portals:undefined});
assert.equal(migrated.levels[0].id,'level-1');
assert.equal(migrated.locations[0].levelId,'level-1');
const second={...starter,levels:[...starter.levels,{id:'level-2',name:'House',kind:'house',tilesetId:'ishar2-dj2'}],
  locations:[...starter.locations,{id:'house-entry',name:'House entry',description:'',x:0,y:3,levelId:'level-2',exits:[],itemIds:[],sceneKind:'room'}],
  portals:[{id:'stairs',fromLocationId:'gate',toLocationId:'house-entry',label:'Stairs'}]};
assert.deepEqual(validateGame(second),[],'two levels may reuse coordinates');
assert.equal(locationAt(second.locations,0,3,'level-2')?.id,'house-entry');
assert.equal(canTravel(second.locations,starter.locations[0],'north')?.id,'vestibule');
assert.ok(validateGame({...second,portals:[{...second.portals[0],toLocationId:'vestibule'}]}).some((problem)=>problem.path==='portal.stairs'));
assert.ok(validateGame({...second,locations:second.locations.map((location)=>location.id==='gate'?{...location,exits:[...location.exits,'house-entry']}:location)}).some((problem)=>problem.path==='location.gate.exits'));

const swamp=createSwampTestArea(starter,'gate');
assert.ok(swamp);
assert.equal(starter.levels.length,1,'preset must leave the source project untouched');
assert.equal(swamp.game.levels.find((level)=>level.id===swamp.levelId)?.biome,'swamp');
const swampCells=swamp.game.locations.filter((cell)=>cell.levelId===swamp.levelId);
assert.equal(swampCells.length,25);
assert.equal(swampCells.filter((cell)=>cell.outdoorSurface==='water').length,2,'preset contains bounded water instead of a water floor');
assert.deepEqual(validateGame(swamp.game),[]);
const entrance=swampCells.find((cell)=>cell.id===swamp.entranceId);
assert.ok(entrance);
assert.ok(canTravel(swamp.game.locations,entrance,'north'),'vegetation does not block travel');
assert.ok(canTravel(swamp.game.locations,entrance,'east'),'all four cardinal links are authored where cells exist');
const bank=swampCells.find((cell)=>cell.x===0 && cell.y===3);
const water=swampCells.find((cell)=>cell.x===0 && cell.y===2);
assert.ok(bank && water);
assert.equal(canTravel(swamp.game.locations,bank,'north'),undefined,'water blocks movement');
assert.equal(bank.exits.includes(water.id),false,'preset omits the reciprocal water connection');
assert.ok(validateGame({...swamp.game,startLocationId:water.id}).some((problem)=>problem.path==='game.startLocationId'),'water cannot be the start field');
assert.ok(validateGame({...swamp.game,locations:swamp.game.locations.map((cell)=>cell.id===bank.id ? {...cell,exits:[...cell.exits,water.id]} : cell)}).some((problem)=>problem.message.includes('Wasserfeld')),'authored exits into water are rejected');
assert.equal(swamp.game.portals.at(-1)?.toLocationId,entrance.id);
const seen=visibleOutdoorCells(swamp.game.locations,entrance,'north');
assert.ok(seen.some(({location,depth,lateral})=>location.x===2&&location.y===1&&depth===3&&lateral===0));
assert.ok(seen.some(({location,depth,lateral})=>location.x===4&&location.y===3&&depth===1&&lateral===2));
assert.equal(visibleOutdoorCells(swamp.game.locations,entrance,'south').every(({location})=>location.levelId===swamp.levelId),true);
const treeCell=swampCells.find((cell)=>cell.x===0&&cell.y===3);
const westBank=swampCells.find((cell)=>cell.x===0&&cell.y===4);
const eastBank=swampCells.find((cell)=>cell.x===1&&cell.y===4);
assert.ok(treeCell && westBank && eastBank);
const tree=swampFeatureForCell(treeCell);
assert.equal(tree?.kind,'tree','a world cell owns a stable tree regardless of facing');
const seenNorth=projectSwampFeature(tree,westBank,'north');
const seenWest=projectSwampFeature(tree,westBank,'west');
const seenFromEast=projectSwampFeature(tree,eastBank,'north');
assert.ok(seenNorth && seenWest && seenFromEast);
assert.ok(seenWest.center>seenNorth.center,'turning west projects the same tree to the right');
assert.ok(seenFromEast.center<seenNorth.center,'moving east shifts the same tree left');
assert.equal(seenWest.distanceBand,seenNorth.distanceBand,'turning does not change a tree distance variant');
assert.equal(seenWest.radialDistance,seenNorth.radialDistance,'turning preserves world-space distance');
const ground=swampGroundFeatureForCell(treeCell);
assert.ok(ground && ground.cellId===`${treeCell.id}-ground`);
assert.equal(swampGroundFeatureForCell(treeCell)?.worldX,ground.worldX,'low vegetation stays at one world point');
assert.equal(projectSwampFeature(ground,westBank,'north')?.distanceBand,projectSwampFeature(ground,westBank,'west')?.distanceBand,'turning preserves low vegetation size');
const besideTree=projectSwampFeature(tree,treeCell,'north');
assert.ok(besideTree && besideTree.center<0,'entering the tree cell keeps its root visible at the side');
assert.equal(swampFeatureForCell(treeCell)?.worldX,tree.worldX,'tree anchor stays fixed across render passes');
assert.equal(swampFeatureForCell(water),undefined,'water does not spawn a tree');
assert.equal(swampGroundFeatureForCell(water),undefined,'water does not spawn low vegetation');
const frontWater=swampWaterExtent(1,0);
assert.ok(frontWater.x<0 && frontWater.x+frontWater.width>640,'water ahead reaches both viewport edges');
const sideWater=swampWaterExtent(2,2);
assert.ok(sideWater.x+sideWater.width>640,'side water reaches the right viewport edge');

assert.equal(assetCatalogGroup('Ishar2/VHOUSE1.IO · ALIS #0'),'houses');
assert.equal(assetCatalogGroup('[COMPOSITE] Ishar2/VHOUSE2.IO · ALIS #44'),'houses');
assert.equal(assetCatalogGroup('Ishar2/FRISE.IO · ALIS #35'),'ui');
assert.equal(assetCatalogGroup('Ishar2/MAIN.IO · ALIS #50'),'font');
assert.equal(assetCatalogGroup('Ishar2/DJFONT.IO · ALIS #0'),'dungeon');
console.log('Room block topology and catalog groups passed');
