# Ishar 1 – vollständige Save-Map (save-map-ishar1)

## Handoff-Kopf
- Von: Quesh · An: Codex (save-maps.ts), Alderaan, Hoth · Stand: 2026-11-03
- Maschinenlesbar: `save-map-ishar1.json` (SaveMap-kompatibel; zusätzliche Schlüssel `byteMap`, `classNameVariants`)
- Werkzeuge (private/): `ishar1-savemap-build.py`, `ishar1-savemap-check.py`
- Regeln: read-only, statisch, keine Commits, keine Originalbytes außerhalb private/.
- Belegstufen: known → `confirmed`, suspected → `probable`, unknown → `unknown`.

## Kernaussagen
1. Save = 5216 Bytes, Big Endian, vollständig aus MAIN `cfwritev` 0x4816–0x4a1c / `cfreadv` 0x4a43–0x4c49 abgeleitet (known). Lückenlos: 107 Bereiche, Summe 5216.
2. Bytes 0..33: 17 BE16-Wörter; Byte-Variablen werden sign-extended gespeichert (z. B. 0x41e6 = −1 → `ff ff`).
3. Danach Struct-of-Arrays: je Feld 5 (Party) bzw. 70 (Akteure) Einträge hintereinander. Wort-Arrays (`ti`) BE16, Byte-Arrays (`tc`) 1 Byte. Darum gilt in FieldSpec `stride = size`.
4. Die bisherigen ISHAR1_SAVE-Offsets (0x2d5 hp, 0x2df gold, 0x2e9 psychic, 0x3e2 level, 0x3e7…0x400 Attribute) sind **widerlegt**: 0x2d5 = Low-Byte von Gift 0x1658[3]; 0x2df = Rasse c2; 0x2e9 = Stärke c2; 0x3e2…0x400 liegen im NPC-Namensblock 0x1746. Ersetzen.
5. Gold = `goldThousands`(3993+2c)·1000 + `gold`(478+2c). Die Party hält Gold meist bei einem Charakter.
6. Hoths Offsets 7386/7576 (Teil 2/3) liegen jenseits 5216 → gehören zu Ishar 2, nicht in diese Map.

## Party-Felder (für `fields`)
| id | Offset (c = 0..4) | Größe | Variable | Bereich | Beleg |
|---|---|---|---|---|---|
| xp | 458+2c | BE16 | 0x1536 | 0..32767 | known (FRISE 0x076bf) |
| hp | 468+2c | BE16 | 0x1542 | 0..hpMax | known (VITALITY) |
| gold | 478+2c | BE16 | 0x154e | 0..999 | known |
| hpMax | 488+2c | BE16 | 0x155a | | known |
| Inventar | 498+26c+2k | BE16 | 0x1568 | Item-Code | known (Basis), Slot 11/12 suspected |
| class | 728+c | u8 | 0x1664 | 0..18, 255 leer | known |
| race | 733+c | u8 | 0x166c | 1..5 | known |
| level | 738+c | u8 | 0x167c | 1..10 | known |
| strength / constitution / wisdom / intelligence / agility | 743/748/753/758/763 +c | u8 | 0x1684/0x168c/0x1694/0x169c/0x16a4 | | known (FRISE 0x07764ff) |
| psychic (MENTAL) | 768+c | u8 | 0x16b4 | 0..100 | known |
| physical (Sättigung) | 773+c | u8 | 0x16bc | 0..100 | known |
| temper | 778+c | u8 | 0x16cc | | suspected |
| armor | 783+c | u8 | 0x16d4 | | known |
| Zauberbuch | 788+20c+k | u8 | 0x16de | | known |
| npcId | 4028+c | u8 | 0x3908 | 0..69, 255 | known |
| goldThousands | 3993+2c | BE16 | 0x3770 | | known |
| Skills 1H/2H/Werfen/Schießen/Schlösser/Orientierung/Erste Hilfe/Sprachen | 4738/4743/…/4773 +c | u8 | 0x3d0c…0x3d44 (Schritt 8) | 0..100 | known (MESSAGEE SKILLS-Seite 0x004b4) |
| rune | 5021+c | u8 | 0x3ee6 | | known |
| Name | 418+8c | char[8] | 0x150c | ASCII, NUL | known |

## Klassennamen-Klärung
Quelle: Switch `odirb(0x1b)` = 0x1664[c] in MESSAGE.IO (FR), MESSAGEE (EN), MESSAGED (DE), MESSAGEI (IT), Label L_01bcd (known). DE-Zeichensatz: `#`=Ü, `$`=Ö, `%`=Ä.

| ID | FR | EN | DE (maßgeblich) | IT | bisher im Kit (ISHAR2_CLASSES) |
|---|---|---|---|---|---|
| 0 | PALADIN | PALADIN | Paladin | PALADINO | Knappe ✗ |
| 1 | GUERRIER | WARRIOR | Krieger | GUERRIERO | |
| 2 | RANGER | RANGER | Ranger | GUIDA | |
| 3 | BARBARE | BARBARIAN | Barbar | BARBARO | |
| 4 | VOLEUR | THIEF | Dieb | LADRO | |
| 5 | CLERC | CLERIC | Geistlicher | MONACO | |
| 6 | MAGICIEN | WIZARD | Zauberer | MAGO | Magier ✗ |
| 7 | ARCHER | ARCHER | Bogenschütze | ARCERE | |
| 8 | ESPION | SPY | Spion | SPIA | |
| 9 | PRETRE | PRIEST | Priester | PRETE | |
| 10 | MERCENAIRE | MERCENARY | Söldner | MERCENARIO | |
| 11 | PRINCESSE | PRINCESS | Prinzessin | PRINCIPESSA | Bettler ✗ |
| 12 | ASSASSIN | ASSASSIN | Attentäter | ASSASSINO | Mörder ✗ |
| 13 | – | – | (kein String, Sprung auf leeren Zweig) | – | Priesterin ✗ |
| 14 | – | – | (kein String) | – | Hypnotiseur ✗ |
| 15 | HYPNOTISEUR | HYPNOTIST | Hypnotiseur | IPNOTIZZATORE | |
| 16 | SORCIERE | WITCH | Hexe | STREGA | |
| 17 | DARK KNIGHT | DARK KNIGHT | Finsterer Ritter | CAVALIERE | Schwarzer Ritter ✗ |
| 18 | MOINE OCCULTE | OCCULT MONK | Okkulter Mönch | MONACO | |

Hoths Party [1,17,18,6,9] = Krieger, Finsterer Ritter, Okkulter Mönch, Zauberer, Priester – stimmt mit MESSAGED überein. Ursache der Abweichungen: ISHAR2_CLASSES wurde für Ishar 1 übernommen. Ishar 1 braucht eigene `classes`/`races` (in JSON).

Rassen (0x166c, Switch `odirb(0x1a)`, known): 1 HUMAIN/HUMAIN(sic)/Menschlich/UMANO, 2 ELFE/ELF/Elfe/ELFO, 3 NAIN/DWARF/Zwerg/NANO, 4 ORC/ORC/Ork/ORCO, 5 HOMME LEZARD/LIZARD/Eidechse/(IT fehlt).

## Byte-Map (alle 5216 Bytes)
| Offset | Länge | Endian | Variable | Layout | Bedeutung | Bereich | Schreiber | Leser | Beleg |
|---|---|---|---|---|---|---|---|---|---|
| 0 | 2 | be | `main 0x421f` | 1 | Flag 0x421f: Nur von MAIN gelesen/geschrieben (Laden/Speichern); Bedeutung offen | 0..255 | MAIN:1 | MAIN:1 | unknown |
| 2 | 2 | be | `main 0x137c` | 1 | Position X: Kartenkoordinate X der Party (GERDEP +1/−1 beim Schritt) | 0..255 | GERDEP:15 MAIN:3 | GERDEP:82 MAIN:28 STEL:14 FORET:14 COLCAVE:14 PLAINE:14 | suspected |
| 4 | 2 | be | `main 0x137d` | 1 | Position Y: Kartenkoordinate Y der Party (GERDEP Schritt) | 0..255 | GERDEP:17 MAIN:3 | GERDEP:98 MAIN:31 RPLAINE:14 STEL:14 FORET:14 COLCAVE:14 | suspected |
| 6 | 2 | be | `main 0x137e` | 1 | Blickrichtung/Ort-Modus: von GERDEP/MAIN gesetzt (2..4), sehr häufig von MCAVE/VILLE gelesen | 0..4 | GERDEP:8 MAIN:6 | MCAVE:265 VILLE:169 GERDEP:61 RAMPART:37 COLCAVE:25 TEMPLE:9 | suspected |
| 8 | 2 | be | `main 0x1508` | 1 | Zone/Karte: aktuelle Zone; Vergleich mit 0x3910[a] (Monster in derselben Zone), mod 10 = Gebietstyp | 0..255 | MAIN:7 GERDEP:5 | RPLAINE:72 MAIN:48 GERDEP:31 DPLT:13 GEREN:12 SAMB:10 | known |
| 10 | 2 | be | `main 0x3e54` | 1 | Zähler 0x3e54 (Wort): FRISE/OBJET addieren Beträge ×1000/×100 aus 0x403a; Bedeutung offen (Preis/Wert-Akkumulator?) | 0..65535 | FRISE:6 SOURIS:1 PARAM:1 MAIN:1 | FRISE:9 OBJET:5 SOURIS:1 MAIN:1 | unknown |
| 12 | 2 | be | `main 0x3e56` | 1 | Zähler 0x3e56 (Wort): Partnerwort zu 0x3e54 | 0..65535 | FRISE:6 SOURIS:1 PARAM:1 MAIN:1 | FRISE:9 OBJET:5 SOURIS:1 MAIN:1 | unknown |
| 14 | 2 | be | `main 0x3f0c` | 1 | Wort 0x3f0c: FRISE/SOURIS/PARAM schreiben; Bedeutung offen | 0..65535 | FRISE:3 SOURIS:1 PARAM:1 MAIN:1 | FRISE:2 MAIN:1 | unknown |
| 16 | 2 | be | `main 0x3f0e` | 1 | Wort 0x3f0e: Partnerwort zu 0x3f0c | 0..65535 | FRISE:3 SOURIS:1 PARAM:1 MAIN:1 | FRISE:2 MAIN:1 | unknown |
| 18 | 2 | be | `main 0x3ffe` | 1 | Flag 0x3ffe: 0/1, von FRISE gesetzt, DPLT liest (Anzeige-Modus?) | 0..1 | FRISE:4 PARAM:1 MAIN:1 | DPLT:3 MAIN:1 | unknown |
| 20 | 2 | be | `main 0x41e4` | 1 | NPC-27-Zustand: 2 = in Party (FRISE 0x0197a), −1 = entfernt, 0 = INTMAIS, 1 = nach Szene 9 (TEXTIN) | -1..2 | FRISE:3 MAIN:2 TEXTIND:1 INTMAIS:1 TEXTIN:1 TEXTINE:1 | TEXTIND:4 INTMAIS:4 TEXTIN:4 TEXTINE:4 TEXTINI:4 MAIN:1 | known |
| 22 | 2 | be | `main 0x41e5` | 1 | Flag 0x41e5: PCAVE setzt 0/1, GERDEP/ENCONT lesen | 0..1 | PCAVE:4 PARAM:1 MAIN:1 | GERDEP:1 ENCONT:1 MAIN:1 | suspected |
| 24 | 2 | be | `main 0x41e6` | 1 | Ort/Szenen-ID: GERDEP setzt 30..44, MAIN-Switch 30..; −1 = keiner (S1) | -1..63 | GERDEP:34 MAIN:7 | MAIN:13 DPLT:6 GERDEP:1 AFFOBJ:1 | suspected |
| 26 | 2 | be | `main 0x421c` | 1 | Teleport-Ziel: TELEP/MONSTRE schreiben | 0..255 | TELEP:1 MAIN:1 MONSTRE:1 | MAIN:2 | suspected |
| 28 | 2 | be | `main 0x421d` | 1 | Teleport-Flag: 0/1 | 0..1 | MAIN:4 TELEP:3 MONSTRE:3 | MAIN:4 | suspected |
| 30 | 2 | be | `main 0x421e` | 1 | Flag 0x421e: nur MAIN, 1 gesetzt | 0..1 | MAIN:3 | MAIN:3 | unknown |
| 32 | 2 | be | `main 0x3eac` | 1 | Gebiet/Szenerie: GERDEP 4/5/8/9/13…; DPLT liest | 0..255 | GERDEP:49 MAIN:3 | GERDEP:56 MAIN:47 DPLT:16 FRISE:1 | suspected |
| 34 | 128 | none | `main 0x1382` | 128 | Weltobjekt-Tabelle A: 128 Bytes, PARAM initialisiert, AFFOBJ liest (Objekte in der Welt) | -128..127 | PARAM:85 SOURIS:3 FRISE:2 | AFFOBJ:6 | suspected |
| 162 | 128 | none | `main 0x1404` | 128 | Weltobjekt-Tabelle B: 128 Bytes, Partner zu 0x1382 | -128..127 | PARAM:85 SOURIS:3 FRISE:2 | AFFOBJ:6 | suspected |
| 290 | 128 | none | `main 0x1486` | 128 | Weltobjekt-Zustand: 128 Bytes; TEXTIN prüft [111],[112],[113+x] < 0 (Quest-Zustand) | -128..127 | PARAM:94 SOURIS:3 FRISE:2 | INTMAIS:6 AFFOBJ:4 TEXTIND:3 TEXTIN:3 TEXTINE:3 TEXTINI:3 | suspected |
| 418 | 40 | none | `main 0x150c` | 5x8 | Namen Party: 5 × 8 Bytes ASCII, NUL-gepolstert (FRISE 0x0768a druckt) | ASCII | PARAM:11 FRISE:1 | FRISE:5 TEXTIND:3 TEXTIN:3 TEXTINE:3 TEXTINI:3 MESSAGEI:2 | known |
| 458 | 10 | be | `main 0x1536` | 5 | Erfahrung: XP je Charakter (FRISE 0x076bf), Kill +50·T/+20·T | 0..32767 | FRISE:5 PARAM:1 | FRISE:17 | known |
| 468 | 10 | be | `main 0x1542` | 5 | Vitalität: aktuelle HP (FRISE 0x076e7), 0 = tot | 0..maxHp | FRISE:13 PARAM:3 GERDEP:2 ITAVERNE:2 INTMAIS:1 GEREN:1 | FRISE:38 GERDEP:5 GEREN:4 ITAVERNE:3 SOURIS:1 PARAM:1 | known |
| 478 | 10 | be | `main 0x154e` | 5 | Gold (Einer): Gold mod 1000; mit 0x3770 = Tausender; Borgen L_009cf | 0..999 | FRISE:9 SOS:4 INTMAIS:4 SOSD:4 ITAVERNE:4 SOSE:4 | FRISE:16 STAGE:6 SOS:5 INTMAIS:5 SOSD:5 ITAVERNE:5 | known |
| 488 | 10 | be | `main 0x155a` | 5 | Vitalität max.: maximale HP | 1..32767 | PARAM:3 FRISE:2 | FRISE:7 ITAVERNE:1 | known |
| 498 | 130 | be | `main 0x1568` | 5x13 | Inventar: 5 × 13 Wörter (Rucksack + Hände [9]/[10] + Rüstung/Helm), Item-Codes | -32768..32767 | PARAM:37 FRISE:19 MARCHAND:1 ITAVERNE:1 | FRISE:40 MARCHAND:2 ITAVERNE:2 GEREN:1 PCAVE:1 | known |
| 628 | 10 | be | `main 0x15ec` | 5 | Effekt-Timer 0x15ec: Zaubereffekt-Timer (magic-contract) | 0.. | FRISE:2 GEREN:1 PARAM:1 | FRISE:3 GEREN:2 GERDEP:1 | known |
| 638 | 10 | be | `main 0x15f8` | 5 | Effekt-Timer 0x15f8: Zaubereffekt (⌊3ML/4⌋ bzw 5ML), Icon 24 | 0.. | FRISE:3 GEREN:1 PARAM:1 | FRISE:2 GEREN:2 | known |
| 648 | 10 | be | `main 0x1604` | 5 | Effekt-Timer 0x1604: Icon 12 | 0.. | FRISE:2 PARAM:1 | FRISE:2 GEREN:2 GERDEP:1 | known |
| 658 | 10 | be | `main 0x1610` | 5 | Inversion: ≠0 blockiert Angriff | 0.. | FRISE:3 GEREN:1 PARAM:1 | FRISE:2 | known |
| 668 | 10 | be | `main 0x161c` | 5 | Schutz-Timer mit Stufe: 10000·Stufe + Timer, Icon 4 | 0.. | FRISE:4 PARAM:1 | FRISE:3 GEREN:2 | known |
| 678 | 10 | be | `main 0x1628` | 5 | Effekt-Timer 0x1628: Icon 27 | 0.. | FRISE:3 PARAM:1 | FRISE:2 GEREN:2 | known |
| 688 | 10 | be | `main 0x1634` | 5 | ungenutzt 0x1634: kein Leser/Schreiber in Skripten gefunden | 0 |  |  | unknown |
| 698 | 10 | be | `main 0x1640` | 5 | Mentalschild-Timer: Icon 28 (Hoth-Beobachtung; Wert nur lokal) | 0.. | FRISE:2 PARAM:1 | GEREN:4 FRISE:2 | known |
| 708 | 10 | be | `main 0x164c` | 5 | Blindheit: ≠0 → Trefferchance 20 | 0.. | FRISE:3 GEREN:1 PARAM:1 | FRISE:3 GERDEP:1 | known |
| 718 | 10 | be | `main 0x1658` | 5 | Gift-Stärke: HP −= Wert pro Gifttick | 0.. | FRISE:4 INTMAIS:1 PARAM:1 | FRISE:3 | known |
| 728 | 5 | none | `main 0x1664` | 5 | Klasse: Klassen-ID 0..18, 255/−1 = leerer Slot (MESSAGE* 0x01bcd) | 0..18,255 | PARAM:17 FRISE:2 INTMAIS:1 ITAVERNE:1 | FRISE:32 ITAVERNE:5 STAGE:4 SOS:3 INTMAIS:3 SOSD:3 | known |
| 733 | 5 | none | `main 0x166c` | 5 | Rasse: 1 Mensch, 2 Elf, 3 Zwerg, 4 Ork, 5 Echsenmensch (MESSAGE* L_01b74) | 1..5 | PARAM:3 FRISE:1 | FRISE:4 MESSAGEI:1 MESSAGED:1 MESSAGEE:1 MESSAGE:1 | known |
| 738 | 5 | none | `main 0x167c` | 5 | Stufe: Level (FRISE 0x07697), max 10 | 1..10 | FRISE:10 PARAM:3 | FRISE:3 GEREN:1 | known |
| 743 | 5 | none | `main 0x1684` | 5 | Stärke: FRISE 0x07764 | 0..255 | PARAM:2 FRISE:1 STAGE:1 | FRISE:2 STAGE:2 SOURIS:1 GEREN:1 | known |
| 748 | 5 | none | `main 0x168c` | 5 | Konstitution: FRISE 0x0778c | 0..255 | PARAM:2 FRISE:1 | FRISE:5 GERDEP:1 GEREN:1 | known |
| 753 | 5 | none | `main 0x1694` | 5 | Weisheit: FRISE 0x07804 | 0..255 | PARAM:2 FRISE:1 STAGE:1 | STAGE:3 FRISE:2 | known |
| 758 | 5 | none | `main 0x169c` | 5 | Intelligenz: FRISE 0x077dc | 0..255 | PARAM:2 FRISE:1 STAGE:1 | FRISE:7 STAGE:3 | known |
| 763 | 5 | none | `main 0x16a4` | 5 | Geschicklichkeit: FRISE 0x077b4 | 0..255 | PARAM:2 FRISE:1 STAGE:1 | FRISE:5 STAGE:2 GEREN:1 | known |
| 768 | 5 | none | `main 0x16b4` | 5 | Mental (Psi-Energie): FRISE 0x07735 MENTAL, Hoth 771 72→67 | 0..100 | FRISE:3 ITAVERNE:3 PARAM:2 | FRISE:9 ITAVERNE:2 | known |
| 773 | 5 | none | `main 0x16bc` | 5 | Körperlich (Sättigung): FRISE 0x0770e PHYSICAL; Taverne +40/+15, Kampf −1 | 0..100 | FRISE:6 ITAVERNE:5 PARAM:2 GERDEP:1 | FRISE:12 ITAVERNE:3 GERDEP:1 | known |
| 778 | 5 | none | `main 0x16cc` | 5 | Gesinnung/Charakter: Abstimmung |0x16cc−0x206e| (recruit/dismiss) | 0..255 | FRISE:1 PARAM:1 | FRISE:3 | suspected |
| 783 | 5 | none | `main 0x16d4` | 5 | Rüstungswert: ARM_p im Schadensmodell | 0..255 | FRISE:11 | GEREN:2 | known |
| 788 | 100 | none | `main 0x16de` | 5x20 | Zauberbuch: 5 × 20 Bytes (k 0..9 Zauber + Rest), stride 20 | 0..40 | PARAM:28 FRISE:2 STAGE:2 | STAGE:3 FRISE:2 MESSAGEI:2 MESSAGED:2 MESSAGEE:2 MESSAGE:2 | known |
| 888 | 560 | none | `main 0x1746` | 70x8 | NPC-Namen: 70 × 8 Bytes ASCII | ASCII |  | FRISE:2 BUSTE:2 TEXTIND:1 TEXTIN:1 PARAM:1 TEXTINE:1 | known |
| 1448 | 140 | be | `main 0x1978` | 70 | Akteur X: 70 Wörter, DPLT schreibt; Position |  | DPLT:6 | ENCONT:6 FRISE:5 GEREN:5 DPLT:2 SOURIS:1 GERDEP:1 | suspected |
| 1588 | 140 | be | `main 0x1a06` | 70 | Akteur Y: 70 Wörter |  | DPLT:6 | ENCONT:6 FRISE:5 GEREN:5 DPLT:2 SOURIS:1 GERDEP:1 | suspected |
| 1728 | 140 | be | `main 0x1b22` | 70 | Akteur HP: 70 Wörter, ≤0 = tot |  | FRISE:5 DPLT:2 GEREN:2 | FRISE:8 GEREN:4 ENCONT:4 GERDEP:1 DPLT:1 PARAM:1 | known |
| 1868 | 140 | be | `main 0x1bb0` | 70 | Akteur Gold: 70 Wörter, beim Rekrutieren → 0x154e |  | FRISE:1 | FRISE:3 PARAM:1 | known |
| 2008 | 140 | be | `main 0x1c3e` | 70 | Akteur Effekt (Halt): 70 Wörter, ⌊ML/4⌋ |  | GEREN:3 FRISE:1 | GEREN:2 FRISE:1 | known |
| 2148 | 140 | be | `main 0x1ccc` | 70 | Akteur Schlaf: 70 Wörter |  | FRISE:3 GEREN:3 | GEREN:2 FRISE:1 DPLT:1 | known |
| 2288 | 140 | be | `main 0x1d5a` | 70 | Akteur Inversion: 70 Wörter |  | GEREN:3 FRISE:2 | FRISE:1 GEREN:1 | known |
| 2428 | 140 | be | `main 0x1de8` | 70 | Akteur Blindheit: 70 Wörter |  | GEREN:3 FRISE:1 | GEREN:2 FRISE:1 | known |
| 2568 | 70 | none | `main 0x1e76` | 70 | Akteur Klasse: 70 Bytes (Klassen-IDs wie 0x1664) | 0..18 | DPLT:1 | FRISE:3 GEREN:2 MESSAGEI:1 MESSAGED:1 MESSAGEE:1 MESSAGE:1 | known |
| 2638 | 70 | none | `main 0x1ebe` | 70 | Akteur Rasse: 70 Bytes | 1..5 | DPLT:1 | FRISE:3 NAIM:2 GEANT:2 BARBARE:2 ORC:2 SORCIER:1 | known |
| 2708 | 70 | none | `main 0x1f06` | 70 | Akteur Stufe/T: 70 Bytes, XP-Faktor |  | DPLT:1 | FRISE:4 GEREN:2 PARAM:1 | known |
| 2778 | 70 | none | `main 0x1f4e` | 70 | Akteur Stärke: 70 Bytes |  | DPLT:1 | FRISE:2 GEREN:1 PARAM:1 | known |
| 2848 | 70 | none | `main 0x1f96` | 70 | Akteur Konstitution: 70 Bytes |  | DPLT:1 | FRISE:3 PARAM:1 | known |
| 2918 | 70 | none | `main 0x1fde` | 70 | Akteur Attribut 0x1fde: 70 Bytes (WIS?) |  | DPLT:1 | FRISE:1 PARAM:1 | suspected |
| 2988 | 70 | none | `main 0x2026` | 70 | Akteur Intelligenz: 70 Bytes (Resistenz gegen 0x39ba) |  | DPLT:1 | FRISE:2 GEREN:1 PARAM:1 | known |
| 3058 | 70 | none | `main 0x206e` | 70 | Akteur Gesinnung: 70 Bytes (Abstimmung) |  |  | FRISE:2 PARAM:1 | known |
| 3128 | 210 | none | `main 0x20b8` | 70x3 | Akteur-Tabelle 3×70: 210 Bytes, DPLT/FRISE; beim Rekrutieren Startitems? |  | DPLT:2 FRISE:1 | FRISE:2 | unknown |
| 3338 | 70 | none | `main 0x218c` | 70 | Akteur Rüstung: 70 Bytes |  | DARKWIZ:2 | FRISE:3 | known |
| 3408 | 70 | none | `main 0x21d4` | 70 | Akteur Geschicklichkeit: 70 Bytes |  | DPLT:1 | FRISE:3 GEREN:2 PARAM:1 | known |
| 3478 | 210 | none | `main 0x221e` | 70x3 | Akteur Zauber 3×70: 210 Bytes, → 0x16de[slot][0..2] beim Rekrutieren |  | DPLT:2 | FRISE:1 GEREN:1 | known |
| 3688 | 70 | none | `main 0x22f2` | 70 | Akteur Modus: 70 Bytes, −10 = Repulse/Charm-Markierung |  | DPLT:6 FRISE:5 MORGU:1 | GEREN:11 FRISE:3 DPLT:2 DARKWIZ:1 SOURIS:1 SORCIER:1 | suspected |
| 3758 | 25 | none | `main 0x364c` | 25 | Formation 5×5: Wert = Slot+1, 0 leer | 0..5 | FRISE:7 PARAM:7 GEREN:1 | FRISE:13 GEREN:9 | known |
| 3783 | 140 | be | `main 0x369a` | 70 | Akteur Wort 0x369a: 70 Wörter |  | DPLT:2 FRISE:1 | FRISE:3 PARAM:1 | unknown |
| 3923 | 70 | none | `main 0x3728` | 70 | Akteur Modus-Kopie: 70 Bytes = 0x22f2 Kopie |  | GEREN:4 FRISE:3 | GEREN:4 | known |
| 3993 | 10 | be | `main 0x3770` | 5 | Gold (Tausender): Gold div 1000 | 0.. | FRISE:9 SOS:4 INTMAIS:4 SOSD:4 ITAVERNE:4 SOSE:4 | FRISE:15 SOS:5 INTMAIS:5 SOSD:5 ITAVERNE:5 SOSE:5 | known |
| 4003 | 25 | none | `main 0x377e` | 25 | Beziehungen 5×5: Freundschaft zwischen Party-Slots | -128..127 | FRISE:8 PARAM:1 | FRISE:11 TEXTIND:2 TEXTIN:2 TEXTINE:2 TEXTINI:2 GERDEP:1 | known |
| 4028 | 5 | none | `main 0x3908` | 5 | NPC-Index je Slot: Akteur-Index (0..69) je Party-Slot, −1 leer | 0..69,255 | PARAM:16 FRISE:3 INTMAIS:1 ITAVERNE:1 | GERDEP:11 ITAVERNE:9 BUSTE:6 TEXTIND:5 FRISE:5 TEXTIN:5 | known |
| 4033 | 70 | none | `main 0x3910` | 70 | Akteur Zone: 70 Bytes; MAIN beim Zonenwechsel |  | MAIN:31 DPLT:2 | FRISE:4 ENCONT:4 GEREN:2 SOURIS:1 GERDEP:1 DPLT:1 | known |
| 4103 | 70 | none | `main 0x3958` | 70 | Akteur 0x3958: 70 Bytes DPLT/GERDEP |  | DPLT:3 GERDEP:1 | GERDEP:1 DPLT:1 | unknown |
| 4173 | 10 | be | `main 0x39a2` | 5 | Wort-Array 0x39a2: nur PARAM init | 0 | PARAM:1 |  | unknown |
| 4183 | 10 | be | `main 0x39ae` | 5 | Effekt 0x39ae: Heil-Timer (⌊5ML/4⌋), Icon 30 | 0.. | FRISE:2 PARAM:1 | FRISE:3 GEREN:1 | known |
| 4193 | 140 | be | `main 0x39ba` | 70 | Akteur Zauber-Resistenz: 70 Wörter |  | GEREN:2 FRISE:1 | GEREN:2 | known |
| 4333 | 140 | be | `main 0x3a48` | 70 | Akteur Wach/Aggro: 70 Wörter, Monster-Skripte lesen |  | DPLT:3 FRISE:1 MORGU:1 | MORGU:3 DARKM:2 GOUL:2 PREDATOR:2 DARKWIZ:1 KIRIELA:1 | suspected |
| 4473 | 140 | be | `main 0x3ad6` | 70 | Akteur Verwirrung: 70 Wörter |  | GEREN:3 FRISE:1 | GEREN:2 | known |
| 4613 | 50 | none | `main 0x3b64` | 50 | Höhlen-Tabelle A: 50 Bytes, PCAVE |  | PCAVE:52 PARAM:9 | MCAVE:2 GERDEP:1 | suspected |
| 4663 | 50 | none | `main 0x3b98` | 50 | Höhlen-Tabelle B: 50 Bytes, PCAVE |  | PCAVE:3 PARAM:1 | PCAVE:27 MCAVE:3 | suspected |
| 4713 | 25 | none | `main 0x3cee` | 25 | Erste-Hilfe-Markierung 5×5: "schon geheilt" je Helfer/Ziel | 0..1 | FRISE:3 GEREN:1 PARAM:1 | FRISE:2 | suspected |
| 4738 | 5 | none | `main 0x3d0c` | 5 | Waffen 1 Hand: Fertigkeit | 0..100 | FRISE:1 | FRISE:1 MESSAGEI:1 MESSAGED:1 MESSAGEE:1 MESSAGE:1 | known |
| 4743 | 5 | none | `main 0x3d14` | 5 | Waffen 2 Hände: Fertigkeit | 0..100 | FRISE:1 | FRISE:1 MESSAGEI:1 MESSAGED:1 MESSAGEE:1 MESSAGE:1 | known |
| 4748 | 5 | none | `main 0x3d1c` | 5 | Werfen: Fertigkeit | 0..100 | FRISE:1 | FRISE:1 MESSAGEI:1 MESSAGED:1 MESSAGEE:1 MESSAGE:1 | known |
| 4753 | 5 | none | `main 0x3d24` | 5 | Schießen: Fertigkeit | 0..100 | FRISE:1 | FRISE:1 MESSAGEI:1 MESSAGED:1 MESSAGEE:1 MESSAGE:1 | known |
| 4758 | 5 | none | `main 0x3d2c` | 5 | Schlösser öffnen: Fertigkeit | 0..100 | FRISE:1 | FRISE:12 MESSAGEI:1 MESSAGED:1 MESSAGEE:1 MESSAGE:1 | known |
| 4763 | 5 | none | `main 0x3d34` | 5 | Orientierung: Fertigkeit | 0..100 | FRISE:1 | FRISE:4 MESSAGEI:1 MESSAGED:1 MESSAGEE:1 MESSAGE:1 | known |
| 4768 | 5 | none | `main 0x3d3c` | 5 | Erste Hilfe: Fertigkeit | 0..100 | FRISE:1 | FRISE:1 MESSAGEI:1 MESSAGED:1 MESSAGEE:1 MESSAGE:1 | known |
| 4773 | 5 | none | `main 0x3d44` | 5 | Sprachen: Fertigkeit (TEXTIN ≥75) | 0..100 | FRISE:1 | MESSAGEI:2 MESSAGED:2 MESSAGEE:2 MESSAGE:2 TEXTIND:1 TEXTIN:1 | known |
| 4778 | 3 | none | `main 0x3d54` | 3 | Kontaktliste: 3 Bytes Akteure in Reichweite |  | GERDEP:3 DPLT:3 ENCONT:3 FRISE:1 | DPLT:10 ENCONT:4 | suspected |
| 4781 | 70 | none | `main 0x3d5a` | 70 | Akteur 0x3d5a: 70 Bytes DPLT/MAIN |  | DPLT:1 MAIN:1 | DPLT:1 | unknown |
| 4851 | 70 | none | `main 0x3da2` | 70 | Akteur 0x3da2: 70 Bytes DPLT/MAIN |  | DPLT:1 MAIN:1 | DPLT:1 | unknown |
| 4921 | 50 | none | `main 0x3dec` | 5x10 | Effekt-Icons 5×10: Icon-IDs aktiver Effekte | 0..99 | FRISE:7 GEREN:1 PARAM:1 | FRISE:7 GEREN:2 | known |
| 4971 | 50 | none | `main 0x3e22` | 50 | Händler-Tabelle: 50 Bytes, MARCHAND/FRISE |  | PARAM:10 FRISE:5 MARCHAND:2 | FRISE:8 MARCHAND:2 | suspected |
| 5021 | 5 | none | `main 0x3ee6` | 5 | Rune (vorbereiteter Zauber): Zauber-ID, 0 = keiner | 0..40 | FRISE:2 PARAM:1 | FRISE:5 | known |
| 5026 | 5 | none | `main 0x3eee` | 5 | Slot-Flag 0x3eee: FRISE schreibt, GERDEP liest |  | FRISE:2 PARAM:1 | GERDEP:1 | unknown |
| 5031 | 5 | none | `main 0x3ef6` | 5 | Slot-Flag 0x3ef6: FRISE schreibt, GERDEP liest |  | FRISE:2 PARAM:1 | GERDEP:1 | unknown |
| 5036 | 5 | none | `main 0x3efe` | 5 | Slot-Flag 0x3efe: INTMAIS liest (==0 → 0x1658=5) |  | FRISE:2 PARAM:1 | INTMAIS:1 | unknown |
| 5041 | 5 | none | `main 0x3f06` | 5 | Slot-Flag 0x3f06: FRISE schreibt, GERDEP liest |  | FRISE:2 PARAM:1 | GERDEP:1 | unknown |
| 5046 | 120 | none | `main 0x3f18` | 120 | Taverne-Tabelle: 120 Bytes, PARAM init, ITAVERNE/BUSTE lesen (Rekrutierbare je Taverne?) |  | PARAM:27 ITAVERNE:1 | ITAVERNE:2 BUSTE:1 | suspected |
| 5166 | 50 | none | `main 0x41ea` | 50 | Rest 0x41ea: 50 Bytes, kein Skriptzugriff gefunden, in allen Saves 0? |  |  |  | unknown |

### unknown-Lücken (explizit)
0 (0x421f), 10–17 (0x3e54/0x3e56/0x3f0c/0x3f0e), 18 (0x3ffe), 28 (0x421e), 688–697 (0x1634, kein Skriptzugriff; in MTDB ≠0), 3128 (0x20b8), 3783 (0x369a), 4103 (0x3958), 4173–4182 (0x39a2, nur PARAM), 4781/4851 (0x3d5a/0x3da2), 5026–5045 (0x3eee…0x3f06), 5166–5215 (0x41ea, kein Zugriff, in allen Saves 0).

## Abgleich mit allen Ishar-1-Saves
79 Dateien mit 5216 Bytes, 23 eindeutige Hashes (S1, SHOPA=PROBEB, LP, LP1=LPONE, LP2, IMP, IMP1, IMP2, FINALE, FDROPA, FPICKA, PROBEC/D, ENCA, ITEMA, MTDA=MTEA, MTDB, MTEB, MTFA, MTFB, NDFA, NPCA, HOB; SONE=S1, FLRA=FDROPA, FLRB=FPICKA). Geprüft: Klasse ∈ 0..18∖{13,14} oder 255, Rasse 1..5, Level 1..10, HP ≤ HPmax, MENTAL/PHYSICAL ≤ 100, Gold-Einer ≤ 999, Skills ≤ 100, Namen ASCII, unknown-Lücken = 0.
- [ausgelassen fürs Repo: enthält aus Originalsaves gelesene Werte; nur lokale Fassung]
- [ausgelassen fürs Repo: enthält aus Originalsaves gelesene Werte; nur lokale Fassung]
- [ausgelassen fürs Repo: enthält aus Originalsaves gelesene Werte; nur lokale Fassung]
- Details pro Save (`validation`) nur lokal, nicht im Repo.

## Testfälle (Alderaan/Hoth)
1. [ausgelassen fürs Repo: enthält aus Originalsaves gelesene Werte; nur lokale Fassung]
2. [ausgelassen fürs Repo: enthält aus Originalsaves gelesene Werte; nur lokale Fassung]
3. [ausgelassen fürs Repo: enthält aus Originalsaves gelesene Werte; nur lokale Fassung]
4. Gold-Probe: Kauf 1000 GS bei S1-Stand → 0x3770[2] −1, 0x154e[2] unverändert (Hoths Beobachtung Byte 483 ⇒ Tausender/Einer prüfen).
5. [ausgelassen fürs Repo: enthält aus Originalsaves gelesene Werte; nur lokale Fassung]
6. Skills: Charakterbogen-Seite SKILLS im Spiel vs. Bytes 4738+5k+c.
7. Inventar Slot 11/12: Rüstung/Helm an- und ablegen (offen, suspected).
8. Lücke 0x1634: MTDB-Erzeugungsschritte reproduzieren, Wert erklären.
