import assert from 'node:assert/strict';
import { createRoomBlock } from '../src/lib/ishar/room-builder.ts';
import { assetCatalogGroup } from '../src/lib/ishar/asset-catalog.ts';
import { normalizeGame, starterGame } from '../src/lib/ishar/project.ts';
import { validateGame } from '../src/lib/ishar/project-validation.ts';
import { canTravel, locationAt } from '../src/lib/ishar/dungeon.ts';

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

assert.equal(assetCatalogGroup('Ishar2/VHOUSE1.IO · ALIS #0'),'houses');
assert.equal(assetCatalogGroup('[COMPOSITE] Ishar2/VHOUSE2.IO · ALIS #44'),'houses');
assert.equal(assetCatalogGroup('Ishar2/FRISE.IO · ALIS #35'),'ui');
assert.equal(assetCatalogGroup('Ishar2/MAIN.IO · ALIS #50'),'font');
assert.equal(assetCatalogGroup('Ishar2/DJFONT.IO · ALIS #0'),'dungeon');
console.log('Room block topology and catalog groups passed');
