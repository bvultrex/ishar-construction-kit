import assert from 'node:assert/strict';
import { dungeonSceneAssignments as assign, dungeonSpritePosition as position, wallColumnEdges, DUNGEON_FRAMES, DUNGEON_NATIVE_Z, DUNGEON_NATIVE_FRAMES, usesNativeDungeonProjection } from '../src/lib/ishar/dungeon-scenes.ts';
for(const [module,base] of [['DJ1.IO',47],['DJ2.IO',35]]) {
  for(let depth=0;depth<4;depth++) {
    const sides=assign('game/'+module,base+depth);
    assert.equal(sides.length,2);
    assert.equal(sides[0].depth,depth);
    assert.equal(sides[0].role,'wall.right');
    assert.equal(sides[1].role,'wall.left');
    assert.equal(sides[1].mirror,true);
    assert.equal(sides[0].x+sides[1].x+sides[0].width,640);
    const [front]=assign(module,base+12+depth);
    assert.equal(front.role,'wall.front');
    assert.equal(front.x+front.width,sides[0].x);
    assert.ok(front.width>0 && front.height>0);
  }
  assert.deepEqual(assign(module,base+4),[],'Unresolved variant is not silently assigned');
  assert.equal(assign(module,base+16)[0].role,'door.front.open','Door frames are open surrounds, not closed leaves');
}
assert.deepEqual(assign('OTHER.IO',47),[]);
for(let depth=0;depth<4;depth++) {
  const openings=assign('DJ1.IO',73+depth);
  assert.deepEqual(openings.map(a=>a.role),['opening.right','opening.left']);
  assert.equal(openings[0].depth,depth);
  assert.equal(openings[1].mirror,true);
}
for(const index of [77,78,114,115,116,117,118,119])
  assert.deepEqual(assign('DJ1.IO',index),[],`DJ1 #${index} is not a verified door leaf`);
for(const index of [77,78,79,80])
  assert.deepEqual(assign('DJ2.IO',index),[],`DJ2 #${index} is stained glass, not a generic door leaf`);
assert.deepEqual(position(0,57,96,102),{x:-47,y:-107});
assert.deepEqual(position(32,20,9,7),{x:28,y:-23});
console.log('Dungeon scene assignment / centered X-Z projection tests passed');

for(let depth=0;depth<4;depth++) {
  const outer=DUNGEON_FRAMES[depth],inner=DUNGEON_FRAMES[depth+1],width=inner.l-outer.l;
  assert.deepEqual(wallColumnEdges(depth,true,0,width),{top:0,bottom:outer.b-outer.t});
  const far=wallColumnEdges(depth,true,width,width);
  assert.equal(far.top+outer.t,inner.t);
  assert.equal(far.bottom+outer.t,inner.b);
  assert.deepEqual(far,wallColumnEdges(depth,false,0,width),'Mirrored walls share the far edge');
}
console.log('Wall transition boundary regressions passed');

const {extractAlisIndexedImages}=await import('../src/lib/ishar/alis-assets.ts');
const fixture=new Uint8Array(70),view=new DataView(fixture.buffer);
view.setUint32(14,32,true);view.setUint32(32,8,true);view.setUint16(36,1,true);
view.setUint32(40,24,true);fixture[64]=1;fixture[65]=37;
view.setUint16(66,2,true);view.setUint16(68,1,true);
const solid=extractAlisIndexedImages(fixture,'synthetic.IO').images[0];
assert.equal(solid.encoding,'solid');assert.equal(solid.width,3);assert.equal(solid.height,2);
assert.deepEqual([...solid.pixels],[37,37,37,37,37,37]);
assert.equal(solid.transparentIndex,undefined,'Solid rectangles are opaque');
assert.equal(extractAlisIndexedImages(fixture.slice(0,69),'truncated.IO').images.length,0);
console.log('ALIS solid rectangle and truncated header tests passed');

assert.deepEqual(DUNGEON_NATIVE_Z,[-42,-25,-12,-7]);
// Metadata-only front-wall joins: top/bottom members must touch exactly.
const project=(x,z,w,h,d)=>{const p=position(x,z,w,h);return {x:127+p.x,y:65-DUNGEON_NATIVE_Z[d]+p.y,w,h};};
const upper=project(0,77,64,28,1),lower=project(0,36,64,53,1);
assert.equal(upper.y,0);assert.equal(upper.y+upper.h,lower.y);assert.equal(lower.y+lower.h,81);
assert.equal(upper.x,lower.x);
assert.equal(project(-38,50,16,81,1).x,82);
assert.equal(project(38,50,16,81,1).x+16,174);
for(const f of DUNGEON_NATIVE_FRAMES) assert.equal(f.t,0,'No invented ceiling wedge above native walls');
assert.equal(usesNativeDungeonProjection(8,'ishar2-dj1'),true,'DJ1 rooms and corridors use the same native camera');
assert.equal(usesNativeDungeonProjection(8,'ishar2-dj2'),true,'DJ2 rooms and corridors use the same native camera');
assert.equal(usesNativeDungeonProjection(3,'ishar2-dj1'),false,'Older packs retain the fallback camera');
assert.equal(usesNativeDungeonProjection(8,'custom'),false,'Custom tilesets retain the authored camera');
console.log('Native script-height and composite seam regressions passed');
