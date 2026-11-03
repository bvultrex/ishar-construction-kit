# Hoth Abnahme 2026-11-03 (12:41–13:00 CET)

## 1 Ishar-1-Save-Offsets — Urteil: known (Kit-Offsets widerlegt)
- Frische Kopie private/ishar1save/work, Conf dosbox-x-hoth-ishar1.conf (cycles fixed 25000), Xvfb :98.
- HOA -> Mentalschild (c3 auf c0) -> HOB, cmp: 771 72->67 (MENTAL 768+c, c=3), 698/699 Timer 0x01BC, 4921 Icon, 483 Gold (Speichern 1000 GS).
- Level 738+c = [10,10,10,8,8] = Bögen im Spiel; Class 728+c = [1,17,18,6,9] = Krieger, Finsterer Ritter, Okkulter Mönch, Zauberer, Priester (Kit-Namen „Schwarzer Ritter“/„Magier“ abweichend, IDs passen).
- Kit ISHAR1_SAVE: psychic 0x2e9+c (10,10,12,18,20, unverändert) und level 0x3e2+c (79,77,0,0,0) falsch; kein Klassenfeld. Vorschlag (nur Bericht): level 738+c, mental 768+c, class 728+c.
- Save-Größe 5216 bestätigt. Speichermenü schließt selbst (kein Schließklick).

## 2 Tür 5 beim Drehen — Urteil: known
- HOT5A -> Klick Rahmen -> HOT5B: 7386 0->1. HOT5E (Kopie HOT5B, ticks 0) -> TL -> HOT5F: 7386 1->0, Blick 3->2, sonst nur Ticks.
- Gegenprobe Laden: HOT5E -> HOT5D: 7386 = 1.
- HOT5C ungültig (erstes Laden nach Boot nicht ausgeführt, Bild 10 zeigt Startinsel) — verworfen, Test als HOT5F wiederholt (vorher Dummy-Laden HOT5A).
- Statisch: GERDEP Switch 0x00623; TL = L_007e2 -> 0x0083a cjsr L_013af, TR = L_00913 -> 0x0096b, beide ohne Bedingung; Schritt nur bei odirb(0x16)==1 (0x0066a). L_013af: 0x4b80[0..2]=0 (0x013d5/0x013df/0x013e9), 0x4aa4[5/9/17]=0 (0x013f3/0x013fd/0x01407). Deckt M52/M54 (9/17). Mein Teil-1-Satz „L_013af nicht beim Drehen“ ist falsch.
- Kontakte bleiben beim Drehen (M57) trotz Leeren: Neueintrag vermutet, suspected; Test außerhalb Reichweite nicht gemacht.
- Tür 9 regulär öffnen: weiter erfolglos (HOT9L, HOT9Q: 7390=0; kein Rahmen im Bild). Offen.
- Branch grok/hoth-contract-fixtures Commit 3f3c7b3: M49 = turn -> {7386:0} known; M58 (blockedStep -> {}) abgespalten, suspected; Checker-Turn-Modell 5/9/17. Checker grün (152 Vektoren), Audit 0 Treffer, Probe 57/136. Clone wieder auf 319819c.

## 3 M48/M52/M54/M56 — Urteil: Kit-Lücken, Fixtures korrekt
| Vektor | Ist (Kit) | Soll | Ursache | Beleg |
|---|---|---|---|---|
| M48 | {7390:0,7398:0} | +7576–7578:0 | Kit-MechState hat keine Kontaktliste | GERDEP 0x013d5–0x013e9; M56 |
| M52 | {} | {7398:0} | kein Turn-Hook im Kit | HOT17J; 0x0083a -> 0x01407 |
| M54 | {} | {7390:0} | dto. | HOT9J; 0x013fd |
| M56 | {} | {7577:0} | keine Kontaktliste | HOTKC; 0x013df |
| M49 (neu) | {} | {7386:0} | kein Turn-Hook | HOT5F |
Fixture-Korrektur nur an Notizen (M52 „Mechanismus unbekannt“, M57 „ruft nicht L_013af“).
Diff-Vorschlag Kit (nicht angewendet), src/lib/ishar/door-mechanics.ts:
```
+export function afterTurn(state: MechState) {
+  const s = clone(state), ev: MechEvent[] = [];
+  for (const d of STEP_RESET_DOORS) setDoor(s, ev, d, false, "GERDEP L_013af via 0x0083a/0x0096b");
+  s.contacts = [0, 0, 0]; // 0x4b80[0..2]; Spiel trägt Monster in Reichweite neu ein (M57)
+  return { state: s, events: ev };
+}
 export function afterStep(...) { ...
+  s.contacts = [0, 0, 0]; // GERDEP 0x013d5-0x013e9
```
plus `contacts: number[]` in MechState/newMechState und Save-Mapping 7576–7578.

## Abschluss
- sha256 vorher/nachher: 746/746 OK (originals 311, dosbox 435). Neue Slots nur in privaten Kopien.
- Eigene DOSBox/Xvfb :98 beendet; fremde Instanzen nicht angefasst. Kein Gesamt-Grün.
