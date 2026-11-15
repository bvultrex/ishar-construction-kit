# HOTH Abnahme 18.10.2026: Hebel und Tür im Original schalten

Ersteller: Hoth (Grok Bot, Executor). Zeit: 17:40–18:02 MESZ. Grundlage: `codex-support/quesh/hebel-tuer-trigger-ishar2.md` (vorher suspected). Private Belege: `codex-support/hoth/private/hebel/`.

## 0. Offset-Konvention (wichtig)
- `save_layout.py` und Quesh zählen **nullbasiert**: Tür d = Byte 7381+d, Hebel k = 7431+k.
- `cmp -l` zählt **einsbasiert**, also um 1 höher. Tür 6 erscheint in cmp als 7388, Hebel 6 als 7438, Tür 5 als 7387.
- Beleg: K5F005 hat nullbasiert x[7387] = 1 und x[7437] = 1, passend zu Quesh „0x4aa4[6] = 1, 0x4ad8[6] = 1“.
- Die Erwartung „7437 und 7387 fallen 1→0“ ist also nullbasiert gemeint und trifft genau zu.
- **Achtung, Folgefehler:** Im Bericht CONT_WRITEBACK_2 habe ich „Türtabelle 7381–7430“ mit cmp-Offsets geprüft, also um 1 verschoben. Die Aussage „unverändert“ gilt trotzdem: Im Bereich 7381–7531 gab es dort gar keine Änderung.

## 1. Aufbau
- Klon `clones/hoth` detached auf 319819c. Den Position-Check habe ich auf dem lokalen Zweig `grok/hoth-save-solid-pos-proposal` (cc53059) laufen lassen; danach zurück auf 319819c. Nichts committet oder gepusht.
- Frische Arbeitskopie `private/hebel/work-20261018-1740` per `cont-mod apply` mit denselben Mod-Bytes (CONT5 124 = 67, 5525 = 33). Datei-mtimes stehen auf 2026-01-01.
- DOSBox-X mit eigener Conf `private/dosbox-x-auto2-hebel.conf`: **`cycles=fixed 25000`**, Xvfb :97, je Session eine Instanz, am Ende per kill -9 auf das eigene Muster beendet. Am Schluss laufen weder Instanz noch Xvfb. Alderaans Instanzen habe ich nicht angefasst.
- Klickkoordinaten: Spielbild 320×200, Skalierung 1:1, Fensterversatz +(90,67).
- Eingangs-Saves (Kopien bzw. Patch-Ausgaben, keine Originale überschrieben):

| Save | Herkunft | Patch | Position-Check |
|---|---|---|---|
| HOTHBA | K5F005 (sha 324c1ce7…fb88, `dosbox/ishar2-alis`) | r23 c19 Blick 3 | walkable |
| HOTHBB | K5F005 | r40 c31 Blick 3, Zone 33 | walkable |
| HOTHV5/V6 | HOTHA5/HOTHA6 | nur r27 c16 Blick 3, Sicht auf Tür 6 | walkable |

## 2. Testort A: Hebel 6 → Tür 6
Mit leerer Hand geklickt, nach jedem Klick in einen neuen Slot gespeichert:

| Klick (x,y) | neuer Slot | cmp -l gegen den vorigen Save (einsbasiert) | Bedeutung |
|---|---|---|---|
| 128,90 | HOTHA1 | 46, 50 | nur Spielzeit, **kein Treffer** |
| 128,70 | HOTHA2 | 49, 50 | Spielzeit, kein Treffer |
| 128,110 | HOTHA3 | 46, 50, 92 (2→1), 94 (2→1) | Spielzeit; 92/94 = Bytes 91/93 nullbasiert im Block 0x519f/0x51a0, Bedeutung unbekannt; kein Treffer |
| 128,119 | HOTHA4 | 46, 49, 50 | kein Treffer |
| **152,58** | **HOTHA5** | 46, 50, **7388 1→0**, **7438 1→0** | **Treffer: Hebel 6 = 0 (0x4ad8[6]), Tür 6 = 0 (0x4aa4[6], zu)** |
| 152,66 | HOTHA6 | 49, 50, **7388 0→1**, **7438 0→1** | zweiter Klick schaltet beides zurück auf 1 |

- **Treffer bei x=152, y=58.** Der Hebelknauf sitzt rechts der Bildmitte bei etwa (152,55–70) (Zoom `zoom.png`). Die vermuteten x=128 und alle y-Werte trafen nicht.
- Bilder `24`/`25`/`26`/`28`/`29` (Kontaktbogen `m2.png`): Der Hebel wechselt sichtbar von oben nach unten und wieder nach oben.
- Tür 6 sichtbar (r27 c16 Blick 3, `m3.png`):
  - HOTHV5 (aus HOTHA5) zeigt die **Tür geschlossen (Gittertür im Bogen)**.
  - HOTHV6 (aus HOTHA6) zeigt den **Bogen offen**.
  - Bilddiff 2 979 px, obwohl die Saves sich nur in 7388/7438 und der Spielzeit unterscheiden.
- **Ladeprüfung in frischen Sessions:**
  - HOTHA5: GRIMZEL gegen HOTHA5 28 718 px; HOTHA5 gegen das Bild vor dem Speichern (`26`) 430 px.
  - HOTHA6: GRIMZEL→HOTHB1→HOTHA6 Diff 11 400 px zum Vorbild; gegen `29` (Hebel oben) 420 px.

**Urteil A: known.**
- Der Hebelklick mit leerer Hand schaltet im Original Hebel 6 (0x4ad8[6]) und Tür 6 (0x4aa4[6]) gemeinsam um, in beide Richtungen.
- Speichern und Laden erhalten den Zustand, die Tür ist sichtbar zu bzw. offen.
- Quesh-Kette 20 → L_003c1 in der Wirkung bestätigt. Die Klickzone stimmt nicht mit der Hypothese überein: (152,58) statt (128,90).

## 3. Testort B: Rahmen von Tür 5
- HOTHBB (r40 c31 Blick 3, Zone 33): Türrahmen sichtbar (`40`). Klick (128,70) → der Rahmen ist weg, der Durchgang offen (`42`, 4 660 px Unterschied).
- Neuer Slot **HOTHB1**. `cmp -l HOTHBB HOTHB1` ergibt nur: 46, 50 (Spielzeit) und **7387 0→1** (nullbasiert 7386 = 0x4aa4[5], Tür 5 offen).
- **Treffer beim ersten Klick, y=70.**
- Ladeprüfung in frischer Session: GRIMZEL gegen HOTHB1 28 644 px; HOTHB1 gegen das Bild nach dem Klick (`42`) 416 px, also offener Durchgang.

**Urteil B: known.**
- Der Klick auf den Rahmen öffnet Tür 5 und setzt nur 0x4aa4[5] = 1, keinen Hebel. Speichern und Laden erhalten das.
- „Nur öffnen, Einbahnrichtung“: suspected, nicht getestet.

## 4. CONT und Saves
- Alle CONT nach allen Sessions:
  - CONT1–4, 6 und 7 byte-gleich mit dem Original.
  - CONT5 nur mit den 2 Mod-Bytes (sha 56e0771f…224b7b).
  - Die mtimes aller CONT unverändert auf 1767222000.
- Abweichende mtimes haben nur die neu geschriebenen HOTHA1–6 (HOTHA5 17:49:14, HOTHA6 17:49:52 MESZ) und HOTHB1 (17:55:36 MESZ). Dazu kommt das Verzeichnis „Ishar 2 - Lösung“ (Verzeichnis-mtime aus dem Kopieren, keine Datei).
- **Hebel- und Türschaltung schreiben CONT nicht.** Der Zustand liegt allein im Save (0x4aa4 / 0x4ad8). known
- sha256 vorher und nachher: 311 Originale und 435 Saves unter `dosbox/ishar2*`, identisch.

## 5. Byte 7578 (0x4b80, Liste der Actors mit Nahkontakt)
- Werte bei nullbasiert 7575–7577 (einsbasiert 7576–7578):
  - Alle Saves hier (K5F005-Familie, GRIMZEL): [86, 0, 0].
  - GRIMZ: [86, 0, 52]. HOTTU6 (GRIMZ nach einem Schritt): [86, 0, 0].
- Gegenprüfung:
  - Die 52 verschwindet beim Weitergehen, ohne dass ein Actor sichtbar war oder starb. Das passt zu „wird beim Weitergehen geleert“.
  - **Aber** Slot 0 (86) bleibt dabei stehen. Das widerspricht „GERDEP 0x013d5 leert alle 3 Slots“, wenn das bei jedem Schritt liefe.
- Stufe: Rolle suspected, Leeren beim Schritt für Slot 2 beobachtet, Slot 0 unklar.

## 6. Offene Punkte / Vorschläge
- Die Klickzone des Hebels in Quesh' Notiz korrigieren: (152,58) statt x=128.
- Rahmen „nur öffnen“ prüfen: zweiter Klick auf die Stelle nach dem Öffnen.
- Schlüsseltür 8 (Gegenstand −17 in der Hand) testen.
- Slot-0-Wert 86 in 0x4b80 statisch nachlesen.
- Bytes 92/94 (einsbasiert), die sich in HOTHA3 ohne Treffer änderten, gehören zum Block 0x519f/0x51a0 (Startinit). Bedeutung offen.

## 7. Belege
`private/hebel/`: `session.log`, `snaps/`, Bilder `NN-*.png`, Kontaktbögen `m1`–`m4`, `zoom.png`, `in/*.json`, `out/*.report.json`, Arbeitskopie mit allen Saves, sha-Listen vorher und nachher.
