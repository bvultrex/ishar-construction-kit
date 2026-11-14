# Item-Transfer-Prüfung Ishar 2: Kit cb511ba / de424b7 (Kontext 7b2a075) gegen FRISE
Stand: 2026-11-14 (Europe/Berlin). Quesh, nur statische Arbeit.

- **Kit-Tip:** `workbench/playable-slice` `21bc808`.
- **Geprüft:**
  - `cb511ba` (Handtausch, Rüstung)
  - `de424b7` (Handpanel-Routing)
  - Kontext `7b2a075` (Entnahme aus Slots, Übergabe)
- **Original:** FRISE.IO `27117c124caf` (Ishar 2, Listing).
- **Vertragsbasis:** `quesh/pickup-contract-ishar2.md/.json` und `pickup-contract-check-ishar2.md` in der gepushten Fassung (Branch `grok/reports-2026-10-18`, nach `bfa1de5`).
- **Ergebnis:** Im unterstützten Umfang gibt es **keine konkrete Abweichung**. Die Grenzen unten sind keine Fehler, sondern bewusst nicht modellierte Original-Pfade.

## (1) Unterstützte Nichtstapelcodes 9, −89..−60, −29..−25
| Prüfpunkt | Kit | FRISE | Label | Ergebnis |
|---|---|---|---|---|
| Codeauswahl | `original-inventory-runtime.ts` `simpleOriginalInventoryCode`, Z. 4 | Zweihand-Zweig nur für −116..−90 (0x02e36). Stapel −59..−49 (0x03bf4, 0x02f19). Porträt nimmt nur gehalten < −14 oder > 0 an (0x007e3). | known | passt: Kein unterstützter Code fällt in einen Sonderzweig. |
| Rüstungstabelle | Z. 5 `armour` | `L_03f22`, 18 Codes, sonst 0 | known | passt (identisch) |
| Gepäckziel | `placeOriginalInventoryItem` Z. 37 (erster freier Slot 0..8) | `L_03bef` 0x03c45–0x03c98 | known | passt |
| Volle Tasche | Z. 37 → null, Item bleibt gehalten (`playtest.tsx` `giveOriginalGround`, Z. 934) | 0x03c9a `cret`, nichts geschrieben | known | passt |
| Handfeld leer | Z. 41/44: Slot = Code, Rüstung += Tabelle | 0x02f5a, 0x02f68/0x02f92 (OR-Tautologie, also immer) | known | passt |
| Entnahme | `takeOriginalInventoryItem` Z. 19–27: Slot = 0, bei Slot 9/10 Rüstung −= Tabelle | `L_02c0f` 0x02c71/0x02c9b (OR, immer), 0x02dbb Slot = 0; −125 und 0 werden nicht entnommen (0x02c2a) | known | passt |
| Rüstungsbyte | `&255` (Z. 25, 45) | `maintc`-Byte ohne Klemmung | Wraparound suspected | passt |

## (2) Handtausch
| Prüfpunkt | Kit | FRISE | Label | Ergebnis |
|---|---|---|---|---|
| Tauschbedingung | Z. 39: alter Code einfach, Handfeld gewählt | 0x03012: −125 → keine Aktion; gleicher Stapelcode → zusammenführen; 16 → Sonderzweig; sonst `L_0315b` (bei T4bbc == 0) | known | passt im unterstützten Umfang. −125 und Sondercodes werden im Kit abgelehnt. |
| Rüstung beim Tausch | Z. 43–44: `swapArmour(neu) − swapArmour(alt)`, nur −29..−26 | 0x032d8/0x03302 (+ neu), 0x03313/0x0333d (− alt), jeweils AND, also −29..−26 | known | passt |
| −25-Fall | −25 hinein: +0; −25 heraus beim Tausch: −0; spätere Entnahme oder Ablage: ±4 (Z. 25, 44) | gleiche Asymmetrie (AND beim Tausch, OR bei Ablage und Entnahme) | known | passt, inklusive Drift |
| Cursor nach Tausch | `playtest.tsx` Z. 935: gehalten = alter Code | 0x0330c: 0x2d16 = alter Code, Cursor bleibt | known | passt |
| Ablage eines negativen Codes auf den Boden | `dropOriginalGround` nur 9/10 | SOURIS 0x007b0 verlangt 0x2d16 > 0 | known | passt |

## (3) Empfängerrouting
| Prüfpunkt | Kit | FRISE | Label | Ergebnis |
|---|---|---|---|---|
| Code 10 | `originalPortraitItemDestination` Z. 10, `receiveOriginalGround` Goldzweig, auch über Handfeld (`playtest.tsx` Z. 933) | 0x0032b vor 0x007e3; Handfelder liegen bei y_up < 75 | known | passt |
| Handpanel offen | Z. 11 → `hand-panel`; Porträt schreibt nichts (`playtest.tsx` Z. 930–931); Handfelder nur bei offenem Panel sichtbar (Z. 1239) | 0x007e3 (T4f0a ≠ 1 → Gepäck), 0x0080c (T4f0a == 1 → nur Handfeldzonen, sonst nichts) | known | passt (T4f0a ist im Kit ein boolescher Wert; die Werte 2/3 führen wie im Original ins Gepäck) |
| Handlungsfähigkeit | Z. 36 (Gepäck und Hand), `receiveOriginalGround` Z. 51 | 007C9 umschließt sowohl 0x007e3 als auch 0x0080c; Code 10: 0x0034d | known | passt |
| −125 im Handfeld | Z. 39 → null | 0x03012 → keine Aktion | known | passt |
| Release | Kit gibt immer frei | 0x03c9b/0x02fdb/0x0315b nur bei T4bbc[0..19] == 0 | T4bbc bei Nichtstapelcodes = 0: suspected | passt |

## Grenzen (keine Abweichungen)
- **Charakterblatt-Pfad** `L_02610` (0x009af: 0x2ab7 == 1, Raster inkl. Handfelder 9/10) wird im Kit nicht modelliert.
  - Dort gibt es keine 007C9-Prüfung (suspected). Ablage und Entnahme wären also auch bei nicht handlungsfähigen Figuren möglich.
  - Gepäckslots 0..8 lassen sich dort gezielt belegen und tauschen.
  - Dass das Kit ohne HP-Gate entnimmt (Z. 17–18), ist mit diesem Pfad vereinbar.
- **Tausch mit nicht unterstützten alten Codes:** Das Original tauscht generisch (`L_0315b`), auch Zweihandwaffen ohne Freigabe des −125-Markers. Das Kit lehnt ab, also konservativ.
- **Porträtzone:** Bei y_up < 15 öffnet ein Klick das Charakterblatt (0x0066b), es wird nichts abgelegt. Das betrifft nur die Klickgeometrie; das Kit nutzt Buttons.

Keine SAV-Werte, Originalbytes oder Dumps in diesem Bericht.
