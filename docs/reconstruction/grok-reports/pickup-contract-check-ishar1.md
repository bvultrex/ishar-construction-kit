# Vertrag und Prüfung: Itemablauf Ishar 1 (Boden → Cursor → Inventar → Save), Schwerpunkt Codes 9/10

Stand: 2026-11-14, Quesh (statische Analyse; read-only, keine Commits).
Evidenzstufen: **known** = direkt im Skript-Listing bzw. EXE gelesen; **suspected** = abgeleitet oder nicht bis zum Ende verfolgt; **unknown**.
Dieser Bericht enthält keine Save-Werte, keine Originalbytes und keine Hexdumps. Konkrete Save-Inhalte, Skriptkonstanten zu Positionen und Formdaten liegen nur in `codex-support/quesh/private/pickup-ishar1/`.

## 0. Profil und Hashes (SHA-256-Präfix, gepackte Originale)
| Datei | Präfix | Rolle |
|---|---|---|
| `start.exe` | `3ea63234c97b` | Interpreter (Ishar 1 DOS) |
| SOURIS.IO | `2bbc1362e2f8` | Maus, Aufnahme, Ablegen auf Boden, Schlüssel auf Tür |
| OBJET.IO | `03bd357d89c0` | Boden-/Cursor-/Inventar-Sprite, Trefferform |
| AFFOBJ.IO | `abe105fad328` | Projektion der Weltobjekte |
| FRISE.IO | `3bd158963fda` | Party-Leiste, Rucksack, Hände, Rüstung/Helm |
| PARAM.IO | `f42ea12ceffa` | Neues-Spiel-Initialisierung der Weltobjekte |
| MAIN.IO | `27c5834de005` | Variablen (cdim), Save-Writer `cfwritev/cfwriteb` 0x4816 ff., Nachrichten |
| MESSAGEE.IO | `1b6a76f2c931` | Gegenstandsbezeichnung (Klassenzuordnung) |
| OBJINT.IO | `7a4f2275bb38` | Cursor-Variante für Codes 51..93 (nicht 9/10) |

Grundlage: lokale ALIS-Listings `decompile/alis/listings/ishar1/`. Eine Decodierlücke in FRISE (0x03fec–0x040eb, „eval runaway“) habe ich mit erhöhtem Ausdruckslimit lokal nachdecodiert (privat). Formen sind mit dem Kit-Leser `readDosAlisForms` decodiert (read-only, privat).

## 1. Kernaussagen
1. **MAIN 0x2D8E ist nicht die Inventarbasis von Ishar 1.** Es ist die Basis von Ishar 2 (15 Slots je Figur, Save 1036 + 30c + 2s). In Ishar 1 greift kein Skript auf 0x2D8E zu, und die Adresse liegt in keinem der 107 Save-Bereiche. (known)
   - Inventarbasis Ishar 1: **MAIN 0x1568**, `cdim` 2-Byte-Elemente, 13 Wörter je Figur (MAIN 0x0008f). (known)
2. **Ishar 1 hat kein START.SAV**, nur START.STP (14 Byte). Codex' Checkpoint 1faef2b (START.SAV, CONT1, Bodenobjekt 9, Empfänger 1, MAIN2D8E) entspricht damit dem Ishar-2-Ablauf aus `pickup-contract-ishar2`, nicht Ishar 1. Den Checkpoint selbst konnte ich nicht einsehen: Der Commit ist in keinem lokalen Repo vorhanden. Er wird daher nicht als Ishar-1-Beleg geführt. (known: Dateien/Adressen; suspected: Zuordnung des Checkpoints)
3. **Codes 9 und 10 sind Weltobjekt-Nummern** (positive Codes) der Klasse „Schlüssel“ (Codes 1..16). Sie öffnen Türen über SOURIS Nachricht 19. (known, Einzelheiten §3)
4. Eine Aufnahme mit Ablage im Rucksack schreibt im Save genau **drei Weltbytes → 0** und **ein Inventarwort 0 → i**. Der Zwischenzustand „am Cursor“ ist nicht speicherbar. (known, §5/§7)

## 2. Umrechnung RAM ↔ Save (Ishar 1, Save 5216 Byte)
| RAM (MAIN) | Save-Offset | Breite | Endianness | Inhalt | Stufe |
|---|---|---|---|---|---|
| 0x1568 + 2·(13c + k) | **498 + 26c + 2k** | 2 | BE16 | Inventar Figur c (0..4), Slot k (0..12) | known |
| 0x1382 + i | 34 + i | 1 | – | Weltobjekt i: X | known (Writer), Bedeutung known (AFFOBJ/SOURIS) |
| 0x1404 + i | 162 + i | 1 | – | Weltobjekt i: Y | known |
| 0x1486 + i | 290 + i | 1 | – | Weltobjekt i: Zone (0 = nicht in der Welt) | known |
| 0x3e22 + 10c + j | 4971 + 10c + j | 1 | – | Stapelzähler Figur c, j = Code + 66 (Codes −66..−57) | known |
| 0x16d4 + c | 783 + c | 1 | – | Rüstungswert | known |
| 0x20b8 + 3a + n | 3128 + 3a + n | 1 | – | Beute von Akteur a (3 Weltobjekt-Nummern) | known (Code), siehe §4 |
| 0x137c / 0x137d / 0x137e / 0x1508 | 2 / 4 / 6 / 8 | je 2 | BE16 (Bytewert) | Party X / Y / Blickrichtung / Zone | known |
| 0x1506 (Wort) | – | – | – | Code am Cursor (0 = nichts) | **transient**, known |
| 0x1742 (Wort) | – | – | – | Handle der Cursor-Entität | transient, known |
| 0x403a + j (10 Byte) | – | – | – | Stapelmenge am Cursor, j = Code + 66 | transient, known |

- Der Inventarblock wird als **Rohblock** geschrieben und gelesen: `cfwriteb loc:0x1568, 130` (MAIN 0x04882) bzw. `cfreadb` (MAIN 0x04aaf). Die Bytefolge im Save ist also die Bytefolge im Skript-RAM, und die Wörter sind dort ebenso BE. (known für die Rohkopie; BE im RAM folgt daraus)
- **Umrechnung:** Save = 498 + (RAM − 0x1568) für RAM in [0x1568, 0x15EA). Weltblöcke: Save = 34 + (RAM − 0x1382), 162 + (RAM − 0x1404), 290 + (RAM − 0x1486). (known)
- Zum Vergleich Ishar 2: Save = 1036 + (RAM − 0x2D8E), 15 Slots. Diese Formel darf nicht auf Ishar 1 angewendet werden.

## 3. Punkt 1: Positive Codes 9 und 10
**Bedeutung (known):**
- Ein positiver Code i ist zugleich Weltobjekt-Index i (Tabellen 0x1382/0x1404/0x1486, i = 0..110 in AFFOBJ).
- Negative Codes sind Inventar-Gegenstände ohne Weltposition.
- OBJET (Schalter auf +0x0c, 0x0009b): Codes 7..16 → Bodensprite 131 + Tiefenindex, Trefferform 6 nur bei Tiefenindex 0. Im Cursor- und Inventarmodus Sprite 135 (0x00342–0x0036e). Codes 1..6 analog mit 128/134 und Form 0.
- MESSAGEE L_01b26: Alle Codes 1..16 ohne eigenen Namenseintrag erhalten die Standardbezeichnung der Schlüsselklasse. (known; Text nicht zitiert)
- Verwendung: SOURIS 0x007ff–0x0083c. Gegenstand am Cursor auf eine Form mit Maske 32 und (Material & 31) == Code → `csend 19` an die Tür, Cursor gelöscht, `0x1506 = 0`. Der Schlüssel ist verbraucht, die Weltbytes bleiben 0.
  - Laut `tuer-hebel-trigger-ishar1` braucht Tür d den Gegenstand d+1. **Code 9 → Tür 8, Code 10 → Tür 9.** Tür 9 (Material 10) hat laut jenem Vertrag keine Kraft-Schwelle, ist also nur per Schlüssel zu öffnen. (Code known; Deutung als Schlüssel jetzt durch die Bezeichnungsklasse gestützt, Stufe known)
- Keine Rüstungswirkung: Die Rüstungstabelle L_05268 kennt nur negative Codes. In den Händen wird sie nur für −55/−56 angewandt. (known)

**Herkunft (known):**
- PARAM 0x011cb–0x011fd (neues Spiel) setzt X/Y/Zone von Objekt 9 und 10, beide in **Zone 15** (Höhle, CONT5). Die Koordinaten stehen nur privat.
- FRISE 0x06955–0x0698d (Tod eines Akteurs): legt dessen Beute `T20b8[a][0..2]` (> 0) an seiner Position in die Welt. Sonderfall Akteur 40: Objekte 35..39 (0x0691e).
- SOURIS-Ablage auf den Boden (§6.3).

**Schreiber/Leser des Codes:**

| Ort | Adresse | Zugriff |
|---|---|---|
| SOURIS | 0x00649 | `0x1506 = id` (Aufnahme) |
| FRISE | 0x05030 | Rucksack-Slot = `0x1506` |
| FRISE | 0x043b0 / 0x046c5 | Hand- bzw. Slot-Ablage / Tausch |
| FRISE | 0x03f8b | `0x1506 = Slot` (aus Slot heben) |
| FRISE | 0x04736 | `0x1506 = alter Slotinhalt` (Tausch) |
| SOURIS | 0x008a4–0x008bb | Weltbytes = Position (Ablage) |
| AFFOBJ | 0x000a5 ff. | liest Weltbytes |
| OBJET | 0x0009b | liest +0x0c |
| SOURIS | 0x0081f | Vergleich mit Türmaterial |

Alles known.

**Abgrenzung:** Die Indizes **9 und 10 als Slotnummern** (Hände) sind etwas anderes. FRISE prüft `dirb10 == 9/10` = Handslot (z. B. 0x03fa2), nicht den Code. Nach dem Code 9/10 im Inventar fragt kein Skript gesondert. (known)

## 4. Weitere Codebereiche bei der Aufnahme (nur zur Abgrenzung, known)
- SOURIS 0x00492: Ist Material & 127 = 33 oder > 109, gilt ein Sonderpfad. Bei 33 muss die Stärkesumme der lebenden Figuren (0x1684) ≥ 62 sein, sonst Meldung −5 und keine Aufnahme. Bei 110..118 wird der Code umgesetzt (110 → 20, 111 → −70, 112 → 12, 113..117 → −29, 118 → 29).
- OBJET 0x0050e ff.: Bodenobjekte 94..109 werden im Cursormodus zu Stapelcodes −60/−62/−63/−64 mit `0x403a[j] = 3`.
- 50 < Code < 94: Cursor-Entität OBJINT (Typ 0x5a) statt OBJET.
- Für 9/10 gilt keiner dieser Pfade. Die Trefferform 6 hat Material 128 + 7 (Maske 128, & 127 = 7), also Normalpfad L_005a4. (known)

## 5. Punkt 2: Zustandswrites einer Aufnahme (Code i = 9 oder 10)
### 5.1 SOURIS-Aufnahme (Boden → Cursor), 0x00405–0x0064f – known
**Bedingungen:**
- Linksklick `0x7a == 1`.
- Viewport: `0x76 < 256`, `0x78 > 72` (Bildschirm-y < 127), `0x137f == 0` (kein Vollbild-Panel).
- `0x1506 == 0`, `0x2339 == 0`, `0x3d08 == 0`.

**Treffer:**
- Bei `0x399e == 0`: `ctstform 128,0`, sonst `cftstmov` (Versatzvariante).
- Die SOURIS-Form 0 ist ein Strahl ab Cursor (Tiefe 0..499).
- Das Objekt ist nur bei Tiefenindex 0 treffbar, also Entfernung 1 geradeaus (OBJET setzt `cforme` nur dann).
- Abgeleitetes Klickfenster für ein Objekt direkt voraus: **x 121..136, y 119..123** (Bildschirm, y nach unten). Mitte ≈ (128,121). Kanten (inklusiv/exklusiv) und gemeinsamer Koordinatenrahmen sind suspected, wie in Ishar 2.

**Writes in Reihenfolge (alle vor dem nächsten `cstop` 0x0064f):**

| # | Adresse | Write | Save |
|---|---|---|---|
| 1 | 0x005a4 | `dirw20 = Treffer-Entität +0x0c` (= i) | – |
| 2 | 0x005ac | `ckill` Boden-Entität | – |
| 3 | 0x005af | `0x1486[i] = 0` | 290+i: Zone → 0 |
| 4 | 0x005b9 | `0x1382[i] = 0` | 34+i: X → 0 |
| 5 | 0x005c3 | `0x1404[i] = 0` | 162+i: Y → 0 |
| 6 | 0x00614–0x0063b | `clive 6` Cursor-OBJET: +0x0c = i, +2 = 0, +0 = `0x76`, +4 = `0x78`, +0x0d = 1 | – |
| 7 | 0x00643 | `0x1742 = Handle` | transient |
| 8 | 0x00649 | `0x1506 = i` | transient |
| 9 | 0x0064f/0x00650 | `cstop`, `cmousoff` | – |

Es gibt keine Zähler und Flags, und AFFOBJ wird nicht geweckt, weil die Boden-Entität direkt gelöscht wird. Anders als in Ishar 2 gibt es keine Blickrichtungstabelle. (known)

### 5.2 Ablage im Rucksack (Klick auf Porträt), FRISE 0x004a7 → L_04fc7 – known
**Bedingungen:**
- `0x78 < 62` (Bildschirm-y > 137), c = `0x76 / 64`.
- HP `0x1542[c] > 0` und Klasse `0x1664[c] ≠ −1`.
- (Code < −19 oder Code > 0) und Handpanel von c nicht offen (`dirtc 0x1a[c] ≠ 1`).

**Ablauf:**
1. Stapelcodes −66..−57: zusammenführen (für 9/10 entfällt das).
2. Erster Slot s in 0..8 mit Wort = 0: **0x05030 `0x1568[c][s] = 0x1506`** → Save 498 + 26c + 2s: 0 → i (BE16).
3. Neuzeichnen nur bei offenem Vollbild-Panel dieser Figur.
4. Freigabe (0x05073–0x050a5): Nur wenn alle `0x403a[0..9] == 0`, folgt `0x1506 = 0`, `ckill 0x1742`, `cmouson`.

Rüstung, Zähler und Flags bleiben unverändert.

### 5.3 Ablage in eine Hand (Handpanel offen), FRISE 0x0057c → L_039f9 → L_03f34/L_04220 – known
**Bedingungen:**
- `dirtc 0x1a[c] == 1`.
- `17 < 0x78 < 45` (Bildschirm-y 155..181).
- Slot 9: x in (14+64c, 39+64c); Slot 10: x in (38+64c, 63+64c) (exklusiv).

**Ablauf bei Code 9/10 (kein Zweihänder, kein Stapel):**
1. Prüfung `0x403a` = 0 → L_04f70: Steht in der **anderen** Hand der Sperrwert −125, wird er auf 0 gesetzt.
2. Ist der Slot leer: **0x043b0 `0x1568[c][s] = i`** → Save 498 + 26c + 18 (s = 9) bzw. + 20 (s = 10).
3. Rüstung nur bei −55/−56, also hier unverändert.
4. Icon-Entität (Modus 2) wird angelegt.
5. Freigabe 0x04449: `0x1506 = 0`, `ckill`, `cmouson`.

### 5.4 Slots 11/12 (Figurenpanel, L_03a64) – known, Nebenbefund
- Slot 11 nimmt nur Codes −29..−25 an, Slot 12 nur −39..−35. Gespeichert wird **Code + 5** (0x03d13/0x03d7e); beim Herausnehmen gilt Code = Inhalt − 5 (0x03b7f/0x03db2).
- Zusätzlich gibt es Konstitutionsgrenzen (0x168c) und eine Rüstungsänderung `0x16d4[c] ±=` Tabellenwert.
- Positive Codes wie 9/10 werden dort abgewiesen (0x03c46 → `cret`, nichts geschrieben).

## 6. Punkt 3: Abbruch und Rückgabe
| Fall | Verhalten | Adresse | Stufe |
|---|---|---|---|
| Rucksack voll (Slots 0..8 ≠ 0) | nichts geschrieben, Gegenstand bleibt am Cursor | FRISE 0x05061–0x05072 | known |
| Empfänger tot (HP ≤ 0) oder leerer Slot (Klasse −1) | Klick ignoriert | FRISE 0x004bf | known |
| Handpanel von c offen | Porträtklick geht nicht in den Rucksack, sondern in die Handlogik bzw. öffnet das Statuspanel (0x0065f) | FRISE 0x0057c ff. | known |
| Hand belegt | Tausch: Slot = gehaltener Code, Cursor = alter Inhalt; nur wenn alle `0x403a == 0`, sonst nichts | FRISE L_04595, 0x046c5/0x04736 | known |
| Hand mit Sperrwert −125 | nichts | FRISE 0x04458 | known |
| Slot 11/12 mit positivem Code | abgewiesen | FRISE 0x03c46 | known |
| Klick auf ein anderes Bodenobjekt mit vollem Cursor | nichts (Ablage nur, wenn kein Objekt unter dem Cursor) | SOURIS 0x007eb–0x007fb | known |
| Tür mit falschem Schlüssel (Material & 31 ≠ Code) | nichts | SOURIS 0x0081f → 0x0083d | known |
| Rechtsklick | **kein Abbruch**: SOURIS prüft `0x7a == 2` nicht; FRISE 0x0093f schließt bei Rechtsklick nur das Vollbild-Panel. Kein Schreiber von 0x1506 in den Rechtsklickpfaden. | – | known (alle 0x1506-Schreiber geprüft) |
| Speichern mit Gegenstand am Cursor | Diskmenü nur bei `0x1506 == 0` (FRISE 0x0022a Tastatur, 0x00913 Maus → MAIN Nachricht 32 → MESSAGE Modus 16) | FRISE | known (Sperre); suspected (dass das der einzige Speicherweg ist) |
| Negative Codes auf den Boden | unmöglich: Ablage auf den Boden nur bei `0x1506 > 0` | SOURIS 0x0076a | known |

### 6.3 Ablage zurück auf den Boden, SOURIS 0x0076a–0x008e4 – known
**Bedingungen:**
- Viewport wie §5.1.
- `0x1506 > 0`, `0x399e == 0`.
- Kein Objekt (Maske 128) unter dem Cursor.
- Keine Form mit Maske 32 getroffen (sonst Türpfad).

**Zielzelle nach Blickrichtung `0x137e`:**

| Blickrichtung | Zielzelle |
|---|---|
| 1 | (X, Y−1) |
| 2 | (X+1, Y) |
| 3 | (X, Y+1) |
| 4 | (X−1, Y) |

Andere Werte nutzen alte dirb-Werte (Grenzfall, suspected irrelevant).

**Writes in Reihenfolge:**

| Adresse | Write | Save |
|---|---|---|
| 0x008a4 | `0x1486[i] = 0x1508` | 290+i: 0 → Zone |
| 0x008b0 | `0x1382[i] = X'` | 34+i: 0 → X' |
| 0x008bb | `0x1404[i] = Y'` | 162+i: 0 → Y' |
| 0x008c6 | `ckill 0x1742` | – |
| 0x008ca–0x008db | `cwakeup` AFFOBJ (Typ 7) | – |
| 0x008de/0x008e4 | `0x1506 = 0`, `cmouson` | – |

Es gibt keine Prüfung auf Wand oder Begehbarkeit der Zielzelle. (known: fehlende Prüfung; Folge im Spiel suspected)

## 7. Punkt 4: Keine Duplikation – Invariante und Reihenfolge
**Invariante:** Jede positive Nummer i befindet sich genau an einem dieser Orte (known für alle gefundenen Schreiber; Vollständigkeit für alle 98 Skripte per rg geprüft, Stufe known für die Schreiber von 0x1506 / 0x1568 / Weltblöcken):
- (A) Welt: Zone ≠ 0
- (B) ein Inventarslot
- (C) Cursor (`0x1506 = i`)
- (D) Akteur-Beute `0x20b8`
- (E) verbraucht (nirgends)

| Übergang | Writes, die gemeinsam passieren müssen (Reihenfolge) | Adressen |
|---|---|---|
| A → C (Aufnahme) | Weltbytes Zone, X, Y = 0 → Cursor-Entität → `0x1506 = i` | SOURIS 0x005af, 0x005b9, 0x005c3, 0x00643, 0x00649 |
| C → B (Rucksack) | Slot = i → `0x1506 = 0` + `ckill` | FRISE 0x05030 → 0x0509b |
| C → B (Hand) | Slot = i → `0x1506 = 0` | FRISE 0x043b0 → 0x04449 |
| B ↔ C (Tausch) | Slot = gehalten → `0x1506 = alt` | FRISE 0x046c5 → 0x04736 |
| B → C (heben) | `0x1506 = Slot` → Slot = 0 | FRISE 0x03f8b → 0x040ec |
| C → A (Boden) | Weltbytes = Position → `0x1506 = 0` | SOURIS 0x008a4..0x008bb → 0x008de |
| C → E (Tür) | `csend 19` → `0x1506 = 0` | SOURIS 0x0082c → 0x00836 |
| D → A (Tod) | Weltbytes = Akteurposition | FRISE 0x06976..0x0698d |

**Begründung, warum nichts doppelt entsteht:**
- Jeder Übergang liegt innerhalb **einer** Skriptscheibe ohne `cstop`/`csleep` dazwischen. Der ALIS-Scheduler ist kooperativ: Ein Skript läuft bis `cstop` (Dispatcher 1000:26EB, Schleife bis Handlerabbruch).
  - Für die direkten Rümpfe ist das known.
  - Für tiefer verschachtelte Unterroutinen der Redraw-Helfer ist es suspected; die direkt gerufenen L_04abf, L_04e59, L_04ea9, L_04c4e, L_04773, L_047e0 und L_04f70 haben kein `cstop`.
- Der Save sieht Zustand C nie, weil die Sperre in §6 gilt. Ein Save enthält eine Nummer also entweder in der Welt **oder** im Inventar. Die Felder 0x1506 / 0x1742 / 0x403a werden nicht gespeichert. (known)
- **Pflichtkopplung für Codex:** Eine Aufnahme gilt erst als Inventareintrag, wenn (1) die drei Weltbytes auf 0 stehen **und** (2) das Inventarwort i enthält **und** (3) `0x1506 == 0` ist. Ein Export mit (2), aber ohne (1) dupliziert. Ein Export mit (1) und `0x1506 ≠ 0` verliert den Gegenstand.
- **Restrisiko (suspected):** Die Freigabe nach dem Rucksack prüft `0x403a[0..9] == 0`. Wäre ein Eintrag ≠ 0, während ein positiver Code gehalten wird, bliebe `0x1506 = i` trotz Slot-Write gesetzt, und eine Doppelablage wäre möglich.
  - Gesetzt wird `0x403a` nur bei Stapelcodes (Heben, OBJET 94..109, MESSAGE/OBJINT); geleert wird es beim Zusammenführen.
  - Solange ein Stapelcode gehalten wird, kann kein positiver Code auf den Cursor kommen.
  - Die Invariante „0x403a ≠ 0 ⇒ Stapelcode gehalten“ ist suspected.

## 8. Abweichungen
### 8.1 Gegenüber dem bisherigen Vertragsbestand
- Einen Ishar-1-Pickup-Vertrag gab es bisher nicht. Der vorhandene `pickup-contract-ishar2` (Karte 1, Objekte 9/10, 0x2d8e) ist korrekt als Ishar 2 gekennzeichnet. Die Ishar-1-Anteile in `dataflow-ishar1.md` („None can be built yet …“) sind überholt, aber nicht falsch.
- `save-map-ishar1`: Präzisierungen und eine Korrektur, eingetragen per Nachtrag 2026-11-14:
  - **0x3e22** ist nicht „Händler-Tabelle“, sondern die Stapelzähler [c][Code+66].
  - Slot 11/12 jetzt known (Code + 5).
  - 0x1382/0x1404/0x1486 = X/Y/Zone der Weltobjekte known.
  - 0x20b8 = Akteur-Beute (Code known).
  - 0x3e54/0x3e56 werden aus Stapelmengen ×1000/×100/×10/×1 befüllt, wenn Stapelcodes −66..−59 auf Code 31 gelegt werden (Code known; Deutung als Mischbehälter suspected).

### 8.2 Gegenüber Codex-Checkpoint 1faef2b
- Die Inventarbasis MAIN 0x2D8E passt **nicht** zu 498 + 26c + 2k. Für Ishar 1 gilt RAM 0x1568 ↔ Save 498 (§2).
- „START.SAV + CONT1 + Bodenobjekt 9“ existiert so in Ishar 1 nicht.
  - Es gibt kein START.SAV.
  - Objekt 9 liegt nach PARAM in Zone 15 (CONT5), nicht in Zone 1.
  - Ein Ishar-1-Test braucht eine gepatchte Arbeitskopie eines 5216-Byte-Saves (§9).
- Ein Ishar-1-Export muss drei Weltbytes (34/162/290 + i) **und** das BE16-Inventarwort schreiben und `0x1506` muss 0 sein. Die Ishar-2-Felder (Weltblock 336 ff., Blickrichtungstabelle 8039 ff.) gibt es in Ishar 1 nicht.

## 9. Abnahme für Hoth (Original-EXE, ohne Rückfragen abarbeitbar)
**Vorbereitung**
1. Eigene Kopie des Spielverzeichnisses. Einen beliebigen 5216-Byte-Save als Basis kopieren, z. B. als `PK0.SAV`.
2. Aus der Basis lesen: X = Wort an 2, Y = Wort an 4, Blickrichtung r = Wort an 6, Zone z = Wort an 8.
3. Zielzelle (X', Y') = Zelle vor der Party (r = 1: Y−1; 2: X+1; 3: Y+1; 4: X−1). Sie muss eine freie Gangzelle sein.
4. Patch: Byte 290+9 = z, Byte 34+9 = X', Byte 162+9 = Y'.
5. Prüfen, dass Figur c = 0 einen freien Rucksackslot hat (ein Wort 498 + 2k mit k ∈ 0..8 = 0) und lebt.
6. Ergebnis als `PK9.SAV` speichern; das ist eine Werkzeug-Eingabe, als „mit Patch“ kennzeichnen.

**Ablauf A (Rucksack)**
1. `PK9` laden.
   - Erwartung: Schlüsselsprite (OBJET-Ressource 131) unten Mitte im Viewport.
   - Screenshot.
2. Sofort über das Diskmenü als `PK9R` speichern. Das ist die Referenz; sie kostet 1000 Gold.
3. Linksklick **(128, 121)**.
   - Erwartung: Bodensprite weg, Cursor zeigt das Icon (Ressource 135).
   - Randtest in getrennten Läufen: (119, 121) und (138, 121) sollen verfehlen; ebenso (128, 116) und (128, 126).
4. Prüfen, dass Speichern mit Gegenstand am Cursor nicht geht: Diskmenü-Klick bzw. Taste ohne Wirkung.
5. Linksklick auf Porträt c0 **(32, 160)**.
   - Erwartung: Icon weg, normaler Mauszeiger.
6. Speichern als `PK9A`.
   - Erwartete Differenz `PK9R → PK9A`:
     - Byte 43: X' → 0
     - Byte 171: Y' → 0
     - Byte 299: z → 0
     - Wort 498 + 2s (s = erster freier Slot 0..8 von c0, BE16): 0 → 9
     - Gold: Gruppensumme −1000 nach Gebührenregel (`shop-tavern-contract-ishar1`, Nachtrag 15:45/16:08)
   - Sonst toleriert: laufende Countdowns 2008..2147 und Akteurfelder, falls Zeit vergeht.
   - Alles andere wäre eine Abweichung.

**Ablauf B (Hand)**
1. `PK9` laden.
2. **Mit leerem Cursor** Porträt c0 (32, 160) klicken. Erwartung: Handpanel von c0 öffnet sich.
3. Linksklick (128, 121): Der Schlüssel kommt an den Cursor.
4. Klick auf den Handslot.
   - Slot 9: (26, 168), nur wenn der Slot leer ist. Sonst Slot 10: (50, 168).
   - Bei belegter Hand ist ein Tausch zu erwarten (dann den alten Inhalt am Cursor notieren).
5. Speichern als `PK9B`.
   - Erwartung gegenüber einer Referenz direkt nach dem Laden: dieselben drei Weltbytes → 0, Wort 498 + 18 (Slot 9) bzw. 498 + 20 (Slot 10): 0 → 9.
   - Rüstung (Byte 783) unverändert. Gold −1000.

**Ablauf C (zurück auf den Boden, optional)**
1. Nach Schritt A3 ohne Porträtklick erneut ins Viewport auf eine Stelle **ohne** Objekt klicken, z. B. (60, 100). Erwartung: Sprite liegt wieder vor der Party.
2. Speichern.
   - Erwartung gegenüber `PK9R`: Weltbytes 43/171/299 gleich wie vorher, da die Zielzelle wieder die Zelle davor ist, und Inventar unverändert.
   - Gold −1000.

**Abbruchkriterien:** Erscheint in Schritt A1 kein Sprite, ist die Zielzelle oder Zone falsch gepatcht (Patch prüfen, nicht weiter klicken). Trifft (128, 121) nicht, mit y-Schritten von 2 px zwischen 115 und 127 abtasten und das Ergebnis notieren.

## 10. Offene Grenzen
- Klickfenster: genaue Kanten und gemeinsamer Koordinatenrahmen von SOURIS-Strahl und OBJET-Box sind suspected (Abnahme A3 klärt das).
- Rolle von `0x399e` (Umschaltung auf `cftstmov`), `0x2339`, `0x3d08`, `0x137f` als Sperren known; ihre Spielbedeutung ist nur teilweise geklärt.
- FRISE-Pfad `dirb20 == 1` (Vollbild-Panel aus 0x00dc8: Heben übergibt den Gegenstand per Zielklick an einen Akteur, `0x20b8[a][0] = Code`): Code gelesen, Bedeutung „Übergabe“ suspected.
- Dass das Diskmenü (Nachricht 32) der einzige Speicherweg ist: suspected.
- Invariante zu `0x403a` (§7): suspected.
- Freigabe ohne Wand-/Begehbarkeitsprüfung bei der Bodenablage: Folge im Spiel unbelegt.
- Codex-Checkpoint 1faef2b lokal nicht verfügbar; Aussagen dazu beruhen auf der Auftragsbeschreibung.

## Shop-Korrekturen (Alderaan STK), 2026-11-14
Quelle: MARCHAND.IO `77db63b52c23`, MAIN.IO `27c5834de005`. Den ausführlichen Nachtrag enthält `quesh/shop-tavern-contract-ishar1.md/.json` (Nachtrag 2026-11-14 „Stapelkauf“).

1. **Zuwachs = Sortimentsmenge qty, nicht +1 (known).**
   - In L_007a1 (Deckel D: 0x007c4 → 5 für −57, 0x007da → 20 für −58, 0x007e3 → 10 sonst) gilt:
     - Zähler + qty ≤ D → 0x0080a Zähler += qty.
     - Sonst → 0x0085a Zähler = D, und der Rest am Cursor wird verworfen.
   - Woher qty kommt:
     - qty steht in `dirti 0x28[i][3]` und wird über 0x0056c nach 0x403a[j] übertragen.
     - Die Vorbelegung ist 1 (0x00895).
     - Auf 5 gesetzt wird qty für −57 (0x008e5/0x009a3/0x00b1b/0x00ec5), auf 20 für −58 (0x00a04/0x00a6a/0x00c79/0x00e2e/0x00fc1).
   - +1 gilt also nur für Stapelcodes mit qty = 1 (−60, −62, −63, −64, −66).
   - STK (−58 in einen leeren Stapel, 0 → 20) ist damit erklärt.
   - Teilauffüllung kostet den vollen Preis (known, Code).
2. **Umrechnung (known):**
   - RAM 0x3e22 + 10c + j ↔ Save 4971 + 10c + j, mit j = Code + 66 (−58 → 8, −57 → 9), u8.
   - Belege: MAIN `cdim 0x3e22` mit Innenschritt 10 (0x00267) und Rohblock `cfwriteb 0x3e22, 50` (0x049f4).
   - Das stimmt mit der Korrektur „0x3e22 = Stapelzähler je Figur“ überein (save-map Nachtrag 2026-11-14).
   - 0x403a (Menge am Cursor) ist transient.
3. **Ablehnung bei vollem Stapel, T2r (known, Code; nicht gespielt):**
   - Bedingung: Code in Slot 0..10 von c, Zähler = D, Gold reicht. Die Goldprüfung 0x00500 mit −21 kommt vorher.
   - Ablauf: L_00741 prüft bei 0x00757, ob `0x403a ≠ qty`. Das trifft nicht zu, also bleibt `dirb19 = 1`. Bei 0x0058a folgt Meldung −43 (0x0059b), dann `cstop`/Mausfreigabe → L_004a3.
   - Folge: Die Zahlung 0x005b2–0x005ec wird übersprungen. Das ergibt **keinen Goldabzug, keinen Slot-Write und keine Zähleränderung**; 0x0085a schreibt D erneut, mit gleichem Wert.
   - Aus S1 tritt das für −57 ein, deshalb bleibt T2 in der bisherigen Form ohne Kauf.
4. **T2' Ausgangszustand mit Kauf (Formel):**
   - c lebt mit Klasse 0x1664[c] ≠ −1, Gold(c) ≥ Preis, und es gilt eine von zwei Bedingungen:
     - (a) kein −57 in den Slots 0..10 und ein freier Slot 0..8. Erwartet: Slot 0 → −57, Zähler 4971 + 10c + 9: 0 → 5, Gold −Preis.
     - (b) −57 vorhanden mit Zähler z < 5. Erwartet: Zähler → 5, Gold −Preis (voll).
5. **Randfall (suspected):** Ein Zähler ≥ D bei leerem Slot (inkonsistenter Save) würde über 0x0071b den Slot schreiben und dann −43 ohne Zahlung auslösen.
