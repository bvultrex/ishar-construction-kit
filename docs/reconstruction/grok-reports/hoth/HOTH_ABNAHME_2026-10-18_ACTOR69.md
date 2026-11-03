# HOTH Abnahme 18.10.2026: Actor 69 (Nacht-NPC) und Speicherfehler um 2 Uhr

> Bereinigte Fassung (2026-11-03): Positionen, Klickkoordinaten, Pixelzahlen, Spielzeiten, sha-Werte und Rohwerte aus Saves stehen in `private/bereinigung/HOTH_ABNAHME_2026-10-18_ACTOR69.privat.md`.

Ersteller: Hoth (Grok Bot, Executor). Zeit: 20:33–20:55 MESZ. Private Belege: `codex-support/hoth/private/actor69/`.
Offset-Notation: **ab 0** wie save_layout und Quesh, **cmp** = `cmp -l` (ab 1). Uhrzeiten des Spiels als Stunde:Ticks.

## 1. Aufbau
- Klon detached auf 319819c. Die Positionsprüfung lief auf dem lokalen Zweig cc53059, danach wieder auf 319819c. Nichts committet oder gepusht.
- Frische Arbeitskopie `private/actor69/work-20261018-2034` per `cont-mod apply`. Mod-Bytes: CONT5 124 = 67, 5525 = 33. mtimes auf 2026-01-01.
- Conf `private/dosbox-x-auto2-actor69.conf` mit **`cycles=fixed 25000`**, Xvfb :97, eine Instanz je Session, per kill -9 auf das eigene Muster beendet. Am Schluss läuft nichts. Alderaans Instanzen habe ich nicht angefasst.
- Nur ein Eingabeweg (xdotool): Tasten 350 ms, Klicks 200 ms.
- Speichern über ein eigenes `private/actor69/savenew2.sh`: gleiche Schritte wie `xpgold/savenew.sh`, aber nach jedem Schritt Bild und Zeitstempel (`save.log`, `sv_<NAME>_0vor/1menu/2dialog/3name/4nach.png`).

## 2. Auftrittsort von Actor 69 (abgeleitet, nicht geraten)
- Actor-Tabellen laut save_layout und Quesh `dataflow-ishar2.md` Zeile [Pos.]: Zeile 0x3412 (Wort, ab 0 2601 + 2·id), Spalte [Pos.]x34f0 (2821 + 2·id), Szene/CONTREE 0x449a (6781 + id).
- Für id 69 in S1, S, S2, SASCHA, LEVELING und LP3: **Zeile [Pos.], Spalte [Pos.]**. Szene 0, nur in S.SAV 12.
- Die Szene 12 setzt GERDEP 0x004b0 bei Stunde 2 (Quesh). S1 steht auf Karte 3 in Zone 12.
- CONT3 Zeile [Pos.]: [Pos.] A/B [privat], [Pos.] Gang (53, 55, 53, 66, 38), [Pos.] Fels.
- **Standort [Pos.], Blick [privat]:** Zelle ([Klick]) liegt 2 Felder voraus. Erster Lauf: [Pos.] (3 voraus).
- Bedingung 0x2c4e[6] ≠ 0 (ab 0 Byte 742): in S1 = 1.

## 3. Patches (Kopien von S1, sha [privat])
- **HOTA0** (`in/a0.json`): `cmp -l S1 HOTA0` (oktal; ab 0 ist jeweils 1 weniger):
  - [cmp privat]
  - [cmp privat]
  - [cmp privat]
  - [cmp privat]
  - 49/50: [Werte privat] (Ticks geändert)
  - Positionsprüfung: walkable.
- **HOTB0** (`in/b0.json`): wie HOTA0, aber Spalte [Pos.] (cmp [cmp privat]). walkable.
- Zone 12 und Karte 3 kommen unverändert aus S1.

## 4. Sichtbarkeit von Actor 69 (Lauf B, ab [Pos.])
- Die HUD-Stunde habe ich je Bild abgelesen (`hud.png`). Den Figurbereich (105..135, 55..95) habe ich gegen Bild `35` (4 Uhr, Nacht, ohne Figur) verglichen: Pixel mit Farbdifferenz > 60.

| Bild | HUD | Figur in ([Klick]) | Diff Figurbereich gegen `35` |
|---|---|---|---|
| `24`, `25` | 1 | nein (Tagespalette) | 1137 (andere Palette) |
| `26`–`29` | 2 | **ja, dunkle Gestalt in Gangmitte, Tiefe 2** | 144 |
| `sv_HOTB1_0vor` | 2 | ja | 144 |
| `sv_HOTB2_0vor` | 3 | ja | 144 |
| `34` | 4 | **nein** | 0 |
| `35`–`37` | 4–5 | nein | 0 |
| `39` | 6 (Tag) | nein | – |

- Zoom: `zoom.png` (Reihenfolge 1 Uhr / 2 / 2 / 4 / 5 / 5 / 6 Uhr).
- Lauf A (ab [Pos.], Tiefe 3) zeigt dasselbe Muster, aber schwächer erkennbar.
- **Byteabgleich, ab 0 6850 = 0x449a[69] (cmp 6851):**
  - HOTB0 ([Spielzeit]) = 0
  - HOTB1 ([Spielzeit]) = **12**
  - HOTB2 ([Spielzeit]) = 12
  - HOTB3 ([Spielzeit]) = **0**
  - Lauf A: HOTA1 ([Spielzeit]) = 0, HOTA3 ([Spielzeit]) = 12, HOTA5 ([Spielzeit]) = 0.
- **Verzögerung:**
  - HOTA1 ([Spielzeit]) trägt noch 0, HOTB2 ([Spielzeit]) noch 12.
  - Die Uhr läuft also auch im Speichermenü weiter. Gespeichert wird ein Stand, den GERDEP noch nicht ausgewertet hat; GERDEP prüft die Stunde nur in seiner eigenen Schleife (0x0048a).
  - Im Bild verschwand die Figur zwischen `sv_HOTB2_0vor` (3 Uhr) und `34` (4 Uhr, nach dem Menü).
  - Stufe suspected (Ursache), beobachtet (Fakt).
- **Neuladen in frischer Session:**
  - HOTB1: GRIMZEL→HOTB1 [px], das Laden hat gegriffen. Gegen das Bild vor dem Speichern (`29`) nur [px]; **Figurbereich identisch mit `29` ([px]), also Figur sichtbar.**
  - HOTB3: GRIMZEL→HOTB3 [px]; gegen `39` [px], ohne Figur.
- **Weitere Bytes zum Zeitpunkt 2 Uhr** (HOTB0→HOTB1, ab 0/cmp):
  - 3180/[cmp privat]. Das ist 0x35ce, Wort [69], Low-Byte, also auch zu id 69 gehörig. Nicht untersucht, das macht Quesh.
  - 7409/7410: Tür 28 0→1 (wie im Bericht TUER28).
  - 91/93: Phase geändert.
  - 2786/2788 und 3006/3008: Zeile (0x3412) und Spalte (0x34f0) der Actors 92 und 93, die sich bewegen.
  - [cmp privat].
  - Die Position von Actor 69 ([Klick]) bleibt in allen Saves gleich.

**Urteil Sichtbarkeit: known (eigener Bild- und Bytebeleg).**
- Bei Stunde 2 erscheint in Zelle ([Klick]) eine Gestalt und 0x449a[69] wird 12.
- Bei Stunde 4 verschwindet sie und das Byte wird 0. Der Zustand übersteht Speichern und Laden.
- Dass die Gestalt genau Actor 69 ist, folgt aus Position und Zeitgleichheit: suspected (stark). Andere Actors stehen nicht auf ([Klick]).

## 5. Speicherfehler: Ursache gefunden
| Versuch | Zeitpunkt (Uhr) | Vorher | Ergebnis |
|---|---|---|---|
| HOTA1 | ~geändert (gespeichert [Spielzeit]) | geladen, Menü zu | ok |
| HOTA2 | 2 | **direkt nach HOTA1, Menü noch offen** | **fehlgeschlagen** |
| HOTA3 | geändert | nach dem Fehlschlag (Menü zu) | ok, Spalte geändert verschoben |
| HOTA4 | ~5 | 60 s nach HOTA3, ohne Klick dazwischen, **Menü offen** | **fehlgeschlagen** |
| HOTA5 | 6 | nach dem Fehlschlag | ok, Blick geändert verschoben |
| HOTA6 | 6 | **direkt nach HOTA5** | **fehlgeschlagen** |
| HOTB1 | 2 ([Spielzeit]) | Menü zu | ok |
| HOTB2 | geändert ([Spielzeit]) | nach HOTB1 Menü per Klick ([Klick]) geschlossen | ok |
| HOTB3 | 6 | Menü geschlossen | ok |
| HOTB4 | **7 (neutral)** | Menü geschlossen | ok |
| HOTB5 | 7 (neutral) | **direkt nach HOTB4, Menü offen** | **fehlgeschlagen** |
| HOTB6 | 8 | nach dem Fehlschlag | ok, Spalte geändert verschoben |

- **Ursache:** Nach erfolgreichem Speichern bleibt das Diskettenmenü offen (`sv_HOTA1_4nach.png`).
  - Beim nächsten Speicherversuch schließt der Klick auf das Diskettensymbol nur das Menü.
  - Der Klick „SAVE“ ([Klick]) fällt dann in die Spielansicht; die getippten Buchstaben und Return wirken als Spieleingaben. Daher die verschobenen Positionen.
- Das tritt **unabhängig von der Uhrzeit** auf: bei 2 Uhr genauso wie bei 7 Uhr (neutral). Mit einem Schließklick ([Klick]) nach jedem Speichern gelangen alle Versuche, auch um 2 und um 4 Uhr.
- Weitere Bedingungen bei allen Versuchen: Karte 3, Zone 12, nur xdotool, kein anderer Dialog offen, Ereignis „Actor 69 erscheint“ bei Lauf A und B jeweils im Zeitraum.
- Die Fehlschläge im TUER28-Lauf (HOTZ3/HOTZ3B) passen genau dazu: HOTZ3 kam direkt nach HOTZ2.

**Urteil Speichern um 2 Uhr: known.** Es gibt keinen Fehler, der an 2 Uhr gebunden ist. Ursache ist das offen gebliebene Diskmenü nach einem vorherigen Speichern.

## 6. CONT und Saves
- CONT1–4, 6 und 7 byte-gleich mit dem Original. CONT5 nur mit den 2 Mod-Bytes (sha [privat]). Alle CONT-mtimes stehen auf 1767222000.
- Abweichende mtimes nur bei den neuen Saves HOTA1, HOTA3, HOTA5 und HOTB1–4, HOTB6 sowie beim Verzeichnis „Ishar 2 - Lösung“.
  - Die Datei-mtimes stammen aus der DOS-Uhr und liegen etwa 30–60 s nach der Box-Zeit des Speicherns.
- sha256 von 311 Originalen und 435 Saves: vorher und nachher identisch. Nichts überschrieben.

## 7. Hinweise / Vorschläge
- In `savenew.sh` nach dem Speichern einen Schließklick ([Klick]) ergänzen, oder vor jedem Speichern prüfen, ob das Menü offen ist. Bisher nur hier lokal (`savenew2.sh` ohne Schließklick, Schließklick in der Session).
- Byte 3180 (0x35ce[69]) und 3220 an Quesh übergeben, nicht untersucht.

## 8. Belege
`private/actor69/`: `session.log`, `save.log`, `snaps/`, Bilder `NN-*.png`, `sv_*.png`, Kontaktbögen m1–m3, `zoom.png`, `hud.png`, `in/*.json`, `out/*.report.json`, Arbeitskopie, sha-Listen vorher und nachher.

## Nachtrag 18.10.2026 21:0x (suspected, Quelle: Quesh `zeit-ishar2.md`, von mir nicht nachgeprüft)
- Byte 3180 (ab 0) ist die **Blickrichtung von Actor 69**: Tabelle 0x35ce, Save 3041 + 2·id, Low-Byte.
- Byte 3220 ist entsprechend die Blickrichtung von **Actor 89**.
- Eine Stunde hat **1000 Durchläufe** (0x4fcc, DOS-Version). Das passt zu meinem Wert [Spielzeit] in HOTB1 (< 1000).
- **Eine Zeitsperre beim Speichern gibt es nicht.** Das deckt sich mit meinem Befund: Die Fehlschläge kamen vom offen gebliebenen Diskmenü.
- Umgesetzt: `private/xpgold/savenew.sh` und `private/actor69/savenew2.sh` klicken nach jedem Speichern auf ([Klick]), um das Diskmenü zu schließen. Sicherung der alten Fassung: `savenew.sh.bak-20261018`.
