# Original-Rastermodell (CONTn.FIC) – Stand 2026-10-10

Umsetzung von Plan v3 (`mauerfeld-plan-v3.md`). Code: `src/lib/ishar/cont-grid.ts`. Belege: `decompile/alis/CONT-FIC.md`, `decompile/register.md` (nicht im Repo).

| Thema | Umsetzung | Stufe |
|---|---|---|
| Format Ishar 2: 2 Layer à 90×60, signed, A @ r*60+c, B @ 5400+r*60+c | `importCont`/`exportCont`, Rohbytes base64 in `AuthoredLevel.grid` | known |
| Ishar 1: 1 Layer 54×90 | nur Import/Export, keine Darstellung | known / Darstellung unknown |
| 0xFF = Vollmauer | `isFullWall`, Kollision | known |
| Zerlegung Codes 22..77 → Boden + Element | `decomposeCode` | known |
| Elemente 1–8 = dünne Kanten (Türkanten) | `edgeSides` | known |
| Element → N/O/S/W | **eine Tabelle** `EDGE_ELEMENT_SIDE` (aus GERDEP 0x00f26–0x0108f + Vorwärtszug 0x00640–0x00709 abgeleitet; Achse durch Daten CONT5/6/7 gestützt: alle Kanten zeigen auf begehbare Nachbarn) | suspected (Vorzeichen N↔S / O↔W nur aus Code-Lesung) |
| Kante ohne Tür blockiert nicht (GERDEP prüft nur Türzustand) | `canStep` | known (Codepfad) |
| Tür = Layer B 61..109 (Nr.+60), Öffnungstabelle 0x4aa4 | Laufzeit-Tür je Nummer, PCAVE-Blatt nach Parität | known |
| Kanten-/Türprüfung nur Karten > 4 | `canStep`, `expandGridLevels` | known |
| Override 0x4ef3 | nicht modelliert | unknown |
| Fallen 0xF7 / 0xC0–0xC3, Schaden (rnd5+8)·(map−4) − Rüstung | `trapAt`, `trapDamage`, Playtest-Hook (jede Falle löst beim Betreten aus; Blickrichtungsabhängigkeit fehlt) | known / Auslöse-Seite unknown |
| Szenentrigger \|B\|−40 | `sceneTriggerAt` (nur Daten) | known; Vorrang Map 3 unknown |
| Szenenregionen 0x4ef2 | Datenfeld, Standard DJ1 | Werte unknown |
| Legacy-Level → Raster | nur als Kopie (`convertLevelToGrid`) | – |

Regeln: Projekte mit importiertem Raster enthalten Originaldaten – nicht veröffentlichen/committen. `*.FIC` ist in `.gitignore`. Lokaler Byte-Round-Trip: `ISHAR2_DIR=… npm run test:cont-local`.

## r7 – Original-treuer Renderer für Raster-Level (`src/lib/ishar/grid-view.ts`)

Raster-Level (`level.grid`) werden nicht mehr über die Kanten-Ansicht gezeichnet, sondern über eine
Neuimplementierung der DJ1/DJ2-Ansichtsskripte (keine Originalbytes im Repo). Kanten-Level nutzen
unverändert den alten Renderer.

- Blickschleife (DJ1 0x00064): Reihen Tiefe 4→0, seitlich −(d+1)..d+1, Zelle je Blickrichtung wie im Skript (known).
- Platzierung (DJ1 0x0223f / DJ2 0x01a09): z=(d+1)·99, y −42/−25/−12/−7/−4/−2/−1, x = lateral·192/92/60/44/34/28/24, Ressource = Basis + z/100 (known).
- Elementzerlegung (0x004b8) und Dispatcher (0x00b40 / DJ2 0x0090e): Element → Weltseite + Flächentyp in `ELEMENT_FACES`;
  14..21 sind A/B-verschränkt (14/15 N, 16/17 O, 18/19 S, 20/21 W) (known).
- Leaf-Routinen als Tabellen `SCRIPTS.DJ1/DJ2`: Wände #47/#55/#56 + #51/#57/#58, Front #59+d (gerade/ungerade A gespiegelt),
  Dünnkante 1–4: Seite #47/#55, Front bei d=0 Rahmen #108 + PCAVE-Tür (nur zu), sonst Front #59+d;
  5–8: Seite #67/#71, Front Bogen #63+d + PCAVE. DJ2: #35/#43/#44, #39/#45/#46, Front #47, Rahmen #117, Bogen #51, Seite #55 (known).
- Tür-Blatt: PCAVE an z+3, Tiefe = z/110 (PCAVE 0x0004d, known). Holz/Gitter nach Türnummer-Parität (suspected).
- Sortierung fern→nah nach z (stabil) (engine, suspected Tie-Break).
- Szene: Typ `main 0x4ef2` → Skript laut MAIN 0x01c96 (DJ1 31–34,37,39,42–44,52,58; DJ2 35,45–50; DJCAT 30,36,38,40,41,51,53) (known).
  Der Typ ist Zustand (gesetzt beim Betreten von B-Triggern, GERDEP 0x0162a) – Playtest führt ihn mit; ohne Historie gilt der nächste erreichbare Trigger (suspected).
- Orientierung: Facing 1 = Spalte−1; der CK zeigt Spalte c bei x = cols−1−c (Skript-Dispatcher + Statistik CONT1..7).
  **Benennung (r10, Kompass im Original):** 1 = N (Spalte−1), 2 = O (Zeile+1), 3 = S (Spalte+1), 4 = W (Zeile−1).
  Die CK-Richtungen (north = Zeile−1 …) sind eigene Kartenachsen: CK north = Original W, CK east = Original N.
  Kantenelemente: 1/5 = W, 2/6 = N, 3/7 = O, 4/8 = S (`EDGE_ELEMENT_COMPASS`).
- Nicht nachgebaut: DJCAT (Fallback DJ1), DJ1-Elemente 78/79, DJTRAP-Sprites, negative PCAVE-Varianten.

## r8 – Laufzeitfakten, DJCAT, 78/79, DJTRAP

- **Prüforakel:** `/workspace/ishar/tools/alis_interp.py` (nur Box, nicht im Repo) führt die Original-Listings DJ1/DJ2/DJCAT aus.
  Er stimmt mit Alderaans `cells_DJ1/DJ2.json` überein (2×1500 Stichproben, 0 Abweichungen).
  `grid-view.ts` stimmt mit dem Orakel auf CONT1/5/6/7 überein (DJ1/DJ2/DJCAT, Türen offen und geschlossen, Sprites und Spawns).
  Einzige Ausnahme: Kartenrand Spalte 0 (Skriptartefakt mit nicht initialisierter Position).
- **Laufzeit (render-runtime.md):** Ursprung (127,78) im 320×200-Frame = (127,65) im 256×113-Fenster; Clip x 0..255, y 13..125 als SVG-clipPath.
  Sortierung nach Tiefe. Gespiegelte Composites: Bit 15 toggelt, dx negiert (war schon so).
  PCAVE/DJTRAP werden je Szene mit der Szenenpalette gebacken: FDJ1 #2, FDJ2 #1, FDJCAT #0 (vermutet).
- **Hintergrund:** FDJ1/FDJ2 #3 bzw. FDJCAT #4+#5 als fernster Sprite (z 1500), #3 bei jedem zweiten Neuzeichnen gespiegelt.
- **Türtabelle 0x4aa4:** global nach Türnummer, kein Reset bei Kartenwechsel.
  Die Türen 5/9/17 schließen nach jedem Schritt (GERDEP 0x013f3).
  Das Türblatt hebt sich beim Öffnen 21 Frames lang um 4 px pro Frame.
- **PCAVE-Regeln** (pcave_doors.json):
  - eigene Kante bei d0: #40 (DJ1) bzw. #46 (DJ2)
  - fern: #8+d für gerade, #12+d für ungerade Nummern, d<4
  - Spezialtüren: 8/29 → #41+d (29 zusätzlich #50), 30 → zusätzlich #55+d
  - negative B: Basistabelle #24/#28/#32+d
  - Schalter: #37/#38 (DJ1) bzw. #47/#48 (DJ2) bei z-5
- **DJCAT:**
  - Split-Tabelle 0x004a9, Dispatcher 0x00760, nur Mittelspalte, Tiefe 0..3, eigene Tür #99+d
  - main 0x4fce wählt den Alternativsatz (Bedeutung unbekannt, Default 0)
- **DJ1 78/79:**
  - Hebel bzw. Waage #117/#114/#122
  - Die Puzzle-Schreibzugriffe von 79 auf Türen 24-27 sind nicht nachgebaut.
- **DJTRAP:**
  - Spawn in den Szenentypen 31,32,33,35,37,44,58,45,48,49,50
  - -9 = Fallblock (#4 bei d3); -61..-64 nur DJ1, Modus je Blickrichtung
  - Statische Frames: #11 / #11 gespiegelt / #17 bei d1, #13 bei d0

## r12 – Tür-/Schaltermechanik, Außen-/Stadtrenderer
- `door-mechanics.ts` (rein, tabellengetrieben nach `door_mechanics.json`; known): Schaltertabelle 0x4ad8, Nischen (Objekte 17–22 auf A 78/79, Schalter |B|−10), Tür 48 ⇔ Schalter 21–26 (Karten 5–7, jeder Schritt), Waage (Pfannen B −37..−39, 3/550 → Tür 24 auf, 25–27 zu, Schalter 27–29), Zeittür 28 (Stunde 1 auf / 4 zu), Druckplatten B −100..−119 (bekannt: 2→13 auf, 3→13 zu, 4→12 auf; Rest von 0x507c unbekannt → nur Ereignis), Hebel, Gegenstände −17/−21/−22, Zauber 18, Reset 5/9/17. Playtest: Schritt-Hooks + Nischen-Darstellung (#114/#117) über die Schaltertabelle; Nischen-/Waage-/Gegenstands-UI nur auf Datenebene.
- Türanimation 21 Frames × 4 px bei ~23,5 fps auch für Edge-Levels (über das Laufzeit-Grid).
- `outdoor-grid-view.ts` + `outdoor-tables.json` (`scripts/gen-outdoor-tables.py`): PLAINE1/ARBO/VHOUSE2/MONTAGNE als Basis je Karte, Overlays je Szenentyp aus `scenes.json` (u. a. VILLAGE1, FORET1, VARCHE, VARCADE, VILLE, VHOUSE1, VPONT, VDEC1–3, VPASSAGE (Schicht B) …). Tabellen der zusätzlichen V*-Skripte mit Alderaans `gen_generic.py` erzeugt (Ausgabe nur auf der Box). Party-Reihe (z < 99) wird übersprungen (suspected Generator-Artefakt; Referenzen belegen es). Importierte CONT-Karten 1–4 nutzen diesen Renderer statt der CK-Sumpf-Heuristik; alte CK-Presets ohne Grid unverändert.
- Nicht enthalten: NPC-/Kreaturen-Module (PEOPLE*, GUARD3, DRUIDE4 …) – Entities.
