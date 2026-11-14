# Ishar 2: Codex-Bodenexport (Objekt 9) nativ in der Original-EXE geladen

Stand: 2026-11-14, Hoth. Lauf 22:25–22:31 (Berlin, UTC+1). Kit `workbench/playable-slice` `64a3c4f`, Nachträge 38–40 dort enthalten, nicht wiederholt.
Evidenzstufen: **known** = eigener Lauf/eigene Messung; **suspected** = abgeleitet, nicht einzeln nachgewiesen; **unknown** = nicht geprüft.

**Save-Bezeichner:** Saves heißen hier nur über synthetische Referenzen. Es stehen keine Bytewerte, Positionen oder Original-SAV-Inhalte im Bericht, Hashes nur als 12-Zeichen-Präfix. Zuordnung, Rohdiffs und Bilder liegen privat unter `codex-support/hoth/private/itempickup/codex-export/` und in `private/save_patches.md`.

| Referenz | Bedeutung | SHA256-Präfix |
|---|---|---|
| SW-START | Original-START (Eingabe) | `e685cd690257` |
| SW-CDX-IN | Kit-Ausgabe `START.SAV-9-controlled-input.SAV` (kontrollierte Platzierung) | `e56401c178b8` |
| SW-CDXA | Kit-Ausgabe `START.SAV-9-received.SAV` = Exportdatei, unverändert als neuer Slot abgelegt | `74378c770176` |
| SW-CDXB | native Neuspeicherung nach Laden von SW-CDXA | `c2c2b25581d7` |
| SW-HIPB / SW-HIPBA | eigener Patch-Save (Objekt 9 vor der Party) / native Aufnahme daraus (Vergleichsbasis) | `c306cfc7c77d` / `f21f908c916d` |

## 1. Export erzeugen und Hashes (known)
| Punkt | Ergebnis |
|---|---|
| Kit | temporärer Blobless-Clone, `git checkout 64a3c4f`; bestehender Clone unberührt; keine Kit-Datei geändert (`git status` leer). Kein `npm install` nötig (Node 24, Typ-Stripping). |
| Eingabeverzeichnis | eigenes `ISHAR2_DIR` unter private/ mit Kopien von START.SAV, IO.IO, CONT1.FIC, byte-identisch zum Original (`cmp`); einziges SAV ist START |
| Input-Hashes | START `e685cd690257` (= Soll), IO.IO `0df1f34cf251`, CONT1.FIC `b3f48f1856b7` |
| Aufruf | `ISHAR2_DIR=… ISHAR_PRIVATE_OUTPUT=<private> node scripts/check-original-ground-roundtrip-local.mjs --controlled-placement` → „1 cases passed“ |
| Ausgabe | `START.SAV-9-received.SAV` = `74378c770176` = **Soll-Hash, exakt gleich** |
| Skript-Selbstbericht | Objekt 9, Empfänger Figur 0, Slot 0; geänderte Offsets 345/545/745 (Welt) und 1037 (Inventarwort) |

**Was der Export gegenüber SW-START ändert (known, Bytediff):** 4 Bytes: Party-Position und Blickrichtung (Offsets 3, 5, 7; kontrollierte Platzierung durch das Skript) und das Inventarwort Figur 0 Slot 0 (Offset 1037 → Objekt 9). Die Weltbytes von Objekt 9 sind wie in SW-START leer, der Wert des Blickbytes 8048 ist unverändert.

## 2. Native Ladung (Original-EXE, DOSBox-X auf eigenem Xvfb, eine Instanz pro Session, danach beendet)
| Prüfung | Ergebnis | Evidenz |
|---|---|---|
| SW-CDXA als neuer Slot in Arbeitskopie `work-i2` (Startspiel nicht überschrieben) | abgelegt, Hash unverändert `74378c770176` | **known** |
| Erstes Laden (Session 1) | Laden wird angenommen, Spielbild ändert sich vollständig gegenüber dem Bootbild (Bilddiff über den ganzen Bildschirm); kein Absturz, keine Fehlermeldung, Party vollständig | **known** |
| Inventar | Charakterblatt Figur 0: Rucksack zeigt das Icon von Objekt 9. Das Blatt ist **pixelgleich zum Blatt nach der nativen Aufnahme (SW-HIPBA)**, einzige Abweichung ist der Kompass (andere Blickrichtung, Bereich 278..298 × 2..13) | **known** |
| Welt | Kein Bodensprite von Objekt 9 (Weltbytes leer; im Bild kein Sprite mit der Grafik von Objekt 9) | **known** |
| Ansicht an der Exportposition | Die Platzierung des Skripts (erste laut Kit begehbare Zelle) liegt am Kartenrand: Sand/Leere ohne Kulisse. Links sichtbar ist ein **fremdes** Bodensprite (andere Grafik als Objekt 9). Mehrere Objekte stehen im Save auf einer gemeinsamen Parkposition dieser Karte (Wert privat, SW-CDX-PARK); eines davon ist vermutlich das sichtbare | Bild **known**, Zuordnung **suspected** |
| Neuspeicherung | in neuen Slot SW-CDXB (`c2c2b25581d7`), Diskmenü danach geschlossen | **known** |
| Reload (Session 2, neue Instanz) | SW-CDXB lädt; Spielbild gleich dem ersten Ladebild bis auf die Uhrzeitanzeige (216..221 × 0..8); Charakterblatt Figur 0 pixelgleich zu Session 1 | **known** |

## 3. Vollständiger Diff SW-CDXA (geladen) → SW-CDXB (neu gespeichert) (known)
17 Bytes, alle erklärt:

| Offsets | Klasse | Erklärung |
|---|---|---|
| 45, 48, 49 | Uhr (44–49) | Spielzeit lief zwischen Laden und Speichern |
| 3446; 3882, 3884, 3886; 5001; 5113; 5333; 5443; 5553; 5951, 5954, 5957; 6213; 6651 | Neuwurf der Akteure ≥ 90 | über das IO.IO-Layout auf RAM abgebildet: alle in den bekannten Neuwurfblöcken (0x36ac, 0x3868, 0x3d2e, 0x3d9e, 0x3e7e, 0x3eee, 0x3f5e, 0x4040, 0x41fc, 0x43ba), Akteurindex jeweils 90–92 |
| Tagesphase (90–93) | – | keine Änderung |
| Unbekanntes | – | **keins** |

Inventarwort, Weltbytes von Objekt 9 und Position bleiben bei der Neuspeicherung unverändert: Die Original-EXE übernimmt den Export ohne Korrektur.

## 4. Vergleich mit der nativen Aufnahme SW-HIPBA (known)
Diff SW-HIPBA → SW-CDXA: 21 Bytes.

| Offsets | Inhalt | Bewertung |
|---|---|---|
| 345/545/745, 1037 | Welt Objekt 9 / Inventar Figur 0 Slot 0 | **identisch** – der Kern des Exports entspricht der nativen Aufnahme |
| 3, 5, 7 | Party-Position und Blick | verschieden durch Aufbau: SW-HIPB bewegt das Objekt vor die Party, das Kit bewegt die Party neben das Objekt. Kein Fehler des Exports, aber **keine Spielpfad-Position** (siehe Offen) |
| 8048 | Blickbyte Objekt 9 | SW-HIPBA trägt den Patchwert von SW-HIPB; die native Aufnahme schreibt dieses Byte nicht (SW-HIPB → SW-HIPBA ohne Änderung an 8048). Der Export lässt es ebenfalls unberührt (START-Wert) → **korrekt** |
| 45, 48, 49 | Uhr | Rauschen |
| 3442, 3884, 3886, 5001, 5003, 5111, 5331, 5441, 5551, 5951, 5954, 6211, 6653 | Neuwurf Akteure 90–92 | Rauschen (SW-HIPBA ist selbst eine native Speicherung) |

Fazit: Überall, wo Codex' Export von der nativen Aufnahme abweicht, liegt die Ursache im anderen Aufbau (Position, Patchrest) oder im bekannten Rauschen. Die von der Aufnahme geschriebenen Bytes (Welt 345/545/745 geleert, Inventarwort) stimmen exakt überein; zusätzliche oder fehlende Writes gibt es nicht. **known**

## 5. Integrität (known)
- Originalinstallation (311 Dateien) vor und nach dem Lauf hash-gleich.
- In `work-i2` kam nur SW-CDXA und SW-CDXB hinzu; alle übrigen Saves hash-gleich.
- Kit-Clone ohne lokale Änderungen; Ausgaben nur unter private/.

## 6. Offen
- **suspected:** Die Exportposition (erste laut Kit begehbare Zelle) liegt am Kartenrand und zeigt kein normales Gelände. Ob die Party von dort nativ regulär gehen kann, ist **unknown** (nicht getestet). Das Laden selbst ist unproblematisch.
- **suspected:** Das sichtbare fremde Bodensprite gehört zu einem der auf einer gemeinsamen Parkposition (Wert privat, SW-CDX-PARK) geparkten Objekte; nicht einzeln zugeordnet.
- **unknown:** SW-CDX-IN (Objekt 9 liegt noch am Boden) wurde nativ nicht geladen; der Nachweis, dass Objekt 9 an genau dieser Stelle nativ sichtbar und aufnehmbar wäre, fehlt also.
- Nicht geprüft: Variante `--controlled-gold` (Objekt 10).
