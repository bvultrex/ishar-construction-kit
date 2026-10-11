// r13 Builder editor regressions (pure grid-editor ops + builder helpers). Synthetic bytes; originals only if present locally.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { bytesToBase64, canStep, cellA, cellB, decomposeCode, edgeViewGrid, expandGridLevels, exportCont, gridLocationId, importCont, addGridLevel, sceneTriggerAt, trapAt, ISHAR2_FILE } from '../src/lib/ishar/cont-grid.ts';
import { paintFloor, paintWall, setDoor, setEdge, setNiche, setSceneTrigger, setTrap, validateGrid, isRoomCell, edgeChoices, wallRuleApplies, compassOf, SCREEN_SIDE } from '../src/lib/ishar/grid-editor.ts';
import { nicheSwitch } from '../src/lib/ishar/door-mechanics.ts';
import { emptyProject, normalizeProject } from '../src/lib/ishar/project.ts';


const blank = (rows = 12, cols = 16, mapNumber = 5) => ({ game: 'ishar2', rows, cols, mapNumber, layerA: bytesToBase64(new Uint8Array(rows * cols).fill(255)), layerB: bytesToBase64(new Uint8Array(rows * cols)) });
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
const no = () => false;

t('floor tool derives original shape codes from neighbours', () => {
  let g = blank(); for (let c = 3; c <= 8; c++) g = paintFloor(g, 5, c).grid;
  assert.deepEqual([3, 4, 5, 8].map((c) => cellA(g, 5, c)), [34, 10, 10, 30]);
  g = paintWall(g, 5, 5).grid; assert.equal(cellA(g, 5, 5), -1); assert.equal(cellA(g, 5, 4), 30);
});
t('edge tool: only across straight corridors, elements 5-8', () => {
  let g = blank(); for (let c = 3; c <= 8; c++) g = paintFloor(g, 5, c).grid;
  const r = setEdge(g, 5, 5, 'east', true); assert.ok(r.ok); assert.equal(cellA(r.grid, 5, 5), 42); assert.deepEqual(decomposeCode(42), [10, 6]);
  assert.equal(setEdge(g, 5, 5, 'north', true).ok, false);
  assert.equal(setEdge(g, 5, 3, 'east', true).ok, false, 'dead end is not a straight corridor');
  assert.deepEqual(edgeChoices(12).map((x) => x.code).sort((a, b) => a - b), [40, 44, 72, 76]);
});
t('door tool writes B = 60+n, blocks GERDEP-style, falls back to the corridor neighbour', () => {
  let g = blank(); for (let c = 3; c <= 8; c++) g = paintFloor(g, 5, c).grid;
  const d = setDoor(g, 5, 5, 'east', 7); assert.ok(d.ok); assert.equal(cellB(d.grid, 5, 5), 67);
  assert.deepEqual(canStep(d.grid, 5, 5, 'east', no), { kind: 'door', door: 7, closed: true });
  assert.equal(canStep(d.grid, 5, 5, 'east', () => true).closed, false);
  // from a non-straight cell (dead end 5/3): placed on the neighbour 5/4 opposite side
  const f = setDoor(g, 5, 3, 'west', 9); assert.ok(f.ok); assert.equal(cellB(f.grid, 5, 4), 69); assert.ok(f.message?.includes('5/4'));
  assert.equal(setDoor(g, 5, 5, 'east', 50).ok, false);
});
t('trap / niche / scene trigger write original B codes', () => {
  let g = blank(); for (let c = 3; c <= 8; c++) g = paintFloor(g, 5, c).grid;
  g = setTrap(g, 5, 6, 'crusher').grid; assert.equal(trapAt(g, 5, 6).kind, 'crusher'); assert.equal(cellB(g, 5, 6), -9);
  g = setNiche(g, 5, 4, 21).grid; assert.equal(cellA(g, 5, 4), 78); assert.equal(nicheSwitch(g, 5, 4), 21);
  g = setSceneTrigger(g, 5, 7, 31).grid; assert.equal(sceneTriggerAt(g, 5, 7), 31);
  assert.equal(setSceneTrigger(g, 5, 7, 10).ok, false, 'map 5: types 29..60 only');
  assert.equal(setSceneTrigger({ ...g, mapNumber: 1 }, 5, 7, 31).ok, false);
  assert.equal(setTrap(g, 0, 0, 'crusher').ok, false);
});
t('wall rule: room|room thin edge without door warns (fix removes edge); doors ok; outdoor exempt', () => {
  let g = blank(); for (let r = 3; r <= 6; r++) for (let c = 3; c <= 8; c++) g = paintFloor(g, r, c).grid;
  assert.ok(isRoomCell(g, 4, 5));
  // force a thin edge between two room cells (raw byte, as an import could)
  const raw = { ...g, layerA: (() => { const a = Buffer.from(g.layerA, 'base64'); a[4 * 16 + 5] = 42; return a.toString('base64'); })() };
  const v = validateGrid(raw); assert.equal(v.filter((i) => i.level === 'warn').length, 1);
  assert.equal(validateGrid(v[0].fix(raw)).filter((i) => i.level === 'warn').length, 0);
  const withDoor = { ...raw, layerB: (() => { const b = Buffer.from(raw.layerB, 'base64'); b[4 * 16 + 5] = 61; return b.toString('base64'); })() };
  assert.equal(validateGrid(withDoor).filter((i) => i.level === 'warn').length, 0);
  for (const m of [1, 2, 4]) { assert.equal(wallRuleApplies({ ...raw, mapNumber: m }), false); assert.equal(validateGrid({ ...raw, mapNumber: m }).length, 0); }
});
t('special codes survive neighbour reshapes (no original code rewritten)', () => {
  let g = blank(); for (let c = 3; c <= 8; c++) g = paintFloor(g, 5, c).grid;
  g = setNiche(g, 5, 5, 22).grid; g = paintFloor(g, 4, 5).grid; assert.equal(cellA(g, 5, 5), 78);
});
t('builder compass = original compass (N up = col-1, O right = row+1)', () => {
  assert.equal(compassOf(SCREEN_SIDE.up), 'N'); assert.equal(compassOf(SCREEN_SIDE.right), 'O');
  assert.equal(compassOf(SCREEN_SIDE.down), 'S'); assert.equal(compassOf(SCREEN_SIDE.left), 'W');
});
t('existing edge projects open without migration and get a read-only view grid', () => {
  const p = normalizeProject(JSON.parse(JSON.stringify(emptyProject('x'))));
  assert.ok(p.game.levels.every((l) => !l.grid));
  assert.ok(edgeViewGrid(p.game, p.game.levels[0].id).ok);
});
t('edited grid level expands for playtest and exports a CONT of original size', () => {
  const p = emptyProject('x'); let g = blank(90, 60); for (let c = 28; c <= 32; c++) g = paintFloor(g, 45, c).grid;
  g = setDoor(g, 45, 30, 'east', 3).grid;
  const res = addGridLevel(p.game, g, 'gate', { r: 45, c: 29 }); assert.ok(res.ok);
  const x = expandGridLevels(res.game); assert.ok(x.locations.some((l) => l.id === gridLocationId(res.levelId, 45, 31)));
  assert.equal(exportCont(g).length, ISHAR2_FILE);
});
const dir = '/workspace/ishar/originals/ishar2/Ishar2';
if (existsSync(`${dir}/CONT5.FIC`)) t('local originals: no false wall-rule hits on CONT1..7, roundtrip after no-op edit', () => {
  for (const m of [1, 2, 3, 4, 5, 6, 7]) {
    const bytes = new Uint8Array(readFileSync(`${dir}/CONT${m}.FIC`)); const g = { ...importCont(bytes, 'x', 'x').grid, mapNumber: m };
    assert.equal(validateGrid(g).length, 0, `CONT${m}`);
    const open = (() => { for (let r = 0; r < 90; r++) for (let c = 0; c < 60; c++) if (cellA(g, r, c) !== -1) return [r, c]; })();
    assert.deepEqual(Buffer.from(exportCont(paintFloor(g, open[0], open[1]).grid)), Buffer.from(bytes));
  }
});

// r14: GERDEP collision (collision_maps1-4.json)
import { cellWalkable } from '../src/lib/ishar/cont-grid.ts';
t('r14 collision: negative A blocks on every map, map 4 A==0 blocks, B -125 blocks, edges never block on maps 1-4', () => {
  const g = blank(4, 4, 2); const A = Buffer.from(g.layerA, 'base64'); A.fill(0);
  A[1 * 4 + 1] = (-10) & 255; A[1 * 4 + 2] = (-3) & 255; A[2 * 4 + 1] = 42; const B = Buffer.from(g.layerB, 'base64'); B[3 * 4 + 3] = (-125) & 255;
  const x = { ...g, layerA: A.toString('base64'), layerB: B.toString('base64') };
  assert.equal(cellWalkable(x, 1, 1), false); assert.equal(cellWalkable(x, 1, 2), false); assert.equal(cellWalkable(x, 3, 3), false);
  assert.equal(canStep(x, 2, 2, 'north', no).kind, 'wall');
  assert.equal(canStep({ ...x, mapNumber: 1 }, 2, 1, 'south', no).kind, 'open', 'edge element 42 never blocks on maps 1-4');
  assert.equal(cellWalkable({ ...x, mapNumber: 4 }, 0, 0), false); assert.equal(cellWalkable({ ...x, mapNumber: 4 }, 2, 1), true);
  const ex = expandGridLevels({ ...emptyProject('x').game, levels: [{ id: 'L', name: 'L', kind: 'outdoor', grid: x }] });
  assert.ok(!ex.locations.some((l) => l.id === gridLocationId('L', 1, 1)));
});
if (existsSync(`${dir}/CONT2.FIC`)) t('r14 user bug CONT2 25/40 O: wall ahead blocks', () => {
  const g = { ...importCont(new Uint8Array(readFileSync(`${dir}/CONT2.FIC`)), 'x', 'x').grid, mapNumber: 2 };
  assert.equal(canStep(g, 25, 40, 'south', no).kind, 'wall'); assert.equal(canStep(g, 28, 34, 'south', no).kind, 'wall');
});
console.log(`builder: ${n} checks ok`);
