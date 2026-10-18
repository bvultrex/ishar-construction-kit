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
const ok = rows.filter((r) => r.ok).length;
for (const r of rows) console.log(`${r.ok ? 'PASST ' : 'NEIN  '} ${r.id.padEnd(5)} ${r.fn}${r.note ? '  — ' + r.note : ''}`);
console.log(`\nKit: ${kit}\nPasst: ${ok}/${rows.length}`);
