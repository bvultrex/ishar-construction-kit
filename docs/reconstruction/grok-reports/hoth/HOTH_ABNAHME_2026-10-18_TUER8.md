# HOTH Abnahme 18.10.2026: Tür 8 über das Schlüsselloch

Ersteller: Hoth (Grok Bot, Executor). Zeit: 18:16–18:36 MESZ. Grundlage ist der Quesh-Nachtrag „key door 8: keyhole found“, vorher suspected. Private Belege: `codex-support/hoth/private/tuer8/`.
Offset-Notation: **ab 0** wie save_layout und Quesh, **cmp** = `cmp -l` (ab 1).

## 1. Aufbau
- Klon `clones/hoth` detached auf 319819c. Positionsprüfung lief auf dem lokalen Zweig `grok/hoth-save-solid-pos-proposal` (cc53059), danach wieder 319819c. Nichts committet oder gepusht.
- Frische Arbeitskopie `private/tuer8/work-20261018-1817` per `cont-mod apply`. Mod-Bytes: CONT5 124 = 67 und 5525 = 33. Datei-mtimes auf 2026-01-01 gesetzt.
- DOSBox-X:
  - Eigene Conf `private/dosbox-x-auto2-tuer8.conf` mit **`cycles=fixed 25000`** auf Xvfb :97, eine Instanz pro Session, am Ende per kill -9 auf das eigene Muster beendet.
  - Am Schluss laufen weder Instanz noch Xvfb. Alderaans Instanzen habe ich nicht angefasst.
- Eingabe nach Alderaans Notiz mit nur einem Eingabeweg (xdotool): Tasten 350 ms gehalten (≥150 ms); Klick: Mausbewegung, 0,2 s, drücken, 0,2 s, loslassen.

## 2. Patch
- **HOTT8A** = Kopie von HOTKY1 (sha e6357e5f…556b, Schlüssel −17 in Hand c0/9) mit Patch `in/t8.json`: 0x2ab4 = 61, 0x2ab5 = 15, 0x2ab6 = 2, 0x2d18 = 5, 0x4ef2 = 36.
- `cmp -l HOTKY1 HOTT8A` (cmp-Offsets, Werte oktal): 4 65→75, 6 20→17, 8 2→3.
  - Ab 0: Byte 3 53→61 (Zeile), Byte 5 16→15 (Spalte), Byte 7 3→2 (Blick).
  - Karte (ab 0 Byte 9) = 5 und Zone (ab 0 Byte 19) = 36 waren schon gesetzt und blieben ungeändert.
- Positionsprüfung: walkable. CONT5 (61,15): A = 78, B = 0.
- Im Spiel mit Blick 2 (Kompass E) ist an der Stirnwand ein kleines Schlüsselloch bei etwa (128,72) zu sehen (`34-L_HOTT8A.png`).

## 3. Punkt 1: Schlüssel auf das Schlüsselloch
**Sauberer Lauf, Session 2:**
- Schritte:
  1. HOTT8A laden.
  2. Bogen öffnen mit (30,193).
  3. Schlüssel aus der linken Hand auf den Cursor nehmen (222,67).
  4. EXIT (244,109).
  5. **Klick (129,72)** mit dem Schlüssel.
  6. Schlüssel zurück in die Hand.
  7. Neuer Slot **HOTT8C** (18:26:46 MESZ).
- **Der erste Klickpunkt (129,72) hat getroffen.** (120,65), (140,80) und die ±30-Suche waren deshalb nicht nötig.
- `cmp -l HOTT8A HOTT8C`:

| ab 0 | cmp | alt → neu | Bedeutung |
|---|---|---|---|
| 45 | 46 | 6 → 7 | Spielzeit 0x4fc6 |
| 48, 49 | 49, 50 | 0 → 1, 160 → 154 | Spielzeit 0x4fca |
| **7389** | **7390** | **0 → 1** | **0x4aa4[8], Tür 8 offen** |

- Schaltertabelle (ab 0 7431+) unverändert.
- **Schlüssel:** ab 0 1054/1055 = FF EF, nicht verbraucht. Nach dem Öffnen lag er weiter am Cursor und ging zurück in die Hand.
- **Sichtbeleg:** Ab Zeile 61 mit Blick 4 liegt Tür 8 nicht im Sichtfeld. Die Tür-8-Zellen sind Seitenzellen bei c14/c16, das Bild bei offener und geschlossener Tür ist gleich (≤ 35 px, Uhr).
  - Deshalb habe ich beide Zustände an die bekannte Sichtstelle r53 c16 Blick 3 gepatcht: HOTV8A aus HOTT8A, HOTV8C aus HOTT8C. Der Patch-Diff besteht jeweils nur aus Zeile, Spalte und Blick (cmp 4, 6, 8).
  - HOTV8A ist byte-gleich mit HOTKY1 (gleiche sha), eine Gegenprobe.
  - Ergebnis `m6.png`: **HOTV8A zeigt die Gittertür geschlossen, HOTV8C zeigt den Durchgang offen** (mit der Frau dahinter). Bilddiff 3 399 px.
- **Neuladen in frischer Session:**
  - GRIMZEL→HOTT8C: 23 634 px, das Laden hat gegriffen.
  - HOTT8C gegen das Bild vor dem Speichern: 424 px.
  - HOTV8C wurde ebenfalls frisch geladen und zeigt den offenen Durchgang.

**Erster Lauf, Session 1, Nebenbefund:**
- Schritte:
  1. HOTT8A laden.
  2. TL TL (Kompass W).
  3. Schlüssel auf den Cursor nehmen.
  4. TR TR, die mit Schlüssel am Cursor **nicht wirkten** (Kompass blieb W).
  5. Klick (129,72) mit Blick in den Gang.
- Trotzdem ergibt Slot **HOTT8B** 7389 0→1 (cmp 7390). Weitere Änderungen: ab 0 Byte 7 Blick 2→4, ab 0 91/93 2→1 (Tagesphase, Rauschen laut Quesh) und Spielzeit.
- Vermutung: Das Schlüsselloch-Objekt bzw. seine Form, die beim Laden mit Blick 2 entstand, war nach dem Drehen noch aktiv. Stufe suspected. Den Lauf zähle ich nicht als sauberen Beleg.

**Urteil Punkt 1: known.**
- Mit dem Schlüssel −17 am Cursor öffnet ein Klick bei (129,72) auf das Schlüsselloch an r61 c15 (Blick 2, Zone 36) Tür 8: ab 0 7389, cmp 7390, 0→1.
- Der Schlüssel wird nicht verbraucht. Der Zustand übersteht Speichern und Laden, das Gitter ist sichtbar offen.
- Die Bedingung „nur bei Blick 2“ ist durch den Nebenbefund nicht sauber bestätigt (suspected).

## 4. CONT und Saves
- CONT1–4, 6 und 7 byte-gleich mit dem Original. CONT5 nur mit den 2 Mod-Bytes (sha 56e0771f…224b7b). Die mtimes aller CONT sind unverändert (1767222000).
- Abweichende mtimes nur bei den neuen Dateien HOTT8B (18:22:36) und HOTT8C (18:26:46), dazu das Verzeichnis „Ishar 2 - Lösung“ (Kopier-mtime).
- sha256 von 311 Originalen und 435 Saves unter `dosbox/ishar2*`: vorher und nachher identisch. Nichts überschrieben.

## 5. Hinweise
- Nach dem Speichern bleibt das Diskettenmenü offen. Der nächste Klick schließt nur das Menü (Alderaans Notiz bestätigt, Session 2).
- Mit einem Gegenstand am Cursor reagieren die Dreh-Pfeile nicht.

## 6. Belege
`private/tuer8/`: `session.log`, `snaps/`, Bilder `NN-*.png`, Kontaktbögen m1–m6, `in/t8.json`, `in/v.json`, `out/*.report.json`, Arbeitskopie mit HOTT8A/B/C und HOTV8A/C, sha-Listen vorher und nachher.
