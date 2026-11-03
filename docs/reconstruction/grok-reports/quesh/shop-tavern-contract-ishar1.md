# Shop and tavern contract, Ishar 1 DOS (MARCHAND.IO, ITAVERNE.IO)

## Handoff header
- **Base commit:** `bb42748` (read-only clone, nothing committed/pushed). Static analysis only.
- **Question:** buy flow, prices, inventories, stack rules, gold arithmetic and save offsets of the shops; tavern menu, prices, eat/sleep effects, payment split, leave/theft event, hire list.
- *(Savewerte → `private/shop-tavern-contract-ishar1-savewerte.md`, SW-1)*
- *(Savewerte → `private/shop-tavern-contract-ishar1-savewerte.md`, SW-2)*
- **Limits:** tavern menu coordinates and the menu-index→action mapping were not read (menu is drawn by another entity); no runtime tavern diff; a tavern is not reachable on the known S1 route.
- *(Savewerte → `private/shop-tavern-contract-ishar1-savewerte.md`, SW-3)*

Evidence levels: **known** = read in code (and checked against saves/SHOPA where stated), **suspected** = plausible, not closed, **unknown** = open.

## SHA-256 (originals/ishar1/Ishar1)
| File | SHA-256 |
|---|---|
| MARCHAND.IO | 77db63b52c23… |
| ITAVERNE.IO | f3bed78c5fb9… |
| MAIN.IO | 27c5834de005… |
| PARAM.IO | f42ea12ceffa… |
| S1.SAV / LP1.SAV | 92023f2b51e3… / 76cf91a104ec… |

Gold per member = thousands 0x154e[c] (save 478+2c) + units 0x3770[c] (save 3993+2c), units 0..999. **Bestätigt (known) 2026-11-03 durch Hoths Spielaktion (HOTH_FIXTURES_ISHAR1_SAVEMAP.md SM06–SM08); Gesamt = Tausender·1000 + Rest.** Items: 0x1568[c][k] words (save 498+26c+2k).

## Shops
### S1. Entry (MAIN building dispatch) — known
- Table 0x3fd6 (x, y, zone → shop #): (17,52,1)#0, (31,16,1)#1, (38,50,1)#2, (24,71,13)#3, (25,80,13)#4, (35,72,13)#5, (19,6,4)#6, (29,69,14)#7, (36,75,14)#8. MAIN passes the number in entity byte dirb 0x0c; MARCHAND switch 0x008b0.
### S2. Inventories (item, price k, price u, [qty]) — known
qty defaults to 1; −57 → 5, −58 → 20 where listed.
- s0: (−57,0,320,5) (−50,0,900) (−25,1,800) (−35,1,200) (−60,0,500) (−62,0,300)
- *(Savewerte → `private/shop-tavern-contract-ishar1-savewerte.md`, SW-4)*
- s2: (−58,0,300,20) (−55,2,500) (−36,1,800) (−64,0,800) (−45,3,200)
- s3: (−57,0,400,5) (−60,0,600) (−62,0,400) (−63,0,800) (−64,0,950) (−66,1,500)
- s4: (−40,2,500) (−41,4,900) (−45,3,800) (−44,4,200) (−47,6,0) (−58,0,650,20) (−48,1,600) (−49,7,500) (−54,1,300)
- s5: (−25,2,0) (−26,3,700) (−28,8,0) (−55,2,800) (−35,1,500) (−38,2,600)
- s6: (−56,5,0) (−26,7,0) (−48,1,800) (−58,0,700,20) (−54,1,250) (−66,1,300) (−41,5,100)
- s7: (−57,0,410,5) (−60,0,680) (−62,0,500) (−63,0,900) (−64,0,990)
- s8: (−27,19,990) (−53,8,500) (−42,9,500) (−58,0,650,20) (−47,6,500) (−51,2,500) (−37,7,500)
- Same item is priced per shop (e.g. −57: 320/380/400/410). Item names: not mapped here (**unknown** in this contract; see item tables).
### S3. Screen and input — known (coordinates suspected for the 1-px flip)
- First prompt OK/EXIT (message −40 "buy?", −41 "choose"). Grid slot i: x = 148+36·(i mod 3), script y block 164−42·(i div 3); click → (x−148)/36 (+3/+6 by y). Exit (288,112) → message −42, 0x7b = 1. Right click or x > 287 switches view.
### S4. Buy flow — known
1. Click item → 0x1506 = item code (0x00496).
2. Click portrait → c = x/64, class 0x1664[c] ≠ −1 required.
3. Refusal (message −21, nothing changes) if pk > gold_k[c] or (pk = gold_k[c] and pu > gold_u[c]). **Only the chosen member's gold counts.**
4. L_006bf: stackable items −66..−57 are merged into an existing stack in slots 0..10, else first free slot 0..8. Bag full → message −43, no charge, item kept by shop.
5. Payment L_0062f: units − pu with borrow from thousands; stored to 0x154e/0x3770.
6. Stack: counter 0x3e22[c][item+66] (save **4971+10c+(item+66)**) += qty; caps −57 → 5, −58 → 20, other stackables → 10.
- **No selling** in Ishar 1 (no sell path in MARCHAND). known
- Shop stock is unlimited (table rebuilt on every entry, not saved). known
### S5. Save — known
Gold 478+2c / 3993+2c, items 498+26c+2k, stack counters 4971+10c+j. Shop tables not saved.

## Taverns (ITAVERNE.IO)
### V1. Entry — known
- MAIN table 0x3f94 (x, y, zone → tavern #), 13 rows: (18,56,1)#0 (29,16,1)#1 (33,18,1)#2 (39,55,1)#3 (22,76,13)#4 (24,70,13)#5 (32,77,13)#6 (35,73,13)#7 (44,75,13)#8 (22,10,4)#9 row10 empty (11 unused) (35,77,14)#11 (38,79,14)#12. # → 0x425c → entity byte +0x0c = t.
- MAIN loads **itaverne.IO if 0x4232 ≠ 0**, else taverne.IO. 0x4232 = 1/2/3 from `model mod 10` (<2 / <4 / =4, MAIN 0x00444, only if model < 3000) — a machine/version flag, not the language. **known** (code), meaning **suspected**. taverne.IO itself was not analysed (**unknown**; this contract covers itaverne.IO).
- If the player stands on no table cell, 0x425c keeps the previous value. **suspected**
### V2. Menu dispatch (dirb 0x18) — code known, labels suspected
| dirb18 | code | effect |
|---|---|---|
| −1 | L_00b91 | leave (0x7b = 1) |
| 1 | 0x0013e | message 100+t (rumour/talk text) |
| 2 | L_00168 | **eat** (food) |
| 3 | L_00168 | **sleep** |
| 4 | L_008bb | **hire** list |
How the menu click maps to 0x18 is in another entity: **unknown**. Inside L_00168 a second prompt draws OK (268,·) / EXIT (292,·); OK = script y 62..72, x 257..287; EXIT x > 287 or y 74..101, x 277..299. **known** (script coords)
### V3. Price and payment — known
- **Price P (gold units): eat 500 + 40·t, sleep 900 + 80·t** (whole party, one price). Split into k/u (P > 1000 → 1 k + P−1000).
- Affordability: **sum of all members' gold** (members = class ≠ −1, including dead) ≥ P, else message −21 and return.
- Payment: n = member count; share = ⌊P/n⌋ (L_00b6e). Pass 1: every member pays share if possible, else pays all it has (→ 0); running remainder R = P − paid. Pass 2: members 0..4 pay the remainder (first one who can pays the rest, others give everything). Net: total gold −P exactly. Messages −20 (eat) / −24 (sleep).
### V4. Effects (only members with HP 0x1542 > 0) — known
- **Eat:** food 0x16bc (save 773+c): > 60 → 100, else +40 (cap 100). No HP/MENTAL change. No leave event.
- **Sleep:** food +15 (cap 100); MENTAL 0x16b4 (768+c): > 50 → 100 else +50 (cap 100); **HP += ⌊(maxHP 0x155a − HP)/5⌋** (save 468+2c, max 488+2c). Animation cputnat 26/27 + entity 0x42. No time advance read in ITAVERNE (**unknown** whether MAIN advances a clock).
### V5. Leave/theft event after sleep — known
1. With probability 1/3 (`rnd(3) == 0`): first member whose npc id 0x3908[c] (save 4028+c) ∈ {21, 28, 15, 10} becomes leaver.
2. Otherwise (and if none found): first member i (npc ≠ −1) for whom **no** other member j (npc ≠ −1) has rel 0x377e[i][j] > −2 (save 4003+5i+j) becomes leaver.
3. If there is no other member, nothing happens. Else every other member j loses the **first item in slots 0..8 with −57 < code < −19** (set to 0); leaver: 0x1664 = 1 (sic), HP = 0, 0x3908 = −1, BUSTE refresh, message −29 with the npc id. The leaver keeps nothing; his gold is not cleared here. The `0x1664 = 1` write is known, its meaning **unknown**.
### V6. Hire list — known (FRISE side suspected)
- *(Savewerte → `private/shop-tavern-contract-ishar1-savewerte.md`, SW-5)*
- Click portrait grid: k = (x−1)/64, +4 if script y < 136 (y > 74, x < 257); x > 287 / y 62..72 = EXIT. Candidate sent to FRISE (type 4) as message 24; if FRISE sets 0x3ead = 1 (accepted), entry := −1. Loop repeats while an empty slot (class −1) exists.
- FRISE acceptance = party vote (see party contract P3). **suspected** (link message 24 → FRISE L_0133b not traced).

## Tests (Alderaan/Hoth)
Shared: load as in REFERENCES §13 (save A right after load: c2 byte 483 −1 = 1000 GS), act, save B, diff A→B.
### T1 (deterministic, **known** — SHOPA reproduced): S1, shop #1 dagger

*Ausgangszustand, Ablauf und konkrete Sollwerte: `private/shop-tavern-contract-ishar1-savewerte.md`, SW-6.*

Relative Erwartung: Gold des gewählten Mitglieds sinkt um Save-Kosten + Preis (Tausender/Einheiten getrennt, §Gold). Gegenstand landet im ersten freien Slot. Positionsbytes ändern sich durch das Laufen.

### T2 (deterministic, suspected): S1 shop #1 stack item −57 (0,380,5)

*Ausgangszustand, Ablauf und konkrete Sollwerte: `private/shop-tavern-contract-ishar1-savewerte.md`, SW-7.*

Relative Erwartung: Einheiten des Mitglieds sinken um den Preis; Stapelzähler 4971+10c+(item+66) steigt um qty (Deckel laut S-Regel).

### T3 (deterministic, suspected): refusal
*(Savewerte → `private/shop-tavern-contract-ishar1-savewerte.md`, SW-8)*
### T4 (deterministic once inside, suspected): tavern sleep with LP1 at tavern t

*Ausgangszustand, Ablauf und konkrete Sollwerte: `private/shop-tavern-contract-ishar1-savewerte.md`, SW-9.*

Relative Erwartung: Gold −(900+80t). Futter +15 (Deckel 100). MENTAL > 50 → 100, sonst +50. HP += ⌊(maxHP − HP)/5⌋.

### T5 (deterministic once inside, suspected): tavern eat with LP1

*Ausgangszustand, Ablauf und konkrete Sollwerte: `private/shop-tavern-contract-ishar1-savewerte.md`, SW-10.*

Relative Erwartung: Gold −(500+40t). Futter > 60 → 100, sonst +40 (Deckel 100). Sonst nichts.

## Nachtrag 2026-11-03 15:45 (Europe/Berlin): Speichergebühr 1000 Gold
Quelle: SOS.IO (Sprachvarianten SOSD/SOSE/SOSI gleich aufgebaut), Speicherdialog L_00752 → L_008cb → MAIN Nachricht 30 → L_0480e (Schreiben). (Code known, 1000-Gold-Effekt von Hoth bestätigt)
- **Gebühr:** `0x3f12` = 1 (Tausender), `0x3f10` = 0 (Rest), gesetzt in L_00b5e. Anzeige „TARIF POUR SAUVEGARDER : 1000 PO“, OK/EXIT.
- **Prüfung (L_00b5e):** Für die belegten Slots c = 0..4 (`0x1664[c] ≠ −1`) werden Tausender und Rest summiert und normalisiert. Die Zahl n der Figuren steht in `dirb 0x1b`. Sind die Tausender der Gruppe < 1, erscheint Meldung −21. Dann wird abgebrochen: kein Abzug, kein Save.
- **Verteilung (L_00cf8):**
  - Anteil pro Figur: K_s = 1 div n und R_s = (1000·(1 mod n)) div n. Bei n = 5 sind das 200, bei n = 4 sind es 250, bei n = 3 sind es 333.
  - Durchgang 1, Slots 0..4 aufsteigend: Jede Figur zahlt ihren Anteil per L_00ea6, mit derselben Borg-Logik wie im Shop (MARCHAND L_0062f). Reicht ihr Gold nicht, gibt sie alles ab und wird auf 0 gesetzt. Die Restgebühr (`0x3f12/0x3f10`) sinkt jeweils um den gezahlten Betrag.
  - Durchgang 2, Slots 0..4 aufsteigend: Die erste Figur, die die ganze Restgebühr tragen kann, zahlt sie, dann endet die Routine. Andere Figuren zahlen alles und werden auf 0 gesetzt, danach geht es weiter.
  - Beispiel: 200/800 entsteht bei n = 5, wenn eine Figur in Durchgang 1 nur ihren Anteil zahlt und eine andere in Durchgang 2 den Rest. (suspected, passt zu Hoths Beobachtung)
- **Reihenfolge:** Erst wird abgezogen (L_00cf8), dann wird gespeichert (csend 30). Der Save enthält den Stand **nach** der Gebühr. (known)
- **Testfall G1:** Ein Save mit gültigem Gold (Rest 0..999) wird im Spiel gespeichert. Erwartet: Die Summe Σ(K·1000+R) über die belegten Slots sinkt um genau 1000, alle R bleiben in 0..999, und die neue Save-Datei zeigt schon den reduzierten Stand. **G2:** Gruppensumme < 1000 → Meldung −21, Save-Datei unverändert.
