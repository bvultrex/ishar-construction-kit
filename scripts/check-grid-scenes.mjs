// Grid -> scene regressions for test:scenes (synthetic data only).
import assert from 'node:assert/strict';
import { expandGridLevels, syntheticTestGrid, addGridLevel, gridLocationId, EDGE_ELEMENT_SIDE } from '../src/lib/ishar/cont-grid.ts';
import { doorLeafKind } from '../src/lib/ishar/dungeon-scenes.ts';
import { roomViewEdges } from '../src/lib/ishar/room-surfaces.ts';
import { starterGame } from '../src/lib/ishar/project.ts';
import { canTravel, doorBetween } from '../src/lib/ishar/dungeon.ts';
const added=addGridLevel(starterGame(),syntheticTestGrid(),'gate',{r:9,c:2});
const g=expandGridLevels(added.game), L=added.levelId, at=(r,c)=>g.locations.find((x)=>x.id===gridLocationId(L,r,c));
// Edge doors resolve to the PCAVE leaf by original door number parity.
assert.equal(doorLeafKind(doorBetween(g.doors,at(1,2),at(0,2)).originalIndex,'ishar2-dj1'),'wood');
assert.equal(doorLeafKind(doorBetween(g.doors,at(6,8),at(6,9)).originalIndex,'ishar2-dj1'),'grate');
// Cells inherit the DJ1 tileset by default (scene regions undecoded) and drive the native view.
assert.equal(at(5,2).tilesetId,'ishar2-dj1');
// Room view: pillar at (6,11) ends lateral scans; room interior open elsewhere.
const r=roomViewEdges(g.locations,at(8,10),'north',g.doors);
assert.equal(r.leftInterior,true); assert.equal(r.rightInterior,true);
assert.equal(canTravel(g.locations,at(7,11),'north'),undefined,'pillar blocks view/movement');
// Only one side table exists and it covers elements 1..8.
assert.deepEqual(Object.keys(EDGE_ELEMENT_SIDE).map(Number),[1,2,3,4,5,6,7,8]);
console.log('Grid scene expansion passed');
