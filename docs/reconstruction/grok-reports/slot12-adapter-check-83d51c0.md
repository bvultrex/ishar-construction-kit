# Ausrüstungsplatz 12 Ishar 2: Kit 83d51c0/17245f4 gegen FRISE
Stand: 2026-11-14 (Europe/Berlin). Quesh, nur statische Arbeit.

- **Geprüft:**
  - `83d51c0`: `original-equipment-runtime.ts`, Wiring in `playtest.tsx`
  - `17245f4`: Fixture-Generator, nur Plausibilität
- **Kit-Tip:** `8b2a4ee`. Nach `83d51c0` gibt es keine weiteren Änderungen an den Adapterdateien.
- **Original:** FRISE.IO `27117c124caf`, vollständige Dekodierung 0x026cf–0x02a66 und `L_03f22`.
- **Ergebnis:** Für (a)–(d) gibt es keine Abweichung im unterstützten Umfang. Alle Punkte sind known.

## (a) Codes −89..−82
| Kit | FRISE | Ergebnis |
|---|---|---|
| Z. 4 `originalProvenEquipmentCode`: −89..−82; Z. 19: nur Slot 12 | 0x027d2/0x027e8: gehaltener Code in −89..−82 → Slot 12 (unabhängig vom Klickband); 0x0294c: Slot 12 nimmt nur −89..−82 an, sonst cret (0x02962) | passt |
| Z. 21: alter Code außerhalb des Bereichs → null | Das Original tauscht jeden gespeicherten Wert (keine Prüfung des alten Codes) | Grenze, konservativ |

## (b) Speicherform
| Kit | FRISE | Ergebnis |
|---|---|---|
| Z. 22: Slot = Code + 1 | 0x029b4 (Ablage) und 0x02a23 (Tausch): gehaltener Code + 1 | passt |
| Z. 12/21: gespeichert − 1 | 0x0275a/0x0277f (Entnahme) und 0x029f6/0x02a48 (alter Code beim Tausch): gespeichert − 1 | passt |

Die Richtung ist bestätigt: + 1 beim Speichern, − 1 beim Lesen. Ishar 1 verwendet dagegen + 5.

## (c) Rüstung
| Fall | Kit | FRISE | Ergebnis |
|---|---|---|---|
| Wertquelle | `originalItemArmour` (`original-inventory-runtime.ts` Z. 8/9) | `L_03f22` über 0x2d16; in −89..−82 haben nur die ungeraden Codes einen Wert ≠ 0, die geraden 0 (`L_04016`) | Werte für −89..−82 identisch |
| Entnahme | Z. 14: − Wert(gespeichert − 1) | 0x02798/0x0279c csub, mit 0x2d16 = gespeichert − 1 (0x0277f) | passt |
| Ablage auf leeren Slot | Z. 23: + Wert(neu) | 0x029cf/0x029d3 cadd | passt |
| Tausch | Z. 23: + neu − alt, ein Byte-Write mit & 255 | 0x02a3e cadd (neu), 0x02a5c csub (alt) | gleiches Endbyte, da modulo 256 |

## (d) Reihenfolge beim Tausch
Original:
1. Cursor löschen (0x029ec).
2. Neues Cursorobjekt mit altem Code − 1 (0x029f6–0x02a14).
3. Slot = neuer Code + 1 (0x02a23).
4. + Rüstung neu (0x02a3e).
5. 0x2d16 = alter Code − 1 (0x02a48).
6. − Rüstung alt (0x02a5c), danach cmousoff.

Kit:
- Z. 22: Slot-Write.
- Z. 23: Rüstung netto.
- Z. 24: `held` = alter Code. In `playtest.tsx` wird der Cursor danach auf `held` gesetzt.

Endzustand und Cursor stimmen überein. Die Zwischenstände im Original sind nur RAM und werden nicht gespeichert.

## Grenzen (keine Abweichungen)
- Die Entnahme im Original prüft keinen Codebereich (0x0274c, nur ≠ 0). Das Kit lehnt gespeicherte Werte außerhalb von −88..−81 ab (Z. 12). Konservativ.
- Im Original landet ein gehaltener Code aus einem anderen Bereich (z. B. Slot 11/13/14) auch über das Band von Slot 12 in seinem eigenen Slot (0x027b3–0x02826). Das Kit hält diese Slots geschlossen und deaktiviert den Button.
- `L_02bb7` (Sonderwirkung −31), `L_03349` und `L_0337f` (Anzeige) betreffen −89..−82 nicht und gehören nicht zum Prüfumfang.
- `17245f4` erzeugt synthetische Fixtures. Die erwarteten Slot- und Rüstungsänderungen passen zu (b) und (c).

Keine SAV-Werte, Originalbytes, Dumps oder Profilwerte in diesem Bericht.
