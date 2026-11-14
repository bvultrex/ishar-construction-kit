# Ishar 2: Originalshop-Kauf mit SAV-Roundtrip in der Original-EXE (selector 6, Ware −61, Preis 1800)

Stand: 2026-11-14, 21:17–21:40 Europe/Berlin. Ishar 2 DOS (`start.exe`, MARCHAND.IO `a5b84f95b8b5…`, CONT1.FIC `b3f48f1856b7…`), Arbeitskopie in DOSBox-X 2025.02.01, Sprache 3 (Deutsch), Eingabe nur per xdotool, eigene Instanz. Originale vorher und nachher hash-identisch (311 Dateien). **Ohne Patch.**

## 1. Skript- und Vertragsbezug
- `scripts/check-original-shop-roundtrip-local.mjs` (Branch `workbench/playable-slice`, gelesen am Stand `1f96371`; eigener Klon, nichts geändert, nichts gepusht). Das Skript sucht in CONT1–3 die erste begehbare Zelle, deren Vorwärtsschritt GERDEP-Meldung 17 mit einem Händler-Selector auslöst, nimmt dazu ein leistbares Sortimentsstück und einen Empfänger, **patcht die Kamera** (Offsets 2/4/6/8) in eine private SAV-Kopie und rechnet den Kauf auf dem Host nach (`receiveOriginalPurchase`). Seine eigenen Grenzen: „browser and original EXE execution still separate“. Dieser Bericht schließt genau diese Lücke für die Original-EXE.
- Lokaler Skriptlauf (START.SAV als einzige Quelle): CONT1, selector 6, Sortimentsslot 0 = Ware −61, Preis (1, 800) = 1800, qty 1, Empfänger c0, Rucksackslot 0; erwartete Schreib-Offsets `1007, 1026, 1027, 1036, 1037`; Eingabepatch nur Offset 3 (Details SW-I2S-5).
- Hinweis: Mit allen Original-SAVs im Verzeichnis wählt das Skript wegen der alphabetischen Reihenfolge eine andere Quelle und einen anderen Empfänger. Für den gewünschten Fall muss `ISHAR2_DIR` nur START.SAV enthalten (SW-I2S-5).
- Datenvertrag MARCHAND (REFERENCES §10.4, known): Gitterklick setzt 0x2d16, Porträtklick prüft Gold, schreibt ersten freien Rucksackslot 0x2d8e und Gold mit Tausender-Borgen (L_00603). Kein Verkaufen.
- Save-Offsets (ORIGINAL_COMMERCE_OFFSETS, Kit): Gold Tausender 1006+2c, Rest 1026+2c (BE16), Inventar 1036+30c+2s (BE16), Stapel 7629+20c.

## 2. Ausgangs-SAV
- `START.SAV` (Arbeitskopie hash-identisch mit dem Original, Präfix `e685cd690257`), **ungepatcht**.
- Zwischen-Saves (im Spiel geschrieben, nur zur Positionskontrolle): `IPOSA`…`IPOSE`; `IPOSE` (`ae8e93f633ec`) steht auf der Ereigniszelle des Skripts.
- Ergebnis-Saves: `ISHOPA` (`6eacee4e026d`, nach dem Kauf), `ISHOPB` (`94628dbaf538`, nach Reboot und Neuladen von ISHOPA).

## 3. Erreichbarkeit (originalgetreu statt Positionspatch)
- Die Ereigniszelle des Skripts ist von START aus **zu Fuß erreichbar**, ohne Kampf. Sie wurde nicht per Patch gesetzt; der IPOSE-Save zeigt dieselbe Zelle, dieselbe Karte und dasselbe Facing, die das Skript in seine Eingabekopie patcht (Werte SW-I2S-1/2).
- Richtungsbestätigung im Spiel: Facing 2 = Zeile+1, 3 = Spalte+1, 1 = Spalte−1 (REFERENCES §2). Achtung: Im Kit heißt Code 1 „east“, bewegt im Original aber Spalte−1. Ein Pfad aus dem Kit-Gitter muss deshalb über die Codes, nicht über die Namen übersetzt werden.

## 4. Klickfolge (Spielkoordinaten; Bildschirm = Spiel + (730,468))
1. Boot: Sprache `KP_3`, Intro mit Space/Escape, Musik `KP_2`.
2. Laden: Diskette (266,12) → LOAD (238,32) → `start` → Return, ~14 s.
3. Weg: Bedienknöpfe vorwärts (287,26), links (266,30), rechts (308,30). Die konkrete Schrittfolge ab START ist privat (SW-I2S-2). Kontrolle: auf der Ereigniszelle stehen, Tür voraus.
   Im Lauf gingen einzelne Klicks verloren; deshalb wurde die Position mit Zwischen-Saves geprüft (SW-I2S-2). Klicks gegen eine Wand sind wirkungslos.
4. Shop: vorwärts → „Möchtet Ihr etwas kaufen?“ → ok (270,134) → Gitter, „Trefft Eure Wahl, meine Herren.“ → Gitterslot oben links (168,59), Preisschild 1800, **einmal** (Zeiger verschwindet) → Porträt c0 (32,170) **einmal** (= Kauf, keine sichtbare Rückmeldung) → Exit-Stein (288,62) → Straße.
5. Speichern: Diskette (266,12) → SAVE (240,58) → neuer Name → Return (Ishar 2 verlangt keine Speichergebühr).
6. Roundtrip: eigene DOSBox-X-Instanz beenden und neu starten (Boot wie 1.) → LOAD → Name des Kauf-Saves → Charakterbogen c0 über den Namen (32,193) → prüfen → exit (242,107) → erneut speichern unter neuem Namen.

## 5. Offsets und Deltas
**Kauf (IPOSE → ISHOPA, 10 Bytes, vollständig):**
| Offset | Bedeutung | Änderung | Evidenz |
|---|---|---|---|
| 1006/1007 | Gold Tausender c0 (1006+2c) | sinkt (Preis 1800 mit Borgen) | **known** |
| 1026/1027 | Gold Rest c0 (1026+2c) | Rest nach Borgen, 0..999 | **known** |
| 1036/1037 | Inventar c0 Slot 0 (1036+30c+2s) | 00 00 → FF C3 (= −61) | **known** |
| 7 | Facing 0x2ab6 | ändert sich beim Verlassen (Umkehr, MAIN 0x0346f; Werte SW-I2S-7) | known |
| 45, 49 | Stunde 0x4fc6, Tick 0x4fca | Uhr ändert sich (Werte SW-I2S-8) | known |
| 91, 93 | 0x519f / 0x51a0 | Tageszeit-Phase aus der Stunde (MAIN 0x04018: 8..19 → 1, <6 oder ≥22 → 3, sonst 2), 0x51a0 = vorige Phase; ändert sich (Werte SW-I2S-8) | **known** (Code), nur zeitabhängig |
- Gesamtgold c0: **genau −1800**; übrige Mitglieder unverändert; keine Stapelbytes (−61 ist kein Stapelitem). Werte SW-I2S-3.
- Die fünf Commerce-Bytes sind **byte-identisch** mit `EXPECTED.SAV` des Kit-Skripts (gleiche Vorher- und Nachherwerte).
- START → ISHOPB: im Bereich 996..1305 und 7629..7728 ändern sich **nur** 1007, 1026, 1027, 1036, 1037 (SW-I2S-6).

## 6. Roundtrip-Ergebnis nach Neuladen
- Nach dem DOSBox-Reboot lädt die Original-EXE ISHOPA ohne Fehler. Im Spiel zeigt der Charakterbogen von c0 das gekaufte Stück im Rucksack und den reduzierten Goldbetrag (Anzeige = Saveinhalt, SW-I2S-3); Waffe in der Hand unverändert.
- Sofortiges Wiederspeichern (ISHOPB): Gold- und Inventarbytes **identisch** mit ISHOPA. Die 19 abweichenden Bytes sind Uhr (45–49), die bekannte EDPLT-Neuwürfelung der wandernden Akteure (Blöcke 0x36ac, 0x3d9e, 0x3e7e…, 0x41fc, 0x43ba; wie REFERENCES §10.5) und ein Byte im Block 0x4b80 (Offset 7577, Bedeutung **unknown**). Keine Commerce-Offsets darunter.
- **Ergebnis: Ware und Gold-Delta überstehen Export und Neuladen in der Original-EXE unverändert, im Spiel und im Save.**

## 7. Evidenzlabel
- Kauf, Offsets und Delta: **known** (gespielt, Save-Diff, deckungsgleich mit Kit-EXPECTED).
- Roundtrip (Reboot, Laden, Anzeige, Wiederspeichern): **known**.
- Erreichbarkeit der Ereigniszelle: **known** (zu Fuß, ohne Patch, mit Zwischen-Saves belegt).
- Bedeutung Offset 7577 (Block 0x4b80): unknown. Ein Determinismus-Wiederholungslauf wurde **nicht** gemacht.

## 8. Risiken und offene Grenzen
- Keine sichtbare Rückmeldung beim Kauf; ein zweiter Porträtklick kauft ein zweites Mal (vgl. SHOPA in §10.5). Ishar 2 zeigt im Gitter keinen Hover-Namen; die Ware wurde über Preisschild und Save-Diff identifiziert, nicht über den Namen.
- Verlorene Klicks beim Laufen (bekanntes Verhalten der Umgebung); ohne Zwischen-Saves kann man an der falschen Zelle landen. Die Tageszeit ändert sich während des Laufs (Phase privat, SW-I2S-8); ein Unhold-/NPC-Sprite stand nach dem Neuladen im Bild, es gab keine Interaktion und keinen Kampf.
- Die Zwischen-Saves tragen zusätzliche Uhr- und Akteur-Rerolls in den Zustand; für den Kauf selbst ist das ohne Einfluss (Commerce-Bytes START = IPOSE).
- Der erste Wiederspeicher-Versuch wurde werkzeugseitig unterbrochen; der offene Namensdialog (SAVE) wurde wiederverwendet. Ergebnis per Datei geprüft.
- Nicht abgedeckt: Stapelware, Ablehnung bei zu wenig Gold, voller Rucksack, Browser-Seite des Kits.
