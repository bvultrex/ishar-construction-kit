# HOTH Abnahme 18.10.2026: Zeitgesteuerte Tür 28 (Karte 7)

Ersteller: Hoth (Grok Bot, Executor). Zeit: 20:08–20:33 MESZ. Grundlage: Quesh-Addendum 19:5x in `quesh/hebel-tuer-trigger-ishar2.md` (suspected). Private Belege: `codex-support/hoth/private/tuer28/`.
Offset-Notation: **ab 0** wie save_layout und Quesh, **cmp** = `cmp -l` (ab 1). Uhrzeiten des Spiels als Stunde:Ticks.

## 1. Aufbau
- Klon `clones/hoth` detached auf 319819c. Die Positionsprüfung lief auf dem lokalen Zweig cc53059, danach wieder 319819c. Nichts committet oder gepusht.
- Frische Arbeitskopie `private/tuer28/work-20261018-2010` per `cont-mod apply`. Mod-Bytes: CONT5 124 = 67, 5525 = 33. mtimes auf 2026-01-01.
- Eigene Conf `private/dosbox-x-auto2-tuer28.conf` mit **`cycles=fixed 25000`**, Xvfb :97, je Session eine Instanz, per kill -9 auf das eigene Muster beendet. Am Schluss läuft nichts mehr. Alderaans Instanzen habe ich nicht angefasst.
- Nur ein Eingabeweg (xdotool): Tasten 350 ms, Klicks 200 ms.

## 2. Uhr im Save (eigene Ableitung)
`save_layout.py` (IO.IO-Laderoutine), dazu MAIN.IO:

| Feld | Adresse | Save-Bytes ab 0 (BE-Wort) | Bedeutung | Beleg |
|---|---|---|---|---|
| Stunde | 0x4fc6 | 44–45 | 0..23 | MAIN 0x03fbe: +1, wenn Ticks ≥ 0x4fcc; 0x03fca: ≥ 24 → −24 und Tag +1 |
| Tag | 0x4fc8 | 46–47 | Tageszähler | MAIN 0x03fd7 und 0x011d3 |
| Ticks | 0x4fca | 48–49 | Unterzähler der Stunde (keine Minuten) | MAIN 0x03faa: +1 pro Tick, wenn 0x2ab7 == 0; Reset auf 0 beim Stundenwechsel |
| Ticks pro Stunde | 0x4fcc | **nicht im Save** | 600 oder 1000 | MAIN 0x00417/0x004a7 u. a.; welcher Wert aktiv ist: unknown |

- Die HUD-Zahl oben rechts ist die Stunde (MAIN 0x04014 `cvputprint 0x4fc6`), die Zahl davor der Tag.
- Nebenwirkung: Die Tagesphase 0x519f/0x51a0 (ab 0 Byte 91/93) folgt der Stunde. Im Versuch war bei 3 Uhr Phase 1, bei 0 Uhr 2, ab 1 Uhr 3.
  - Das passt nicht zu Queshs Regel (<6 → 3): Nach der Regel müsste schon bei 3 Uhr 3 stehen.
  - Vermutlich wird die Phase nur bei einem Stundenwechsel neu berechnet; HOTZ0 trug noch den gepatchten Tageswert. suspected.
- **Gemessene Dauer: ca. 43 s Realzeit pro Spielstunde** (DOSBox cycles 25000).
  - Stundenwechsel laut HUD bei 20:13:16, 20:13:59, 20:14:42 und 20:15:22 MESZ, abgetastet im 20-s-Raster, also grob.
- Rast oder Schlaf habe ich nicht verwendet. Die Debugtaste „a“ (+200 Ticks, MAIN 0x0412b) habe ich bewusst nicht benutzt.

## 3. Ort und Patches
- CONT7 Zeile 6:
  - c8 A = −5 / B = −57 (PPSAC)
  - c9 A = 43 / B = −121
  - c10 A = 10
  - **c11 A = 43 / B = 88 → Tür 28 (Türblatt)**
  - c12 A = 20, Gang nach r5/r7
- Standort **r6 c12, Blick 1 (−col)**: Tür 28 ist eine Zelle voraus.
- Zone 52: Die Marken r8 c13 = −92 und r7 c15 = −92 ergeben 52. Nach Queshs Liste ist das DJ1. Positionsprüfung: walkable.
- **HOTZ0** = Kopie von HOTK753 (sha 27b4b7d6…1aed: Karte 7, 14:510, Tür 28 = 1, 0x449a[69] = 12, Objekt 6 ≠ 0). Patch `in/z1.json`.
  - `cmp -l HOTK753 HOTZ0` (cmp oktal → ab 0 dezimal):
    - 4: 14→6 = ab 0 Byte 3 (Zeile 12→6)
    - 6: 10→14 = Byte 5 (Spalte 8→12)
    - 8: 2→1 = Byte 7 (Blick 2→1)
    - 20: 65→64 = Byte 19 (Zone 53→52)
    - 46: 16→3 = Byte 45 (Stunde 14→3)
    - 49/50: 1/376 → 2/60 = Byte 48/49 (Ticks 510→560)
- **HOTZ1N** = Kopie von HOTZ1 (Spielergebnis, Tür 28 = 0). Patch `in/z2.json`: Stunde 7→0 (cmp 46: 7→0) und Ticks 251→560 (cmp 49/50: 0/373 → 2/60).
  - Damit ist der Ausgangszustand „Tür zu“ vom Spiel selbst erzeugt, nicht ins Blaue gepatcht.
- Bedingung für Actor 69 (GERDEP 0x00497): 0x2c4e[6] ≠ 0. Im Save liegt das ab 0 bei Byte 742 und ist überall 1.

## 4. Ablauf und Ergebnis
| Slot (neu) | Uhr h:Ticks | 7409 Tür 28 (cmp 7410) | 6850 = 0x449a[69] (cmp 6851) | Phase 91/93 | Bild |
|---|---|---|---|---|---|
| HOTZ0 (Patch) | 3:560 | 1 | 12 | 1/1 | Bogen offen, Figur dahinter (`04`, `zoom1.png` links) |
| **HOTZ1** | 7:251 | **0** | **0** | 2/2 | ab der HUD-Stunde 4 Tür zu, Holzgitter (`05`–`10`, `zoom1.png` rechts) |
| HOTZ1N (Patch) | 0:560 | 0 | 0 | 2/2 | zu (`24`) |
| **HOTZ2** | 1:519 | **1** | 0 | 3/3 | offen ab HUD 1 (`25`) |
| **HOTZ3B** | 3:52 | 1 | **12** | 3/3 | offen (`46`, `47`) |
| **HOTZ4** | 5:437 | **0** | **0** | 3/3 | Tür nicht im Blick (nach einem Fehlklick Zeile 7, Blick auf die Wand), nur Byte-Beleg |

**cmp -l der Spiel-Saves (ab 0 / cmp):**
- **HOTZ0→HOTZ1:**
  - 45/46: 3→7 (Stunde); 48/49 und 49/50 (Ticks)
  - 91/92 und 93/94: 1→2 (Phase)
  - **3220/3221: 0→1** (main:0x35ce + 179, Bedeutung unbekannt)
  - **6850/6851: 12→0**, **7409/7410: 1→0**
- **HOTZ1N→HOTZ2:** 45/46: 0→1; 49/50 (Ticks); 91/92 und 93/94: 2→3; **7409/7410: 0→1**. Sonst nichts.
- **HOTZ2→HOTZ3B:** 45/46: 1→3; 48/49 und 49/50 (Ticks); **6850/6851: 0→12**. Sonst nichts.
- **HOTZ2→HOTZ4:** 3/4: 6→7 (Zeile, Fehlklick nach dem gescheiterten Speichern); 45/46: 1→5; Ticks; **7409/7410: 1→0**. Der Actor blieb 0, weil die Zwischenstufe 12 nicht gespeichert wurde.
- Schaltertabelle (ab 0 7431+) in keinem Diff verändert.

**Neuladen in frischen Sessions (Bilddiff):**

| Save | gegen GRIMZEL (Laden gegriffen) | gegen das Bild vor dem Speichern | Inhalt |
|---|---|---|---|
| HOTZ2 | 43 485 px | 156 px | offen |
| HOTZ1 | 43 515 px | 35 px | zu |
| HOTZ3B | – | 3 596 px (Uhr- und Animationsstand, `m4.png`) | offen |
| HOTZ4 | 43 679 px | 2 736 px | Wandblick |

**Speicherproblem (Beobachtung):**
- Zwei Speicherversuche um Stunde 2 schlugen fehl: HOTZ3 entstand nicht, HOTZ3B erst verspätet um 3:52. Das Diskmenü öffnete sich nicht sofort.
- Der nächste Klick traf im ersten Fall die Bewegungsleiste, daher die verschobene Zeile in HOTZ4.
- Ob das mit dem `cwakeup` bei Stunde 2 (GERDEP 0x004ba) zusammenhängt: unknown.

## 5. Urteile
- **Uhr-Offsets:** Stunde 44–45, Tag 46–47, Ticks 48–49 (ab 0): **known** (save_layout plus Laufzeit). Der Grenzwert 0x4fcc steht nicht im Save; ob 600 oder 1000 gilt, ist unknown.
- **Tür 28 = 0x4aa4[28] = ab 0 7409 (cmp 7410), Karte 7 r6 c11:** **known.** Öffnet sich beim Wechsel auf Stunde 1 (0→1, sichtbar offen) und schließt sich beim Wechsel auf Stunde 4 (1→0, sichtbar zu). Beides übersteht Speichern und Laden.
- **Actor 69 (0x449a[69] = ab 0 6850, cmp 6851):**
  - Byte-Verhalten **known:** 0→12 zwischen 1 und 3 Uhr, 12→0 über 4 Uhr. Der exakte Zeitpunkt 2:00 ist nicht eigens gespeichert, passt aber zum Bytecode.
  - **Sichtbarkeit: nicht belegt.** 12 ist nach Queshs Lesart die Szene 12 (Karte 3), nicht das Gefängnis.
  - Die Figur hinter dem Bogen ist bei 1 Uhr (Actor 0) und bei 3 Uhr (Actor 12) gleich, gehört also **nicht** zu Actor 69.
- **CONT:** unverändert (siehe 6).

## 6. CONT und Saves
- CONT1–4, 6 und 7 sind byte-gleich mit dem Original. CONT5 hat nur die 2 Mod-Bytes (sha 56e0771f…224b7b). Alle CONT-mtimes stehen weiter auf 1767222000.
- Abweichende mtimes haben nur die neuen HOTZ1 (20:16:30), HOTZ2 (20:19:36), HOTZ4 (20:23:00) und HOTZ3B (20:25:52), dazu das Verzeichnis „Ishar 2 - Lösung“ (Kopier-mtime).
- sha256 von 311 Originalen und 435 Saves: vorher und nachher identisch. Nichts überschrieben.

## 7. Offen / Vorschläge
- Actor 69 sichtbar prüfen: Karte 3, Szene 12 (z. B. nahe S1, r7 c31) zwischen 2 und 4 Uhr.
- Byte 3220 (main:0x35ce + 179) 0→1 beim Lauf über 4–7 Uhr statisch klären.
- Den aktiven Wert von 0x4fcc ermitteln, etwa per feinerer Messung der Ticks pro Sekunde.

## 8. Belege
`private/tuer28/`: `session.log`, `snaps/`, Bilder `NN-*.png`, `save_*_dialog`/`_nach.png`, Kontaktbögen m1–m4, `zoom1.png`, `in/z1.json` und `in/z2.json`, `out/*.report.json`, Arbeitskopie, sha-Listen vorher und nachher.

## Nachtrag 18.10.2026 21:0x (suspected, Quelle: Quesh `zeit-ishar2.md`, von mir nicht nachgeprüft)
- Byte 3180 (ab 0) ist die **Blickrichtung von Actor 69**: Tabelle 0x35ce, Save 3041 + 2·id, Low-Byte.
- Byte 3220 ist entsprechend die Blickrichtung von **Actor 89**.
- Eine Stunde hat **1000 Durchläufe** (0x4fcc, DOS-Version). Das passt zu meinem Wert 2:957 in HOTB1 (< 1000).
- **Eine Zeitsperre beim Speichern gibt es nicht.** Das deckt sich mit meinem Befund: Die Fehlschläge kamen vom offen gebliebenen Diskmenü.
- Umgesetzt: `private/xpgold/savenew.sh` und `private/actor69/savenew2.sh` klicken nach jedem Speichern auf (266,12), um das Diskmenü zu schließen. Sicherung der alten Fassung: `savenew.sh.bak-20261018`.
