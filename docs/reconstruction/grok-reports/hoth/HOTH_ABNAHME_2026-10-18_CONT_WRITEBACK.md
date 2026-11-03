# Ergänzung: Schreibt MAIN.IO CONTn.FIC zurück? Überleben Mod-Bytes? (Hoth, 18.10.2026)

Auftrag von Cupero, 18.10. 16:46. Bearbeitet 16:46–16:58 Europe/Berlin (MESZ). Format wie die Hauptabnahme (Handoff-Punkte 1–7).
Private Dateien liegen unter `/workspace/ishar/codex-support/hoth/private/contwb/`.
Nichts committet, nichts gepusht. Nicht angefasst: Codex-Prüfer, local-repo, Saschas PC und Alderaans Instanzen.

## 1. Basis und Versionen
- Original Ishar 2 DOS (deutsch), `/workspace/ishar/originals/ishar2/Ishar2`.
  - CONT5.FIC: 5bc64e4c…0ff0a0
  - start.exe: 5e35e58d…0dadf9
  - GRIMZEL.SAV: 4b42d32b…4bd3bf (Karte 5, r53 c16)
  - FINALE.SAV: 2fc3a3d7…6c42 (Karte 6, r53 c32)
- Toolkit: Clone hoth 319819c, Node v24.22.0 (`cont-mod.mjs`).
- Emulator: DOSBox-X 2025.02.01 SDL2, Xvfb :97 (eigener), xdotool 3.20160805.1.
- conf: `private/dosbox-x-auto2-contwb.conf` (sha256 a1e102a7…65fed7). Gegenüber `dosbox/dosbox-x-auto2.conf` geändert sind nur:
  - die mount-Zeilen auf die Arbeitskopie;
  - **`cycles=fixed 25000`** statt `max 80%`.
- Je Session eine eigene Instanz, am Ende per SIGKILL beendet (nur das eigene conf-Muster). Xvfb :97 ist am Schluss ebenfalls beendet.
- Listings: `decompile/alis/listings/ishar2/MAIN.IO.asm`, `TABLEAU.IO.asm` u. a.

## 2. Fragestellung
Wann schreibt das Original eine CONTn.FIC zurück: beim Speichern, beim Kartenwechsel oder nie? Welche Bytes ändert das Spiel selbst? Bleiben Mod-Bytes erhalten?

## 3. Befehle und Ablauf
1. **Mod-Datei:** Kopie von CONT5.FIC, darin per `dd` geändert:
   - A(r2, c3) = 0x37 (Wert 55, kommt in Ebene A von CONT5 sonst nicht vor);
   - B(r2, c4) = 0x1B (Wert 27, kommt in Ebene B sonst nicht vor).

   Beide Zellen liegen in einer Leerfläche (Zeilen 0–5 × Spalten 0–11 sind alle 0), weit weg von GRIMZEL r53 c16 und FINALE r53 c32.
2. **Export:**
   - `node scripts/cont-mod.mjs diff <orig> <mod> private/contwb/in/cont5-wb.patch.json` → Exit 0 („2 byte changes“).
   - `node scripts/cont-mod.mjs apply /workspace/ishar/originals/ishar2/Ishar2 …/cont5-wb.patch.json private/contwb/work-20261018-1647` → Exit 0.
   - `cmp -l` Original gegen Export: `124 0 67` und `5525 0 33` (einsbasiert, oktal), also genau die zwei Bytes. CONT5 der Arbeitskopie hat sha256 56e0771f…224b7b.
3. **Zeitstempel als Marker:** Alle Dateien der Arbeitskopie per `touch -d '2026-01-01 00:00:00'` auf mtime 1767222000 gesetzt. Jeder Schreibzugriff des Spiels wäre dadurch sofort sichtbar.
4. **Schnappschuss nach jedem Schritt:** `private/contwb/snap.sh`, Ergebnis in `snaps/NN-<schritt>.txt`. Er nimmt sha256 und mtime (ns) aller Dateien der Arbeitskopie, vergleicht mit dem vorigen Stand und macht `cmp -l` jeder CONTn.FIC gegen das Original.
5. **Ablauf:** `private/contwb/session.sh` mit den Schritten `L:<save>` (Laden über Disk-Icon/LOAD) und `S:<neu>` (Speichern über Disk-Icon/SAVE in einen neuen Namen; Abbruch, falls die Datei existiert). Screenshot nach jedem Schritt (`NN-*.png`). Welcher Save wirklich geladen wurde, habe ich per Bilddiff gegen die Ansichten von GRIMZEL und FINALE geprüft.

| # | Schritt | geladen bzw. geschrieben (nachgeprüft) | Kartenwechsel | CONT1–7: sha256 / mtime |
|---|---|---|---|---|
| 01 | Boot (neues Spiel, Karte 1) | – | (Start) | unverändert |
| 02 | L GRIMZEL | ja (Bild = GRIMZEL, 0 px) | 1 → 5 | unverändert |
| 03 | L FINALE | ja (Bild = FINALE, 0 px) | 5 → 6 | unverändert |
| 04 | S HOTWB6 (auf Karte 6) | neue Datei, = FINALE bis auf 2 Byte Spielzeit | – | unverändert |
| 05 | L GRIMZEL | **nein** (erstes Laden nach dem Speichern greift nicht; bekannte Eigenheit) | – | unverändert |
| 06 | S HOTWB5 | neue Datei, enthält aber den Karte-6-Zustand (wegen 05) | – | unverändert |
| 07 | L HOTWB5 | Karte 6 | – | unverändert |
| 08 | Boot (neue Instanz) | – | (Start) | unverändert |
| 09 | L GRIMZEL | ja | 1 → 5 | unverändert |
| 10 | S HOTWC5 (auf Karte 5) | neue Datei, Kopf (2,53,16,3,5); gegen GRIMZEL nur Byte 49/50 (0x4fca) | – | unverändert |
| 11 | L FINALE | nein (erstes Laden nach dem Speichern) | – | unverändert |
| 12 | L FINALE | ja | 5 → 6 | unverändert |
| 13 | L HOTWC5 (Neuladen des eigenen Saves) | ja (Bild = GRIMZEL, 0 px) | 6 → 5 | unverändert |
| 14 | L HOTWC5 (nochmal) | ja | – | unverändert |

**Durchgehend:** Alle sieben CONTn.FIC haben in jedem Schnappschuss denselben sha256 und die Marker-mtime 1767222000. CONT5 weicht vom Original in genau den zwei Mod-Bytes ab. Das Spiel hat **nur** die neuen SAV-Dateien geschrieben (HOTWB6, HOTWB5, HOTWC5, mit mtime vom Lauf); keine vorhandene Datei wurde verändert.

**Unversehrtheit:** Originale (311 Dateien) und alle 435 .SAV unter `dosbox/ishar2*` sind vorher und nachher hashgleich (`private/contwb/{originals,saves}-{vorher,nachher}.sha`).

## 4. Statischer Abgleich (MAIN.IO)
- **Lesen:** MAIN.IO 0x03cba–0x03cdb. Name nach Karte 0x51b8 (0x03cdc-Switch → `CONT1..7.FIC`), Abfrage `oexistf`, dann `cfreadb loc:0x0080,0x1518` und `loc:0x159c,0x1518` (2 × 5400 B).
  - Aufrufe: Nachricht 12 (0x00377, Karte aus 0x2d18), Nachricht 15 (0x00393, Karte aus Nachricht) und **0x0165e** (Kartenwechsel: 0x2d18 → 0x51b8 → Lesen).
- **Schreiben:** MAIN.IO 0x03ca2–0x03cb9, `cfopen … oimmw(770)` und `cfwriteb` beider Ebenen. Einziger Auslöser ist **Nachricht 10** (0x00368).
- **Einziger Sender von Nachricht 10 an MAIN (Entity 0):** `TABLEAU.IO` 0x002de und 0x00350, jeweils nach der Abfrage „SAUVER <O>UI <N>ON ?“. Das ist ein Kartenbearbeitungsmodul (sendet auch 12 = Karte laden, 0x000bc).
  - `grep "csend n=0, oimmb(0), …"` über alle Listings zeigt sonst nur die Nachrichten 18, 23, 30 und −100.
  - TABLEAU wird nur geladen bei MAIN 0x00bc5–0x00c2f: `omodel < 1000` → „EDITER TABLEAU ?“ → Taste o/O → `cload 'tableau.IO'`.
  - In keinem Boot dieser Läufe erschien dieser Prompt (Screenshots 01/08).
- **Nicht ganz ausgeschlossen:** `csend …, odirw(0x26), oimmb(10)` in SOURIS.IO und TAVERNE.IO senden 10 an ein per Maus bzw. Form getroffenes Entity, nicht direkt an 0. Dass das jemals MAIN ist, halte ich für unwahrscheinlich (suspected), statisch ist es nicht ausgeschlossen.
- **Nebenbefund:** MAIN 0x00aba/0x00ac0 setzt 0x519f/0x51a0 auf 1. Das erklärt die früher beobachtete Änderung von Save-Byte 91/93 (2 → 1) in den ungültigen XP/Gold-Saves als Startinitialisierung (suspected → plausibel).

## 5. Ergebnis je Punkt

| # | Punkt | Urteil | Beleg |
|---|---|---|---|
| 1 | Schreiben beim Speichern im Spiel | **known: nein.** Speichern auf Karte 5 (HOTWC5) und Karte 6 (HOTWB6) ändert keine CONTn.FIC, weder sha256 noch mtime | Schnappschüsse 04, 06, 10 |
| 2 | Schreiben beim Kartenwechsel per Laden | **known: nein**, für 1→5, 5→6 und 6→5 | Schnappschüsse 02, 03, 09, 12, 13 |
| 3 | Schreiben beim Kartenwechsel per Ausgang bzw. Reise im Spiel | **offen**, nicht getestet. Statisch läuft der Kartenwechsel 0x0165e nur über die Lese-Routine | MAIN 0x0165e |
| 4 | Schreiben insgesamt | **suspected (stark): nur im Entwicklereditor TABLEAU** (Nachricht 10 nach „SAUVER“). Im normalen Spiel kein Schreibpfad gefunden, und im Lauf nie geschrieben | Abschnitt 4 |
| 5 | Mod-Bytes überleben | **known: ja.** Beide Mod-Bytes (Ebene A und B) bleiben über alle Schritte erhalten; die Datei wird vom Spiel nie angefasst | `cmp -l` je Schnappschuss |
| 6 | Wird die Mod-CONT gelesen? | **known** aus der Hauptabnahme (Lauf C4: massive A-Zellen blockieren die Bewegung im Original). In diesem Lauf haben die Mod-Zellen absichtlich keine Spielwirkung, ihre Wirkung ist hier nicht sichtbar | HOTH_ABNAHME_2026-10-18.md, Punkt 2b |
| 7 | Welche Bytes ändert das Spiel selbst (Türen, Schalter, Fallen, B)? | **known: in CONT keine.** Laufzeitzustände wie Türen liegen im Save (Türtabelle 0x4aa4, Byte 7381; Laufbeleg HOTHD8). Save gegen Ausgangssave ohne Aktion: nur die Spielzeit 0x4fca (Byte 48/49), gegebenenfalls 0x4fc6 | cmp HOTWC5 gegen GRIMZEL, HOTWB6 gegen FINALE |
| 8 | Folge für Mods | **known (aus 1, 2, 5):** Eine exportierte CONT-Änderung ist dauerhaft und gilt für alle Saves dieser Installation, weil der CONT-Zustand nicht im Save liegt. Ein Save trägt keine eigene Kartenkopie | – |

## 6. Grenzen und nächster Schritt
**Nicht getestet:**
- Kartenwechsel durch Gehen bzw. Reise.
- Der TABLEAU-Pfad (Gate `omodel < 1000` nicht aufgelöst).
- Andere Karten als 1, 5 und 6.
- Spielaktionen (Tür öffnen, Hebel, Falle) vor dem Speichern.
- Ishar 1.

**Eigenheit:** Das erste Laden nach einem Speichern greift nicht (Schritte 05 und 11). Alle Aussagen oben stützen sich nur auf Schritte, deren Laden nachgeprüft ist.

**Nächster Schritt:** einen Ausgang bzw. eine Reise zwischen zwei Karten im Spiel ausführen, danach dieselbe Schnappschussfolge. Im Exportmanifest ließe sich vermerken: „CONT wird vom Original im Spielbetrieb nicht zurückgeschrieben (Speichern/Laden geprüft)“.

## 7. Codevorschlag
Keiner.
