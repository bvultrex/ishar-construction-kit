# TABLEAU.IO: developer map/enemy editor (Ishar 2), static analysis

Base commit: bvultrex/ishar-construction-kit workbench/playable-slice bb42748 (read-only clone). Static only, no emulator runs.
Hashes (SHA-256): Ishar 2 TABLEAU.IO c25bfe28d79869f2b2a347b92d4a307786cf9d521c6b5d8292e924a20ddd85fa; MAIN.IO bfab5e91…8cf8db95; EN1.FIC b3710e9a1af7d8016b794d9b4aec8c9f3f472b7a5ce4003426da135cdbf6f2d4; start.exe 5e35e58d…adf9. Ishar 1 MAIN.IO 27c5834d…06c5.
Sources: ALIS listings decompile/alis/listings/ishar{1,2}/*.asm, unpacked start.exe segment 1000 (capstone). No original bytes in this file.

## 1. Activation (omodel)
- omodel (opcode 0x78) → start.exe 1000:6df8 → 1000:0f49: returns 2000 + {adapter ss:[0x2894]: 2→0, 7→1, 3→2, 5→4} (`add ax,0x7d0` at 1000:0f78). DOS omodel is always 2000..2004. **proven** (Ishar 1 start.exe has the identical routine at the same offset; files differ otherwise.)
- maestun's name for omodel < 1000 is "author mode". No real DOS machine reaches it. **proven** (DOS)
- MAIN.IO (Ishar 2) gates:
  - 0x003ff–0x0069b: platform chain <2000/<3000/<4000/<6000/<7000 sets 0x4fcc, 0x51a1, 0x51a2 and others.
  - 0x006a4: omodel ≥ 1000 and 0x5198 == 0 → cswitching.
  - 0x00ac7: 0x4ef3 ∈ {1,2} OR omodel < 1000 → debug prompts POSITION X/Y (0x2ab4/0x2ab5), NUMERO DE CONTREE (0x2d18), ZONE (0x4ef2), CODE (0x4ef3).
  - 0x00bcb: omodel < 1000 → "EDITER TABLEAU ?". Keys 'o'/'O' → clive 3, cload 'tableau.IO', cdefmouse 0, clive. Any other key continues the game.
  - Further omodel < 1000 debug keys: EATT 0x01308 (key 'p'), GESORT 0x014e0 (key 'b'). **proven**
- Reference-run options (none tested):
  - (a) Memory patch of the immediate at 1000:0f79 (d0 07 → e.g. 00 00) before the MAIN init. Side effects: the platform chain at 0x003ff takes the <2000 (non-PC) branch, and the debug prompts plus p/b keys become active. Risky for faithful rendering, but enough to see the editor.
  - (b) Better: a patched copy of MAIN.IO in a private test install where only the compare at 0x00bcb is inverted or forced. Fewer side effects. This needs the A1 writer (A1_WRITER.md) and must never touch originals.
  - (c) A save with 0x4ef3 = 1/2 reaches only the POSITION prompts, never the editor. A save alone cannot open the editor. **proven** (static)

## 2. Controls and display (Ishar 2 TABLEAU.IO)
- Start prompt "<I>LE OU <E>NNEMI ?". I → map editor: dirb35 = 1, dims 0x2d19 = 90 × 0x49d2 = 60, sends message 12 to MAIN (load the current CONT map). E → enemy editor L_015bc.
- Map screen (loop 0x000e1, draw L_00c97):
  - Text grid of 12 cells (first index, X) × 21 cells (second index, Y) from view origin dirw12/dirw14. Cell text x = i·3+3, y = j+2.
  - Headers show the index numbers. Ink by value:
    | Value | Ink |
    |---|---|
    | −9, −8 | 2 |
    | 1..6 | 5 |
    | 7..10 | 6 |
    | 11, 12 | 3 |
    | 13..20 | 7 |
    | 30..33 | 8 |
    | other | 4 |
    | 0 | blank |
  - Status line "-B-T-D-E-I-C-N-M-F-X-W-S- E:" with the layer flag. Bottom line shows X:/Y: (absolute cell).
- Mouse → cell (L_01407): col = (mx−24)/24 clamped 0..11; row = (my−16)/8 clamped 0..20; then clamped to the map size.
  - Left click applies mode dirb27:
    | dirb27 | Effect |
    |---|---|
    | 1/2 | block |
    | 3 | random value in [dirb28, dirb29] |
    | 4 | trame value dirb2c |
    | 5 | typed value |
    | 6 | increment between start/end, wraps |
  - Right click writes dirb60.
- Keys (L_01fc0 → dirw10):
  | Key | Function |
  |---|---|
  | B | block fill: random range or trame, two-click rectangle, "REMPLISSAGE" (random fill avoids repeats) |
  | T | line/TRAIT, random or trame |
  | D | ACCES DIRECT: click, then type a value |
  | E | erase one value across the whole layer (sets it to 0) |
  | I | increment painting |
  | C | replace X→Y in the whole table (T) or the screen (E) |
  | N | toggle layer A/B (dirb39) |
  | M | right-button value |
  | X | copy a rectangle to buffer 0x68 |
  | W | paste the buffer |
  | S | save (message 10) |
  | F | quit with optional SAUVER → message 10, then csleep |
  | arrows | scroll 1; 5 with Ctrl; 12/21 pages |
  | O, A | no-op |
  **proven** (static)
- Enemy editor: one actor id dirb38 at a time. Menu "<N> <-> <+> <A> <F>": number, previous/next (0..0x4a81−1), random fill, quit/save → message 16. Field labels and addresses:
  | Label | Address |
  |---|---|
  | NOM | 0x2fc4 |
  | RACE | 0x3d2e (1 HUMAIN, 2 ELFE, 3 NAIN, 4 ORC) |
  | CLASSE | 0x3cbe (0 PALADIN, 1 GUERRIER, 2 RANGER, 3 BARBARE, 4 VOLEUR, 5 CLERC, 6 MAGICIEN, 7 ARCHER, 8 ESPION, 9 PRETRE, 10 MERCENAIRE, 11 MANDIANT, 12 ASSASSIN, 13 PRETRESSE, 14 HOMME INSECT, 15 HYPNOTISEUR, 16 SORCIERE, 17 DARK KNIGHT, 18 MOINE OCCULTE) |
  | NIVEAU | 0x3d9e |
  | VITALITE | 0x36ac |
  | FORCE | 0x3e0e |
  | CONSTIT | 0x3e7e |
  | SAGESSE | 0x3eee |
  | INTELL. | 0x3f5e |
  | AGILITE | 0x41fc |
  | G/EVIL | 0x3fce |
  | POSX/POSY | 0x3412/0x34f0 |
  | OBJET1-3 | 0x4040 |
  | ARGENT M/C | 0x378a/0x3868 (gold thousands/remainder) |
  | RELATION | 0x43ba |
  | SORT1-3 | 0x426e |
  | CONTREE | 0x449a |
  | ARMURE | 0x418c |
  | INVISIBLE | 0x45e8 |
  | ENROLE | 0x4f4c |
  **proven** (labels)

## 3. What it writes
- Map: signed bytes into MAIN 0x0080 (layer A, dirb39 = 0) or 0x159c (layer B, dirb39 = 1), index [X 0..89][Y 0..59]. Byte offset = X·60 + Y. This matches the kit's FORMATS.md / cont-grid.ts (offset r·cols+c, rows = 90 = editor X, cols = 60 = editor Y, signed cellA/B). Ink classes are developer groupings, not semantics: −9/−8, 1–6, 7–10, 11–12, 13–20, 30–33. The editor imposes no value range (typed input, any byte). Map these classes onto the GRID_MODEL codes: open.
- Write-back to CONTn.FIC: MAIN message 10 (0x00368): 0x51b8 = map 0x2d18; L_03ca2/03cdc picks CONT1..7.FIC (→0x49d4); cfopen mode 770; cfwriteb 0x0080 len 0x1518; cfwriteb 0x159c len 0x1518; close. The whole file is written (10800 B, A then B, no header) to the CONT of the current map, only on S, or on F + "O". **proven**
- Enemies: message 16 (MAIN 0x003a0): 0x51b8 = 0x2d18, then L_03d78 opens EN1.FIC (always this name) mode 770 and writes the full actor tables in fixed order:
  | Address | Length |
  |---|---|
  | 0x3412 | 0xdc |
  | 0x34f0 | 0xdc |
  | 0x35ce | 0xdc |
  | 0x36ac | 0xdc |
  | 0x378a | 0xdc |
  | 0x3cbe | 0x6e |
  | 0x3d2e | 0x6e |
  | 0x3d9e | 0x6e |
  | 0x3e0e | 0x6e |
  | 0x3e7e | 0x6e |
  | 0x3eee | 0x6e |
  | 0x3f5e | 0x6e |
  | 0x41fc | 0x6e |
  | 0x3fce | 0x6e |
  | 0x4040 | 0x14a |
  | 0x418c | 0x6e |
  | 0x3946 | 0xdc |
  | 0x3b02 | 0xdc |
  | 0x3be0 | 0xdc |
  | 0x3a24 | 0xdc |
  | 0x426e | 0x14a |
  | 0x3868 | 0xdc |
  | 0x43ba | 0x6e |
  | 0x2fc4 | 0x44c |
  | 0x449a | 0x6e |
  | 0x450a | 0xdc |
  | 0x45e8 | 0xdc |
  | 0x46c6 | 0xdc |
  | 0x4f4c | 0x6e |
  The 0x6e tables are 110 actors × 1 byte; the 0xdc tables are 110 × word. This gives an EN1.FIC layout for the kit (sum = 6050 B = the size of the local EN1.FIC: proven). **proven** (write order); the reader (0x03e20) is presumably symmetric (hypothesis).

## 4. Ishar 1
- MAIN.IO 0x00a67: the same "EDITER TABLEAU ?" gate (omodel < 1000), then cload 'tableau.IO'. **TABLEAU.IO is not in the local Ishar 1 install**, so the editor is unusable even with a patch. **proven**
- Ishar 1 has the same omodel routine in start.exe (always ≥ 2000). The same < 1000 debug keys exist in DPLT 0x00c91 (key 't') and GEREN 0x0150b (key 'p'). **proven**
- CONT write: message 10 (MAIN 0x0036e) → 0x4251 = 0x1508 (map), then L_0444e picks CONT1..13 via a switch on 0x4251 (0x044c1). It writes **one** 4860-byte (0x12fc) layer from 0x0080 when the map number is odd, or from 0x234a when it is even. This matches FORMATS.md (54 × 90, one layer). **proven**
- No other TABLEAU, EDITER or cfwriteb CONT paths; the other cfwriteb calls are save code (0x0480e+).

## 5. Relevance for the kit (more faithful wins)
- Mirror: byte cells, signed display; Ishar 2 has two layers with an A/B toggle; X = first index (90), Y = second (60); write the whole file as A then B with no header; file name chosen by map number 1–7 (Ishar 1: one layer, 1–13 with buffer parity); no partial writes; save only explicitly.
- The editor does no validation. The kit's validation is a kit addition and must be labelled as such.
- Optional editor-faithful tools: block/random fill, trame, line, replace in table or screen, erase value, copy/paste rectangle, right-button value. These are conveniences of the original developer tool and may be mirrored.
- Enemy data: EN1.FIC write order (above) is the original contract for an enemy editor; field names come from the TABLEAU labels.

## Limits / Next step
- Static only; nothing patched or run. The ink-class → terrain meaning is open; the EN1.FIC reader (0x03e20) has not been read in detail.
- Next step: Codex reference run with variant (b) in a private copy; compare the CONT1..7 bytes after S with the cont-grid export.
