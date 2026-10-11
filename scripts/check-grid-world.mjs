// Grid model (plan v3) regressions for test:world. Synthetic bytes only — no original data.
import assert from 'node:assert/strict';
import { addGridLevel, canStep, gridStep, gridCellOf, cellA, cellB, convertLevelToGrid, decomposeCode, edgeSides, expandGridLevels, exportCont, importCont,
  sceneTriggerAt, setGridCell, syntheticTestGrid, trapAt, trapDamage, gridLocationId, gridDoorId, ISHAR2_FILE } from '../src/lib/ishar/cont-grid.ts';
import { normalizeGame, normalizeProject, emptyProject, starterGame } from '../src/lib/ishar/project.ts';
import { validateGame } from '../src/lib/ishar/project-validation.ts';
import { canTravel, doorBetween } from '../src/lib/ishar/dungeon.ts';

// Legacy projects stay byte-identical through normalisation (no grid added).
const legacy=emptyProject('legacy');
const once=normalizeProject(JSON.parse(JSON.stringify(legacy)));
assert.equal(JSON.stringify(normalizeProject(JSON.parse(JSON.stringify(once))).game),JSON.stringify(once.game),'normalisation is idempotent');
assert.ok(!JSON.stringify(once).includes('"grid"'),'level-1 migration adds no grid');
assert.ok(normalizeGame(starterGame()).levels.every((level)=>level.grid===undefined));
assert.equal(expandGridLevels(legacy.game),legacy.game,'no grid level = same object');

// Synthetic CONT file: layer offsets 0 / 5400, signed reading.
const bytes=new Uint8Array(ISHAR2_FILE);
bytes.fill(0xff,0,5400);
bytes[3*60+4]=0x0c; bytes[5400+3*60+4]=0xc0; bytes[5400+2*60+4]=60+7;
const imported=importCont(bytes,'C:/x/CONT6.FIC','abc');
assert.equal(imported.ok,true);
const g=imported.grid;
assert.deepEqual([g.rows,g.cols,g.mapNumber,g.game],[90,60,6,'ishar2']);
assert.equal(cellA(g,0,0),-1); assert.equal(cellA(g,3,4),12); assert.equal(cellB(g,3,4),-64); assert.equal(cellB(g,2,4),67);
assert.equal(cellA(g,-1,0),-1,'outside = wall');
assert.deepEqual(exportCont(g),bytes,'unedited export is byte-identical');
const edited=setGridCell(g,'A',0,0,0x0a);
assert.equal(cellA(edited,0,0),10); assert.equal(exportCont(edited)[0],0x0a); assert.equal(exportCont(g)[0],0xff,'edit returns a copy');
assert.equal(importCont(new Uint8Array(4860),'CONT1.FIC','x').grid.game,'ishar1');
assert.equal(importCont(new Uint8Array(100),'CONT1.FIC','x').ok,false);

// Element decomposition (CONT-FIC §2, known) and the single suspected side table.
assert.deepEqual(decomposeCode(76),[12,1]); assert.deepEqual(decomposeCode(38),[10,8]); assert.deepEqual(decomposeCode(10),[10]); assert.deepEqual(decomposeCode(-1),[-1]);
assert.deepEqual(edgeSides(76),['north']); assert.deepEqual(edgeSides(70),['west']); assert.deepEqual(edgeSides(74),['east']); assert.deepEqual(edgeSides(72),['south']);
assert.deepEqual(edgeSides(44),['north'],'element 5 = side view of the north edge');
for(const code of [70,71,72,73,74,75,76,77,38,39,40,41,42,43,44,45]) {
  const [floor]=decomposeCode(code), sides=edgeSides(code);
  assert.ok(floor===12||floor===13 ? ['north','south'].includes(sides[0]) : ['east','west'].includes(sides[0]),`edge across the corridor axis for ${code}`);
}

// GERDEP-style collision on the synthetic test grid.
const t=syntheticTestGrid();
const shut=()=>false, open=()=>true;
assert.deepEqual(canStep(t,2,2,'west',shut),{kind:'wall'},'full wall cell blocks');
assert.deepEqual(canStep(t,2,2,'north',shut),{kind:'open'},'entering the door cell from the south is free');
assert.deepEqual(canStep(t,1,2,'north',shut),{kind:'door',door:2,closed:true},'closed door on the north edge blocks');
assert.deepEqual(canStep(t,1,2,'north',open),{kind:'door',door:2,closed:false});
assert.deepEqual(canStep(t,0,2,'south',shut),{kind:'door',door:2,closed:true},'door also blocks from the far side');
assert.deepEqual(canStep(t,6,8,'west',shut),{kind:'door',door:3,closed:true},'west = col+1 (r7 orientation)');
assert.deepEqual(gridStep('east'),{dr:0,dc:-1}); assert.deepEqual(gridStep('north'),{dr:-1,dc:0});
assert.deepEqual(gridCellOf(t,{x:t.cols-1-2,y:5}),{r:5,c:2});
assert.deepEqual(canStep({...t,mapNumber:2},1,2,'north',shut),{kind:'open'},'edge/door test only on maps > 4');
assert.deepEqual(canStep(t,5,11,'south',shut),{kind:'wall'},'pillar in the room');

// Traps and scene triggers (DJTRAP / GERDEP, known).
assert.deepEqual(trapAt(t,8,2),{kind:'crusher',code:0xf7});
assert.deepEqual(trapAt(t,4,2),{kind:'wall',code:0xc2,variant:2});
assert.equal(trapAt(t,5,2),undefined);
assert.equal(trapDamage(5,0),8); assert.equal(trapDamage(7,4),36); assert.equal(trapDamage(5,0,20),0); assert.equal(trapDamage(4,4),0);
const trig=setGridCell({...t,mapNumber:3},'B',5,2,-60);
assert.equal(sceneTriggerAt(trig,5,2),20); assert.equal(sceneTriggerAt({...trig,mapNumber:5},5,2),undefined,'-60 is outside the map-5 range');

// Test level: separate level + portal, source untouched, valid, runtime expansion.
const starter=starterGame();
const added=addGridLevel(starter,t,'gate',{r:9,c:2});
assert.equal(added.ok,true);
assert.equal(starter.levels.length,1,'source project untouched');
assert.deepEqual(validateGame(added.game),[]);
const runtime=expandGridLevels(added.game);
const L=added.levelId, at=(r,c)=>runtime.locations.find((x)=>x.id===(r===9&&c===2 ? added.entryId : gridLocationId(L,r,c)));
assert.equal(at(9,2).id,added.entryId,'authored entrance keeps its id');
assert.equal(canTravel(runtime.locations,at(9,2),'north').id,gridLocationId(L,8,2));
assert.equal(canTravel(runtime.locations,at(2,2),'west'),undefined);
const door=doorBetween(runtime.doors,at(1,2),at(0,2));
assert.equal(door.id,gridDoorId(L,2)); assert.equal(door.originalIndex,2); assert.equal(door.initiallyOpen,false);
assert.equal(doorBetween(runtime.doors,at(6,8),at(6,9)).originalIndex,3);
assert.equal(at(4,9).sceneKind,'room'); assert.equal(at(2,2).sceneKind,'corridor');
assert.equal(added.game.locations.filter((x)=>x.levelId===L).length,1,'only the entrance is stored; cells are runtime-only');
assert.ok(validateGame({...added.game,locations:added.game.locations.map((x)=>x.id===added.entryId?{...x,x:0,y:0}:x)}).some((p)=>/nicht begehbaren Zelle/.test(p.message)));

// Convert legacy level as a copy (opt-in): original untouched, doors -> edge code + layer B.
const conv=convertLevelToGrid(starter,'level-1');
assert.equal(conv.ok,true);
assert.equal(JSON.stringify(conv.game.locations.filter((x)=>(x.levelId||'level-1')==='level-1')),JSON.stringify(starter.locations.map((x)=>({...x}))),'legacy cells unchanged');
const cg=conv.game.levels.find((x)=>x.id===conv.levelId).grid;
const np=starter.locations.find((x)=>x.id==='north-passage'), minX=Math.min(...starter.locations.map((x)=>x.x))-1, minY=Math.min(...starter.locations.map((x)=>x.y))-1;
assert.equal(cellA(cg,np.y-minY,cg.cols-1-(np.x-minX)),44,'N-S corridor, door on side-view edge element 5 (12+5, like CONT5 door #48)'); assert.equal(cellB(cg,np.y-minY,cg.cols-1-(np.x-minX)),61);
// every converted CK cell keeps its CK position and links (orientation round trip)
const rt=expandGridLevels(conv.game);
for(const l of starter.locations){ const c=rt.locations.find((x)=>x.levelId===conv.levelId && x.x===l.x-minX && x.y===l.y-minY); assert.ok(c,`cell ${l.id}`);
  for(const n of l.exits.map((id)=>starter.locations.find((x)=>x.id===id))) assert.ok(c.exits.some((id)=>{const m=rt.locations.find((x)=>x.id===id); return m.x===n.x-minX && m.y===n.y-minY;}),`link ${l.id}->${n.id}`); }
assert.deepEqual(validateGame(conv.game),[]);
console.log('Grid model (CONT layers, hybrid walls, edge doors, traps, conversion) passed');

// r11: edge levels render through grid-view (runtime copy). Door looks like the original (arch + PCAVE leaf),
// never a solid front wall; an open door shows the cells behind it; doors on junctions move to the straight side.
{
  const G = await import('../src/lib/ishar/cont-grid.ts');
  const V = await import('../src/lib/ishar/grid-view.ts');
  const built = G.edgeViewGrid(starter, 'level-1'); assert.equal(built.ok, true);
  assert.equal(G.edgeViewGrid(starter, 'level-1'), built, 'cached per game');
  const at = (id) => { const l = starter.locations.find((x) => x.id === id); return [l.y - built.minY, built.grid.cols - 1 - (l.x - built.minX)]; };
  const n = built.doorNumbers['sanctum-seal']; assert.ok(n > 0);
  const [r0, c0] = at('guardhall');
  const shut = V.gridView(built.grid, r0, c0, 'north', 'DJ1', () => false, () => false, { sceneType: 31 });
  assert.ok(shut.sprites.some((s) => s.routine === 'arch'), 'door arch drawn');
  assert.ok(shut.sprites.some((s) => s.module === 'PCAVE.IO' && s.index >= 8 && s.index <= 15), 'closed PCAVE leaf');
  const open = V.gridView(built.grid, r0, c0, 'north', 'DJ1', (k) => k === n, () => false, { sceneType: 31 });
  assert.ok(!open.sprites.some((s) => s.module === 'PCAVE.IO'), 'open door: no leaf');
  assert.ok(open.sprites.some((s) => s.d >= 2), 'open door: cells behind it are drawn');
  // a door on a T-junction cell is hung on the straight neighbour's edge
  const g2 = structuredClone(starter);
  g2.locations.push({ id: 'e1', name: 'O1', description: '', x: 1, y: 3, exits: ['gate', 'e2'], itemIds: [] }, { id: 'e2', name: 'O2', description: '', x: 2, y: 3, exits: ['e1'], itemIds: [] }, { id: 's1', name: 'S', description: '', x: 0, y: 4, exits: ['gate'], itemIds: [] });
  g2.locations.find((l) => l.id === 'gate').exits.push('e1', 's1');
  g2.doors.push({ id: 'gate-door', fromLocationId: 'gate', toLocationId: 'e1', initiallyOpen: true });
  const b2 = G.buildEdgeGrid(g2, 'level-1');
  assert.ok(b2.doorNumbers['gate-door'] > 0, 'junction door placed on neighbour'); assert.ok(!b2.warnings.some((w) => /gate-door/.test(w)));
  const e1 = g2.locations.find((l) => l.id === 'e1');
  assert.equal(G.cellA(b2.grid, e1.y - b2.minY, b2.grid.cols - 1 - (e1.x - b2.minX)), 38, 'E-W corridor, door on west edge (10+8)');
  assert.equal(JSON.stringify(starter.doors.map((d) => d.id)), JSON.stringify(['sanctum-seal']), 'project untouched');
  // r11b: locked door from a junction into a dead-end room (no straight cell on either side) is kept
  const g3 = structuredClone(starter);
  g3.locations.push({ id: 'vault', name: 'Kammer', description: '', x: 1, y: 3, exits: ['gate'], itemIds: [] }, { id: 's1', name: 'S', description: '', x: 0, y: 4, exits: ['gate'], itemIds: [] });
  g3.locations.find((l) => l.id === 'gate').exits.push('vault', 's1');
  g3.doors.push({ id: 'vault-door', fromLocationId: 'gate', toLocationId: 'vault', initiallyOpen: false, keyItemId: 'crypt-rune' });
  const b3 = G.buildEdgeGrid(g3, 'level-1'); const n3 = b3.doorNumbers['vault-door'];
  assert.ok(n3 > 0 && !b3.warnings.some((w) => /vault-door/.test(w)), 'locked junction door kept');
  assert.equal(b3.grid.doorKeys[n3], 'crypt-rune');
  const gt = g3.locations.find((l) => l.id === 'gate'); const gr = gt.y - b3.minY, gc = b3.grid.cols - 1 - (gt.x - b3.minX);
  const v3 = V.gridView(b3.grid, gr, gc, 'east', 'DJ1', () => false, () => false, { sceneType: 31 });
  assert.ok(v3.sprites.some((s) => s.module === 'PCAVE.IO' && s.index >= 8 && s.index <= 15), 'locked door: closed PCAVE leaf');
  assert.ok(!V.gridView(b3.grid, gr, gc, 'east', 'DJ1', (k) => k === n3, () => false, { sceneType: 31 }).sprites.some((s) => s.module === 'PCAVE.IO'), 'opened: no leaf');
  assert.deepEqual(G.canStep({ ...b3.grid, mapNumber: 5 }, gr, gc, 'east', () => false), { kind: 'door', door: n3, closed: true }, 'locked door blocks');
  console.log('Edge levels through grid-view (r11) passed');
}

// r10: original compass labels (in-game: 1=N col-1, 2=E row+1, 3=S col+1, 4=W row-1) — labels only
{
  const G = await import('../src/lib/ishar/cont-grid.ts');
  const V = await import('../src/lib/ishar/grid-view.ts');
  const COMPASS_STEP = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  for (const [ck, code] of Object.entries(V.FACING_CODE)) {
    const s = G.gridStep(ck), name = G.ORIGINAL_COMPASS[code];
    assert.deepEqual([s.dr, s.dc], COMPASS_STEP[name], `facing ${code} = ${name}`);
    assert.equal(G.CK_TO_COMPASS[ck], name);
  }
  for (let e = 1; e <= 8; e++) {
    const s = G.gridStep(G.EDGE_ELEMENT_SIDE[e]);
    assert.deepEqual([s.dr, s.dc], COMPASS_STEP[G.EDGE_ELEMENT_COMPASS[e]], `element ${e}`);
  }
  assert.equal(G.EDGE_ELEMENT_COMPASS[5], 'W'); assert.equal(G.EDGE_ELEMENT_COMPASS[7], 'E');
  // save layout (synthetic bytes): scene type word 9, flooded word 25, doors at 7381
  const sav = new Uint8Array(8359); sav.set([0,2,0,38,0,25,0,4,0,5]); sav[19] = 36; sav[51] = 1; sav[7381 + 48] = 1;
  const h = G.parseSaveHeader(sav);
  assert.deepEqual([h.row, h.col, h.compass, h.sceneType, h.flooded, h.doors[48]], [38, 25, 'W', 36, true, 1]);
  console.log('Original compass labels + save layout passed');
}

// r12: door/switch mechanics (door_mechanics.json, known rules)
{
  const M = await import('../src/lib/ishar/door-mechanics.ts');
  const G2 = await import('../src/lib/ishar/cont-grid.ts');
  const g = { game: 'ishar2', rows: 3, cols: 8, mapNumber: 5, layerA: '', layerB: '' };
  const a = new Uint8Array(24), b = new Int8Array(24);
  for (let i = 0; i < 6; i++) { a[i] = i < 3 ? 79 : 78; b[i] = -(31 + i); }
  a[8] = 79; b[8] = -37; b[9] = -102; a[10] = 79; b[10] = -38; a[11] = 79; b[11] = -39;
  g.layerA = Buffer.from(a).toString('base64'); g.layerB = Buffer.from(new Uint8Array(b.buffer)).toString('base64');
  assert.equal(G2.cellB(g, 0, 0), -31);
  let s = M.newMechState();
  for (let i = 0; i < 6; i++) { assert.equal(M.nicheSwitch(g, 0, i), 21 + i); s = M.nicheObject(g, 0, i, 17 + i, true, s).state; }
  assert.equal(M.nicheObject(g, 0, 0, 5, true, M.newMechState()).events.length, 0, 'only objects 17..22');
  let r = M.afterStep(g, 1, 0, s); assert.equal(r.state.doors[48], 1, 'door 48 opens with switches 21-26');
  r = M.afterStep(g, 1, 0, M.nicheObject(g, 0, 3, 20, false, r.state).state); assert.equal(r.state.doors[48], 0, 'and closes when one is taken');
  s = M.newMechState(); s.doors[5] = s.doors[9] = s.doors[17] = 1;
  r = M.afterStep(g, 1, 1, s); assert.deepEqual([r.state.doors[5], r.state.doors[9], r.state.doors[17], r.state.doors[13]], [0, 0, 0, 1], 'reset 5/9/17 + plate 2 opens 13');
  assert.equal(M.hourTick(1, M.newMechState()).state.doors[28], 1); assert.equal(M.hourTick(4, { ...M.newMechState(), doors: Object.assign(Array(50).fill(0), { 28: 1 }) }).state.doors[28], 0);
  assert.equal(M.pullLever(7, M.newMechState()).state.doors[7], 1);
  assert.equal(M.useOnDoorForm({ item: -22 }, 68, M.newMechState()).state.doors[30], 0, 'door 30 needs 0x50ab');
  assert.equal(M.useOnDoorForm({ item: -22 }, 68, { ...M.newMechState(), flag50ab: 1 }).state.doors[30], 1);
  assert.equal(M.useOnDoorForm({ spell: 18 }, 67, M.newMechState()).state.doors[29], 1);
  assert.equal(M.panAt(g, 1, 0), 0); assert.equal(M.panAt(g, 1, 2), 1);
  s = M.newMechState(); s = M.loadPan(0, { count: 3, minor: 550 }, s).state; r = M.loadPan(1, { count: 3, minor: 550 }, s);
  assert.deepEqual([r.state.doors[24], r.state.switches[27], r.state.switches[29]], [1, 1, 1], 'scale solved at 3/550 x3');
  r = M.loadPan(1, { count: 2, minor: 100 }, s); assert.deepEqual([r.state.doors[24], r.state.doors[26], r.state.doors[28]], [0, 1, 0], 'wrong pan 1');
  console.log('Door/switch mechanics (r12) passed');
}
// r12: outdoor/town renderers (tables executed from the original scripts)
{
  const O = await import('../src/lib/ishar/outdoor-grid-view.ts');
  const g = { game: 'ishar2', rows: 20, cols: 20, mapNumber: 1, layerA: Buffer.alloc(400, 1).toString('base64'), layerB: Buffer.alloc(400).toString('base64') };
  const v = O.outdoorView(g, 10, 10, 'north', { sceneType: 1 });
  assert.equal(v[0].module, 'FOND1.IO'); assert.ok(v.every((s) => s.z >= 99 || s.r < 0), 'no party-row artefacts');
  assert.ok(v.every((s, i) => i === 0 || s.z <= v[i - 1].z), 'far to near');
  assert.ok(O.OUTDOOR_OVERLAYS['1'].includes('VILLAGE1') && O.OUTDOOR_OVERLAYS['10'].includes('VARCADE'));
  assert.equal(O.outdoorView({ ...g, mapNumber: 5 }, 10, 10, 'north').length, 0);
  console.log('Outdoor/town renderers (r12) passed');
}
