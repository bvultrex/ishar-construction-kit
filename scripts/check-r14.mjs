import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { addGridLevel, canStep, cellA, cellB, cellWalkable, expandGridLevels, gridStep, importCont, validateGridLevel } from '../src/lib/ishar/cont-grid.ts';
import { outdoorView } from '../src/lib/ishar/outdoor-grid-view.ts';
import { sceneTypeAt } from '../src/lib/ishar/grid-view.ts';
import { emptyProject } from '../src/lib/ishar/project.ts';

const make = (map, a, b = Array(a.length).fill(0)) => ({ game:'ishar2', rows:1, cols:a.length, mapNumber:map,
  layerA:Buffer.from(a).toString('base64'), layerB:Buffer.from(b).toString('base64') });
for (const map of [1,2,3,7]) {
  for (const a of [-21,-20,-19,-18,-5]) {
    const g=make(map,[0,a],[0,-8]);
    assert.deepEqual(canStep(g,0,0,'west',()=>false),{kind:'event',message:17,value:-8});
    assert.equal(canStep(g,0,0,'west',()=>false,false).kind,'wall');
  }
}
const gate=make(2,[0,0],[0,-125]);
assert.equal(cellWalkable(gate,0,1),true,'interaction cell remains in the runtime graph');
assert.equal(canStep(gate,0,0,'west',()=>false).kind,'event');
assert.equal(canStep(gate,0,0,'west',()=>false,false).kind,'open','retreat is not forward movement');
assert.deepEqual(canStep(make(2,[0,0],[0,-126]),0,0,'west',()=>false),{kind:'open',exit:true});
// A nearby trigger beyond a negative wall is not reachable by the scene fallback.
assert.equal(sceneTypeAt(make(2,[0,-3,0],[0,0,-95]),0,0),undefined);
assert.equal(sceneTypeAt(make(2,[0,0,0],[0,0,-95]),0,0),55);
assert.equal(sceneTypeAt(make(2,[0,0,0],[0,0,-95]),0,0,5),5,'live scene state stays sticky');
const game=emptyProject('r14').game;
const firstGame=importCont(new Uint8Array(4860).fill(10),'CONT2.FIC','synthetic');
assert.ok(firstGame.ok); assert.equal(firstGame.grid.game,'ishar1');
assert.deepEqual(outdoorView(firstGame.grid,20,20,'south'),[],'Ishar 1 must not run ARBO');
assert.deepEqual(validateGridLevel({id:'old',name:'old',kind:'dungeon',grid:firstGame.grid},game),[],'archived Ishar-1 levels must not block valid Ishar-2 playtests');
const newMap=addGridLevel(game,make(2,[10,10]),game.locations[0].id,{r:0,c:0});
assert.ok(newMap.ok);
assert.equal(newMap.game.levels.at(-1).tilesetId,'ishar2-out2');
assert.equal(newMap.game.levels.at(-1).kind,'outdoor');
const ghost={...game.locations[0],id:'blocked',levelId:'L',x:0,y:0};
const expanded=expandGridLevels({...game,levels:[{id:'L',name:'L',kind:'outdoor',grid:make(2,[0,-3])}],locations:[ghost]});
assert.ok(!expanded.locations.some(l=>l.id==='blocked'),'blocked authored cells cannot remain as ghost locations');
console.log('r14 synthetic movement, events, scene reachability and runtime graph passed');

// Optional private evidence. No original bytes or research tables are embedded.
const dir=process.env.ISHAR2_DIR, report=process.env.ISHAR_COLLISION_REPORT;
if(dir && report){
  const evidence=JSON.parse(readFileSync(report,'utf8'));
  let blocked=0, edges=0, terrainBlocked=0;
  for(const [map, data] of Object.entries(evidence.maps)){
    const result=importCont(readFileSync(join(dir,`CONT${map}.FIC`)),`CONT${map}.FIC`,'local');
    assert.equal(result.ok,true);const g=result.grid;
    for(const p of data.blocked_in_code_but_open_in_dungeon_reading.cells){
      assert.equal(cellA(g,p.r,p.c),p.A);assert.equal(cellB(g,p.r,p.c),p.B);
      assert.equal(cellWalkable(g,p.r,p.c),false,`CONT${map} ${p.r}/${p.c}`);blocked++;
    }
    for(const p of data.edge_walls_in_dungeon_reading_that_do_not_block.cells){
      const d=['north','east','south','west'].find(d=>{const s=gridStep(d);return p.r+s.dr===p.to[0] && p.c+s.dc===p.to[1];});
      assert.ok(d);
      const step=canStep(g,p.r,p.c,d,()=>false);
      assert.notEqual(step.kind,'door',`CONT${map}: no dungeon door test`);
      // Report counts edges before the separate Jon zero-height rule.
      if(!cellWalkable(g,...p.to)){assert.equal(step.kind,'wall');terrainBlocked++;}
      else assert.ok(step.kind==='open'||step.kind==='event');
      edges++;
    }
  }
  console.log(`Original evidence: ${blocked} blocked cells, ${edges} nonblocking dungeon-edge interpretations (${terrainBlocked} still blocked by terrain) passed`);
}else console.log('Private original-map comparison skipped (set ISHAR2_DIR and ISHAR_COLLISION_REPORT)');
