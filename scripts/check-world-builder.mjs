import assert from 'node:assert/strict';
import { createRoomBlock } from '../src/lib/ishar/room-builder.ts';
import { assetCatalogGroup } from '../src/lib/ishar/asset-catalog.ts';
import { starterGame } from '../src/lib/ishar/project.ts';
import { validateGame } from '../src/lib/ishar/project-validation.ts';

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

assert.equal(assetCatalogGroup('Ishar2/VHOUSE1.IO · ALIS #0'),'houses');
assert.equal(assetCatalogGroup('[COMPOSITE] Ishar2/VHOUSE2.IO · ALIS #44'),'houses');
assert.equal(assetCatalogGroup('Ishar2/FRISE.IO · ALIS #35'),'ui');
assert.equal(assetCatalogGroup('Ishar2/MAIN.IO · ALIS #50'),'font');
assert.equal(assetCatalogGroup('Ishar2/DJFONT.IO · ALIS #0'),'dungeon');
console.log('Room block topology and catalog groups passed');
