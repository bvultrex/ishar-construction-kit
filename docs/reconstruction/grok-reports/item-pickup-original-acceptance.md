# Originalabnahme Itemablauf Ishar 2: Boden → Cursor → Inventar → Save → Reload (Objekt 9, CONT1)

Stand: 2026-11-14, Hoth. Läufe 20:41–21:20 (Berlin, UTC+1); Objekt-10-Nachtrag 21:10–21:20. Unabhängige Abnahme in der Original-EXE.
Evidenzstufen: **known** = eigener reproduzierbarer Lauf in der Original-EXE mit vollständigem Byte-Diff; **suspected** = abgeleitet oder nur statisch; **open** = nicht geprüft.
Dieser Bericht enthält keine Save-Werte, Party-Positionen, Namen oder Originalbytes. Konkrete Werte, vollständige Diffs, Screenshots und sha256 liegen privat unter `codex-support/hoth/private/itempickup/`.

## 0. Profil
| Punkt | Wert |
|---|---|
| Spiel | Ishar 2 DOS, `start.exe` `5e35e58d2d13` |
| Skripte | AFFOBJ `40b882fbadff`, OBJET `51ec1fdf24be`, SOURIS `78df7c73f880`, FRISE `27117c124caf`, IO `0df1f34cf251` |
| Laufzeit | DOSBox-X 2025.02.01, cycles fixed 25000, nosound, eigenes Xvfb, nur xdotool; je Session eine Instanz, danach beendet |
| Arbeitskopie | eigene Kopie des Original-Spielverzeichnisses (187 Dateien), Originale (311 Dateien) vorher = nachher hash-gleich; START.SAV und CONT1–7 der Kopie unverändert |
| Kit-Bezug | `workbench/playable-slice` `f4cf659` (inkl. `9beadfd`), nur gelesen in einem temporären Clone, danach gelöscht |
| Verträge | Quesh `pickup-contract-ishar2` (R1–R7), Quesh `pickup-contract-check-ishar1` §9 als Checkliste (auf Ishar 2 übertragen) |
| Codex-Checkpoint `1faef2b` | auf der Box und auf origin nicht vorhanden; Abgleich daher über Offsets und Diffs in §4 |

## 1. Eingaben (alle **mit Patch**, Werkzeug-Eingaben)
Jede Eingabe ist eine Kopie von START.SAV (8359 Byte); jedes geänderte Byte steht mit sha256 vorher/nachher in `private/save_patches.md`.
| Save | Patch | sha-Präfix | Bemerkung |
|---|---|---|---|
| START | – (Original) | `e685cd690257` | Karte 1, CONT1 |
| HIPB | 4 Byte: Objekt 9 Zeile/Spalte/Karte/Blick (Save 345/545/745/8048) auf die Zelle vor der Party | `c306cfc7c77d` | byte-identisch zu Alderaans PICK9 |
| HIPA | 4 Byte: dasselbe für Objekt 10 (346/546/746/8049) | `37ee691d4e88` | byte-identisch zu Alderaans PICK10 |
| HIPG | HIPA + 4 Byte: Beutelbetrag Save 14–17 (0x4c94/0x4c96) ungleich 0 | `b199a09ece84` | Goldgutschrift Objekt 10 sichtbar machen |
| HIPF | HIPB + Figur 0, Rucksack-Slots 0..8 mit einem Inventarcode gefüllt (Save 1036..1053) | `20e71284ca77` | Rucksack-voll-Test |
Zielzelle: CONT1 Layer A ≥ 0 (Boden). Alle übrigen Saves (HIPBR, HIPBA, …) hat das Original selbst geschrieben, jeweils in einen neuen Slot.

## 2. Abläufe
Klickpunkte in Spielkoordinaten 320×200. Laden und Speichern über das Diskmenü (266,12), das Menü danach mit (266,12) geschlossen. Das erste Laden nach dem Start wurde jedes Mal per Bilddiff gegen das Startbild geprüft. Direkt nach jedem Laden wurde eine Referenz in einen neuen Slot gespeichert; jeder Diff ist gegen diese Referenz gerechnet.
| Session | Ablauf | Saves |
|---|---|---|
| s1 | HIPB laden → Referenz → Klick (128,112) → Diskmenü mit Gegenstand am Cursor → Porträt Figur 0 (32,170) → speichern | HIPBR, HIPBA |
| s2 (neuer Start) | **Reload** HIPBA → sofort speichern (Rundlauf) → Charakterblatt Figur 0 (32,193): Gegenstand sichtbar → aus dem Rucksack heben → Porträt Figur 1 (96,170) → Blatt schließen → speichern | HIPBS, HIPBT |
| s3 | HIPB laden → Referenz → Aufnahme → Hände-Icon (40,131) → Handplatz 10 (50,168) → speichern → wieder aus Platz 10 heben → Panel zu → Viewport (60,100) → speichern | HIPBC, HIPBD, HIPBE |
| s4 | HIPF laden → Referenz → Aufnahme → Porträt Figur 0 (Rucksack voll) → Diskmenü → Porträt Figur 1 → speichern | HIPFR, HIPFA |
| s5, s6 | HIPA (Objekt 10) laden → Referenz → Aufnahme (128,112) → Porträt Figur 0 → (s6: Charakterblatt) → speichern | HIPAQ/HIPAA, HIPAC/HIPAB |
| s7, s8 (neuer Start) | HIPG (Objekt 10 plus Beutelbetrag) laden → Referenz → Charakterblatt (Gold vorher) → Aufnahme → Porträt Figur 0 → Charakterblatt (Gold nachher) → speichern; s8: **Reload** HIPGA → sofort speichern → Charakterblatt | HIPGR, HIPGA, HIPGS |

## 3. Verdikte Hauptfall Objekt 9 (Eingaben mit Patch, §1)
| # | Punkt | Ergebnis | Evidenz |
|---|---|---|---|
| V1 | **Sichtbarkeit** | Nach dem Laden von HIPB ist das Bodensprite unten in der Mitte des Viewports zu sehen (Pixeldiff gegen START nur dort). Drei Sessions liefern dasselbe Bild. | **known** |
| V2 | **Aufnahme** | Ein Klick (128,112) genügt. Das Bodensprite verschwindet, der Mauszeiger wird durch das Item-Icon ersetzt und folgt der Maus. Im Save: Welt Zeile/Spalte/Karte (336+i/536+i/736+i) → 0, Blick (8039+i) **bleibt**. | **known** |
| V3 | **Empfänger** | Porträt Figur 0 → erster freier Rucksackslot (Wort 1036+30c+2s, BE16) = Item-Code. Handplatz 10 → Wort 1036+30c+20. Rüstung 1336+c bleibt unverändert (Rucksack und Hand). Figur 0 lebt und ist belegt, passt also zu Gate FRISE 0x007C9 (HP > 0 signed, Klasse ≠ FF). Den negativen Fall (tote oder leere Figur) habe ich nicht gespielt. | **known** (positiver Fall); Gate-Negativfall **suspected** (statisch, s. §5) |
| V4 | **Speichern / Export-SAV** | Das Original schreibt einen Save mit genau den Ziel-Bytes: HIPBR → HIPBA hat 7 geänderte Bytes, 3 davon Uhr, dazu 3 Weltbytes → 0 und das Low-Byte des Inventarworts → Code. Sonst ändert sich nichts. | **known** |
| V5 | **Reload in der Original-EXE** | Neue Session, HIPBA geladen. Am Fundort ist kein Bodensprite mehr (Pixel gleich START). Sofort wieder gespeichert (HIPBS): Weltbytes bleiben 0, das Inventarwort bleibt; der Rest ist Uhr und der bekannte Akteur-Neuwurf (Akteure ≥ 90). | **known** |
| V6 | **Inventar nach Reload** | Das Charakterblatt zeigt das Icon im Rucksack, pixelgleich zum Blatt vor dem Reload. Der Gegenstand ist benutzbar: aus dem Slot gehoben und Figur 1 gegeben. HIPBS → HIPBT: Figur 0 s0 → 0, Figur 1 s0 → Code, Rest nur Uhr. | **known** |
| V7 | **Kein Speichern mit Gegenstand am Cursor** | Ein Klick auf das Diskmenü mit Gegenstand am Cursor öffnet kein Menü, es entsteht keine Datei, das Icon bleibt am Cursor (s1, s4). Der Zwischenzustand „am Cursor“ landet also nie im Save. | **known** (Mausweg); Tastaturweg **open** |
| V8 | **Rucksack voll** | Porträt Figur 0 mit vollen Slots 0..8: nichts wird geschrieben, der Gegenstand bleibt am Cursor. Danach geht er an Figur 1, Slot 0. HIPFR → HIPFA: 3 Weltbytes → 0, Figur 1 s0 → Code; die Slots von Figur 0 bleiben unverändert. | **known** |
| V9 | **Keine Duplikation** | In allen Saves steht Objekt 9 an genau einer Stelle: entweder Welt (Karte ≠ 0) oder genau ein Inventarwort (Zählung über alle 75 Wörter). Das gilt nach Aufnahme, nach Reload, nach Weitergabe und nach Bodenablage. | **known** |
| V10 | Bodenablage (Rückweg) | Aus Handplatz 10 gehoben und in den Viewport gelegt: Weltbytes wieder auf die Zelle vor der Party, Inventar → 0. HIPBC → HIPBE unterscheidet sich nur in der Uhr; das Sprite ist pixelgleich wieder da. | **known** |

## 4. Offsets und Diff-Vertrag für den Kit-Export (Codex)
| Feld | Save-Offset | MAIN | Breite | Aufnahme + Ablage |
|---|---|---|---|---|
| Welt Zeile Objekt i | 336+i | 0x2aba+i | u8 | → 0 |
| Welt Spalte Objekt i | 536+i | 0x2b84+i | u8 | → 0 |
| Welt Karte Objekt i | 736+i | 0x2c4e+i | u8 | → 0 |
| Welt Blick Objekt i | 8039+i | 0x50c8+i | u8 | **unverändert** |
| Inventar Figur c, Slot s | 1036+30c+2s | **0x2d8e**+2(15c+s) | BE16 | 0 → i (Rucksack: erster freier Slot 0..8; Hand: s = 10) |
| Rüstung Figur c | 1336+c | 0x2f0e+c | u8 | unverändert für i = 9 |
| gehalten / Cursor-Handle | – | 0x2d16 / 0x2fc0 | – | nicht im Save; beim Speichern immer 0 (V7) |
- **Vollständiger Diff Referenz → nach Aufnahme+Rucksack (Original):** genau {336+i, 536+i, 736+i, 1036+30c+2s (High- und Low-Byte)}. Dazu nur die Uhr-Wörter 44–49. Alle anderen 8350 Bytes bleiben unverändert. Ein Kit-Export, der auf derselben Eingabe nur diese Bytes schreibt und alle übrigen erhält, entspricht dem Original.
- **Beim Vergleich tolerieren** (Laden → Speichern ohne Aktion): Uhr 44–49 und die Akteur-Blöcke 0x36ac/0x3868 (je 220 B), 0x3d2e/0x3d9e/0x3e7e/0x3eee/0x3f5e/0x41fc/0x43ba (je 110 B) und 0x4040 (330 B), jeweils nur die Einträge der Akteure ≥ 90 (bekannter Neuwurf nach jedem Laden). Deshalb muss die Referenz direkt nach dem Laden gespeichert werden.
- Kit `f4cf659`, `pickOriginalGround`/`receiveOriginalGround`: Für Objekt 9 stimmen die geschriebenen Felder überein (3 Weltbytes, Blick bleibt, erster freier Slot 0..8, BE16, Basis 1036 = 0x2d8e, Gate HP > 0 und anwesend). **Abweichung bei Objekt 10:** siehe §6.

## 5. Abgleich mit Quesh' Checkliste (`pickup-contract-check-ishar1` §9, statisch für Ishar 1) – je Abweichung ein Befund
| Checkliste (Ishar 1) | Ishar 2, Original | Befund |
|---|---|---|
| Weltbytes Zone 290+i, X 34+i, Y 162+i → 0 | Entsprechend: Karte 736+i, Zeile 336+i, Spalte 536+i → 0 | gleiche Semantik, andere Offsets. **B1:** Ishar 2 hat eine vierte Welttabelle (Blick 8039+i), die die Aufnahme **nicht** löscht (known; Quesh R3 sagt dasselbe) |
| Inventarwort 498+26c+2k: 0 → i (13 Wörter je Figur) | 1036+30c+2s: 0 → i (15 Wörter je Figur, Basis MAIN 0x2d8e) | **B2:** anderes Layout (15 statt 13 Slots); die Ishar-1-Formel gilt hier nicht (known) |
| Cursor 0x1506 transient | 0x2d16 transient | gleich (known über V7) |
| Speichern kostet 1000 Gold (Referenz PK9R) | Speichern kostet in Ishar 2 nichts; kein Gold-Byte im Diff | **B3:** keine Speichergebühr (known, auch frühere SG-Messung) |
| Klickfenster x 121..136, y 119..123, Klick (128,121) | Objekt 9: Klick (128,112) trifft; Kanten laut Alderaan x 116..141, y 103..122 | **B4:** andere Box (OBJET-Form 40 in Ishar 2). Kanten habe ich nicht neu vermessen |
| Porträt (32,160) | Porträt (32,170) | gleiche Logik, Klickpunkt nach Ishar-2-Layout |
| Hand: erst Porträt mit leerem Cursor öffnet das Handpanel | Hände-Icon (40,131) öffnet das Panel, Platz 10 (50,168) | **B5:** anderer Bedienweg; Ergebnis Wort s = 10 → Code, Rüstung unverändert (known) |
| Rucksack voll → bleibt am Cursor | ebenso (V8) | gleich (known) |
| Kein Speichern mit Cursor | ebenso (V7) | gleich (known, Mausweg) |
| Ablauf C: zurück auf den Boden | ebenso (V10), Zielzelle = Zelle davor, Blick wird gesetzt | gleich (known) |
| Codes 9/10 = Schlüssel Tür 8/9 (Ishar 1) | In Ishar 2 sind 9/10 Bodenobjekte von Karte 1; 10 ist ein Goldbeutel und wird am Porträt als Gold gutgeschrieben (§6) | **B6:** Bedeutung der Codes ist spielspezifisch |

## 6. Erweiterung Objekt 10 (Goldbeutel; korrigiert 2026-11-14, 21:20)
- Sichtbarkeit **known**: Sprite unten Mitte (s5–s7).
- Aufnahme **known**: Klick (128,112), Icon folgt der Maus. In s5 nahm ein erster Klick bei (128,110) nicht auf; ob die Kante oder ein verlorener Klick schuld war, ist offen.
- **Befund B7 (korrigiert, known):** Objekt 10 wird am Porträt nicht ins Gepäck gelegt, sondern **als Gold gutgeschrieben**. Die frühere Formulierung „verbraucht, ohne Wirkung“ war falsch: In den ersten Läufen (s5, s6) war der Betrag in Save 14–17 bereits 0, die Gutschrift also 0. Deshalb änderte sich dort kein Gold-Byte.
  - Statisch (FRISE 0x0032b–0x00375, Quesh, eigene Lesung): Gilt `0x78 < 75` und `|0x2d16| == 10`, folgen dasselbe Gate (HP > 0, Klasse ≠ −1) und `L_04825` → `L_06865`. Danach `0x2d16 = 0`, `ckill`, `cmouson`. `L_03bef` (Slot-Write) wird nicht erreicht.
  - Lauf **mit Patch** (HIPG = HIPA plus Betrag in Save 14–17, Werte privat), Session s7, Reload in s8:

  | Feld | Save-Offset | MAIN | Delta / Vertrag | Ergebnis |
  |---|---|---|---|---|
  | Gold-Einheiten Figur c | 1026+2c (BE16) | 0x2d80+2c | Einheiten += Wort(16); ist die Summe > 999, dann Tausender += Summe div 1000 und Einheiten = Summe mod 1000 | **bestätigt** (Fall mit Übertrag) |
  | Gold-Tausender Figur c | 1006+2c (BE16) | 0x2d68+2c | Tausender += Wort(14) + Übertrag | **bestätigt** |
  | Beutelbetrag | 14–15 / 16–17 (BE16) | 0x4c94 / 0x4c96 | → 0 | **bestätigt** |
  | Inventar | 1036+30c+2s | 0x2d8e | kein Slot-Write | **bestätigt** (kein Wort = 10 in 75 Slots) |
  | Welt Objekt 10 | 336/536/736+10 | – | → 0, Blick 8039+10 bleibt | bestätigt |
  | Reload (neue Session, sofort gespeichert) | – | – | Gold, 14–17, Welt und Inventar unverändert; sonst nur Uhr und Akteur-Neuwurf (≥ 90) | **bestätigt** |

  - Die Goldanzeige im Charakterblatt stieg genau um die Gutschrift und zeigte nach dem Reload denselben Wert (Screenshots privat).
  - Die Diffs enthalten außer den genannten Feldern nur die Uhr 44–49.
  - Handplätze liegen ebenfalls bei `0x78 < 75`; dass sie denselben Pfad nehmen, ist **suspected** (nicht gespielt).
  - **Kit-Abweichung (Vorschlag, nicht umgesetzt):** `receiveOriginalGround(bytes, 10, c)` in `f4cf659` schreibt 10 in den Rucksack. Das Original schreibt kein Inventarwort, sondern Gold nach obigem Vertrag und setzt 14–17 auf 0. Quesh' ursprünglicher Vertrag R6 nannte den Pfad 0x0032b nicht.

## 7. Offen
- Gate 0x007C9, Negativfall (tote oder leere Figur als Empfänger): nur statisch, kein Lauf (laut Vorgabe kein Nebenpfad).
- Speichersperre über die Tastatur: nicht geprüft.
- Kanten der Klickbox (Objekt 9 nicht neu vermessen, Objekt 10 nur ein Einzelbefund).
- Objekt 10 über Handplatz: nur statisch (suspected).
- Codex' eigener Export aus `1faef2b` liegt nicht vor; Abgleich nur über §4 möglich.

## 8. Artefakte (privat)
`codex-support/hoth/private/itempickup/`: `PLAN.md`, `ERGEBNISSE.privat.md` (vollständige Diffs), `hip-saves.sha`, `screenshots.sha` (95 Bilder), `originals-vorher.sha`/`originals-nachher2.sha`, `work-i2-vorher.sha`/`work-i2-nachher.sha`, Werkzeuge `tools/`. Die Patches stehen in `private/save_patches.md`.
