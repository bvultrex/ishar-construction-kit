#!/usr/bin/env node
// Hoth 14.11.2026: abhaengigkeitsfreier Checker fuer opcode75-vectors.json mit eigenem Referenzmodell.
// Opcode 75 (Byte 0x4B, cerasen): entfernt alle Grafikdatensaetze des aktiven Kontexts mit (screenId, num).
// Exit 0 nur, wenn jeder record-list-Vektor exakt zum Modell passt und die Meta-Vektoren formal vollstaendig sind.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const fx = JSON.parse(readFileSync(process.argv[2] ?? join(here, 'opcode75-vectors.json'), 'utf8'));
const s8 = (v) => ((v & 255) ^ 128) - 128, s16 = (v) => ((v & 0xffff) ^ 0x8000) - 0x8000;
function model(v) {
  const st = structuredClone(v.start);
  const R = new Map(st.records.map((r) => [r.addr, r]));
  const links = Object.fromEntries(Object.entries(st.linkHeads).map(([k, x]) => [k, x]));
  let head = st.head, free = st.free, ferase = st.ferase; const steps = [];
  const search = (num) => { // Suche ab Kopf; Liste absteigend nach screen, dann num (signed)
    let pred = 0, cur = head;
    while (cur) { const r = R.get(cur);
      if (s16(st.screenId) < s16(r.screen)) { pred = cur; cur = r.next; continue; }
      if (s16(st.screenId) !== s16(r.screen)) return null;
      if (num < r.num) { pred = cur; cur = r.next; continue; }
      return num === r.num ? { pred, cur } : null; }
    return null; };
  for (const op of v.input.ops) {
    const num = s8(op.value); let hang = false;
    for (let f = search(num); f; f = search(num)) {
      const r = R.get(f.cur);
      if (f.pred) R.get(f.pred).next = r.next; else head = r.next;
      if (ferase === 0 && r.state >= 0) { r.state = 1; continue; }
      r.next = free; free = f.cur; // Freiliste, danach +6-Kette der Bildschirm-ID
      const key = String(r.screen);
      if (links[key] === f.cur) { links[key] = r.link; continue; }
      let si = links[key] ?? 0; while (si && R.get(si) && R.get(si).link !== f.cur) si = R.get(si).link;
      if (!si || !R.get(si)) { hang = true; break; }
      R.get(si).link = r.link;
    }
    if (hang) { steps.push({ returned: false }); break; }
    ferase = 0;
    steps.push({ returned: true, siAdvance: op.operand === 'oimmb' ? 2 : 3, dsRestored: true, spRestored: true, esUnchangedReg: true, bpUnchangedReg: true, numByte: op.value & 255, ferase: 0 });
  }
  return { steps, after: { head, free, ferase, linkHeads: links, records: st.records } };
}
const LABELS = new Set(['known', 'suspected', 'open']);
let ok = 0, bad = 0; const count = {};
for (const v of fx.vectors) {
  const errs = [];
  if (!LABELS.has(v.label)) errs.push('label');
  if (!v.profiles?.length || v.profiles.some((p) => !p.profile || (p.exePrefix ?? '').length > 12 || (p.captureMemPrefix ?? '').length > 12)) errs.push('profile/hash-prefix');
  for (const k of ['start', 'input', 'expected', 'evidence']) if (!(k in v)) errs.push('fehlt ' + k);
  if (v.kind === 'record-list') {
    const m = model(v), e = v.expected;
    const exSteps = e.steps.map((s) => (s.returned ? s : { returned: false }));
    if (JSON.stringify(m.steps) !== JSON.stringify(exSteps)) errs.push('steps ' + JSON.stringify(m.steps) + ' != ' + JSON.stringify(exSteps));
    for (const k of ['head', 'free', 'ferase']) if (m.after[k] !== e.after[k]) errs.push(k + ' ' + m.after[k] + ' != ' + e.after[k]);
    if (JSON.stringify(m.after.linkHeads) !== JSON.stringify(e.after.linkHeads)) errs.push('linkHeads');
    if (JSON.stringify(m.after.records) !== JSON.stringify(e.after.records)) errs.push('records ' + JSON.stringify(m.after.records));
    const oc = e.after.otherChanges; if (oc && (oc.es || oc.records || oc.script || oc.ssGlobals.length)) errs.push('Seiteneffekte ausserhalb Modell');
    if (v.profilesIdentical !== true) errs.push('Profile nicht identisch');
  }
  count[v.kind] = (count[v.kind] ?? 0) + 1;
  if (errs.length) { bad++; console.log('ROT', v.id, errs.join('; ')); } else ok++;
}
const labels = fx.vectors.reduce((a, v) => ((a[v.label] = (a[v.label] ?? 0) + 1), a), {});
console.log(JSON.stringify({ vectors: fx.vectors.length, green: ok, red: bad, kinds: count, labels }));
process.exit(bad ? 1 : 0);
