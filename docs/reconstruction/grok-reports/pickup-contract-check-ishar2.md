# Pickup-Prüfung Ishar 2, Codes 9/10, Karte 1: Original gegen Kit f4cf659
Stand: 2026-11-14 (Europe/Berlin). Quesh, nur statische Arbeit.

**Geprüfter Kit-Stand:** `workbench/playable-slice` `f4cf659`.
- Der Clone ist nur per `git fetch` aktualisiert. Arbeitsbaum, Checkout und Commits bleiben unberührt; gelesen wurde über `git show`/`git diff`.
- Diff `319819c..f4cf659` im Pickup-Pfad:
  - `original-ground-runtime.ts`: HP-Gate in `receiveOriginalGround`.
  - `playtest.tsx`: Inventaransicht und Porträt-Sperre.
  - `check-original-ground.mjs`, neu `check-original-ground-recipient-local.mjs` und `check-original-ground-roundtrip-local.mjs`.
  - `pickOriginalGround` ist unverändert.

**Original-Hashes (Präfixe):**
- FRISE.IO `27117c124caf`
- SOURIS.IO `78df7c73f880`
- OBJET.IO `51ec1fdf24be`
- AFFOBJ.IO `40b882fbadff`
- start.exe `5e35e58d2d13`

**Nicht wiederholt:** Gate FRISE 007C9 (Fix 9beadfd).

**Save-Umrechnung** (IO.IO-Ableitung, known):

| RAM | Save | Inhalt |
|---|---|---|
| T2aba+id | 336+id | Weltobjekt Zeile |
| T2b84+id | 536+id | Weltobjekt Spalte |
| T2c4e+id | 736+id | Weltobjekt Karte |
| T50c8+id | 8039+id | Weltobjekt Blickrichtung |
| T2d8e | 1036+30c+2s | Inventar-Slot, BE16 |
| T2f0e | 1336+c | Rüstung |
| T2d68 | 1006+2c | Gold, Tausender |
| T2d80 | 1026+2c | Gold, Einheiten |
| 0x4c94 | 14–15 | Geldbeutel, Tausender |
| 0x4c96 | 16–17 | Geldbeutel, Einheiten |
| 0x4f13 | 20–21 | Szenen-Flag |
| T449a | 6843+i | Tabelle, Index i |

Transient, also nicht gespeichert: 0x2d16 (gehalten), 0x2fc0 (Cursor-Entity), 0x4f0a, 0x4bbc, 0x4aa0, 0x4f10.

## (a) Gespeicherte Writes, die im Kit fehlen oder abweichen

| # | Original (Adresse) | RAM → Save | Formel | Label | Kit (f4cf659) |
|---|---|---|---|---|---|
| A1 | FRISE 0x0032b–0x00375, `L_04825`/`L_06865`: **Code 10** auf Porträt oder Handfeld (y_up < 75), c lebend | T2d80[c] → 1026+2c; T2d68[c] → 1006+2c; 0x4c94/96 → 14–17 | Einheiten += 0x4c96; Tausender += 0x4c94 + ⌊Einheiten/1000⌋, Einheiten mod 1000; danach 0x4c94 = 0x4c96 = 0. **Kein Slot-Write**, Objekt verbraucht | known (Listing) | `receiveOriginalGround` (original-ground-runtime.ts) schreibt Code 10 in den ersten freien Slot 1036+30c+2s. **Abweichung.** `check-original-ground-roundtrip-local.mjs` erwartet diesen Slot-Write auch für 10. |
| A2 | SOURIS 0x009ce–0x009f0: Bodenablage | T2c4e/T2aba/T2b84/T50c8[id] → 736/336/536/8039 + id | Karte = 0x2d18; Feld vor der Gruppe (Karte 1, 0x008f0); **T50c8[id] = 0x2ab6** | known | `returnOriginalGround` (playtest.tsx Z. 898) stellt den Snapshot von vorher wieder her. Weicht ab bei Byte 8039 + id, falls der alte T50c8-Wert ≠ aktuelle Blickrichtung (Anzeige auf Karte 1 gleich, L_00287). Die übrigen drei Felder sind gleich, solange die Gruppe sich nicht bewegt hat (suspected). |
| A3 | FRISE `L_0259c` → `L_02e20` (0x02f5a): Ablage **Code 9** auf Handfeld 9/10 | T2d8e[c][9/10] → 1036+30c+18/20 | Slot = 9; T2f0e += Rüstung(9) = 0 | known | fehlt: kein Handfeld-Pfad |
| A4 | FRISE 0x03012–0x03347: Tausch mit belegtem Slot (Handfeld oder Charakterblatt) | Slot → 1036+30c+2s; T2f0e[c] → 1336+c | Slot = 9; 0x2d16 = alter Code; Rüstung ±, **nur für −29..−26** (AND bei 0x032d8/0x03313). Bei Ablage und Aufnahme gilt dagegen immer (OR) | known | fehlt. Folge im Original: Tauscht 9 ein −25 aus der Hand (Rüstung 4), bleibt 1336 + c um 4 erhöht. |
| A5 | FRISE `L_02c0f` (0x02c1c–0x02dbb): Aufnahme aus einem Slot, z. B. für eine Übergabe an eine andere Figur | Slot → 1036+30c+2s = 0; T2f0e −= Rüstung (Slots 9/10) | Slot = 0, 0x2d16 = Code | known | fehlt: Übergabe zwischen Figuren ist im Kit nicht möglich |
| A6 | SOURIS 0x00c74–0x00c91: gehalten == 9, 0x4aa0 == 1, Material 100 | 0x4f13 → 20–21 | 0x4f13 = 3, Freigabe. PP11 0x000fc: T449a[62] = 0 (Save 6905) | known (SOURIS); Szene PP11 suspected | fehlt (außerhalb der Kit-Karte 1) |
| A7 | SOURIS 0x004a6–0x004ba: Aufnahme vom Boden | 336/536/736 + id = 0 | – | known | `pickOriginalGround` stimmt überein. T50c8 bleibt im Original und im Kit unverändert. |

## (b) Abbruch- und Freigabebedingungen

| Fall | Original | Kit | Bewertung |
|---|---|---|---|
| Rucksack voll (Slots 0..8) | `L_03bef` 0x03c9a `cret`: nichts geschrieben, Item bleibt am Cursor | `receiveOriginalGround` → null, Item bleibt gehalten | stimmt (known); für Code 10 nicht anwendbar (A1) |
| Falscher Empfänger (HP ≤ 0 oder Klasse −1) | 007C9 bzw. für Code 10 0x0034d (gleiches Prädikat): keine Aktion | null bzw. Button gesperrt | stimmt (007C9 von Codex geprüft) |
| Handpanel offen (T4f0a[c] == 1) | Porträtklick geht in die Handfeld-Logik statt ins Gepäck (0x007e3/0x0080c) | kein Handpanel | fehlt (transient, ohne Save-Folge) |
| Handfeld mit −125 belegt | 0x03012 → keine Aktion | – | fehlt |
| Bodenablage blockiert | Material-512-Objekt unter dem Cursor (0x008cf), Material 69 (0x00877), 0x4aa0 ≠ 0 (0x007b0), Viewport-Gate 0x0041c (x < 256, y_up > 72, 0x2ab7 == 0, 0x4fcf == 0) | Ablage nur durch Klick auf das blasse Sprite oder Escape | Verhalten weicht ab; für Escape ist kein Original-Gegenstück belegt (unknown) |
| Zielfeld der Ablage | Karte 1: Feld vor der Gruppe, ohne Begehbarkeitsprüfung | Fundort-Snapshot | gleich, solange Position und Richtung gleich bleiben (suspected); siehe A2 |
| Speichern mit Item am Cursor | unmöglich: `L_05c6e` (io.IO) nur bei 0x2d16 == 0 und 0x4aa0 == 0 (0x002b0, 0x00982) | Export gesperrt (`disabled={!!originalHeld}`) | stimmt (known) |
| Bewegen mit Item am Cursor | GERDEP `L_0055e` 0x00572 kehrt bei 0x2d16 ≠ 0 zurück | Bewegen und Drehen gesperrt | stimmt; ob GERDEP der einzige Bewegungspfad ist: suspected |
| Freigabe des Cursors | nur wenn alle T4bbc[0..19] == 0 (0x03c9b Porträt, 0x02fdb Handfeld, 0x0315b Tausch). Dann 0x2d16 = 0, `ckill 0x2fc0`, `cmouson`. Bodenablage 0x009fc–0x00a1a ohne T4bbc-Prüfung | immer | für 9/10 normal gleich (T4bbc dort 0, suspected) |
| Aufnahme-Gate | 0x2d16 == 0, 0x49d3 == 0, 0x4b34 == 0; bei 0x4aa0 ≠ 0 `cftstmov` statt `ctstform` | kein Gegenstück zu diesen Zuständen | Relevanz im Kit unknown |
| Randband y_up 73..74 mit Code 10 | SOURIS (Boden) und FRISE (A1) können beide greifen; die Reihenfolge hängt vom Scheduler ab | – | unknown |

## Übereinstimmungen (kurz)
- Aufnahme nullt 336/536/736 + id, T50c8 bleibt (A7).
- Erster freier Slot 0..8, BE16 an 1036 + 30c + 2s, für Code 9.
- Empfänger-Prädikat (007C9, nicht wiederholt).
- Rucksack voll → nichts geschrieben, Item bleibt.
- Kein Speichern und keine Bewegung mit Item am Cursor.
- 0x2d16/0x2fc0 sind nicht im Save.
- Rüstung von 9/10 = 0, also keine Änderung an 1336 + c bei Porträtablage.
- Sprites, Tiefe und Pickbarkeit (AFFOBJ/OBJET) wie im Vertrag.

## Vertragskorrektur
`quesh/pickup-contract-ishar2.md/.json`: Nachtrag 2026-11-14 eingetragen.
- R6 für Code 10 widerlegt.
- R5 um T50c8 ergänzt.
- R7-Tausch geschlossen.
- Hinweis auf den veralteten Wert `hit_rect_game.10` = 135; gültig ist 134.

Backups vorher/nachher liegen nur privat auf der Box.

**Bereinigung variantC (2026-11-14):** In `pickup-contract-ishar2.json` (`addendum_2026_10_18_armour.variantC.bytes` und `.clicks`) und in `pickup-contract-ishar2.md` (Abschnitt „Variant C recommendation“) standen konkrete Bytewerte aus dem gepatchten Save PICK25 (Offsets 1056/1057/1336). Sie waren seit der Erstveröffentlichung am 2026-10-18 öffentlich (JSON seit `0a516ce`, MD seit `46cab39`) und blieben in den Bereinigungen von Nachtrag 11 und 18 stehen. Ab Nachtrag 32 sind sie durch „privat (SW-PK2-ARM-C)“ ersetzt; die Offsets bleiben. Die Git-Historie enthält die alten Werte weiterhin.

## Offene Grenzen
- Alles ist statisch. A1 sollte nativ geprüft werden: Objekt 10 aufheben, aufs Porträt legen, speichern. Erwartet: kein Slot-Write, Gold + (0x4c94, 0x4c96), 14–17 → 0.
- Inhalt von 0x4c94/96 zur Zeit von A1 ist im Normalfall 0 (suspected), weil die Felder gespeichert und geladen werden.
- Zuordnung von Material 100 zu PP11: suspected.
- Charakterblatt-Raster `L_02610` (Slot-Index aus x/y) nicht vollständig geprüft. Dass dort Code 10 ins Gepäck gelangen kann (y_up > 82): suspected.
- Listing-Lücke FRISE 0x02cbb–0x02dba (Stapelzweig, nicht 9/10).
- Alle T4bbc-Writer nicht vollständig aufgezählt.

Keine Save-Werte, Originalbytes oder Dumps in diesem Bericht.
