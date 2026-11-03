# Dungeonkarten Ishar 1 – Format (öffentlich, ohne Kartendaten)

Stand 2026-11-03. Belegstufen in Klammern. Kartendaten und Decoder nur in `private/`.

## 1. Fundort (known)
- Dateien `CONT1.FIC` … `CONT6.FIC`, je **4860 Bytes**, roh, **ohne Packformat und ohne Kompression**.
- **Korrektur zu Alderaan:** Die Karten liegen doch in CONTn.FIC. Beleg: MAIN liest genau 0x12fc = 4860 Bytes; alle 29 Türen von Zone 15 liegen in CONT5 auf Türmaterial, alle 7 von Zone 12 in CONT2.
- Zone → Datei (MAIN L_044c1, Zone in `0x4251`): 1–6 → CONT1–6, 12 → CONT2, 13 → CONT3, 14 → CONT4, 15 → CONT5, 7–11 → keine.
- MAIN L_04483 lädt: ungerade Zone → Puffer `0x0080`, gerade → `0x234a`. MAIN L_0444e schreibt denselben Puffer per fwriteb zurück; die Karte ist also zur Laufzeit veränderbar.

## 2. Format (known)
- 54 (x) × 90 (y), 1 Byte pro Zelle, signed int8, **Index = x·90 + y** (spaltenweise).
- Nur **ein** Layer. „A/B“ sind die zwei RAM-Puffer für benachbarte Zonen (gerade/ungerade), keine Datenlayer.
- Globale Spalte `0x3646 = 54·(zone%10−1)+x`; über x=53 hinaus → Zone+1, x=0 (GERDEP L_00934, L_00a8a). y 0..89.

## 3. Zellwerte
| Wert | Bedeutung | Stufe |
|---|---|---|
| < 0 | nicht begehbar (GERDEP L_011c3) | known |
| −1..−25, −40..−43 | Sonderwand mit Ereignis (GERDEP 0x00c84 ff.) | known, Ereignis unknown |
| −80..−87 | Übergang/Teleport mit fester Zielposition (GERDEP L_0101c ff.) | known |
| −99, −50..−52 | Fels/Wand | suspected |
| 0 | Boden | known |
| 1..45, 70..81, 100..110 | begehbar, vermutlich Grafikvariante | suspected |
| 46..65, 82..85 | Tür (begehbar), Kante aus m%4: 2→x−1, 3→x+1, 0→y−1, 1→y+1 | known |
| 66..69 | Hebel | suspected |

## 4. Bewegung (known)
Ziel = Position + Vektor(Blick `0x137e`, Taste `dirb 0x11`). Blockiert, wenn Zielwert < 0, wenn die Türkante einer geschlossenen Tür überquert wird (eigene oder Zielzelle, siehe `tuer-hebel-trigger-ishar1.md` §6) oder wenn ein Monster auf der Zielzelle steht (L_01584).

## 5. Loader
```python
b = open(f'CONT{n}.FIC','rb').read(); assert len(b) == 4860
cell = lambda x, y: (b[x*90+y] ^ 0x80) - 0x80
```

## 6. Testfälle
- **K1:** CONT5 (20,53) ist Tür mit m%4 = 1; (20,52) und (20,54) sind 0; (19,53) und (21,53) sind negativ.
- **K2:** Alle Türkoordinaten aus `tuer-hebel-trigger-ishar1.json` treffen Türmaterial (Zone 15: 29/29 in CONT5, Zone 12: 7/7 in CONT2).
- **K3:** Hinter jeder Türkante liegt eine begehbare Zelle (CONT2 7/7, CONT5 29/29).
- **L1:** Zone 15, Start (20,51), Blick 3, 5× vor, Tür 10 offen → (20,52), (20,53), (20,54), (20,55), (20,56).
- **L2:** wie L1, Tür 10 zu → Stopp auf (20,53) (= korrigiertes T4).

## 7. Offen
- Bedeutung der positiven Werte und der Sonderwände; ob Zonen 2–5 neben 12–15 genutzt werden; ob ein Save die CONTn.FIC ersetzt.

## Nachtrag 2026-11-03 (2): Zellwerte → Renderer/Trigger
Höhlenrenderer ist **MCAVE.IO**: Zelle lesen in L_004b7 (0x004c7/0x004d8), Switch bei 0x0055f über −82..−80 und 10..85. Zusatzmodule COLCAVE (34..45) und INCAVE (78..81); beide lädt MAIN. Trigger für Eingänge: GERDEP schickt Nachricht 17 an MAIN (0x00330, Fall 17 → loc 0x425b, L_03542).
Ein Wert ≥ 10 beschreibt die **Wandflächen einer begehbaren Zelle**; negative Zellen werden in der Höhle nicht gezeichnet. Das korrigiert die alte Zeile „−99, −50..−52 Fels (suspected)“ im Abschnitt 3: Das Zeichnen ist jetzt belegt (known); dass es Fels ist, bleibt suspected.

| Wert | Renderer | Klick | Trigger | Stufe |
|---|---|---|---|---|
| < 0 außer −80..−82 | Höhlenrenderer: kein Bild (MCAVE-Switch 0x0055f hat keinen Fall); Wände werden als Flächen der begehbaren Nachbarzelle gezeichnet | – | nicht begehbar (GERDEP L_011c3) | known |
| −99, −50..−52 | massiver Fels / Wandinneres; nur über das Fehlen eines Falls belegt | – | – | known (kein Render), Name suspected |
| −1..−25 (Zonen <10) | Außenwelt-Eingang; der Außenrenderer ist nicht ausgewertet | Laufen vorwärts (dirb11=1) gegen die Zelle | GERDEP 0x00cd0–0x00f1e: send n=1,0,17,k → MAIN 0x00330 Fall 17 → loc 0x425b=k, L_03542: k=1 taverne/itaverne.IO (0x036c6), k=2 marchand.IO (0x0381c, Tabelle 0x3fd6), k=3 stage.IO (0x038c6, Tabelle 0x4178), k=4 intmais.IO (0x0396d, Tabelle 0x41b8); Gebäude-Nr. aus Tabelle[x,y,zone] → loc 0x425c | known (Wert→k je Blick in GERDEP) |
| −12 | Sonderfall in GERDEP 0x00e02: Prüfung eines Gruppenmitglieds mit 0x3908==27, ENCONT-Eintrag (live 0x0e, 0x3f06) | Laufen vorwärts | Ereignis mit Figur 27 | suspected |
| −40..−43, −8, −10, −16, −19 (Zonen ≥10) | Eingang aus der Höhle; zusätzlich Bedingung an die eigene Zelle (35/36/37/40/57/76) | Laufen vorwärts | GERDEP L_00f3e: send 17,k (k=1..4 wie oben) | known |
| −80, −81, −82 | Treppe/Übergang: Wandbilder plus Sprite 241 (MCAVE L_02c4a/L_02b80/L_02d14) | Laufen auf die Zelle | GERDEP L_0101c ff.: feste Zielposition/Zone (z. B. −80 in Zone 15 → (36,26)) | known |
| 0..9 | Boden ohne Wandfläche (kein MCAVE-Fall) | – | – | known |
| 10..13 | Gang: zwei parallele Seitenwände (10/11 entlang y, 12/13 entlang x); Stirnfläche Sprite 27 (L_030c3), Spiegelung über Wert%2 | – | – | known (Render), Namen suspected |
| 14..21 | eine Wandfläche; Seite aus Wert und Blick (Sprites dirw 0x28/0x2a = 15/21 mittig bzw. 43/37 seitlich, je + Tiefe) | – | – | known |
| 22..29 | Ecke: zwei Wandflächen + Stirnfläche | – | – | known |
| 30..33 | Sackgasse: drei Flächen | – | – | known |
| 34..45 | Säule/Pfeiler: MCAVE L_02e95–L_03094 (Sprites 49..79), zusätzlich COLCAVE cswitch2 0x005a6 (Ziele ab L_005c8) | – | – | known (Render), Name suspected |
| 46..53 | Tür Typ 1: Türblatt Sprite 126 (L_03101), Rahmen 144 (L_03353/L_033aa); Türkante m%4 | Klick-/Schlüssellogik siehe tuer-hebel-trigger-ishar1 | Tür d über 0x3c00/0x3c34, Zustand 0x3b64 | known |
| 54..57 | Tür Typ 2: 132 / Rahmen 150 | wie oben | wie oben | known |
| 58..61 | Tür Typ 3: 138 / Rahmen 156 | wie oben | wie oben | known |
| 62..65 | Tür Typ 4: 181/171 (L_03171/L_031b9), Rahmen 21 (L_0355d) | wie oben | wie oben | known (Render), Typname suspected |
| 66..69 | Hebel: MCAVE L_03607/L_0368d/L_03713, Wandfläche 201/207 (dirw 0x2c/0x2e), Hebel 213/219 (L_03718/L_0375a) | frontal bei Tiefe 0 (PCAVE) | 0x3b98[k] | known |
| 70..77 | Wandfläche mit Variante (eine Seite, Sprite dirw 0x2a) | – | – | known (Render), Bedeutung suspected |
| 78..81 | Wand + Objekt Sprite 228; INCAVE 0x005da legt Sprite 12+Tiefe darüber | – | – | known (Render), Bedeutung unknown |
| 82..85 | Tür Typ 5: 234 (L_03151), Rahmen 144 | wie Türen | wie Türen | known |
| 100..110 | nur CONT3/CONT4 (Außenzonen), kein Höhlenfall | – | – | unknown (Außenrenderer) |

Testfälle:
- **R1:** Zone 15, (20,52), Blick 3 → Tür 10 frontal (Rahmen 144 + Türblatt). (suspected)
- **R2:** (20,53), Blick 1 → dieselbe Tür von hinten. (suspected)
- **R3:** −99 vor der Party → keine eigene Grafik. (known)
- **R4:** Außenzone, −1..−25 voraus, vorwärts → Taverne, Händler, Gilde oder Haus wird geladen. (known)
- **R5:** Zone 15, auf −80 laufen → (36,26). (known)
Offen: Außenrenderer der Zonen 1..6 und die Werte 100..110; welche Bilddatei zu welcher Sprite-Nummer gehört.

## Nachtrag 2026-11-03 (3): Außenrenderer und Sprite-Ressourcen
### Außenrenderer (Zonen 1–6)
Die Außenrenderer arbeiten in Schichten: Jedes Modul zeichnet nur seine eigenen Werte. Alle Module haben dasselbe Gerüst: Init-Switch auf −100, Blick-Switch über 0x137e, Tiefentabelle 99·n, danach der Wert-Switch (known). Welche Module MAIN je Zone lädt, habe ich nicht einzeln geprüft (suspected). Die Bedeutungen sind aus den Modulnamen abgeleitet (suspected).

| Modul | Wert-Switch | Werte | Bedeutung |
|---|---|---|---|
| PLAINE | 0x00552 (odirb 0x1c) | −27,−26, 12..25, 34..37 | Ebene: Wand/Hang, Deko |
| RPLAINE | 0x00a46 (odirb 0x1b) | −82..−80, −52..−50, −43..−40, 1..10, 54,55,57 | Felsen/Ebene; Sonderzellen −40..−43, −50..−52 und Übergänge −80..−82 |
| FORET | 0x00566 (odirb 0x2c) | −33..−30, 11..16, 21..24 | Wald |
| ARBRE | 0x00545 (odirb 0x22) | 30..37 | Einzelbäume |
| VILLE | 0x00510 (odirb 0x21) | 35..110 | Stadt: Häuser/Mauern, inkl. 100..110 |
| VILLAGE | 0x00562 (odirb 0x2c), Blick-Switch 0x00612 | −25..−1 | Gebäudefassaden = Eingänge (Nachricht 17, siehe Nachtrag 2) |
| INVILLE | 0x004bd (odirb 0x21) | 97, 98, 109, 110 | Stadtdeko |
| RAMPART | 0x005a4 (odirb 0x26) | 100..111 | Stadtmauer/Wall |
| LACUSTRE | 0x00582 (odirb 0x21) | 54..57 | Wasser/Pfahlbau |
| FBUIS | 0x00537 (odirb 0x20) | −32, −31, 25, 26 | Gebüsch |
| FONTAINE | 0x00510 (odirb 0x26) | −26 | Brunnen |
| STEL | 0x00516 (odirb 0x20) | −87..−85 | Stele |
| TEMPLE | 0x004c9 (odirb 0x21) | 10..16 | Tempel |

Werte 100..110 zeichnen VILLE, RAMPART (100..111) und INVILLE (109/110). Sie kommen nur in CONT3 und CONT4 vor, also in Stadtzonen.

### Sprite-Nummern → Ressourcen
Eine Sprite-Nummer ist ein Index in die Ressourcentabelle der **eigenen .IO-Datei**. Der Zeiger steht im Header-Dword @14; dort liegen Offset und Anzahl. `cputnat`/`cxputat` zeichnen diesen Index (known).
MCAVE.IO hat 247 Ressourcen. 126, 144, 201, 213, 228, 234 und 241 sind Komposite vom Typ 0xFF, 12 ist eine Bitmap (known). Die Rohbytes liegen nur in `private/`. Die Türblätter von PCAVE liegen in PCAVE.IO. Offen: die Komposite auflösen und die Bilder exportieren.

Testfälle:
- **S1:** Ressource 126 aus MCAVE.IO ist Typ 0xFF. (known)
- **S2:** MCAVE.IO hat mindestens 242 Ressourcen. (known)
- **A1:** −1..−25 im Blick → Fassade aus VILLAGE; vorwärts → Gebäude-Szene. (Bild suspected, Trigger known)
- **A2:** 100..111 → Mauer aus RAMPART. (suspected)

## Nachtrag 2026-11-03 (4): Außenmodule je Zone, Wert-Switches belegt
Ersetzt die Stufe „suspected“ aus Nachtrag 3. Zonen-Switch: MAIN 0x0173b über `0x1508`.

| Zonen | Module | Adressen |
|---|---|---|
| 1, 3, 4 | PLAINE, FOND, RPLAINE; RAMPART+INVILLE nur bei Region 0x3eac 9/11; ARBRE bei freiem Speicher >56; SAMB optional | 0x0179f–0x01875 |
| 2, 5 | FOND, RPLAINE, FORET; FBUIS bei freiem Speicher >35 | 0x018b0–0x018fc |
| 6 | FTEMPLE, TEMPLE | 0x0193e/0x0194c |
| 12, 15 | PCAVE, MCAVE (Zone 15 zuvor TELEP); SCAVE optional; COLCAVE bei 0x4239==1 | 0x01976–0x01a57 |
| 13, 14 | FVILLE, VILLE, PABO; FONTAINE bei freiem Speicher >16 | 0x01a93–0x01b30 |
| ereignisgesteuert | VILLAGE (0x02c7a u. a.), LACUSTRE (0x03099), STEL (MAIN Z.1554 ff.), RAMPART/INVILLE (0x0300e/0x0303d) | suspected (Bedingungen nicht ausgewertet) |

| Modul | Switch | Werte | Zeichnung | Stufe |
|---|---|---|---|---|
| PLAINE | 0x00552 | 12..25, 34..37, −27, −26 | Bodenschicht und Hänge; Basis dirw 0x10/0x20 + Tiefe 0x0e/0x12 | known |
| RPLAINE | 0x00a46 | 1..10, 54, 55, 57, −40..−43, −50..−52, −80..−82 | Felsen; −80/−81/1 mit zusätzlicher Spiegelschicht (dirw 0x20/0x24) | known |
| FORET | 0x00566 | 11..16, 21..24, −30..−33 | Wald; Basis dirw 0x1e/0x32 | known |
| ARBRE | 0x00545 | 30..37 | Einzelbäume; Basis dirw 0x14/0x28 | known |
| VILLE | 0x00510 | 35..110 | Nur 78/109/110 zeichnen direkt (dirw 0x14); alle anderen über Unterprogramme, nicht aufgelöst | Switch known, Sprite unknown |
| VILLAGE | 0x00562 | −25..−1 | Fassaden; Basis dirw 0x1e + Tiefe, Blick-Switch 0x00612 | known |
| INVILLE | 0x004bd | 97, 98, 109, 110 | Deko; dirw 0x14 | known |
| RAMPART | 0x005a4 | 100..111 | Mauer; dirw 0x1a/0x2c, gespiegelt | known |
| LACUSTRE | 0x00582 | 54..57 | dirw 0x14/0x26 | known |
| FBUIS | 0x00537 | −32, −31, 25, 26 | dirw 0x14/0x24 | known |
| FONTAINE | 0x00510 | −26 | dirw 0x1a | known |
| STEL | 0x00516 | −87..−85 | dirw 0x14 | known |
| TEMPLE | 0x004c9 | 10..16 | 10..12 zeichnen direkt (dirw 0x14/0x26); 13..16 über Unterprogramme | teilweise |

- **Sprite-Index:** dirw-Basis + Tiefenterm, als Ressource der eigenen .IO (Format: `io-komposit-format.md`). Die konkreten Indizes je Wert sind nicht aufgelöst (suspected).
- **Korrektur:** CONT2 mit Hebeln ist Zone 12, jetzt known. Die Werte 100..110 gehören zu den Zonen 13/14 (VILLE). In den Zonen 3/4 laden RAMPART und INVILLE nur bei Region 9/11.
- **Bedeutungsnamen:** bildlich nur für MCAVE geprüft, sonst suspected.

Testfälle:
- **Z1:** Zone 12 → PCAVE und MCAVE werden geladen. (known)
- **Z2:** Zone 13 → VILLE; Wert 78 wird direkt gezeichnet. (known, Code)
- **Z3:** Zone 2 → FORET zeichnet 11..16. (known)
