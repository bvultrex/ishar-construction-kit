# HOTH Abnahme 18.10.2026: Zeitgesteuerte Tür 28 (Karte 7)

> Bereinigte Fassung (2026-11-03): Positionen, Pixelzahlen, Spielzeiten, sha-Werte und Rohwerte aus Saves stehen in `private/bereinigung/HOTH_ABNAHME_2026-10-18_TUER28_ZEIT.privat.md`.

Ersteller: Hoth (Grok Bot, Executor). Zeit: 20:08–20:33 MESZ. Grundlage: Quesh-Addendum 19:5x in `quesh/hebel-tuer-trigger-ishar2.md` (suspected). Private Belege: `codex-support/hoth/private/tuer28/`.
Offset-Notation: **ab 0** wie save_layout und Quesh, **cmp** = `cmp -l` (ab 1). Uhrzeiten des Spiels als Stunde:Ticks.

## 1. Aufbau
- Klon `clones/hoth` detached auf 319819c. Die Positionsprüfung lief auf dem lokalen Zweig cc53059, danach wieder 319819c. Nichts committet oder gepusht.
- Frische Arbeitskopie `private/tuer28/work-20261018-2010` per `cont-mod apply`. Mod-Bytes: CONT5-Offsets 124 und 5525 (Werte privat). mtimes auf 2026-01-01.
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
- Nebenwirkung: Die Tagesphase 0x519f/0x51a0 (ab 0 Byte 91/93) folgt der Stunde. Die beobachteten Phasen passen nicht durchgehend zu Queshs Regel (<6 → 3); Werte siehe private Fassung.
  - Vermutlich wird die Phase nur bei einem Stundenwechsel neu berechnet; HOTZ0 trug noch den gepatchten Tageswert. suspected.
- **Gemessene Dauer: ca. 43 s Realzeit pro Spielstunde** (DOSBox cycles 25000).
  - Stundenwechsel laut HUD bei 20:13:16, 20:13:59, 20:14:42 und 20:15:22 MESZ, abgetastet im 20-s-Raster, also grob.
- Rast oder Schlaf habe ich nicht verwendet. Die Debugtaste „a“ (+200 Ticks, MAIN 0x0412b) habe ich bewusst nicht benutzt.

## 3. Ort und Patches
- CONT7: Tür 28 (Türblatt) mit Nachbarzellen und Gang (Zellen und Werte siehe private Fassung).
- Standort eine Zelle vor Tür 28 (Position privat). Die Zone ergibt sich aus den Zonenmarken; nach Queshs Liste ist das DJ1. Positionsprüfung: walkable.
- **HOTZ0** = Kopie von HOTK753 (Karte 7, Tür 28 offen, Actor 69 gesetzt, Objekt 6 vorhanden; sha und Uhrzeit privat). Patch `in/z1.json`.
  - `cmp -l HOTK753 HOTZ0` (ab 0): Byte 3 (Zeile), 5 (Spalte), 7 (Blick), 19 (Zone), 45 (Stunde), 48/49 (Ticks).
- **HOTZ1N** = Kopie von HOTZ1 (Spielergebnis, Tür 28 zu). Patch `in/z2.json`: Stunde und Ticks geändert (Werte privat).
  - Damit ist der Ausgangszustand „Tür zu“ vom Spiel selbst erzeugt, nicht ins Blaue gepatcht.
- Bedingung für Actor 69 (GERDEP 0x00497): 0x2c4e[6] ≠ 0. Im Save liegt das ab 0 bei Byte 742 und ist in allen verwendeten Saves erfüllt.

## 4. Ablauf und Ergebnis
| Slot (neu) | Tür 28 (7409, cmp 7410) | Actor 69 (6850 = 0x449a[69], cmp 6851) | Bild |
|---|---|---|---|
| HOTZ0 (Patch) | offen | gesetzt | Bogen offen, Figur dahinter (`04`, `zoom1.png` links) |
| **HOTZ1** | **zu** | **gelöscht** | ab der HUD-Stunde 4 Tür zu, Holzgitter (`05`–`10`, `zoom1.png` rechts) |
| HOTZ1N (Patch) | zu | gelöscht | zu (`24`) |
| **HOTZ2** | **offen** | gelöscht | offen ab HUD 1 (`25`) |
| **HOTZ3B** | offen | **gesetzt** | offen (`46`, `47`) |
| **HOTZ4** | **zu** | **gelöscht** | Tür nicht im Blick (nach einem Fehlklick verschobene Zeile, Blick auf die Wand), nur Byte-Beleg |

Uhrzeiten (Stunde:Ticks) und Tagesphasen je Slot siehe private Fassung.

**cmp -l der Spiel-Saves (ab 0 / cmp):**
- **HOTZ0→HOTZ1:** Stunde (45), Ticks (48/49), Tagesphase (91, 93), **3220** (main:0x35ce + 179, Bedeutung unbekannt), **6850** (Actor 69), **7409** (Tür 28).
- **HOTZ1N→HOTZ2:** Stunde, Ticks, Tagesphase, **7409**. Sonst nichts.
- **HOTZ2→HOTZ3B:** Stunde, Ticks, **6850**. Sonst nichts.
- **HOTZ2→HOTZ4:** Zeile (3), Stunde, Ticks, **7409**. Der Actor blieb gelöscht, weil die Zwischenstufe nicht gespeichert wurde.
- (Offsets ab 0; cmp-Rohwerte siehe private Fassung.)
- Schaltertabelle (ab 0 7431+) in keinem Diff verändert.

**Neuladen in frischen Sessions (Bilddiff):**

| Save | gegen GRIMZEL (Laden gegriffen) | gegen das Bild vor dem Speichern | Inhalt |
|---|---|---|---|
| HOTZ2 | ja | entspricht | offen |
| HOTZ1 | ja | entspricht | zu |
| HOTZ3B | – | Rest-Diff nur Uhr- und Animationsstand (`m4.png`) | offen |
| HOTZ4 | ja | entspricht | Wandblick |

Pixelzahlen siehe private Fassung.

**Speicherproblem (Beobachtung):**
- Zwei Speicherversuche schlugen fehl: HOTZ3 entstand nicht, HOTZ3B erst verspätet. Das Diskmenü öffnete sich nicht sofort.
- Der nächste Klick traf im ersten Fall die Bewegungsleiste, daher die verschobene Zeile in HOTZ4.
- Ob das mit dem `cwakeup` bei Stunde 2 (GERDEP 0x004ba) zusammenhängt: unknown.

## 5. Urteile
- **Uhr-Offsets:** Stunde 44–45, Tag 46–47, Ticks 48–49 (ab 0): **known** (save_layout plus Laufzeit). Der Grenzwert 0x4fcc steht nicht im Save; ob 600 oder 1000 gilt, ist unknown.
- **Tür 28 = 0x4aa4[28] = ab 0 7409 (cmp 7410), Karte 7:** **known.** Öffnet sich beim Wechsel auf Stunde 1 (zu→offen, sichtbar) und schließt sich beim Wechsel auf Stunde 4 (offen→zu, sichtbar). Beides übersteht Speichern und Laden.
- **Actor 69 (0x449a[69] = ab 0 6850, cmp 6851):**
  - Byte-Verhalten **known:** wird beim Wechsel auf 1 Uhr gesetzt und beim Wechsel auf 4 Uhr gelöscht. Der exakte Zeitpunkt ist nicht eigens gespeichert, passt aber zum Bytecode.
  - **Sichtbarkeit: nicht belegt.** Der gesetzte Wert ist nach Queshs Lesart die Szene 12 (Karte 3), nicht das Gefängnis.
  - Die Figur hinter dem Bogen ist bei gelöschtem und gesetztem Actor-Byte gleich, gehört also **nicht** zu Actor 69.
- **CONT:** unverändert (siehe 6).

## 6. CONT und Saves
- CONT1–4, 6 und 7 sind byte-gleich mit dem Original. CONT5 hat nur die 2 Mod-Bytes (sha siehe private Fassung). Alle CONT-mtimes stehen weiter auf 1767222000.
- Abweichende mtimes haben nur die neuen HOTZ1 (20:16:30), HOTZ2 (20:19:36), HOTZ4 (20:23:00) und HOTZ3B (20:25:52), dazu das Verzeichnis „Ishar 2 - Lösung“ (Kopier-mtime).
- sha256 von 311 Originalen und 435 Saves: vorher und nachher identisch. Nichts überschrieben.

## 7. Offen / Vorschläge
- Actor 69 sichtbar prüfen: Karte 3, Szene 12 (Position privat) zwischen 2 und 4 Uhr.
- Byte 3220 (main:0x35ce + 179), das sich beim Lauf über 4–7 Uhr änderte, statisch klären.
- Den aktiven Wert von 0x4fcc ermitteln, etwa per feinerer Messung der Ticks pro Sekunde.

## 8. Belege
`private/tuer28/`: `session.log`, `snaps/`, Bilder `NN-*.png`, `save_*_dialog`/`_nach.png`, Kontaktbögen m1–m4, `zoom1.png`, `in/z1.json` und `in/z2.json`, `out/*.report.json`, Arbeitskopie, sha-Listen vorher und nachher.

## Nachtrag 18.10.2026 21:0x (suspected, Quelle: Quesh `zeit-ishar2.md`, von mir nicht nachgeprüft)
- Byte 3180 (ab 0) ist die **Blickrichtung von Actor 69**: Tabelle 0x35ce, Save 3041 + 2·id, Low-Byte.
- Byte 3220 ist entsprechend die Blickrichtung von **Actor 89**.
- Eine Stunde hat **1000 Durchläufe** (0x4fcc, DOS-Version). Das passt zu meinem in HOTB1 beobachteten Tickwert (< 1000, Wert privat).
- **Eine Zeitsperre beim Speichern gibt es nicht.** Das deckt sich mit meinem Befund: Die Fehlschläge kamen vom offen gebliebenen Diskmenü.
- Umgesetzt: `private/xpgold/savenew.sh` und `private/actor69/savenew2.sh` klicken nach jedem Speichern auf (266,12), um das Diskmenü zu schließen. Sicherung der alten Fassung: `savenew.sh.bak-20261018`.
