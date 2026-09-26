import assert from 'node:assert/strict';
import { dungeonSceneAssignments as assign, dungeonSpritePosition as position, wallColumnEdges, DUNGEON_FRAMES } from '../src/lib/ishar/dungeon-scenes.ts';
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
  assert.deepEqual(assign(module,base+16),[],'Door frames are not treated as closed doors');
}
assert.deepEqual(assign('OTHER.IO',47),[]);
assert.deepEqual(position(0,57,96,102),{x:-48,y:-108});
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
