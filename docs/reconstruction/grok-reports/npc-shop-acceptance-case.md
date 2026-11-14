# Abnahmefall Shop Ishar 1: Stapelitem-Kauf im Shop #1 (Fall STK)

Stand: 2026-11-14, Europe/Berlin. Arbeitskopie in DOSBox-X 2025.02.01. Originale vorher und nachher hash-identisch (311 Dateien). **Ohne Patch.**

## 1. Vertragsbezug
- `shop-tavern-contract-ishar1` (MARCHAND.IO `77db63b52c23…`, PARAM.IO `f42ea12ceffa…`):
  - S1: Eingangstabelle 0x3fd6, Shop #1 bei (31,16,1).
  - S2: Sortiment s1, Gitterslot 3 = Item −58, Preis (0 k, 500 u), qty 20.
  - S3: Gitter und Exit (288,112).
  - S4: Kauf, Stapelregel L_006bf/L_007a1, Zahlung L_0062f.
  - S5: Save-Offsets.
  - Nachtrag „Speichergebühr 1000 Gold“ (SOS L_00b5e/L_00cf8).
- Der Fall ist die spielbare Variante von Vertragstest T2 (Stapelitem statt Nicht-Stapelitem wie im vorhandenen Referenzfall SHOPA). Er schließt die offene Grenze „Stack items … not referenced“ aus REFERENCES §15.6.
- **Abweichung zum Vertrag:** T2 ist im Vertrag mit Item −57 formuliert. Nach Code kann das so nicht eintreten (Abschnitt 6). Deshalb nimmt dieser Fall −58.

## 2. Ausgangs-SAV
- `S1.SAV` (Original-Fixture, Arbeitskopie hash-identisch, Präfix `92023f2b51e3`). Keine Änderung, kein Patch.
- Ergebnis: `STKA.SAV` = `STKB.SAV`, Präfix `c93c4e57fbf5` (beide privat, nur unter `private/work/ishar1`).

## 3. Position und Zone
- Start: Zone 1 (Stadt, CONT1). Startzelle und Facing stehen privat (SW-NPC-1).
- Route: Zwischenzelle (SW-NPC-2), dann der Schritt auf die Shop-Zelle (31,16,1) aus der Code-Tabelle 0x3fd6. MAIN übergibt Shopnummer 1 (Entity-Byte dirb 0x0c, MARCHAND-Switch 0x008b0).
- Ende: zurück auf der Straße, Facing beim Verlassen umgekehrt (SW-NPC-3).
- Keine Monster und kein Kampf auf dem Weg.

## 4. Klickfolge (Spielkoordinaten 320×200; Bildschirm = Spiel + (730,468))
1. Laden:
   - Diskette (309,56) → LOAD (160,155) → `s`, `KP_1`, Return.
   - Etwa 14 s warten.
2. Laufen:
   - Rechts drehen (310,101) ×2 (Facing-Werte privat).
   - Vorwärts (289,82).
   - Links drehen (266,101) (Facing-Wert privat).
   - Vorwärts. Es erscheint „MÖCHTET IHR ETWAS KAUFEN?“.
3. Kaufen:
   - OK (270,132). Es erscheinen das Gitter und „WÄHLT AUS, STOLZE ABENTEURER.“
   - Gitterslot 3 (165,62) **einmal**. Hover und Status zeigen „PFEIL“, Preis 500.
   - Porträt c2 (160,160) **einmal**. Das ist der Kauf; es gibt keine sichtbare Rückmeldung.
4. Verlassen: Exit-Stein (288,112). Die Straße erscheint wieder.
5. Speichern:
   - Diskette (309,56) → SAVE (160,146).
   - Der Dialog zeigt „SICHERN DES SPIELS KOSTET : 1000 GS“. OK (272,157).
   - Neuer Name aus Buchstaben, Return.

Das Kampf-Icon wird nicht berührt.

## 5. Erwartete und beobachtete Zustandsänderungen (Diff Ausgangs-SAV → Ergebnis)
Formeln aus dem Vertrag, mit c = 2, Item −58, j = item + 66 = 8, Slot k = 3 (erster freier Slot 0..8, weil c2 kein −58 trägt; SW-NPC-5).

| Offset | Formel | Änderung | Evidenz |
|---|---|---|---|
| 3, 7 | Position x, Facing | Laufweg und Facing-Umkehr beim Verlassen (Werte: SW-NPC-3) | known (Wert); Mechanismus suspected |
| 483 | Tausender 478+2c (Low-Byte) | −2 (eins durch Borgen beim Preis, eins durch die Gebühr; Werte: SW-NPC-4) | **known** |
| 3997/3998 | Einheiten 3993+2c | Einheiten − 500 mit Borgen aus den Tausendern (L_0062f), Gebühr ohne Wirkung auf die Einheiten (Werte: SW-NPC-4) | **known** |
| 556/557 | Item 498+26c+2k, k = 3 | 00 00 → FF C6 (= −58) | **known** |
| 4999 | Stapelzähler 4971+10c+j | vorher leer → 0x14 = 20 (qty 20, Deckel 20, L_007a1 erster Zweig) | **known** |

- Gesamtgold der Gruppe: genau −500 (Preis) − 1000 (Speichergebühr). Im Diff ändern sich nur die Goldfelder von c2; c2 trägt beides (Goldstände der Gruppe privat, SW-NPC-4).
- Weitere Unterschiede: **keine**, insgesamt 8 Bytes. CONT1..6 sind identisch mit den Originalen.
- `case_diff_i1.py … SHOP --char 2 --price 500 --code -58 --pos …` → **exit 0**, 0 unerwartete Offsets (SW-NPC-7). Damit ist auch der Stapelzweig des Werkzeugs zum ersten Mal an einem echten Lauf geprüft.
- Determinismus: Ein zweiter unabhängiger Lauf (STKB) ergab einen byte-identischen Save. Der Ishar-1-Save enthält keine Uhr.

## 6. Evidenzlabel
- **Fall STK: known** (gespielt, Save-Diff, wiederholt, byte-identisch). Ohne Patch.
- **Nebenbefund zur Vertrags-T2 (−57): known (Code), nicht gespielt.**
  - Alle Mitglieder in S1 tragen −57 bereits mit vollem Stapel (Deckel 5; SW-NPC-6).
  - L_006bf findet den Slot, und L_007a1 kann nichts hinzufügen (Rest = qty). L_00741 lässt dirb 0x19 = 1 stehen, daraus folgt Meldung −43 („BÜNDEL VOLL“).
  - Keine Abbuchung, kein Zählerwechsel; das Item bleibt in der Hand.
  - Die Vertragserwartung für T2 (Einheiten − 380, Zähler + 5) tritt daher von S1 aus nicht ein. Als eigener Testfall „Refusal bei vollem Stapel“ wäre das spielbar.

## 7. Risiken und offene Grenzen
- Gitterkoordinate (165,62) für Slot 3 ist per Hover-Text bestätigt. Die übrigen Slots sind aus der Formel in S3 abgeleitet (suspected).
- Der Kauf hat keine sichtbare Rückmeldung. Ein Doppelklick auf Item oder Porträt erzeugt einen zweiten Kauf (vgl. SHOPA in Ishar 2). Bei −58 würde der zweite Kauf am Deckel 20 scheitern (Meldung −43, keine Abbuchung; aus Code, nicht gespielt).
- Die Speichergebühr wird vor dem Schreiben abgebucht. Im Diff ist sie vom Kaufpreis nur über die Gesamtsumme trennbar (Tausender-Byte 483 trägt beides).
- Abgedeckt sind nur Shop #1 und ein Stapelitem mit leerem Zähler. Teilfüllung (Zähler + qty > Deckel, zweiter Zweig L_007a1) und der echte „Bündel voll“-Pfad (9 belegte Slots) sind nicht gespielt.
- Neue Saves brauchen für einen erneuten Ladeversuch einen DOSBox-Neustart. Für den Diff wurde direkt die Datei gelesen.
- Taverne/NPC-Fälle (V1–V6) bleiben offen. Eine Tavernentür ist von S1 aus laut REFERENCES §6 nicht erreichbar.
