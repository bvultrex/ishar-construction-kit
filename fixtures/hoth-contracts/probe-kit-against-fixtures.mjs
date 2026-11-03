#!/usr/bin/env node
// Hoth 18.10.2026: read-only probe of existing kit functions against contract-fixtures.json.
// Usage: node probe-kit-against-fixtures.mjs <kit-clone> [IO.IO]   (IO.IO is only read, for deriveIshar2SaveLayout)
// Does not modify any kit file. Exit 0 = probe ran (verdicts are reported, not enforced).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const kit = process.argv[2] ?? '/workspace/ishar/clones/hoth';
const ioPath = process.argv[3];
const fx = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'contract-fixtures.json'), 'utf8'));
const imp = (p) => import(pathToFileURL(join(kit, 'src/lib/ishar', p)).href);
const dm = await imp('door-mechanics.ts'), cg = await imp('cont-grid.ts'), af = await imp('original-actor-frame.ts');
const oc = await imp('original-commerce.ts'), gr = await imp('original-ground-runtime.ts'), sa = await imp('save-actors.ts'), sl = await imp('ishar2-save-layout.ts');
const layout = ioPath ? await sl.deriveIshar2SaveLayout(new Uint8Array(readFileSync(ioPath))) : null;
const SIZE = 8359;
const mk = (fields = []) => { const b = new Uint8Array(SIZE); for (const f of fields) { if ('be16' in f) { b[f.offset] = (f.be16 >> 8) & 255; b[f.offset + 1] = f.be16 & 255; } else b[f.offset] = f.u8 & 255; } return b; };
const diff = (a, b) => { const d = {}; for (let i = 0; i < SIZE; i++) if (a[i] !== b[i]) d[i] = b[i]; return d; };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const byId = Object.fromEntries(fx.vectors.map((v) => [v.id, v]));
const rows = [];
const rec = (id, fn, ok, note = '') => rows.push({ id, fn, ok, note });
const stateFrom = (b) => { const s = dm.newMechState(); for (let i = 0; i < 50; i++) { s.doors[i] = b[7381 + i]; s.switches[i] = b[7431 + i]; } return s; };
// mechanics
for (const id of ['M15', 'M16']) { const v = byId[id]; const b = mk(v.input.save); let s = stateFrom(b); for (const op of v.input.ops) s = dm.pullLever(op.k, s).state; const a = b.slice(); b[7387] = s.doors[6]; b[7437] = s.switches[6]; rec(id, 'door-mechanics.ts pullLever', eq(diff(a, b), v.expected.changes)); }
for (const id of ['M17', 'M18']) rec(id, '(kein Rahmenklick-Modell; useOnDoorForm deckt nur Formen 66/67/68)', false, 'fehlt');
for (const id of ['M19', 'M22']) { const v = byId[id]; let s = stateFrom(mk(v.input.save)); s = dm.useOnDoorForm({ item: v.input.ops[0].held }, 66, s).state; rec(id, 'door-mechanics.ts useOnDoorForm(item, form 66)', (s.doors[8] ? { '7389': 1 } : {})['7389'] === v.expected.changes['7389'], 'Form 66 = Schlüsselloch; Positions-/Blickbedingung liegt ausserhalb'); }
for (let n = 23; n <= 28; n++) { const v = byId['M' + n]; const b = mk(v.input.save); let s = stateFrom(b); s.hour = (b[44] << 8) | b[45]; s = dm.hourTick(v.input.ops[0].to, s).state; rec(v.id, 'door-mechanics.ts hourTick', s.doors[28] === v.expected.door28); }
{ const s = dm.afterStep({ game: 'ishar2', rows: 90, cols: 60, mapNumber: 5, layerA: cg.bytesToBase64(new Uint8Array(5400)), layerB: cg.bytesToBase64(new Uint8Array(5400)) }, 0, 0, { ...dm.newMechState(), doors: Object.assign(Array(50).fill(0), { 5: 1 }) }); rec('M18+', 'door-mechanics.ts afterStep (STEP_RESET_DOORS 5,9,17)', true, `Tür 5 nach einem Schritt: ${s.state.doors[5]} (Original: HOTSR2 ebenfalls 0, siehe M45)`); }
for (let n = 1; n <= 13; n++) { const v = byId['M' + String(n).padStart(2, '0')]; const b = v.input.decodeB; const d = cg.doorNumber(b); const e = v.expected; const ok = e.kind === 'door' ? d === e.index : d === undefined; rec(v.id, 'cont-grid.ts doorNumber' + (e.kind === 'door' || e.kind === 'none' ? '' : ' (nur Türen; Hebel/Zone/Trigger in nicheSwitch/sceneTriggerAt/afterStep)'), ok, e.kind); }
for (const id of ['M49', 'M58', 'M50', 'M51', 'M52', 'M53', 'M54', 'M55', 'M56', 'M57']) { const v = byId[id]; const b = mk(v.input.save); const a = b.slice(); let s = stateFrom(b); const g = { game: 'ishar2', rows: 90, cols: 60, mapNumber: 5, layerA: cg.bytesToBase64(new Uint8Array(5400)), layerB: cg.bytesToBase64(new Uint8Array(5400)) };
  let turn = false; for (const op of v.input.ops) { if (op.op === 'step') s = dm.afterStep(g, 0, 0, s).state; else if (op.op === 'turn') turn = true; else if (op.op === 'blockedStep') {} } for (let i = 0; i < 50; i++) { b[7381 + i] = s.doors[i]; b[7431 + i] = s.switches[i]; }
  const ist = JSON.stringify(diff(a, b)), soll = JSON.stringify(v.expected.changes);
  rec(id, 'door-mechanics.ts afterStep' + (turn ? ' (Drehen: kein Kit-Hook)' : ''), ist === soll, ist === soll ? '' : `Ist ${ist} / Soll ${soll}`); }
for (const id of ['M45', 'M46', 'M48']) { const v = byId[id]; const b = mk(v.input.save); const a = b.slice(); let s = stateFrom(b); const g = { game: 'ishar2', rows: 90, cols: 60, mapNumber: 5, layerA: cg.bytesToBase64(new Uint8Array(5400)), layerB: cg.bytesToBase64(new Uint8Array(5400)) };
  for (const op of v.input.ops) if (op.op === 'step') s = dm.afterStep(g, 0, 0, s).state; for (let i = 0; i < 50; i++) { b[7381 + i] = s.doors[i]; b[7431 + i] = s.switches[i]; }
  rec(id, 'door-mechanics.ts afterStep', JSON.stringify(diff(a, b)) === JSON.stringify(v.expected.changes), id === 'M48' ? `Kit-Diff ${JSON.stringify(diff(a, b))} (Kontaktliste 0x4b80[0..2] fehlt im Kit)` : ''); }
// rng
for (const id of ['R01', 'R02', 'R03', 'R04']) { const v = byId[id]; const g = af.originalActorRandom(v.input.seed); let got; try { got = v.input.bounds.map((n) => g(n)); } catch (e) { got = String(e.message); } rec(id, 'original-actor-frame.ts originalActorRandom', eq(got, v.expected.values), typeof got === 'string' ? got : ''); }
// savefields via ishar2-save-layout (address based) and original-commerce
const A = { goldK: 0x2d68, goldR: 0x2d80, xp: 0x2d50, hp: 0x2d5c, level: 0x2eb6, armour: 0x2f0e };
const w = (m, a) => (m.get(a) << 8) | m.get(a + 1);
if (layout) {
  for (const id of ['S01', 'S02', 'S03', 'S05', 'S06', 'S07', 'S08', 'S09', 'S11']) {
    const v = byId[id], m = sl.readIshar2SavedMain(mk(v.input.save), layout), c = v.input.char ?? 0; let got;
    switch (v.input.read) {
      case 'gold': got = w(m, A.goldK + 2 * c) * 1000 + w(m, A.goldR + 2 * c); break;
      case 'xpDisplay': got = w(m, A.xp + 2 * c) * 100; break;
      case 'level': got = m.get(A.level + c); break; case 'hp': got = w(m, A.hp + 2 * c); break; case 'armour': got = m.get(A.armour + c); break;
      case 'clock': got = { hour: w(m, 0x4fc6), day: w(m, 0x4fc8), ticks: w(m, 0x4fca) }; break;
    }
    rec(id, 'ishar2-save-layout.ts readIshar2SavedMain (+ Adressen aus Bericht)', eq(got, v.expected.value));
  }
  { const v = byId.S04, b = mk(v.input.save); const out = sl.patchIshar2SavedMain(b, layout, [{ address: A.goldK + 8, width: 2, value: 7 }, { address: A.goldR + 8, width: 2, value: 8 }]); rec('S04', 'ishar2-save-layout.ts patchIshar2SavedMain', eq(diff(b, out), v.expected.changes)); }
  { const v = byId.M15, b = mk(v.input.save); const out = sl.patchIshar2SavedMain(b, layout, [{ address: 0x4aa4 + 6, width: 1, value: 0 }, { address: 0x4ad8 + 6, width: 1, value: 0 }]); rec('M15w', 'ishar2-save-layout.ts patchIshar2SavedMain (Tür-/Schaltertabelle)', eq(diff(b, out), v.expected.changes)); }
  { const fld = layout.fields.find((f) => f.memoryAddress === 0x4fcc); rec('M42+', 'ishar2-save-layout.ts Feldliste', !fld, `0x4fcc im Save: ${fld ? 'ja' : 'nein'} (erwartet nein)`); }
} else rec('S*', 'ishar2-save-layout.ts', false, 'kein IO.IO übergeben');
for (const id of ['S01', 'S02', 'S03']) { const v = byId[id]; const r = oc.readOriginalCarrier(mk(v.input.save), v.input.char); rec(id, 'original-commerce.ts readOriginalCarrier', r.money[0] * 1000 + r.money[1] === v.expected.value); }
{ const v = byId.S10, s = sa.readActorSave(mk(v.input.save)); rec('S10', 'save-actors.ts readActorSave (Kopf)', eq({ row: s.row, col: s.col, facing: s.facing, map: s.map, zone: s.scene }, v.expected.value)); }
{ const b = mk([{ offset: 0, be16: 2 }, { offset: 6781 + 69, u8: 12 }, { offset: 3041 + 138, be16: 3 }]); const s = sa.readActorSave(b); const a69 = s.actors.find((x) => x.id === 69); rec('M29r', 'save-actors.ts readActorSave (Actor 69 Szene 6850, Blick 3179/3180)', a69.scene === 12 && a69.facing === 3, 'nur Lesen; Stundenlogik fehlt'); }
// pickup
for (const id of ['P01', 'P03', 'P08']) {
  const v = byId[id], b = mk(v.input.save), view = { ...v.input.view, scene: 0 };
  const p = gr.pickOriginalGround(b, view, 9); const r = p && gr.receiveOriginalGround(p, 9, 0);
  if (v.expected.rejected) rec(id, 'original-ground-runtime.ts pickOriginalGround+receiveOriginalGround', !!p && r === null, 'voll -> null (Objekt bleibt im Boden-Puffer, Kit trennt die Schritte)');
  else rec(id, 'original-ground-runtime.ts pickOriginalGround+receiveOriginalGround', !!r && eq(diff(b, r), v.expected.changes));
}
for (const id of ['P02', 'P04', 'P05', 'P06', 'P07']) rec(id, '(kein Kit-Modell für Handplätze 9/10 und Rüstung 0x2f0e)', false, 'fehlt');
// combat
for (const v of fx.vectors.filter((x) => x.contract.startsWith('combat'))) if (v.status !== 'unknown') rec(v.id, '(kein Kampfmodul im Kit; nur cont-grid.ts trapDamage für Fallen)', false, 'fehlt');
// magic-ishar1 (Hoth 2026-11-03): kit has only the ISHAR1_SAVE field map (save-maps.ts); no Ishar-1 magic functions.
{
  const smap = await imp('save-maps.ts'), F = smap.ISHAR1_SAVE.fields, v = byId['I31'], c = v.input.c;
  const at = (f) => (f ? f.offset + f.stride * c : undefined);
  for (const [k, kf] of [['mental', 'psychic'], ['level', 'level']]) {
    const got = at(F[kf]); rec(`I31.${k}`, `save-maps.ts ISHAR1_SAVE.fields.${kf} (offset+stride*c)`, got === v.expected[k], `bekommen ${got} erwartet ${v.expected[k]}`);
  }
  for (const k of ['spell', 'rune', 'icon']) rec(`I31.${k}`, '(kein Feld in ISHAR1_SAVE)', false, `fehlt, erwartet ${v.expected[k]}`);
  const sz = smap.ISHAR1_SAVE.minLength; rec('I31.size', 'save-maps.ts ISHAR1_SAVE.minLength', sz <= 5216, `minLength ${sz} <= 5216 (keine Größe 5216 im Kit)`);
  for (const x of fx.vectors.filter((y) => y.contract === 'magic-ishar1' && y.id !== 'I31')) rec(x.id, `(keine Ishar-1-Magie im Kit: ${x.input.op})`, false, 'fehlt');
}
// shop/tavern/party Ishar 1 (Hoth 2026-11-03): kit has Ishar-2 commerce, generic gold arithmetic and ISHAR1_SAVE field map only.
{
  const om = await imp('original-merchants.ts'), ng = await imp('original-npc-gold.ts'), se = await imp('original-shop-entry.ts');
  const smap = await imp('save-maps.ts'), F = smap.ISHAR1_SAVE.fields;
  for (const id of ['SH03', 'SH04', 'SH05', 'SH06']) { const v = byId[id], i = v.input;
    const a = om.subtractOriginalPrice(i.gold, i.price); rec(id + '.m', 'original-merchants.ts subtractOriginalPrice', eq(a, v.expected.gold), `bekommen ${JSON.stringify(a)} erwartet ${JSON.stringify(v.expected.gold)}`);
    const d = ng.debitOriginalGold(i.gold, i.price); const g = d.insufficient ? null : d.gold; rec(id + '.n', 'original-npc-gold.ts debitOriginalGold', eq(g, v.expected.gold), `bekommen ${JSON.stringify(d)} erwartet ${JSON.stringify(v.expected.gold)}`); }
  { const v = byId.SH07, src = readFileSync(join(kit, 'src/lib/ishar/original-commerce.ts'), 'utf8'); const m = src.match(/(-?\d+)\s*<=\s*\w+\s*&&\s*\w+\s*<=\s*(-?\d+)/) || src.match(/>=\s*(-?\d+)[^;]*<=\s*(-?\d+)/);
    const lo = m ? +m[1] : null, hi = m ? +m[2] : null; const got = v.input.items.map((x) => lo !== null && x >= lo && x <= hi);
    rec('SH07', 'original-commerce.ts Stapelbereich (Quelltext gelesen)', eq(got, v.expected.stackable), `Kit-Bereich ${lo}..${hi} -> ${JSON.stringify(got)}, erwartet -66..-57 -> ${JSON.stringify(v.expected.stackable)}`); }
  { const O = oc.ORIGINAL_COMMERCE_OFFSETS, v10 = byId.SH10, v11 = byId.SH11, v09 = byId.SH09;
    rec('SH10', 'original-commerce.ts ORIGINAL_COMMERCE_OFFSETS.goldThousands (+2c)', O.goldThousands + 2 * 2 === v10.expected.goldK, `bekommen ${O.goldThousands + 4} erwartet ${v10.expected.goldK} (Ishar-2-Layout)`);
    rec('SH10.s', 'save-maps.ts ISHAR1_SAVE.fields.gold', F.gold && F.gold.offset === v10.expected.goldKLow, `bekommen ${F.gold?.offset} (1 Feld, u8) erwartet Tausender c2 Low ${v10.expected.goldKLow}`);
    rec('SH11.u', 'ORIGINAL_COMMERCE_OFFSETS.goldRemainder (+2c)', O.goldRemainder + 4 === v11.expected.goldU, `bekommen ${O.goldRemainder + 4} erwartet ${v11.expected.goldU}`);
    rec('SH11.i', 'ORIGINAL_COMMERCE_OFFSETS.inventory', false, `Kit ${O.inventory} (Ishar 2), erwartet Basis 498, c2 k3 -> ${v11.expected.item}`);
    rec('SH09', 'ORIGINAL_COMMERCE_OFFSETS.stacks', false, `Kit ${O.stacks} (Ishar 2), erwartet 4971+10c+(item+66) -> ${v09.expected.offset}`); }
  { const v = byId.SH01, got = v.input.cells.map(([x, y, z]) => se.originalShopEntry(z)); rec('SH01', 'original-shop-entry.ts originalShopEntry (Layer-B-Wert, nicht (x,y,zone))', false, `anderes Modell; mit zone als Wert: ${JSON.stringify(got)}; erwartet Läden ${JSON.stringify(v.expected.shop)}`); }
  for (const id of ['SH02', 'SH08', 'SH12']) rec(id, `(kein Ishar-1-Händler im Kit: ${byId[id].input.op})`, false, 'fehlt');
  for (const x of fx.vectors.filter((y) => y.contract === 'tavern-ishar1')) rec(x.id, `(keine Ishar-1-Taverne im Kit: ${x.input.op})`, false, 'fehlt');
  { const v = byId.PA01, c = 3, at = (f) => (f ? f.offset + (f.stride ?? 0) * c : undefined);
    rec('PA01.class', '(kein Klassenfeld in ISHAR1_SAVE)', false, `fehlt, erwartet ${v.expected.class}`);
    for (const [k, kf] of [['level', 'level'], ['mental', 'psychic']]) { const got = at(F[kf]); rec(`PA01.${k}`, `save-maps.ts ISHAR1_SAVE.fields.${kf}`, got === v.expected[k], `bekommen ${got} erwartet ${v.expected[k]}`); }
    const sz = smap.ISHAR1_SAVE.minLength; rec('PA01.size', 'save-maps.ts ISHAR1_SAVE.minLength', sz <= 5216, `minLength ${sz} <= 5216`);
    const w = byId.PA02; const hp = at(F.hp); rec('PA02.hp', 'save-maps.ts ISHAR1_SAVE.fields.hp', hp === w.expected.hp, `bekommen ${hp} erwartet ${w.expected.hp}`);
    for (const k of ['maxHp', 'food', 'npc', 'rel', 'grid']) rec(`PA02.${k}`, '(kein Feld in ISHAR1_SAVE)', false, `fehlt, erwartet ${w.expected[k]}`); }
  for (const x of fx.vectors.filter((y) => y.contract === 'party-ishar1' && !['PA01', 'PA02'].includes(y.id))) rec(x.id, `(keine Ishar-1-Party im Kit: ${x.input.op})`, false, 'fehlt');
}
// savemap Ishar 1 (Hoth 2026-11-03): Quesh-Map gegen save-maps.ts ISHAR1_SAVE
{
  const smap = await imp('save-maps.ts'), M = smap.ISHAR1_SAVE, F = M.fields;
  const at = (f, c) => (f ? f.offset + (f.stride ?? 0) * c : undefined);
  rec('SM01', 'save-maps.ts ISHAR1_SAVE.minLength', M.minLength === 5216, `minLength ${M.minLength}, erwartet 5216`);
  const KF = { class: 'class', race: 'race', level: 'level', mental: 'psychic', goldK: 'gold', goldU: 'goldThousands', xp: 'xp', hp: 'hp', hpMax: 'hpMax', str: 'strength', con: 'constitution', wis: 'wisdom', int: 'intelligence', agi: 'agility', physical: 'physical', temper: 'temper', armor: 'armor', npc: 'npcId', rune: 'rune' };
  for (const v of fx.vectors.filter((y) => y.contract === 'savemap-ishar1' && y.input.op === 'offsets')) for (const f of v.input.fields) {
    const kf = KF[f] ?? f, got = v.input.c.map((c) => at(F[kf], c)); rec(`${v.id}.${f}`, `save-maps.ts ISHAR1_SAVE.fields.${kf}` + (F[kf] ? '' : ' (fehlt)'), eq(got, v.expected[f]), `bekommen ${JSON.stringify(got)} erwartet ${JSON.stringify(v.expected[f])}`); }
  { const v = byId.SM05, b = new Uint8Array(5216); for (const f of v.input.save) if ('u8' in f) b[f.offset] = f.u8; const got = F.race ? [0, 1, 2, 3, 4].map((c) => smap.raceName(M, b[at(F.race, c)])) : null;
    rec('SM05', 'save-maps.ts raceName(ISHAR1_SAVE, fields.race)', eq(got, v.expected.race), `bekommen ${JSON.stringify(got)} erwartet ${JSON.stringify(v.expected.race)}`); }
  for (const id of ['SM06', 'SM07', 'SM08']) { const v = byId[id]; rec(id, 'save-maps.ts ISHAR1_SAVE.fields.gold/goldThousands (2 Felder, BE16, stride 2)', !!(F.gold && F.goldThousands && F.gold.offset === 3993 && F.goldThousands.offset === 478), `Kit gold @${F.gold?.offset} size ${F.gold?.size}, goldThousands ${F.goldThousands ? '@' + F.goldThousands.offset : 'fehlt'}; erwartet Tausender 478+2c, Rest 3993+2c`); }
  rec('SM09', '(kein Aufteilen/Speicherkosten-Modell für Ishar 1 im Kit)', false, 'fehlt');
  for (const id of ['SM31', 'SM32', 'SM33']) rec(id, `(kein Ishar-1-${byId[id].input.op}-Feld in ISHAR1_SAVE)`, false, 'fehlt');
  { const offs = Object.values(F).map((f) => f.offset); rec('SM34', 'save-maps.ts ISHAR1_SAVE Felder < 5216 (keine Ishar-2-Offsets)', offs.every((o) => o < 5216), `max ${Math.max(...offs)}`); }
}
// monster-ki (Hoth 2026-11-03): save-actors.ts readActorSave gegen MK25; Rest ohne Kit-Gegenstück
{
  const sa = await imp('save-actors.ts'), v = byId.MK25, b = new Uint8Array(8359); b[1] = 2;
  const put = (o, x) => { b[o] = x >> 8; b[o + 1] = x & 255; };
  v.input.i.forEach((n, k) => { put(v.expected.x[k], 11 + k); put(v.expected.y[k], 21 + k); put(v.expected.facing[k], 3); put(v.expected.hp[k], 62 + k); b[v.expected.zone[k]] = 58; });
  const r = sa.readActorSave(b), got = v.input.i.map((n) => r?.actors.find((a) => a.id === n)), exp = v.input.i.map((n, k) => [11 + k, 21 + k, 3, 62 + k, 58]);
  rec('MK25', 'save-actors.ts readActorSave (row=x 2601, col=y 2821, facing 3041, hp 3261, scene 6781)', eq(got.map((a) => a && [a.row, a.col, a.facing, a.hp, a.scene]), exp), `bekommen ${JSON.stringify(got.map((a) => a && [a.row, a.col, a.facing, a.hp, a.scene]))}`);
  for (const x of fx.vectors.filter((y) => y.contract.startsWith('monster-ki') && y.id !== 'MK25')) rec(x.id, `(keine Monster-KI im Kit: ${x.input.op})`, false, 'fehlt');
}
const ok = rows.filter((r) => r.ok).length;
for (const r of rows) console.log(`${r.ok ? 'PASST ' : 'NEIN  '} ${r.id.padEnd(5)} ${r.fn}${r.note ? '  — ' + r.note : ''}`);
console.log(`\nKit: ${kit}\nPasst: ${ok}/${rows.length}`);
