# Unabhängige Test- und Exportabnahme (Hoth) – 18.10.2026

Erstellt von Grok Bot (Hoth), Executor für Sascha, Auftrag über Cupero vom 18.10. um 15:41.
Bearbeitung 15:41–16:20 (Europe/Berlin, MESZ).
Format nach `docs/reconstruction/GROK_COLLABORATION_HANDOFF_2026-10-18.md` (Commit bb42748), Abschnitt „Format für Rücklieferungen“, Punkte 1–7.
Alle privaten Dumps, Saves, Arbeitskopien und Bilder liegen unter `/workspace/ishar/codex-support/hoth/private/`.
Nichts committet außer einem lokalen Vorschlags-Commit im eigenen Clone (siehe 7), nichts gepusht.
Nicht angefasst: local-repo, Saschas PC, die Prüfer original-dos-* und check-native-dos-*, fremde DOSBox-Instanzen (alderaan, dosbox-x-input.conf).

**Vorab, Ishar-1-Wandregel:** nicht abgeschlossen. `decompile/wall-rule.md` wertet nur Ishar 2 (CONT1–7) aus. Im Register steht Ishar 1 als **U20 [Stufe: unknown]**. Laut Auftrag nicht fortgesetzt.

---

## 1. Basiscommit, Spielprofil, Originalhash

| Element | Wert |
|---|---|
| Clone | `/workspace/ishar/clones/hoth` (frisch von `origin` = github.com/bvultrex/ishar-construction-kit, Branch workbench/playable-slice) |
| Geprüfter Code-Stand | `319819c83d8dfe30675bba3ad8a51b43c3afc871` (2026-10-18 15:34:14 +0200), detached ausgecheckt. Verifiziert: Vorfahr von HEAD |
| Handoff-Commit | `bb42748` = HEAD des Branches. Fügt gegenüber 319819c nur `GROK_COLLABORATION_HANDOFF_2026-10-18.md` hinzu (213 Zeilen, `git diff --stat 319819c bb42748`) |
| Spiel | Ishar 2, DOS, deutsche Ausgabe (Sprachwahl 3 = Deutsch), `/workspace/ishar/originals/ishar2/Ishar2` (nur gelesen) |
| Profil-Hash (Toolkit-Inventar) | `sourceProfileSha256` 85d01296bf015c43621151de4c3c63fdf3561c44ee20e45c83d93f2f5e3072a8 (aus `ishar-ck-mod-manifest.json`) |
| start.exe | 43 462 B, sha256 5e35e58d2d133dadeed4b233b7f962f9c941c3d635feb9d3a067a63c340dadf9 |
| IO.IO | 0df1f34cf2519341ef20825d49c7f1e7ff204878814db744f7e5cb58ce6b5918 |
| MAIN.IO | bfab5e9175931dbb1c2c51f0576092ef423e0bf950579340c8a1715e8cf8db95 |
| CONT5.FIC | 10 800 B, 5bc64e4cc0c29587263867d0a66f3a102a3790eb9e70203469519b29e62ff0a0 |
| GRIMZEL.SAV | 8 359 B, 4b42d32b6a682bb71cd112d7a30d172114bf13117c63ad5d5fee76e57884d3bf |
| Werkzeuge | Node v24.22.0, lokal unter `/workspace/ishar/tools/node-v24.22.0-linux-x64` (Archiv-sha256 cc2f601c…9e95008). Node 20.19.2 aus dem System kann kein TS-Stripping und wurde nicht benutzt. npm 11.21.0, Python 3.13.5, Pillow 12.3.0 |
| Emulator | DOSBox-X 2025.02.01 SDL2 (Debian 2025.02.01+dfsg-3), Xvfb 2:21.1.16-1.3+deb13u4 auf eigenem Display **:97**, xdotool 3.20160805.1, Linux 6.12.94 |

## 2. Fragestellung und untersuchter Bereich

1. Welche Aussagen aus STATUS.md und COVERAGE.md sind durch Tests gedeckt, und laufen diese Tests auf 319819c?
2. Gilt die Kette Import → kleine Änderung an Originaldaten → Export → Laden im Original-DOS-Spiel → Zustandsnachweis für mehrere Formate? Bleiben unbekannte Bytes erhalten?
3. Wo genau fehlen Tests für Langtexte und Aliase bei den Stringprüfungen, und wie könnte ein Test dafür aussehen?

Formate: **CONT** (Karte 5) und **Save MAIN** (GRIMZEL) wurden durchgehend geprüft. **Palette** nur statisch, ohne Ladenachweis im Original (siehe 5).

## 3. Reproduzierbare Befehle (mit Exitcodes)

Umgebung für alle Node-Befehle: `cd /workspace/ishar/clones/hoth`, außerdem:
`PATH=/workspace/ishar/tools/node-v24.22.0-linux-x64/bin:$PATH`,
`ISHAR1_DIR=/workspace/ishar/originals/ishar1/Ishar1`,
`ISHAR2_DIR=/workspace/ishar/originals/ishar2/Ishar2`,
`ISHAR_ACTOR_LISTINGS=/workspace/ishar/decompile/alis/listings/ishar2`.

### 3.1 Aufbau und Tests
| Befehl | Exit |
|---|---|
| `git clone … hoth && git checkout -q 319819c` | 0 |
| `npm ci` (Log `/tmp/hoth_npmci.log`) | 0 |
| `npm run typecheck` (Log `/tmp/hoth_tc.log`) | 0 |
| `/workspace/ishar/codex-support/hoth/run_tests.sh`: alle 61 `test:*`-Skripte einzeln, 600 s Timeout, 6 parallel. Logs in `private/tests/<name>.log`, Ergebnis in `private/tests/results.tsv` | 58× 0, 3× 1 |
| Nachlauf: `ISHAR1_LISTINGS=/workspace/ishar/decompile/alis/listings/ishar1 npm run -s test:original-alis-switch-profiles` | 0 |
| dito `test:original-alis-branch-profiles` | 0 |
| `npm run -s test:a1-writer-local -- /workspace/ishar/codex-support/hoth/private/a1-writer-out` (Ishar 1: 98, Ishar 2: 142 Ein-Byte-Bildänderungen mit Readback) | 0 |
| 43 `scripts/check-*.mjs`, die **nicht** in package.json stehen, einzeln, 120 s Timeout (`private/tests/extra/`) | 39× 0, 4× 1 |
| 140 `scripts/check-*.py` außerhalb von package.json (davon 136 check-native-dos-*) | **nicht ausgeführt** (brauchen private Captures bzw. memory.bin; ausdrücklich nicht anzufassen) |

### 3.2 CONT-Export (Toolkit `scripts/cont-mod.mjs`)
Jeder Lauf erzeugt eine eigene, neue Arbeitskopie aus den Originalen. `apply` kopiert die ganze Installation, prüft per Readback, dass nur die Patchdatei abweicht, und schreibt `ishar-ck-mod-manifest.json` mit `verification: prepared-not-tested-in-original`.

| Lauf | Bearbeitung (Kopie des Originals, `dd conv=notrunc`) | `diff` → Patch | `apply` → Arbeitskopie | Exit |
|---|---|---|---|---|
| C1 | A r28 c17: 255→10 (Offset 1697) | `private/mod-input/cont5.patch.json` | `private/work-20261018-1600` | 0/0 |
| C2 | A r27 c17: 43→10 (Offset 1637) | `private/mod-input2/cont5-door.patch.json` | `private/work-20261018-1601-door` | 0/0 |
| C3 | B r27 c17: 66→0 (Offset 7037) | `private/mod-input3/cont5-b.patch.json` | `private/work-20261018-1604-bdoor` | 0/0 |
| **C4** | A r53 c15: 0→255 und A r53 c17: 11→255 (Offsets 3195/3197) | `private/mod-input4/cont5-solid.patch.json` | `private/work-20261018-1607-solid` | 0/0 |

Befehlsform: `node scripts/cont-mod.mjs diff <orig CONT5.FIC> <bearb. CONT5.FIC> <neu.patch.json>`, danach `node scripts/cont-mod.mjs apply /workspace/ishar/originals/ishar2/Ishar2 <patch.json> <neues Verzeichnis>`.

### 3.3 Save-Export (Toolkit `scripts/save-main.mjs patch`)
`node scripts/save-main.mjs patch <IO.IO> <GRIMZEL.SAV> <writes.json> <neue .SAV>`, jeweils Exit 0:

| Save | writes.json | Report changedOffsets | Zweck |
|---|---|---|---|
| HOTHD6.SAV | `[{"address":19114,"width":1,"value":0}]` (Tür #6) | [7387] | Tür außerhalb des Sichtfelds (siehe 5) |
| **HOTHD8.SAV** | `[{"address":19116,"width":1,"value":0}]` (0x4aac, Tür #8 → zu) | [7389] | Tür in Sicht |
| HOTPOS.SAV | `[{"address":10933,"width":1,"value":19}]` (Spalte 16→19) | [5] | Positionsprobe |

Neue Saves wurden mit `cp -n` nur in eigene Arbeitskopien gelegt (`work-20261018-1600` bzw. `work-20261018-1607-save`, frische Kopie der Originale).

### 3.4 Laden im Original (Eingabesequenz)
- **conf:** Kopie von `/workspace/ishar/dosbox/dosbox-x-auto2.conf` (sha 68db0487…). Per `sed` geändert sind nur die beiden `mount c`/`mount a`-Zeilen, die auf die jeweilige Arbeitskopie zeigen (per `diff` geprüft). Die Kopien heißen `private/dosbox-x-auto2-{hoth,hoth-ref,hoth-door,bdoor,solid,save8}.conf`.
- **Skript:** `private/hoth_session.sh <arbeitskopie> <tag> [SAVE]` startet `DISPLAY=:97 SDL_AUDIODRIVER=dummy dosbox-x -conf …` und wartet 20 s. Danach: `KP_3`, 20× `space` (je 1,5 s), `KP_2`, 10 s warten.
- **Laden:** über `private/hoth_load.sh`: Klick Disk-Icon (266,12), Klick LOAD (232,26), Name über Tastatur, `Return`, 7 s warten, `alt`, danach `gameshot`.
- **Bewegung:** Klick (287,50) für 1 Schritt zurück (Bild `_zurueck`), dann 2× Klick (287,24) für vorwärts (Bild `_vor`). Alle Spielkoordinaten +(90,67) im Fenster.
- Am Ende beendet `SIGKILL` nur die eigene Instanz (Muster `dosbox-x -conf …/hoth/private/dosbox-x-`). Danach wird sha256 der Arbeitskopie vorher/nachher verglichen.
- **Referenz:** unveränderte, frische Kopie `private/work-ref-20261018-1559`, gleiche Sequenz (`ref_*.png`).
- Bildvergleich: Pillow `ImageChops.difference`, Ansichtsbereich (0,13)–(256,126), Diffbilder in `private/diff_*.png`.

### 3.5 Unversehrtheit
- Originale `/workspace/ishar/originals`: 311 Dateien, sha256 vorher = nachher (`private/originals-{vorher,nachher}.sha`).
- Save-Ordner `/workspace/ishar/dosbox/ishar2*`: 435 .SAV, Multimenge aus Hash und Name vorher = nachher (`private/saves-vorher.sha`, `private/saves-nachher-fullpath.sha`).
- Arbeitskopien nach den Original-Läufen: bdoor, solid, save8 und door sind byte-gleich vorher/nachher. In `work-20261018-1600` ist nur das absichtlich hinzugefügte HOTPOS.SAV neu. Das Spiel hat in keinem Lauf eine CONT- oder SAV-Datei geschrieben.
- Hashes aller Ein- und Ausgaben: `private/hashes-io.sha`. Screenshots: `private/screenshots.sha`.

## 4. Adressen, Datenvertrag, beobachtete Seiteneffekte

- **CONT (Ishar 2):** 10 800 B = Ebene A (5400) + Ebene B (5400), je 90 Zeilen × 60 Spalten, Offset `r*60+c` bzw. `5400+r*60+c`, signed.
  - MAIN.IO 0x03cba–0x03cdb liest `CONTn.FIC` (n = 0x51b8 ← 0x2d18) mit `cfreadb loc:0x0080,0x1518` und `loc:0x159c,0x1518`, nur bei `oexistf`.
  - MAIN.IO 0x03ca2–0x03cb9 **schreibt** dieselbe Datei zurück (`cfopen … 770` und `cfwriteb`), ausgelöst über Nachricht 10 (0x00368). Gelesen wird über Nachricht 12 (0x00377), 15 (0x00393) und bei 0x0165e.
  - Seiteneffekt für Mods: Das Original kann `CONTn.FIC` in der Installation überschreiben. In meinen Läufen kam das nicht vor (Hashes gleich). Ich habe aber nicht gespeichert und keinen Kartenwechsel per Reise gemacht.
- **Save MAIN:** Kopf BE16: Marker, Zeile, Spalte, Blick, Karte. GRIMZEL = (2, **53**, **16**, 3, 5).
  - Türtabelle `main:0x4aa4` = Byte 7381, 50 Byte, 1 = offen. GRIMZEL: Türen #1–3, #6–8, #24 und #29 offen.
  - **Korrektur einer eigenen Annahme:** In meiner Planung stand für GRIMZEL „r27 c18“. Richtig ist r53 c16. Deshalb lagen C1–C3 und HOTHD6 außerhalb des Sichtfelds. Die neuen Läufe C4 und HOTHD8 zielen auf den richtigen Ort.
  - CONT5 um r53: c14 A42/B68 und c16 A38/B68 (Tür #8 an beiden Zellen), c15 A0, c17 A11.

## 5. Ergebnis je Punkt

| # | Prüfpunkt | Urteil | Beleg |
|---|---|---|---|
| 0a | Clone, bb42748/319819c verifiziert, Handoff gelesen | **bewiesen** | `git merge-base --is-ancestor`, `git diff --stat` |
| 0b | `npm ci`, typecheck auf 319819c | **bewiesen** (Exit 0) | Logs in /tmp |
| 1a | 61 npm-Tests auf 319819c | **58 grün im ersten Lauf, 3 rot nur wegen fehlender Umgebung. Im Nachlauf mit Umgebung alle 3 grün** → 61/61 Exit 0 | results.tsv, *.rerun.log |
| 1b | `test:r14` | **Exit 0, aber privater Teil übersprungen** („set ISHAR2_DIR and ISHAR_COLLISION_REPORT“) → offen, nicht als grün werten | test:r14.log |
| 1c | Zusätzliche .mjs-Prüfer außerhalb von package.json | **2 echte Rote auf 319819c:** `check-dos-physical-frame.mjs` (Zeile 14 erwartet einen Throw `/alias/`, der nicht mehr kommt; vermutlich veraltet, seit laut COVERAGE.md vom 18.10. der gemeinsame physische Scheduler die pauschale Ablehnung überlappender Fenster ersetzt hat) und `check-native-script-diagnostic.mjs` (Zeile 29: `'ready' !== 'stopped'`). 2 weitere rot nur wegen Umgebung bzw. Argument (`check-dos-findfirst-oracle.mjs` ohne Pfad, `check-cont2-local.mjs` braucht ALIS_RESEARCH_DIR/PYTHON_EXE) | private/tests/extra/*.log |
| 1d | 140 Python-Prüfer (native) | **offen**, nicht ausgeführt | – |
| 2a | CONT: Import → Änderung → Export, unbekannte Bytes erhalten | **bewiesen** für C1–C4: `cmp -l` Original gegen Export zeigt genau die beabsichtigten Bytes (C4: Offsets 3196/3198 einsbasiert, 000→377, 013→377). Alle übrigen 182 Dateien der Installation sind hashgleich, neu ist nur das Manifest | `cmp -l`, Hashlisten-diff |
| 2b | CONT: geladen im Original mit Zustandsnachweis | **bewiesen (Kollision), Darstellung widerspricht der naiven Erwartung.** C4 (r53 c15/c17 → 0xFF): Im Original sind Schritt zurück **und** vor blockiert (`solid_zurueck` gegen Referenz: 81,6 % der Ansicht anders; `solid_vor` bleibt auf der Startansicht). Mit Referenz und mit C3 (Änderung woanders) ist beides möglich. Die Startansicht selbst ist aber unverändert (Abweichung nur in der NPC-Animation): Die massive Zelle direkt vor bzw. hinter der Gruppe ändert das Bild von dieser Position aus nicht | ref_/solid_/bdoor_*.png, diff_*.png |
| 2c | CONT C1–C3 im Original | **ohne sichtbare Wirkung, Ursache geklärt:** Die Zellen lagen nicht im Sichtfeld (falsche Ausgangsposition, siehe 4). Kein Fehler des Toolkits | ref_GRIMZEL gegen s4_/door_GRIMZEL: 0 px |
| 2d | Save: Export, unbekannte Bytes erhalten | **bewiesen:** HOTHD8 gegen GRIMZEL `cmp -l` → nur Byte 7390 (einsbasiert) 1→0. HOTHD6 → nur 7388. HOTPOS → nur Byte 6 | cmp |
| 2e | Save: geladen im Original mit Zustandsnachweis | **bewiesen für HOTHD8:** Tür #8 erscheint als geschlossenes Gitter (11,6 % der Ansicht anders als in der Referenz) und blockiert den Schritt vorwärts. Nach einem Schritt zurück ist das Gitter in Tiefe 2 sichtbar | save8_*.png |
| 2f | HOTHD6 | **wie erwartet ohne sichtbare Wirkung** (Tür #6 nicht im Bild). Der Ladevorgang ist belegt: Nach einem Schritt zurück setzt das Laden die Ansicht auf die Startposition zurück | s4_*.png |
| 2g | HOTPOS (Spalte 16→19, auf r53 c19 = 0xFF) | **Beobachtung:** Das Laden führt zurück zum Musik-Startdialog, das Spiel startet also neu. Ob das eine Plausibilitätsprüfung im Original ist oder ein Absturz-Neustart, ist **offen**. Der Save-Writer warnt nicht vor Positionen auf massiven Zellen | s3_HOTPOS.png |
| 2h | Palette | **nur statisch geprüft, Ladenachweis im Original offen.** `test:palette-edit-local` (75 Module, 161 Paletten) und `test:reference-dos-palette-transition` sind grün. Welche Palette in der Szene von Karte 5 aktiv ist, ließ sich nicht zuordnen: Die dominanten Bildfarben, z. B. (101,52,4), finden sich nicht direkt in den mit `describeAlisPalettes` lesbaren Paletten. DJ1, DJ2, DJCAT, DJCOL und DJDEC haben keine lesbare DOS-Palette | private/pal_*.mts |
| 3 | Langtext-/Aliastests | **Lücke bestätigt und beschrieben, Vorschlagstest grün (modellbasiert, nicht nativ)** | siehe unten |

**Stringprüfung im Detail (Punkt 3):**
- **Dokumentierte Lücke:** `PHYSICAL_STRING_ASSIGNMENT.md`: „Überlappende Stringkopien und längere Texte sind hier noch nicht durch eigene synthetische Vergleichsfälle abgedeckt.“ `PHYSICAL_STRING_ASSIGNMENT_NATIVE_2026-10-18.json`: „overlap and long-string native vectors pending“.
- **Bestand:**
  - `check-native-dos-indexed-assignment.py`: 18 Stringfälle, Textlängen nur 0–2.
  - `check-native-dos-script-assignment.py`: Längen 0/1/2/7/31/127/255, keine Überlappung.
  - `check-native-dos-expression-string.py`: 4 Längen, keine Überlappung.
  - `scripts/check-dos-indexed-assignment.mjs` (Exit 0) prüft im Stringpfad nur die Host-Grenze. Er steht nicht in package.json, läuft also in keinem npm-Test. Dasselbe gilt für `check-dos-string-output.mjs` (Exit 0).
- **Nicht abgedeckt:**
  - (a) Texte > 255 Byte.
  - (b) 16-Bit-Offsetwrap von Quelle bzw. Ziel innerhalb eines Segments.
  - (c) Physische Aliase zwischen Literal bzw. Kontextquelle, Scratch `SS:[C58]/[C5C]` und Ergebnisziel `ES:BP+off` (Ziel = Quelle ± 1).
  - (d) Langtexte, die die Scratchzeigerworte `SS:C58/C5C` selbst überschreiben. Das passiert im Vorschlag bei 4000 Byte ab SS:0802; der anschließende Swap liest dann die überschriebenen Werte.
  - (e) Laufkopie bei Ziel = Quelle + 1. Das erste Byte wird verschmiert, die Null kommt erst, wenn die Quelle das ES-Fenster verlässt (im Vorschlag nach 14 159 Byte).
- **Vorschlag:** `scripts/proposals/grok-check-dos-string-long-alias.mjs` (siehe 7) mit 11 Literalfällen (Länge 0…4000, zwei Wrapfälle), 3 Aliasfällen und einem nicht terminierten Fall. Jeder Fall vergleicht den vollen 1-MiB-Speicher gegen ein unabhängiges Vorwärts-Bytekopiermodell und prüft, dass die Eingabe unverändert bleibt. Exit 0.
- **Grenze:** Die Erwartung ist eine **Hypothese** über das native Verhalten. Bestätigen ließe sie sich nur, wenn dieselben Fälle in `check-native-dos-indexed-assignment.py` bzw. `dos-script-assignment-vectors.mjs` als native Vektoren ergänzt werden. Diese Dateien sind von Codex aktiv und von mir nicht verändert.

**Keine Gesamtabnahme.** Bewiesen ist die Kette nur für CONT (Kollisionswirkung) und Save (Türzustand), je an einem Ort auf Karte 5.

## 6. Grenzen und erwarteter nächster Schritt

**Vergleichsumfang**
- Byteebene: `cmp -l` Original gegen Export für die geänderte Datei, sha256 aller Dateien der Installation.
- Bildebene: Spielbild 320×200 nach Laden bzw. Schritt, Diff gegen eine frisch gebootete Referenz derselben Sequenz.

**Nicht verglichen**
- RAM-Zustand des Originals nach dem Laden (kein Speicherdump).
- Ebene-B-Wirkung im Original: C3 lag außerhalb der Sicht und wurde nicht wiederholt.
- Andere Karten und Saves, Speichern im Original und erneutes Laden.
- Kartenwechsel (Lesen bzw. Schreiben von CONTn.FIC durch das Spiel).
- Ishar 1.
- Palette im Original.
- Audio, Texte, A1-Bildexport im Original.
- Native Python-Prüfer.

**Bekannte Schwächen der Sequenz**
- Die Bootzeit schwankt (ein Lauf blieb im Musikdialog hängen).
- SIGTERM öffnet in DOSBox-X nur einen Beenden-Dialog. Daher SIGKILL der eigenen Instanz; drei Fenster „Quit DOSBox-X warning“ blieben auf :97 zurück.
- Mauszeiger und NPC-Animation erzeugen Rest-Diffs (1–2,5 %).

**Offene Abnahmestellen**
1. `check-dos-physical-frame.mjs` und `check-native-script-diagnostic.mjs` sind auf 319819c rot. Klären, ob sie veraltet sind, und dann aktualisieren oder entfernen. Sie stehen nicht in package.json, laufen also nicht in den npm-Tests.
2. Der private Teil von `test:r14` ist übersprungen (ISHAR_COLLISION_REPORT fehlt).
3. Palette: Herkunft der aktiven Szenenpalette bestimmen und danach denselben Ablauf wie hier.
4. Ebene B (z. B. B r53 c16 Tür #8 → 0) und Kollision in Sicht im Original wiederholen.
5. Speichern im Original mit dem geänderten CONT: Prüfen, ob das Spiel `CONT5.FIC` zurückschreibt und dabei Modbytes erhält. Relevant für das Exportziel.
6. Save-Writer: Plausibilitätswarnung für Positionen auf A = 0xFF (Beobachtung HOTPOS: Neustart).
7. Langtext- und Aliasvektoren nativ bestätigen.

**Nächster Implementierungsschritt (Vorschlag)**
- In `MOD_WORKFLOW.md` eine kleine „Original-Load-Abnahme“ mit fester Zelle in Sicht ergänzen, etwa C4 und HOTHD8 an GRIMZEL r53 c16 als Referenzfälle.
- Das Manifest sollte `verification` erst nach einem dokumentierten Ladelauf auf `tested-in-original` setzen können.

## 7. Codevorschlag

- Clone `/workspace/ishar/clones/hoth`, **lokaler Branch** `grok/hoth-string-long-alias-proposal` auf Basis 319819c, Commit **9f04e9c**. **Nicht gepusht, noch nicht integriert.**
- Neue Datei: `scripts/proposals/grok-check-dos-string-long-alias.mjs` (sha256 ecae9be5b6301348c5dd32a605131c8ce32dbc9cc149add10acbf2f7216f398d). Nicht in package.json eingetragen. Keine bestehende Datei geändert, keine Originaldaten enthalten.
- Test: `node scripts/proposals/grok-check-dos-string-long-alias.mjs` → Exit 0, Ausgabe „PROPOSAL string long/alias: 11 literal lengths/wraps, 3 alias cases, unterminated bound passed (model-based, not native)“ (`private/tests/proposal-string.log`).
- Er testet ausschließlich die öffentliche Funktion `assignOriginalDosIndexedValue`, mit Operand-Tags 4 und 10 und Ergebnis-Tag 10.
