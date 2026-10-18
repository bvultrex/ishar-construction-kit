#!/usr/bin/env node
// Hoth 18.10.2026: dependency-free checker for contract-fixtures.json with its own reference model.
// Exit 0 only when every known/suspected vector is green; unknown vectors are counted, not evaluated.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const file = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), 'contract-fixtures.json');
const fx = JSON.parse(readFileSync(file, 'utf8'));
const SIZE = 8359;
// ---------- buffer helpers ----------
const mk = (fields = []) => { const b = new Uint8Array(SIZE); for (const f of fields) { if ('be16' in f) { b[f.offset] = (f.be16 >> 8) & 255; b[f.offset + 1] = f.be16 & 255; } else b[f.offset] = f.u8 & 255; } return b; };
const rd = (b, o) => (b[o] << 8) | b[o + 1];
const wr = (b, o, v) => { b[o] = (v >> 8) & 255; b[o + 1] = v & 255; };
const s16 = (v) => (v & 0x8000 ? v - 0x10000 : v);
const diff = (a, b) => { const d = {}; for (let i = 0; i < SIZE; i++) if (a[i] !== b[i]) d[i] = b[i]; return d; };
const td = (a, b) => Math.trunc(a / b);
// ---------- save layout (Ishar 2, offsets from 0) ----------
const L = { row: 2, col: 4, facing: 6, map: 8, zone: 18, hour: 44, day: 46, ticks: 48, phase: 90, xp: 986, hp: 996, goldK: 1006, goldR: 1026, inv: 1036, level: 1291, armour: 1336,
  objA: 336, objB: 536, objMap: 736, actorFacing: 3041, actorHp: 3261, actorScene: 6781, door: 7381, sw: 7431, contact: 7576 };
const invOff = (c, s) => L.inv + 2 * (c * 15 + s);
const ARMOUR = { '-89': 4, '-87': 3, '-85': 2, '-83': 1, '-79': 1, '-77': 6, '-75': 2, '-71': 12, '-69': 9, '-67': 7, '-65': 5, '-63': 3, '-61': 2, '-29': 6, '-28': 3, '-27': 2, '-26': 1, '-25': 4 };
const armourOf = (code) => ARMOUR[code] ?? 0;
const TICKS_PER_HOUR = 1000;
// ---------- RNG ----------
const rngStep = (r) => (Math.imul(r, 0x7ab7) + 0xf881) & 0xffff;
function rngFrom(seed) { let r = seed & 0xffff; const f = (n) => { r = rngStep(r); return n > 0 ? (r * n) >>> 16 : 0; }; f.state = () => r; return f; }
// ---------- models ----------
function pickup(v) {
  const b = mk(v.input.save); const a = b.slice(); let held = 0, rejected = false;
  const putSlot = (c, s, code) => { wr(b, invOff(c, s), code & 0xffff); if (s >= 9) b[L.armour + c] = (b[L.armour + c] + armourOf(code)) & 255; };
  for (const op of v.input.ops) {
    if (op.op === 'floorPickup') { b[L.objA + op.obj] = 0; b[L.objB + op.obj] = 0; b[L.objMap + op.obj] = 0; held = op.obj; }
    else if (op.op === 'handPickup') { held = s16(rd(b, invOff(op.char, op.slot))); wr(b, invOff(op.char, op.slot), 0); b[L.armour + op.char] = (b[L.armour + op.char] - armourOf(held)) & 255; }
    else if (op.op === 'dropHand') { putSlot(op.char, op.slot, held); held = 0; }
    else if (op.op === 'dropPortrait') { let s = 0; while (s < 9 && rd(b, invOff(op.char, s))) s++; if (s === 9) rejected = true; else { putSlot(op.char, s, held); held = 0; } }
  }
  const r = { changes: diff(a, b), held }; if (rejected) r.rejected = true; if ('saveAllowed' in v.expected) r.saveAllowed = held === 0;
  return r;
}
function pickupArmour(v) { return { armour: v.input.armourCodes.map(armourOf) }; }
function decodeB(b, map) {
  if (b >= 61 && b <= 109) return { kind: 'door', index: b - 60 };
  if (b <= -11 && b >= -30) return { kind: 'lever', index: -b - 10 };
  if (b <= -70 && b >= -99) return { kind: 'zone' };
  if (b <= -100 && b >= -119 && map > 4) return { kind: 'walkTrigger', index: -b - 100 };
  return { kind: 'none' };
}
function mech(v) {
  const i = v.input;
  if ('decodeB' in i) return decodeB(i.decodeB, i.map);
  if (i.doorOffset) return { doorOffsets: i.doorOffset.map((d) => L.door + d), switchOffsets: i.switchOffset.map((k) => L.sw + k) };
  if ('dayPhaseHour' in i) { const h = i.dayPhaseHour; return { phase: h >= 8 && h <= 19 ? 1 : h < 6 || h >= 22 ? 3 : 2 }; }
  if (i.clockOffsets) return { hour: L.hour, day: L.day, ticks: L.ticks };
  const b = mk(i.save); const a = b.slice(); const res = {};
  for (const op of i.ops) {
    if (op.op === 'lever') { b[L.sw + op.k] ^= 1; b[L.door + op.k] ^= 1; }
    else if (op.op === 'frame') { b[L.door + op.d] = 1; }
    else if (op.op === 'keyhole') { const p = i.pos; if (p.map === 5 && p.row === 61 && p.col === 15 && p.facing === 2 && op.held === -17) b[L.door + 8] = 1; res.keyConsumed = false; }
    else if (op.op === 'keyOnLeaf') { /* leaf has no form: nothing */ }
    else if (op.op === 'hour') {
      const from = rd(b, L.hour), to = op.to; wr(b, L.hour, to);
      if (from !== to) { if (to === 1) b[L.door + 28] = 1; if (to === 4) b[L.door + 28] = 0;
        if (to === 2 && b[L.objMap + 6] !== 0) b[L.actorScene + 69] = 12; if (to === 4) b[L.actorScene + 69] = 0; }
    } else if (op.op === 'ticks') {
      if (i.paused) continue;
      for (let n = 0; n < op.n; n++) { let t = rd(b, L.ticks) + 1, h = rd(b, L.hour), d = rd(b, L.day);
        if (t >= TICKS_PER_HOUR) { t = 0; h++; if (h >= 24) { h -= 24; d++; } } wr(b, L.ticks, t); wr(b, L.hour, h); wr(b, L.day, d); }
    }
  }
  const e = v.expected;
  if ('door28' in e) return { door28: b[L.door + 28] };
  if ('actor69scene' in e) return { actor69scene: b[L.actorScene + 69] };
  if ('ticks' in e) return { hour: rd(b, L.hour), day: rd(b, L.day), ticks: rd(b, L.ticks) };
  return { changes: diff(a, b), ...res };
}
function rngVec(v) {
  const g = rngFrom(v.input.seed);
  if (v.input.firstState) { g(1); return { state: g.state() }; }
  const values = v.input.bounds.map((n) => g(n)); return { values, state: g.state() };
}
function combat2(v) {
  const i = v.input;
  switch (i.f) {
    case 'playerHit': return { hit: i.blind ? 20 : 50 + 2 * i.LVL + 3 * (td(i.AGI * i.FOOD, 80) - i.AGI_t) - td(i.loc172, 2) + td(i.skill, 5) };
    case 'fist': return { dmg: Math.max(0, td(i.STR - i.CON_t, 2) - i.ARM_t) };
    case 'weapon': { const g = rngFrom(i.seed); return { dmg: Math.max(0, td(i.STR + 2 - i.CON_t, 2) - i.ARM_t + g(i.die) + 1) }; }
    case 'monsterHit': return { hit: 9 * i.LVL_m + 3 * i.AGI_p - i.AGI_m };
    case 'monsterDmg': { const g = rngFrom(i.seed); const dmax = Math.max(0, i.STR_m + 2 - td(i.CON_p, 2) - i.ARM_p); let d = g(dmax) + 1; if (i.half) d = td(d, 2); return { dmg: d }; }
    case 'xp': return { xp: i.alive.map((al, c) => (al ? (c === i.killer ? td(i.LVL_t, 3) + 1 : td(i.LVL_t, 5) + 1) : 0)) };
    case 'food': return { food: i.FOOD - i.swings };
    case 'death': { const b = mk(i.save); const a = b.slice(); b[L.actorScene + i.actor] = 0; wr(b, L.actorHp + 2 * i.actor, 0); b[L.contact + i.contactSlot] = 0; return { changes: diff(a, b) }; }
    case 'monsterCooldown': return { cooldown: td(i.ticksPerHour, 480) * td(40, i.AGI_m + 1) };
    case 'playerCooldown': return { cooldown: td(i.ticksPerHour, 120) * (td(i.T * 25, i.skill) + 2) };
  }
  throw Error('unknown f ' + i.f);
}
const LV1 = [700, 1700, 3000, 5000, 8000, 12000, 17000, 23000, 30000];
function combat1(v) {
  const i = v.input;
  switch (i.f) {
    case 'playerHit': return { hit: 30 + 2 * i.LVL + 5 * (td(i.AGI * i.FOOD, 80) - i.AGI_t) - i.loc146 + td(i.skill, 5) };
    case 'dmg': { const g = rngFrom(i.seed); return { dmg: Math.max(0, i.bonus - i.ARM_t + g(Math.max(0, td(i.STR + 2 - i.CON_t, 2))) + 1) }; }
    case 'monsterHit': return { hit: 9 * i.T_m + 3 * i.AGI_p - i.AGI_m };
    case 'xp': return { xp: i.alive.map((al, c) => (al ? (c === i.killer ? 50 : 20) * i.T : 0)) };
    case 'levelUp': { let L2 = i.LVL; if (i.XP !== i.prevXP) for (let k = 0; k < LV1.length; k++) if (i.prevXP < LV1[k] && LV1[k] <= i.XP) L2 = k + 2; return { XP: Math.min(i.XP, 31000), LVL: L2 }; }
    case 'monsterCooldown': { const g = rngFrom(i.seed); return { cooldown: td(40, i.AGI_m + 1) + g(5) }; }
    case 'offsets': { const c = i.char, m = i.mon; return { xp: 458 + 2 * c, hp: 468 + 2 * c, gold: 478 + 2 * c, maxhp: 488 + 2 * c, lvl: 738 + c, str: 743 + c, con: 748 + c, agi: 763 + c, food: 773 + c, arm: 783 + c, monHp: 1728 + 2 * m, monT: 2708 + m }; }
  }
  throw Error('unknown f ' + i.f);
}
const CLOCK = new Set([L.hour, L.hour + 1, L.day, L.day + 1, L.ticks, L.ticks + 1, 90, 91, 92, 93]);
function savefields(v) {
  const i = v.input;
  if (i.saveSize) return { size: SIZE };
  if (i.diffOffsets) return { roundtripOk: i.diffOffsets.every((o) => CLOCK.has(o)) };
  const b = mk(i.save); const c = i.char;
  if (i.write === 'gold') { const a = b.slice(); wr(b, L.goldK + 2 * c, td(i.value, 1000)); wr(b, L.goldR + 2 * c, i.value % 1000); return { changes: diff(a, b) }; }
  switch (i.read) {
    case 'gold': return { value: rd(b, L.goldK + 2 * c) * 1000 + rd(b, L.goldR + 2 * c) };
    case 'xpDisplay': return { value: rd(b, L.xp + 2 * c) * 100 };
    case 'level': return { value: b[L.level + c] };
    case 'hp': return { value: rd(b, L.hp + 2 * c) };
    case 'armour': return { value: b[L.armour + c] };
    case 'header': return { value: { row: rd(b, L.row), col: rd(b, L.col), facing: rd(b, L.facing), map: rd(b, L.map), zone: rd(b, L.zone) } };
    case 'clock': return { value: { hour: rd(b, L.hour), day: rd(b, L.day), ticks: rd(b, L.ticks) } };
  }
  throw Error('unknown read');
}
const MODELS = { 'pickup-ishar2': (v) => (v.input.armourCodes ? pickupArmour(v) : pickup(v)), 'mechanics-ishar2': mech, rng: rngVec, 'combat-ishar2': combat2, 'combat-ishar1': combat1, 'savefields-ishar2': savefields };
// ---------- compare ----------
const norm = (x) => JSON.stringify(x, (k, val) => (val && typeof val === 'object' && !Array.isArray(val) ? Object.fromEntries(Object.entries(val).map(([kk, vv]) => [String(kk), vv]).sort(([p], [q]) => (p < q ? -1 : 1))) : val));
const subset = (exp, got) => Object.keys(exp).every((k) => norm(exp[k]) === norm(got[k]));
const sum = {}; let bad = 0;
for (const v of fx.vectors) {
  const s = (sum[v.contract] ??= { known: [0, 0], suspected: [0, 0], unknown: 0 });
  if (v.status === 'unknown') { s.unknown++; continue; }
  if (!v.id || !v.contract || !v.source || !v.input || !v.expected || !['known', 'suspected'].includes(v.status)) { console.log(`FEHLT  ${v.id}: Pflichtfeld`); bad++; continue; }
  let got, ok = false;
  try { got = MODELS[v.contract](v); ok = subset(v.expected, got); } catch (e) { got = { error: String(e) }; }
  s[v.status][ok ? 0 : 1]++;
  if (!ok) { bad++; console.log(`ROT    ${v.id} [${v.contract}/${v.status}] erwartet ${norm(v.expected)} bekommen ${norm(got)}`); }
}
console.log(`\nDatei: ${file}  Vektoren: ${fx.vectors.length}`);
console.log('Vertrag               known grün/rot  suspected grün/rot  unknown');
for (const [c, s] of Object.entries(sum)) console.log(`${c.padEnd(21)} ${String(s.known[0]).padStart(5)}/${s.known[1]}       ${String(s.suspected[0]).padStart(9)}/${s.suspected[1]}       ${s.unknown}`);
console.log(bad ? `\nERGEBNIS: ${bad} rot` : '\nERGEBNIS: alle geprüften Vektoren grün');
process.exit(bad ? 1 : 0);
