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
    else if (op.op === 'keyhole') { const p = i.pos; if (p.map === 5 && p.row === 44 && p.col === 27 && p.facing === 1 && op.held === -17) b[L.door + 8] = 1; res.keyConsumed = false; }
    else if (op.op === 'keyOnLeaf') { /* leaf has no form: nothing */ }
    else if (op.op === 'step') { for (const d of [5, 9, 17]) b[L.door + d] = 0; for (let k = 0; k < 3; k++) b[L.contact + k] = 0; } // GERDEP L_013af
    else if (op.op === 'turn') { for (const d of [5, 9, 17]) b[L.door + d] = 0; } // GERDEP 0x0083a/0x0096b L_013af; M49/M52/M54 beobachtet; Kontaktliste bleibt (M57, Neueintrag vermutet)
    else if (op.op === 'blockedStep') { /* no L_013af */ }
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
// ---------- magic-ishar1 (Quesh magic-contract-ishar1.md, Hoth 2026-11-03) ----------
const T1 = [1,3,5,1,3,5,1,2,0,8,0,6,3,8,10,4,6,1,1,1,0,3,3,4,4,5,6,6,0,7,9,10,3,4,6,5,0];
const lvl1 = (s) => T1[s - 1], sl1 = (s) => T1[s];
const ALLOW = { 0: (s) => lvl1(s) === 1 && s < 18, 2: (s) => (lvl1(s) < 4 && s < 18) || s === 33, 5: (s) => s < 18 || [33,35,36].includes(s),
  6: (s) => (s > 17 && s < 33) || s === 34, 9: (s) => [20,22,24,26].includes(s), 16: (s) => [22,24,26,27,30,34].includes(s), 18: (s) => (lvl1(s) < 6 && s > 17 && s < 33) || s === 34 };
const CASTERS = [0,2,5,6,9,16,18];
function magic1(v) {
  const i = v.input, cost = (M, sl) => Math.max(0, M - (sl + 5));
  switch (i.op) {
    case 'cost': return { mental: cost(i.M, i.sl) };
    case 'castCost': return { mental: cost(i.M, sl1(i.s)) };
    case 'friendlyThreshold': return { threshold: 8 * i.L + i.M };
    case 'hostileThreshold': return { threshold: i.M - 3 * (i.sl - i.L) };
    case 'heal': { const f = rngFrom(i.seed); let hp = i.hp; for (let k = 0; k < i.L; k++) hp = Math.min(i.maxHp, hp + f(2 * i.s + 2) + 1); return { hp }; }
    case 'damage': { let d = i.s === 32 ? 300 : i.L + sl1(i.s); if (i.actor === 39 && i.item40) d *= 4; else if (i.s === 32) d = Math.trunc(d / 60); return { dmg: d }; }
    case 'lightning': { let D = Math.floor((i.L + sl1(25)) / 2); return { dmg: i.arm.map((a) => { D -= a; return D > 0 ? D : 0; }) }; }
    case 'protection': return { timer: 10000 * (i.s - 4) + Math.floor((5 * i.M * i.L) / 4) };
    case 'timer54': return { timer: Math.floor((5 * i.M * i.L) / 4) };
    case 'actorTimer': return { timer: Math.floor((i.M * i.L) / 4) };
    case 'price': return { goldK: 3 * i.lvl };
    case 'priceSpell': return { goldK: 3 * lvl1(i.s) };
    case 'learn': { const stat = [0,2,5].includes(i.cls) ? i.wis : i.int; return { learned: ((i.r * 13) >>> 16) + lvl1(i.s) < stat }; }
    case 'allow': return { allowed: !!ALLOW[i.cls]?.(i.s) };
    case 'sleep': return { mental: i.M.map((m) => (m > 50 ? 100 : Math.min(100, m + 50))) };
    case 'canCast': return { can: i.cls.map((c) => CASTERS.includes(c)) };
    case 'saveOffsets': return { mental: 768 + i.c, spell: 788 + 20 * i.c + i.k, rune: 5021 + i.c, icon: 4921 + 10 * i.c + i.k, level: 738 + i.c, size: 5216 };
    case 'actorTimers': { if (i.actor === 39 || i.actor === 50) return { t: [0,0,0,0] }; const t = i.t.slice(); const j = t.findIndex((x) => x !== 0); if (j >= 0) t[j]--; return { t }; }
    case 'paid': return { paid: i.cases.map((c) => c === 'miss' || c === 'cancel16') };
  }
  throw new Error('op ' + i.op);
}

// ---------- shop/tavern/party Ishar 1 (Quesh, Hoth 2026-11-03) ----------
const SHOPS = { '31,16,1': 1, '29,69,14': 7, '19,6,4': 6, '17,52,1': 0, '38,50,1': 2, '24,71,13': 3, '25,80,13': 4, '35,72,13': 5, '36,75,14': 8 };
const P57 = { 0: [0, 320], 1: [0, 380], 3: [0, 400], 7: [0, 410] };
const TAV = { '18,56,1': 0, '29,16,1': 1, '33,18,1': 2, '39,55,1': 3, '22,76,13': 4, '24,70,13': 5, '32,77,13': 6, '35,73,13': 7, '44,75,13': 8, '22,10,4': 9, '35,77,14': 11, '38,79,14': 12 };
function shop1(v) { const i = v.input;
  switch (i.op) {
    case 'shopAt': return { shop: i.cells.map((c) => SHOPS[c.join()] ?? null) };
    case 'price': return { price: i.shops.map((s) => P57[s]) };
    case 'pay': { const [k, u] = i.gold, [pk, pu] = i.price; if (pk > k || (pk === k && pu > u)) return { gold: null, refused: true };
      let t = 1000 * (k - pk) + (u - pu); return { gold: [Math.floor(t / 1000), t % 1000], refused: false }; }
    case 'stackable': return { stackable: i.items.map((x) => x >= -66 && x <= -57) };
    case 'stackAdd': return { count: i.items.map(([it, n, q]) => Math.min(it === -57 ? 5 : it === -58 ? 20 : 10, n + q)) };
    case 'stackOffset': return { offset: 4971 + 10 * i.c + (i.item + 66) };
    case 'goldOffset': return { goldK: 478 + 2 * i.c, goldKLow: 479 + 2 * i.c, goldU: 3993 + 2 * i.c, item: 498 + 26 * i.c + 2 * (i.k ?? 0) };
    case 'flags': return { sell: false, stockSaved: false };
  } throw new Error('op ' + i.op); }
function tavern1(v) { const i = v.input;
  switch (i.op) {
    case 'price': return { eat: i.t.map((t) => 500 + 40 * t), sleep: i.t.map((t) => 900 + 80 * t) };
    case 'split': return { k: i.P.map((p) => (p > 1000 ? [1, p - 1000] : [0, p])) };
    case 'afford': return { ok: i.members.filter((m) => m[0] !== -1).reduce((a, m) => a + m[1], 0) >= i.P };
    case 'pay': { const g = i.units.slice(), sh = Math.floor(i.P / g.length); let R = i.P;
      g.forEach((x, n) => { const p = Math.min(sh, x); g[n] -= p; R -= p; }); for (let n = 0; n < g.length && R; n++) { const p = Math.min(R, g[n]); g[n] -= p; R -= p; } return { units: g }; }
    case 'eat': return { food: i.food.map((f, n) => (i.hp[n] > 0 ? (f > 60 ? 100 : Math.min(100, f + 40)) : f)) };
    case 'sleep': return { food: i.food.map((f, n) => (i.hp[n] > 0 ? Math.min(100, f + 15) : f)), mental: i.mental.map((m, n) => (i.hp[n] > 0 ? (m > 50 ? 100 : Math.min(100, m + 50)) : m)),
      hp: i.hp.map((h, n) => (h > 0 ? h + Math.trunc((i.maxHp[n] - h) / 5) : h)) };
    case 'leave': { let L = null; if (i.r3 === 0) { const j = i.npc.findIndex((x) => [21, 28, 15, 10].includes(x)); if (j >= 0) L = j; }
      if (L === null && i.rel) { for (let a = 0; a < i.npc.length && L === null; a++) if (i.npc[a] !== -1 && !i.npc.some((x, b) => b !== a && x !== -1 && i.rel[a][b] > -2)) L = a; }
      if (L === null) return { leaver: null };
      return { leaver: L, items: i.items.map((s, j) => { if (j === L) return s; const t = s.slice(); const q = t.findIndex((c) => c > -57 && c < -19); if (q >= 0) t[q] = 0; return t; }) }; }
    case 'tavernAt': return { tavern: i.cells.map((c) => TAV[c.join()] ?? null) };
    case 'hireClick': return { k: i.pts.map(([x, y]) => Math.trunc((x - 1) / 64) + (y < 136 ? 4 : 0)) };
  } throw new Error('op ' + i.op); }
const CLS1 = { 1: 'Krieger', 17: 'Finsterer Ritter', 18: 'Okkulter Mönch', 6: 'Zauberer', 9: 'Priester' };
function party1(v) { const i = v.input;
  switch (i.op) {
    case 'offsets': return { class: 728 + i.c, level: 738 + i.c, mental: 768 + i.c, size: 5216, hp: 468 + 2 * i.c, maxHp: 488 + 2 * i.c, food: 773 + i.c, npc: 4028 + i.c,
      rel: i.i === undefined ? undefined : 4003 + 5 * i.i + i.j, grid: i.row === undefined ? undefined : 3758 + 5 * i.row + i.col };
    case 'className': return { name: i.cls.map((c) => CLS1[c]) };
    case 'living': return { living: i.cls.map((c, n) => (c !== -1 && i.hp[n] > 0 ? n : -1)).filter((n) => n >= 0) };
    case 'vote': return { accept: i.v.map((vs) => vs.filter((x) => x > 0).length >= vs.filter((x) => x < 0).length) };
    case 'recruitSlot': return { slot: i.hp.indexOf(0) };
    case 'gridPlace': { for (let r = 4; r >= 0; r--) for (let c = 0; c < 5; c++) if (!i.grid[r][c]) return { cell: [r, c] }; return { cell: null }; }
    case 'dismiss': { const y = i.votes.filter((x) => x > 0).length, n = i.votes.filter((x) => x < 0).length; return { m: y >= n ? { hp: 0, npc: -1, cls: -1, gold: [0, 0] } : i.m }; }
    case 'killRel': { const out = [], ch = []; i.AT.forEach(([A, T], n) => { let r = i.rel[n]; if (A > 0) r += T <= 0 ? 2 : -1; else r += T <= 0 ? 1 : -2; out.push(r); ch.push(A <= 0 && T > 0 && r < -2); }); return { rel: out, chain: ch }; }
    case 'voteValue': return { v: i.x.map(([t1, t2, a, b]) => t1 - 2 + 2 * t2 - Math.abs(a - b)) };
  } throw new Error('op ' + i.op); }

const SM1 = { xp: [458, 2], hp: [468, 2], goldK: [478, 2], hpMax: [488, 2], class: [728, 1], race: [733, 1], level: [738, 1], str: [743, 1], con: [748, 1], wis: [753, 1], int: [758, 1], agi: [763, 1],
  mental: [768, 1], physical: [773, 1], temper: [778, 1], armor: [783, 1], goldU: [3993, 2], npc: [4028, 1], rune: [5021, 1] };
['OneHand', 'TwoHand', 'Throw', 'Shoot', 'Lockpick', 'Orientation', 'FirstAid', 'Languages'].forEach((k, n) => (SM1['skill' + k] = [4738 + 5 * n, 1]));
const RACE1 = { 1: 'Mensch', 2: 'Elfe', 3: 'Zwerg', 4: 'Ork', 5: 'Echsenmensch' }; RACE1[2] = 'Elf';
function savemap1(v) { const i = v.input; const b = new Uint8Array(5216); for (const f of i.save ?? []) { if ('be16' in f) { b[f.offset] = f.be16 >> 8; b[f.offset + 1] = f.be16 & 255; } else b[f.offset] = f.u8; }
  const w = (o) => (b[o] << 8) | b[o + 1];
  switch (i.op) {
    case 'size': return { size: b.length };
    case 'offsets': return Object.fromEntries(i.fields.map((f) => [f, i.c.map((c) => SM1[f][0] + SM1[f][1] * c)]));
    case 'race': { const o = [0, 1, 2, 3, 4].map((c) => SM1.race[0] + c); return { offsets: o, race: o.map((x) => RACE1[b[x]]) }; }
    case 'gold': { const K = [0, 1, 2, 3, 4].map((c) => w(478 + 2 * c)), U = [0, 1, 2, 3, 4].map((c) => w(3993 + 2 * c)), g = K.map((k, n) => 1000 * k + U[n]); return { goldK: K, goldU: U, gold: g, total: g.reduce((a, x) => a + x, 0) }; }
    case 'splitSave': { const q = Math.floor(i.total / i.n), r = i.total % i.n, a = Array.from({ length: i.n }, (_, n) => q + (n < r ? 1 : 0)); return { afterSplit: a, afterSave: a.map((x) => x - i.cost / i.n) }; }
    case 'inv': return { offset: i.pts.map(([c, k]) => 498 + 26 * c + 2 * k) };
    case 'spell': return { offset: i.pts.map(([c, k]) => 788 + 20 * c + k) };
    case 'name': return { offset: i.c.map((c) => 418 + 8 * c) };
    case 'bounds': return { ishar1: i.offsets.map((o) => o < 5216), allFieldsInside: Object.values(SM1).every(([o, s]) => o + 4 * s + s <= 5216) };
  } throw new Error('op ' + i.op); }

// ---------- monster-ki Ishar 1/2 (Quesh monster-ki-ishar{1,2}, Hoth 2026-11-03) ----------
function monsterKi(v) {
  const i = v.input, two = v.contract === 'monster-ki-ishar2', hS = two ? 9 : -41, xMax = two ? 85 : 50;
  const DX = [0, -1, -1, -1, 0, 1, 1, 1], DY = [-1, -1, 0, 1, 1, 1, 0, -1];
  switch (i.op) {
    case 'chase': { const h = i.h; return { chase: ((h >= -30 && h <= -2) || h === hS) && Math.abs(i.m[0] - i.party[0]) <= Math.abs(h) && Math.abs(i.m[1] - i.party[1]) <= Math.abs(h) }; }
    case 'step': { let best = i.m, bd = Infinity; for (let k = 0; k < 8; k++) { const x = i.m[0] + DX[k], y = i.m[1] + DY[k];
        if (Math.abs(x - i.home[0]) >= Math.abs(i.h) || Math.abs(y - i.home[1]) >= Math.abs(i.h) || x <= 3 || x >= xMax) continue;
        const d = (x - i.target[0]) ** 2 + (y - i.target[1]) ** 2; if (d < bd) { bd = d; best = [x, y]; } }
      return two ? { pos: best, cooldown: 2 } : { pos: best }; }
    case 'offsets': return two ? { x: i.i.map((n) => 2601 + 2 * n), y: i.i.map((n) => 2821 + 2 * n), facing: i.i.map((n) => 3041 + 2 * n), hp: i.i.map((n) => 3261 + 2 * n), zone: i.i.map((n) => 6781 + n) }
      : { x: i.i.map((n) => 1448 + 2 * n), y: i.i.map((n) => 1588 + 2 * n), hp: i.i.map((n) => 1728 + 2 * n), stance: i.i.map((n) => 3688 + n), zone: i.i.map((n) => 4033 + n),
          type: i.i.map((n) => 2638 + n), chased: i.i.map((n) => 4103 + n), homeX: i.i.map((n) => 4781 + n), homeY: i.i.map((n) => 4851 + n), contact: [4778, 4779, 4780] };
    case 'afterLoad': { const reroll = i.zoneHasEntries && !i.sync; return { actorsChanged: reroll, sessionsEqual: !reroll }; }
    case 'zoneChange': return { actorsChanged: i.entries > 0 };
    case 'wanderReset': { const b = new Uint8Array(8359); for (const f of i.save) if ('be16' in f) { b[f.offset] = f.be16 >> 8; b[f.offset + 1] = f.be16 & 255; } else b[f.offset] = f.u8;
      const a = b.slice(); for (let n = 60; n < 70; n++) { for (const o of [1448, 1588, 1728]) { b[o + 2 * n] = 0; b[o + 2 * n + 1] = 0; } b[3688 + n] = 0; b[4033 + n] = 0; }
      const ch = {}; for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) ch[k] = b[k]; return { changes: ch }; }
    case 'contactOrder': { const c = [0, 0, 0]; [1, 0, 2].forEach((slot, k) => (c[slot] = i.arrivals[k])); return { contact: c }; }
  } throw new Error('op ' + i.op); }
const MODELS = { 'monster-ki-ishar1': monsterKi, 'monster-ki-ishar2': monsterKi, 'savemap-ishar1': savemap1, 'shop-ishar1': shop1, 'tavern-ishar1': tavern1, 'party-ishar1': party1, 'magic-ishar1': magic1, 'pickup-ishar2': (v) => (v.input.armourCodes ? pickupArmour(v) : pickup(v)), 'mechanics-ishar2': mech, rng: rngVec, 'combat-ishar2': combat2, 'combat-ishar1': combat1, 'savefields-ishar2': savefields };
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
