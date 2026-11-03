# HOTH Abnahme 18.10.2026: CONT-Writeback, Teil 2 (Kartenwechsel im Spiel, Tür/Hebel vor dem Speichern)

> Bereinigte Fassung (2026-11-03): Positionen, Pixelzahlen, Spielzeiten, sha-Werte und Rohwerte aus Saves stehen in `private/bereinigung/HOTH_ABNAHME_2026-10-18_CONT_WRITEBACK_2.privat.md`.

Ersteller: Hoth (Grok Bot, Executor). Zeitraum: 16:58–17:38 MESZ. Private Belege liegen in `codex-support/hoth/private/contwb2/`.
Offsets sind wie bei `cmp -l` **einsbasiert**. Adressen stammen aus `decompile/repro/save_layout.py` (Ablage `private/contwb2/layout.txt`).

## 1. Versionszuordnung und Aufbau
- Originale: `/workspace/ishar/originals/ishar2/Ishar2` (nur gelesen). Klon `clones/hoth` steht detached auf 319819c. Der Position-Check lief von meinem lokalen Vorschlagszweig `grok/hoth-save-solid-pos-proposal` (cc53059). Danach habe ich wieder auf 319819c zurückgeschaltet. Nichts gepusht, nichts committet.
- Frische Arbeitskopie: `private/contwb2/work-20261018-1658`, erzeugt per `cont-mod apply` mit `contwb/in/cont5-wb.patch.json`.
  - Mod-Bytes wie zuvor: CONT5 Offset 124 und 5525 geändert. CONT5-sha siehe private Fassung.
  - Alle Dateien habe ich auf die mtime 2026-01-01 00:00 gesetzt (epoch 1767222000).
- **DOSBox-X:** eigene Conf `private/dosbox-x-auto2-contwb2.conf`, abgeleitet von `dosbox-x-auto2.conf`.
  - Änderungen: **`cycles=fixed 25000`** (statt `max 80%`) und `mount c/a` auf die Arbeitskopie.
  - Eigener Xvfb `:97`. Je Session eine Instanz, die am Session-Ende mit `kill -9` auf das eigene Conf-Muster beendet wurde.
  - Am Ende laufen weder eine Instanz noch Xvfb :97. Alderaans Instanzen habe ich nicht angefasst.
- Skripte: `private/contwb2/session.sh` (Schrittfolge, nach jedem Schritt Bild plus Schnappschuss) und `snap.sh`.
  - `snap.sh` hält sha256 und mtime aller Dateien der Arbeitskopie fest, bildet den Diff zum vorigen Schritt und vergleicht die CONT-Dateien mit dem Original.
  - Protokoll: `session.log`, Schnappschüsse unter `snaps/`.

## 2. Unversehrtheit
- sha256 vorher und nachher: Originale 311 Dateien, alle Saves unter `dosbox/ishar2*` 435 Dateien (`originals-vorher/nachher.sha`, `saves-vorher/nachher.sha`). **Beide sind identisch.**
- Kein Save wurde überschrieben. Die Spiel-Saves sind ausschließlich neue Namen: HOTMW1, HOTTU1, HOTTU2, HOTTU3, HOTTU5, HOTTU6.
- Eingangs-Saves sind patch-Ausgaben (HOTAR10, HOTK751/753) oder Kopien von Originalen unter neuen Namen (HOTD8C = HOTHD8 aus dem ersten Auftrag, HOTS1C = S1, HOTSAC = SASCHA2, HOTGZC = GRIMZ).
- Nach allen Sessions:
  - CONT1–4, 6 und 7 sind byte-gleich mit dem Original.
  - CONT5 weicht nur in den 2 Mod-Bytes ab (Offsets 124 und 5525).
  - Die mtimes aller CONT stehen weiter auf 1767222000. Abweichende mtimes haben nur die 6 neu geschriebenen SAV.

## 3. Punkt 1: Kartenwechsel im Spiel durch Gehen
**Weg A, Ereigniszelle CONT3 (Zelle privat) A=−5/B=−55 (K67):**
- HOTAR10 = S.SAV mit Positionspatch (Werte privat). Der Position-Check meldet „walkable“.
- Der Schritt nach vorn löst die Szene „Chef-Kommandant von Zachs Insel“ aus (Bild `06-W_10.png`).
- Nach EXIT steht die Gruppe wieder draußen auf Karte 3. **Kein Kartenwechsel**, keine Festnahme: Die Itemprüfung in PP3MN ist ohne passende Gegenstände nicht erfüllt (suspected).

**Weg B, Treppe CONT7 (Zelle privat) B=−126 → Karte 3 (K68): gelungen.**
- HOTK753 = S.SAV mit Patch auf Karte 7 vor die Treppe (Position und Szene privat). Der Position-Check meldet „walkable“.
- Im Spiel zwei Schritte vorwärts: Gefängnisgang mit Treppe (`44-F.png`). Danach „Zach's Island“, Gasse mit Wachen = VJAIL (`45-F.png`, `46-W_10.png`). Das ist der Kartenwechsel 7→3 durch Gehen.
- Gespeichert in den neuen Slot **HOTMW1** (sha siehe private Fassung, mtime 17:11:42 MESZ). Kopf (Byte 1–10): Position, Karte 3 und Szene (Werte privat). Das entspricht exakt dem Ziel aus K68.
- **Ladeprüfung in einer frischen Session:** zuerst GRIMZEL laden, dann HOTMW1.
  - Bilddiff GRIMZEL gegen HOTMW1: deutlich. Der Ladevorgang hat also gegriffen.
  - HOTMW1 gegen das Bild vor dem Speichern (`46`): nur kleiner Rest-Diff (zweiter Ladevorgang). Das sind Uhr- und Wachen-Animationen, gleiche Ansicht.
  - Hinweis: In der Speicher-Session griff „GRIMZEL laden“ direkt nach dem Speichern wieder nicht (Diff minimal). Deshalb habe ich die Ladeprüfung nur in der frischen Session gewertet.
- `cmp -l HOTK753 HOTMW1`: 138 Byte.
  - Kopf: 4 (Zeile), 6 (Spalte), 10 (Karte), 20 (Szene).
  - Spielzeit: 46, 49, 50 (0x4fc6/0x4fca).
  - 131 Byte in 15 Neun-Byte-Tabellen ab main:0x3412, 0x34f0, 0x35ce, 0x36ac, 0x3d2e, 0x3d9e, 0x3e0e, 0x3e7e, 0x3eee, 0x3f5e, 0x41fc, 0x43ba, 0x449a, 0x4814 und 0x4884 (Byte 2783–7345).
  - Die neuen Werte sind Zeilen/Spalten rund um die Ankunftszelle, dazu Blick-, Sprite- und Zustandswerte. Vermutete Bedeutung: NPC- bzw. Akteurstabelle (9 Plätze), beim Kartenwechsel für Karte 3 neu belegt (die Wachen). Stufe suspected.
  - **Türtabelle 7381–7430 und Schaltertabelle ab 7431: 0 Byte geändert.** CONT unverändert (siehe Abschnitt 2).

**Urteil Punkt 1:**
- **known:** Kartenwechsel durch Gehen im Original, Speichern danach und erfolgreiches Laden.
- **known:** CONT wird dabei nicht geschrieben (sha, mtime und cmp aller 7 CONT unverändert). Der Save enthält nur Kopf, Spielzeit und die Akteurstabellen.
- Nicht geprüft: Reise per Schiff (SASCHA2 steht an einer Hafenzelle mit B=−125) und der Weg per Festnahme.

## 4. Punkt 2: Tür, Hebel oder Falle vor dem Speichern
Versuche im Spiel:

| Versuch | Ausgang | Ergebnis | neuer Slot | cmp -l gegen Basis |
|---|---|---|---|---|
| GRIMZEL, offene Tür #8 (Durchgang mit Frau) | Klick auf die Türöffnung (130,70), danach (130,40) | keine sichtbare Änderung (Rest-Diff = Animation) | HOTTU1, HOTTU2 | nur Spielzeit: 46, 49, 50 |
| HOTD8C (Tür #8 zu, Gitter) | Klick auf das Gitter (130,70) und (130,40) | Gitter bleibt zu | HOTTU3 | nur Spielzeit: 46, 50 |
| S1 (Karte 3), Tür #3 vor der Gruppe | Schritt vor, Klick | Kampf mit Dieben ausgelöst, keine Tür | nicht gespeichert | – |
| SASCHA2 (Hafen), Tür #31 | umdrehen, vor, Klick | Durchgang in einen dunklen Hof, keine Türänderung | HOTTU5 | 4 (Zeile), 8 (Blick), 46, 49, 50 |
| GRIMZ (Karte 4), Säulenring Tür #20 | Klick und Schritt vor | Säulen bleiben, Schritt gelingt | HOTTU6 | 6 (Spalte), 46, 49, 50, **7578 (main:0x4b80)** |

- **Türtabelle (7381, 50 B) und Schaltertabelle (7431ff.) haben sich in keinem Fall geändert.** CONT ist in allen Fällen unverändert.
- Byte 7578 (main:0x4b80) geändert beim Schritt in GRIMZ: Bedeutung unbekannt. Vermutlich ein Ereignis- oder Objektzustand der betretenen Zelle.
- Ladeprüfung HOTTU1 per Bilddiff: GRIMZEL gegen HOTTU1 kaum Diff, weil beide dieselbe Ansicht zeigen. Das beweist für HOTTU1 nichts (Stufe unknown). HOTMW1 ist der gültige Ladebeleg dieses Auftrags.
- Bytecode-Befund (eigen, PCAVE.IO.asm 0x0031b–0x0039a):
  - Der Tür-Umschalter schreibt `0x4aa4[odirb(0x0d)]` = 1 (öffnen, 0x0032a/0x0039a) bzw. 0 (schließen, 0x00357).
  - Daneben liegt ein Hebelzustand `0x4ad8[odirb(0x17)]` mit Sprites [Werte privat] (0x00244–0x003e8).
  - Ein schlichter Klick auf das Türbild reicht nach meinem Lauf nicht. Nötig sind wohl ein Hebel, ein Schlüssel oder eine bestimmte Klickzone (suspected, passt zu K81 Tür #48).

**Urteil Punkt 2:**
- **Tür/Hebel/Falle im Spiel umgeschaltet: nicht erreicht (unknown).**
- **known (eigener Beleg, 5 Saves):** Speichern ohne Türänderung lässt Tür- und Schaltertabelle byte-gleich. Es ändern sich nur Spielzeit und Position (bei HOTTU6 zusätzlich Byte 7578). CONT bleibt unverändert.
- Die Frage, welche Bytes sich beim echten Umschalten ändern, bleibt offen. Erwartet nach Bytecode: genau `7381+Tür` (bzw. ein Hebel-Byte in 0x4ad8). Stufe suspected.

## 5. Gesamtbild
Es gibt kein Gesamt-Grün. Punkt 1 ist belegt. Punkt 2 ist nur für „Save ohne Umschalten“ belegt; das Umschalten selbst ist offen.

## 6. Vorschläge (nicht umgesetzt)
- Für Punkt 2 einen Hebel suchen: Welche CONT-Zelle startet PCAVE mit `odirb(0x17)`? Den Aufrufer in GERDEP nachlesen. Dann per save:main patch direkt davor stellen.
- Alternativ: Schlüsselobjekt ins Inventar patchen und eine verschlossene Tür öffnen.
- Schiffsreise ab SASCHA2 (Hafenzelle) als zweiten Kartenwechsel-Fall testen.
- Ladeprüfungen immer in einer frischen Session, mit vorher geladenem, deutlich anderem Save (z.B. GRIMZEL).

## 7. Belege
`private/contwb2/`: `session.log`, `snaps/`, Bilder `NN-<Schritt>.png`, Kontaktbögen m1–m7, `in/*.json` (Patches), `out/*.report.json` (Position-Check), `work-20261018-1658/` (Arbeitskopie mit allen neuen SAV), sha-Listen vorher/nachher.
