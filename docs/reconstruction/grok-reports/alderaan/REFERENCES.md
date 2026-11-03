# Alderaan: reproducible original references (manifest, preparation stage)

Status: 2026-10-18 21:15, Europe/Berlin. **Ishar 2 hit-chance sample (§20, 240 swings, run 20:37–20:58 CEST): consistent with the contract formula for c0 and c1 overall; one sub-group flag (c1 vs guard 92).** **Ishar 2 has complete references for all four cases:** floor pickup (§8), NPC via tavern listen (§9), shop buy SHOPB (§10; SHOPA kept as a noted double buy), tavern meal MEALB (§11), enemy encounter ENCB (§12; blow-by-blow replay check of the combat contract in §12.8) and **item transfer between characters XFERA/XFERB (§18, run 20:31–20:34 CEST)**. **Ishar 1 has references for all four cases (run 19:31–19:38 CEST in `private/work/ishar1`):** NPC = trainer interaction NPCA (§13), item transfer ITEMA (§14), shop buy SHOPA (§15) and encounter ENCA (§16, unpatched), **plus floor drop/pickup FLRA/FLRB (§17, run 20:28–20:29 CEST)**. Selling does not exist in either original (known, §10 / §15). Open gaps: Ishar 1 tavern NPC (not reachable from S1); Ishar 2 row 1b MARIN: not reachable from LP3 (verified, §19.5); the interaction is known only from the script (no handler); Ishar 2 floor drop of negative items is impossible by code (§18.6). Images and saves live only under `private/`, and nothing here is in git. **Save-value rule (2026-11-03):** concrete values from saves (HP, gold, XP, MENTAL/MP, food, stats, party/actor positions, save hashes > 12 chars, character/NPC names) live in `private/REFERENCES-savewerte.md` under anchors `SW-<section>-<letter>` / `SW-N-<n>` (names); this file keeps offsets, formulas, transitions and verdicts.

## 1. Base commit and game profile
- Handoff: `docs/reconstruction/GROK_COLLABORATION_HANDOFF_2026-10-18.md`, blob in commit `bb427487ecce407124b5d98df50a8ca9627cbd60`, verified code state `319819c83d8dfe30675bba3ad8a51b43c3afc871`. Read through the GitHub connector; the local repo does not have this commit and was not changed.
- Working copies (byte-identical to `/workspace/ishar/originals`, checked with `diff -rq`): `private/work/ishar1`, `private/work/ishar2`. Full hash lists: `private/sha256_ishar1.txt`, `private/sha256_ishar2.txt`.

| Game | start.exe SHA-256 | MAIN.IO SHA-256 | START.STP |
|---|---|---|---|
| Ishar 1 | `3ea63234c97b` | `27c5834de005` | d4eb29e4… (same in both games) |
| Ishar 2 | `5e35e58d2d13` | `bfab5e917593` | d4eb29e4… |

- Edition and language are not determined (as in the handoff). On start, Ishar 2 asks "1 English / 2 Français / 3 Deutsch". **Always press 3 (Deutsch)**, as in the earlier runs (alis_shots BOOT: Keypad_3).
- Emulator: DOSBox-X 2025.02.01 SDL2 (Debian package; same version as the K75/K81 runs). Configs: `private/dosbox-ishar1.conf`, `private/dosbox-ishar2.conf` (autolock=false, scaler=none, aspect=false, cycles=fixed 25000 since the 16:30 lag fix (was max 80 %), nosound). Launch: `private/run.sh ishar1|ishar2`. A smoke test on Xvfb :98 reached the Silmarils logo (Ishar 1) and the language menu (Ishar 2).

## 2. Question
Original references for: (1) reach an NPC and interact, (2) pick up/drop an item and transfer it between inventories, (3) shop: enter/buy/sell, (4) enemy encounter. One reference each for Ishar 1 and Ishar 2.

## 3. Reproducible input (operator guide)
**Launch:** `/workspace/ishar/codex-support/alderaan/private/run.sh ishar2` (or `ishar1`). Use your own DOSBox-X instance. Do not use or close any running `dosbox-x-input.conf` instance belonging to someone else.

**Ishar 2 startup:** press 3 for Deutsch, then Space repeatedly to skip the intro (about 10×, then 6× with about 3.5 s pauses), then Keypad 2, until the game screen appears (alis_shots.py BOOT, K81).

**Ishar 1 startup (timing-dependent):** Silmarils logo (about 15 s) → Space until the language box „1 – ENGLISH / 2 – FRANCAIS / 3 – DEUTSCH / 4 – ITALIANO“ appears → **Keypad 3** (the top-row 3 was ignored) → game screen. The number of Space presses depends on timing: 2 in the probe, 3 in the reference run (the title appeared late). Watch the screen rather than counting presses. Load: disk (309,56) → „SPIEL LADEN“ (160,155) → name (digits on the numpad) → Return. Save: disk (309,56) → „SPIEL SICHERN“ (160,146) → „SICHERN DES SPIELS KOSTET : 1000 GS“ → OK (272,157) → name → Return. Full Ishar 1 UI table: `private/cases_ishar1_plan.md` §4.

**Input (K75/K81, register):**
- autolock=false, absolute mouse clicks.
- Game coordinates are 320×200. Window click = window origin + (90 + gx, 67 + gy), as in `dosbox/orig_var.sh`. That offset was measured with DOSBox-X on Xvfb. **Recalibrate it once** on your display by clicking a known icon.
- Keyboard (both manuals): numpad moves the pointer, Shift = left button, Alt = right button, F1–F5 = action icons, F6–F10 = attack icons, Ctrl+1..6 = movement panel (mapping suspected), Ctrl+9 = disk/save menu, Ctrl+7 = tactics.

**Ishar 2 click points (known from K81, game coordinates):**
- Disk icon (266,12)
- "Spiel laden" (load game) (232,26)
- Turn left (266,30)
- Forward (287,26)
- Turn right (308,30)
- Back (287,62)
- Door leaf / viewport centre (128,70)
- Viewport x 0–255, y 13–125

**Load a save:** (266,12) → wait 1.5 s → (232,26) → type the name without .SAV (digits on the numpad) → Return → wait about 7 s. The first load right after the game starts may report "File nicht gefunden" (file not found); if so, repeat once (K81).

**Facing (save word 6):**
- Ishar 2: 1 = N (col−1), 2 = O (row+1), 3 = S (col+1), 4 = W (row−1). "Turn left" goes 4→3 (decreases).
- Ishar 1: 1 = y−1, 2 = x+1, 3 = y+1, 4 = x−1. Turn left (move code 4): 1→4→3→2→1. Turn right: 1→2 (GERDEP 0x006e8/0x0080d).

**HUD (Ishar 2, from reference/raw/3_r17_c56_N_S10_K3A019_geladen.png, suspected until calibrated):**
- 5 portraits, x centres ≈ 32 / 96 / 160 / 224 / 288, y ≈ 140–185
- Names at y ≈ 193
- Action icon row at y ≈ 131

**Screenshots:** DOSBox-X menu "Capture → Capture raw screenshot" (320×200 indexed), or Ctrl+F5. Files go to `private/shots/<game>/`. Name them `<game>_<case>_<save>_<step>.png`.

**Save state:** save only under new letter names (references are saved results). Never overwrite an existing save. Record CONT hashes before each run and compare them after the run. The CONT writer MAIN 0x04462/0x04474 (L_0444e, message 10 to MAIN) exists, but it is **not on the save path**: saving is message 30 → MAIN L_0480e, which writes only the .SAV. In the probe (3 saves) and the reference run (4 saves), CONT1–6 stayed byte-identical (`shots/ishar1/cont_before.sha`; known for these paths). Not tested: zone changes and the tavern sleep path (suspected: also no writeback). **Every Ishar 1 save costs 1 000 gold** (SOSD 0x00b04/0x00b0a/0x00b7e; known). If the working copy has changed: recheck it with `sha256sum -c` and copy it again from `/workspace/ishar/originals`.

## 4. Data contract used to pick the cases (static analysis)
- **Ishar 2 save** (IO.IO 0x00ded):
  - Bytes 2–9 BE16 = row 0x2ab4, column 0x2ab5, facing 0x2ab6, map 0x2d18; bytes 18–19 = scene 0x4ef2.
  - Party 0x2fa2 = byte 1476 (5 bytes).
  - Inventory 0x2d8e = byte 1036 (150 bytes; slot layout suspected).
  - Actors x/y/facing/hp = bytes 2601/2821/3041/3261 (BE16 [110]); type = 4911, scene = 6781.
  - Floor items: map = 0x2c4e (byte 736), x = 0x2aba (336), y = 0x2b84 (536), indexed by item ID (SOURIS 0x009ce–0x009e5 writes them when an item is dropped; AFFOBJ 0x0007d draws them).
- **Ishar 2 shop/tavern:**
  - Moving forward onto A = −5 sends message 17 with B (GERDEP 0x00e74).
  - MAIN 0x0326a: |B| in 17..39 → `marchand.IO`, shop number |B|−17.
  - |B| in 1..15 → `taverne.IO` (MAIN 0x03229, suspected range).
- **Ishar 2 actors:** EAFF (see `decompile/alis/render-tables/actors_placement.json`). An actor is visible when it is 0..5 cells ahead, |lateral| ≤ distance, and its facing equals the party facing.
- **Ishar 1 save** (MAIN 0x0480e, 5216 bytes):
  - Bytes 2–9 BE16 = x 0x137c, y 0x137d, facing 0x137e, zone 0x1508.
  - Door state 0x3b64 = byte 4613 (50 bytes, suspected). XP 0x1536 = 458+2c, HP 0x1542 = 468+2c, gold thousands 0x154e = 478+2c, gold units 0x3770 = 3993+2c, inventory 0x1568 = 498+2·(13c+s) (slots 0–8 backpack) (all known from §13–16). Max HP 0x155a = 488+2c (suspected). Full field list: `private/ishar1-save-layout-derived.json`.
  - Actors x/y/hp = 0x1978/0x1a06/0x1b22 = bytes 1448/1588/1728 (BE16 [70]); zone 0x3910 = byte 4033 (x/y/hp known from §16); group/type 0x22f2 = byte 3688 (suspected).
- **Ishar 1 buildings:**
  - Moving forward onto certain negative A values sends message 17 with a parameter:
    - −19/−40 with current cell 37/57 → 1 (tavern)
    - −16/−41 with current cell 36/57 → 2 (shop)
    - −10/−43 with current cell 35/57 → 3 (training, "stage")
    - other values → 4 (house)
    - Source: GERDEP 0x00d44–0x0100a.
  - MAIN 0x0381c: shop = table 0x3fd6 (x, y, zone, shop number), filled by PARAM.IO 0x02449 ff.
    - Zone 1 shops: (17,52) #0, (31,16) #1, (38,50) #2
    - Training: (31,18), (35,53), (14,56)

## 5. Per-case plan (Result = pending)

| # | Game | Case | Start save (SHA-256, first 16 chars) | Map/zone, position, facing | Target (evidence) | Planned input | Expected (hypothesis) | Result |
|---|---|---|---|---|---|---|---|---|
| 1 | Ishar 2 | NPC | S.SAV (`49c2bb82ca24…` (full: private SW-5-t)) | Map 3 Zach, scene 10, (see private SW-5-a) | Red messenger PEOPLE1 (actor 94, type 64) (see private SW-5-b). Same figure as K3N000–003 (K86) | Load S → turn left (266,30) once → facing O → figure 1 cell ahead → click the figure (≈128,80) → then try the action icons (F1–F5) for talk | Figure visible (sprite #8+d per EAFF). Interaction response **open**: PEOPLE1 0x00038 reacts to message 40 only in scene 3 | **messenger: not possible** (actor 94 has 0x4f4c = 0, known). **Replaced by the tavern reference, done 18:21 CEST, see §9** |
| 1m | Ishar 2 | Tavern meal (NPC service) | S.SAV (`49c2bb82ca24…` (full: private SW-5-u)) | as row 1 | Tavern t = 2 at (17,55), button 2 "Essen" | turn left 2× → forward → Essen → ok → close message → exit | −580 gold, food 100 | **done: MEALB (18:44–18:45 CEST), §11.** MEALA (no ok) kept as the negative case |
| 1b | Ishar 2 | NPC (alternative) | LP3.SAV (`e82bcf3e2830…` (full: private SW-5-v)) | Map 3, scene 23, (see private SW-5-c). Verified: the views match CONT3 around this cell exactly | Sailor MARIN (actor 55, type 12, (see private SW-5-d)scene 23) (see private SW-5-e), 3 cells toward compass W, behind the tavern cell r4 c55 | All four directions tried (20:34, 21:01, 21:10): N and S blocked (A = −1), W = tavern menu (no step), E = map exit (B = −125 → (see private SW-5-f), MARA) | **Known (script):** MARIN.IO has no click or message-40 handler, so no dialogue. **Verified:** he cannot be reached or seen from LP3 (the start cell is a closed pocket). **Unknown:** his in-game appearance; no known save is on his pier | **not reachable from LP3, closed as "script-only" (§19.5).** No boat-trigger cell in scene 23 |
| 1 | Ishar 1 | NPC (trainer "stage"; tavern as fallback) | S1.SAV (`92023f2b51e3…` (full: private SW-5-w)) | Zone 1 (CONT1), (see private SW-5-g) | Training entrance A = −43 at (31,18) (table 0x4178 entry (31,18,zone 1,#10)) | Turn right 2× (4→1→2) → forward → (see private SW-5-h) → turn right 1× (2→3) → forward → message 17 parameter 3 → stage.IO → select a character / training dialogue | Training screen (MAIN 0x038c6) | **done: NPCA (19:32–19:33 CEST), §13.** Trainer dialogue up to the price, EXIT without paying. The tavern fallback is not reachable from S1 (§6) |
| **2a (FIRST)** | Ishar 2 | Floor pickup → backpack / hand (Quesh contract `quesh/pickup-contract-ishar2.md`) | **PICK9.SAV**, a labelled toolkit patch of START.SAV (`c306cfc7c77d…` (full: private SW-5-x); source START `e685cd690257…` (full: private SW-5-y); 4 bytes: file 345/545/745/8048 = 12/12/1/2) | Map 1, (see private SW-5-i); object 9 on r12 c12 | Object 9 one cell ahead (sprite OBJET res 115) | Load PICK9 → click (128,113) → A: portrait 1 (32,170), or B: hands icon of char 0 then slot 10 (50,168) → save as a NEW name PICK9A/PICK9B | Pickup clears 345/545/745 (8048 stays 2); A: c0 slot 0 = 9 (file 1037); B: c0 slot 10 = 9 (file 1057); armour 0x2f0e unchanged (armour(9)=0); hit box x 116..141 / y 104..123 (hypothesis, to be bisected). Check: `private/pickup_diff.py`, plan `private/pickup_plan.md` | **done (A 16:50, B 17:06, edges 17:50, armour C2 R/T/U 18:05–18:08 CEST): all checklist bytes confirmed, armour rule confirmed, edges measured (y 1 px higher); open: slot-9 swap, pointer hotspot (§8)** |
| 2 | Ishar 2 | Item: transfer / drop / pick up | S.SAV | as row 1 | Character 4 (slot 3) carries items (inventory word values −51/−57/−59, slot layout suspected) | Click name 4 (≈224,193) → sheet → pick up an item → click portrait 1 (≈32,160) → transfer; then pick up the item again and click into the viewport floor (≈128,110) → lies on the floor → click it → back in the cursor → click a portrait | Item in the other inventory; floor drop writes 0x2c4e/0x2aba/0x2b84 (SOURIS 0x009ce) | **done (transfer): XFERA hand→hand and XFERB hand→backpack (20:31–20:34 CEST, base LEVELING), §18.** Floor drop: negative item codes cannot be dropped on the floor (known); positive-object floor pickup is §8 |
| 2 | Ishar 1 | Item | S1.SAV | as above | Inventory of the active character (manual p. 6/11: "click on item"; "drop" on the sheet destroys the item) | Sheet via the name → move an item to another face (transfer). To place it on the floor: click into the 3D view with the item (suspected) → pick it up again | Transfer known from the manual; floor drop in Ishar 1 **not confirmed in code** | **done (transfer only): ITEMA (19:33–19:34 CEST), §14.** Key c0 slot 7 → c3 slot 0. **Floor drop/pickup: done, FLRA/FLRB (20:28–20:29 CEST), §17** (SOURIS L_0076a / 0x00451, floor tables 0x1382/0x1404/0x1486) |
| 3 | Ishar 2 | Shop | S.SAV | Map 3, (see private SW-5-j) | Cell (17,57): A = −5, B = −18 → shop 1 (marchand.IO) | Load S → forward (287,26) → shop screen → "Buy", choose item, click character → "Sell" | marchand.IO with shop number 1 (MAIN 0x0326a) | **done: SHOPB (18:43–18:44 CEST) = one rope, −700, c0 slot 0 = −41, §10.** SHOPA (2 ropes) kept as a noted double buy. **Sell: does not exist in the original (known, MARCHAND has no gold-increase or slot-clear path, §10)** |
| 3 | Ishar 1 | Shop | S1.SAV | Zone 1, (see private SW-5-k) | Shop #1 at (31,16), table 0x3fd6 | Turn right 2× (4→1→2) → forward → (see private SW-5-l) → turn left 1× (2→1) → forward → message 17 parameter 2 → marchand.IO, shop #1 → buy/sell | Shop (MAIN 0x0381c, PARAM 0x02456 table) | **done: SHOPA (19:34–19:36 CEST), §15.** „WURFDOLCH (+1)“ 1 100 GS to c2 slot 3. **Sell: does not exist (known, §15)** |
| 4 | Ishar 2 | Enemy encounter | LEVELING.SAV (`dac7e0a405fa…` (full: private SW-5-z)) | Map 3, scene 21, (see private SW-5-m) | 5× GUARD3 (actors 90–94, (see private SW-5-n), facing 1 = directly ahead | Load → screenshot (guards visible at distance 1) → attack icon F6 (character 1) or click a guard | Guards visible (GUARD3 #13+d). Whether they are hostile is **suspected** (GUARD3 handler 21 = attack) | **done: ENCB (18:45–18:48 CEST), §12.** One forward step onto the guards' cell, 8 rounds F6/F7: actor 91 killed (see private SW-5-o), XP +3/+4/+3/+3/+3, HP c0 −51, c1 −35. Actual layout: 12 guards (actors 90–101), 3 per cell; attacks need the same cell. ENCA (no approach) kept as the negative case |
| 4 | Ishar 1 | Enemy encounter | LP1.SAV (`76cf91a104ec…` (full: private SW-5-aa)) or IMP1.SAV (`cc4405e2ff12…` (full: private SW-5-ab)) | LP1: zone 15 (CONT5 cave), (see private SW-5-p) | LP1: 6 actors (63–68, type −4, (see private SW-5-q). IMP1: 3 actors (see private SW-5-r) | Wait in place for up to 60 s, screenshot every 10 s; then move toward the group | Encounter **not guaranteed** statically: no direct path (CONT5 x22/23 y54 = −99) | **done: ENCA (19:36–19:38 CEST), §16, unpatched.** The group (see private SW-5-s); 8 rounds ATTACK c0/c1 killed all 6 (HP→0); party HP −11/−14. XP is capped, so the proof is monster HP + party HP. Seen twice (probe + run) |

## 6. Limits and next step
- Rows marked done were run in the original. Ishar 2 row 1b (MARIN) is still open: one attempt failed on a wrong position reading (§19).
- Facing and turn directions in Ishar 1 are known from GERDEP. From code reading, the edge codes in the S1 street (x28..33, y17: 54/57 alternating) leave only x30↔x31 reachable: 54 = wall on the x−1 side (blocks leaving toward x−1 and entering while moving x+1), 57 = wall on the y+1 side. The taverns at (29,16) and (33,18) are therefore not reachable from S1 by walking. Trainer and shop both work from x31. If the operator *can* walk further, the edge-group reading is wrong: report it (relevant for U20).
- Next step: an operator runs the table rows, saves shots and the final states under `private/`, and fills in the Result column with: success / different / not reproducible.

## 7. Code proposals
None. **Proposed save patches (not applied):**
- P1, Ishar 1 encounter: copy LP1.SAV and set the party position (bytes 2–7) to (see private SW-7-a). Reason: the encounter depends on monster movement (AI). Mark the result "patched". **Not applied and currently not needed:** ENCA (§16) reached the encounter unpatched; keep P1 only as a fallback if the approach fails twice.
- P2, Ishar 2 NPC with confirmed message 40: none needed; patch only if row 1/1b gives no interaction.

## 8. Case 2a record: Ishar 2 floor pickup (handoff 7-section format)

### 8.1 Base commit and game profile
- Handoff `bb42748`, code `319819c`, routine contract `codex-support/quesh/pickup-contract-ishar2.md` (R1–R7).
- Ishar 2 DOS, `start.exe` `5e35e58d2d13`.
- Script hashes as in the contract (AFFOBJ/OBJET/SOURIS/FRISE/IO).
- DOSBox-X 2025.02.01, `private/dosbox-ishar2.conf` (cycles fixed 25000, core normal, autolock=false, nosound), working copy `private/work/ishar2`. Language 3 (Deutsch).

### 8.2 Question
Original behaviour of ground pickup → cursor → drop (A: portrait/backpack; B: hand slot with hands panel open), including the armour field 0x2f0e and the exact click box.

### 8.3 Reproducible input
| item | value |
|---|---|
| Start save | **PICK9.SAV** `c306cfc7c77d…` (full: private SW-8.3-b). **Labelled toolkit patch** of START.SAV `e685cd690257…` (full: private SW-8.3-c): 4 bytes, file 345/545/745/8048 = 12/12/1/2 (object 9 on map 1 r12 c12), as in the contract |
| Position | map 1, (see private SW-8.3-a); object 9 one cell ahead |
| Calibration | game (0,0) = X-screen (730,468) on the operator display, 1:1 |
| Inputs, A | disk (266,12) → LOAD (238,32) → `p i c k KP_9` → Return → click (128,113) → click portrait 1 (32,170) → disk → SAVE (240,58) → `pick9a` → Return |
| Inputs, B | as A up to the pickup → hands icon of char 0 (40,131) → click (50,168) → SAVE → `pick9b` |
| After, A | PICK9A.SAV `4cca3b035c9f…` (full: private SW-8.3-d) |
| After, B | PICK9B.SAV `86acb5d64012…` (full: private SW-8.3-e) |
| Shots | `private/shots/ishar2/pick_01_loaded`, `pick_02b_held`, `pick_03A_dropped_b`, `pick_B01..B04` |

### 8.4 Data contract (save offsets, file = 8359 bytes)
| file offset | MAIN | meaning |
|---|---|---|
| 345 / 545 / 745 / 8048 | T2aba / T2b84 / T2c4e / T50c8 + 9 | object 9 row, col, map, facing |
| 1036 + 2·(15c+s) | T2d8e | inventory word, BE |
| 1336 + c | T2f0e | armour |

Tolerated noise in `private/pickup_diff.py`, classified from the scripts:
- **known:** clock, file 44–49 (hour, day, tick; MAIN 0x03faa).
- **known:** day phase, file 90–93 (0x519f / 0x51a0; MAIN 0x04018, 0x00e59).
- **known mechanism, RNG outcome:** wandering-monster re-roll of the current scene's actor slots ≥50. EDPLT 0x0039a respawns whenever 0x4ef2 ≠ 0x4f06, and 0x4f06 is not saved, so this happens after every load (L_00fc2 / L_006e5 / L_010c8).

### 8.5 Results per expectation
| # | expectation | A | B |
|---|---|---|---|
| 1 | object 9 drawn bottom centre after loading | confirmed | confirmed |
| 2 | click (128,113) picks it up; icon follows the mouse | confirmed | confirmed |
| 3 | 345/545/745 → 0, **8048 stays 2** | confirmed | confirmed |
| 4 | hit box x 116..141, y 104..123 | **x confirmed, y refuted by 1 px: measured y 103..122** (§8.5b) | – |
| 5/6 | portrait drop → first free backpack slot (c0 slot 0, 1037 0→9) | **confirmed** | – |
| 7 | backpack drop: armour 1336 unchanged | confirmed | – |
| 8 | hands icon (40,131) opens the panel | – | confirmed (icon at x≈33..50) |
| 9 | drop on slot 10 (50,168) → 1057 0→9 | – | **confirmed** |
| 10 | slot-9 swap path (FRISE 0x03012, slot 9 holds −104) | – | **open** (not tried) |
| 11 | hand drop adds armour(code); armour(9)=0 → 1336 unchanged | – | confirmed; add/subtract rule confirmed by variant C2 (§8.5c) |
| 16 | no other save change apart from the tolerated noise | confirmed (pickup_diff exit 0) | confirmed (exit 0) |
| 17 | CONTn.FIC unchanged; full `sha256sum -c` OK | confirmed | confirmed |

Nothing refuted, apart from the 1-px y offset of the hit box.

### 8.5b Hit-box edges (PICKN = letter-named copy of PICK9, no saving; hit = pixel diff of the sprite region; reset by clicking (128,40))
| edge | last hit | first miss | contract |
|---|---|---|---|
| left | x=116 | x=115 | 116 ✔ |
| right | x=141 | x=142 | 141 ✔ |
| top | y=103 | y=102 | 104 ✘ (−1) |
| bottom | y=122 | y=123 | 123 ✘ (−1) |

- Height 20 and width 26 match the form.
- The 1-px y shift is **open**. It could be a pointer hotspot offset or an off-by-one in the y flip (SOURIS 0x00223, 0x78 = 199 − y). The pointer tip was not verified in the captures.
- These are commanded game coordinates.

### 8.5c Variant C2 armour (item −25, armour(−25) = 4)
- **Start save:** PICKQ.SAV `78d3fbdb51aa…` (full: private SW-8.5c-a). It is a letter-named byte copy of Quesh's PICK25 (labelled toolkit patch of PICK9: c0 slot 10 = −25, 1336 = 4). A letter name was used because digits in the name field were unreliable.
- **Points used, all hit first time:**
  - c0 hands panel (40,131), c0 slot 10 (50,168)
  - c1 hands panel (104,131), c1 slot 10 (114,168)
  - portrait 1 (32,170)

| save | sha256 | inputs | bytes (vs base) | pickup_diff |
|---|---|---|---|---|
| PICKR | `f9ba3933b9c7…` (full: private SW-8.5c-b) | load pickq, (40,131), (50,168), (104,131), (114,168), save | vs PICKQ: 1056/57 FF E7→00 00, 1086/87 00 00→FF E7, **1336 4→0, 1337 0→4** | R exit 0 |
| PICKT | `9e9da280230a…` (full: private SW-8.5c-c) | from the PICKR state: (114,168), (50,168), save | vs PICKR: reverse, **1336 0→4, 1337 4→0**; vs PICKQ: noise only | T exit 0 |
| PICKU | `c60c95af775d…` (full: private SW-8.5c-d) | load pickq, (40,131), (50,168), (40,131) close, (32,170), save | vs PICKQ: 1036/37 →FF E7 (c0 backpack 0), 1056/57 →00 00, **1336 4→0**, 1337 unchanged | U exit 0 |
| PICKS | `3ebcb89594bf…` (full: private SW-8.5c-e) | pick + drop into the same slot | clock only | S exit 0 |

**Confirmed:**
- picking up from a hand subtracts armour (FRISE 0x02c9b);
- dropping into a hand adds it (0x02f92);
- dropping into the backpack does not add it (L_03bef);
- armour is a byte at file 1336 + c.

**Also confirmed:**
- a held negative item cannot be dropped on the floor (SOURIS 0x007b0 requires > 0);
- backpack slots inside an open hands panel ignore drops;
- the disk menu is blocked while an item is held (FRISE 0x00292).

### 8.6 Limits
- **Patched start:** PICK9 is a toolkit-made save; everything after loading is the original EXE.
- **Latency:** A/B ran at 15–60 s per input. The later runs (edges, C2) had no lag (< 2 s) with xdotool-only input.
- **Open:** the slot-9 swap path (FRISE 0x03012; its armour guard covers only −29..−26). The 1-px y hotspot offset. The armour of body slots 11–13.
- **Monster re-roll:** world-state bytes of the wandering monsters differ per run, because the RNG re-rolls them on load. A comparison must not expect them to be identical.

### 8.7 Code proposals
None applied. Kit side, `pickOriginalGround` / `receiveOriginalGround` could model 0x2d16/0x2fc0 and the R7 armour rule, as in the contract.

Save comparisons against the original need to ignore or re-seed the EDPLT re-roll. Alternatively, start comparisons only after the respawn that follows loading.

## 9. Case 1 record: Ishar 2 NPC via tavern "Lauschen" (handoff 7-section format)

### 9.1 Base commit and game profile
- Handoff `bb42748`, code `319819c` (as §1). Ishar 2 DOS, `start.exe` `5e35e58d2d13`, MAIN.IO `bfab5e917593…`.
- Scripts involved (SHA-256, byte-identical to `/workspace/ishar/originals`): TAVERNE.IO `ea315973f218`, TEXTIND.IO `b36ded430e7d`, GERDEP.IO `58d2c57ff3eb…`, CONT3.FIC `0340856a122e…`.
- DOSBox-X 2025.02.01, `private/dosbox-ishar2.conf` (cycles fixed 25000, nosound), language 3 (Deutsch), xdotool input only, own instance. Run 2026-10-18 18:19–18:23 CEST.

### 9.2 Question
Original reaction when the party talks to NPCs. The world NPCs near S.SAV cannot react (messenger actor 94 and LP3 sailor have 0x4f4c = 0, known, `private/cases_ishar2_plan.md`). The tavern menu is the guaranteed NPC dialogue.

### 9.3 Reproducible input
| item | value |
|---|---|
| Start save | S.SAV `49c2bb82ca24…` (full: private SW-9.3-b) (unpatched) |
| Map / position | map 3 (Zach's Island), scene 10, (see private SW-9.3-a) |
| Target | tavern cell (17,55): CONT3 A = −5, B = −3 → MAIN 0x03183: tavern index t = \|B\| − 1 = 2 (known) |
| Calibration | game (0,0) = X-screen (730,468), 1:1 |
| Inputs | disk (266,12) → LOAD (238,32) → `s` → Return → turn left (266,30) → turn left (266,30) (facing 3→2→1) → forward (287,26): the move is blocked and the tavern opens (GERDEP 0x00e74 message 17, MAIN 0x03229 `taverne.IO`) → click "Lauschen" (40,132) (bar y 127–137, button = x/80 + 1, TAVERNE 0x00093) |
| Closing | the text scroll stays until one mouse button or key is pressed and released (TEXTIND L_02331, known). That click is consumed; it does **not** act on the menu |
| Leave | exit stone (288,62) (TAVERNE 0x000df: x > 256, screen y < 126) |
| Captures (private) | `shots/ishar2/c/f3.png` (tavern menu), `c/talk3.png` `9b0c2dcb3829…` (18:21:52, text scroll) |

### 9.4 Data contract
- TAVERNE 0x00150: button 1 spawns TEXTIND (entity 0x35) with message 100 + t = **102**, then `csleep`. TEXTIND wakes the tavern after the closing click (0x00097). No variable is written (known).
- On leaving any building, MAIN 0x0346f–0x034a0 reverses the party facing (1↔3, 2↔4) (known). Here: entered with facing 1, back in the street with facing 3, so save byte 7 does not differ from S.SAV.

### 9.5 Result
- **Message text (TEXTIND L_01b72, known; matches the capture word for word):** „Unser neues Haus ist sehr angenehm. Das Gefängnis nebenan ist kein echtes Problem, außer nachts ... manchmal um 3 Uhr morgens hört man laute Schreie, aber sonst ...“
- It is shown as a 4-line scroll over the portraits, with button 1 "Lauschen" highlighted.
- State: talk changes nothing. The after-save MEALA.SAV (`5844578953c7…` (full: private SW-9.5-b); talk plus the failed meal attempt, §11.5) differs from S.SAV only in clock bytes 45/49 (hour 14→17, tick) and 28 bytes of the wandering-monster re-roll of actors 90–93 (EDPLT, §8.4; actor 93 newly placed in scene 10 (see private SW-9.5-a)). Party, gold, inventory, food bytes and position are unchanged. `case_diff.py … TALK` would exit 0. CONT1–7 are unchanged.

### 9.6 Limits
- This is the tavern "listen" dialogue (rumour text of tavern t = 2), not a world-actor conversation. A world NPC needs Act icon 1 on a recruitable actor (plan case 1B, LPD, still open).
- The text depends only on t. Other taverns give messages 100…110 (TEXTIND switch 0x000c6).

### 9.7 Code proposals
None.

## 10. Case 3 record: Ishar 2 shop buy (reference SHOPB; handoff 7-section format)

### 10.1 Base commit and game profile
- Handoff `bb42748`, code `319819c` (as §1). Ishar 2 DOS, `start.exe` `5e35e58d2d13`, MAIN.IO `bfab5e917593`.
- MARCHAND.IO `a5b84f95b8b5`, GERDEP.IO `58d2c57ff3eb`, CONT3.FIC `0340856a122e` (all byte-identical to the originals).
- DOSBox-X 2025.02.01, `private/dosbox-ishar2.conf`, language 3 (Deutsch), xdotool input only, own instance. Run 2026-10-18 18:43–18:44 CEST (log `private/run_cases_ishar2_redo.md`).

### 10.2 Question
Original behaviour of entering a shop and buying exactly one item (rope, 700 po), and whether selling exists.

### 10.3 Reproducible input
| item | value |
|---|---|
| Start save | S.SAV `49c2bb82ca24…` (full: private SW-10.3-b) (unpatched) |
| Map / position | map 3 (Zach's Island), scene 10, (see private SW-10.3-a) |
| Target | shop cell (17,57): CONT3 A = −5, B = −18 → shop #1 (MAIN 0x0326a, MARCHAND cswitch 0x00884 → L_008b0) (known) |
| Calibration | game (0,0) = X-screen (730,468), 1:1; click = move, 0.3 s, press 0.2 s, release |
| Inputs | disk (266,12) → LOAD (238,32) → `s` → Return → forward (287,26) → „Möchtet Ihr etwas kaufen?“ → ok (270,134) → grid + „Trefft Eure Wahl, meine Herren.“ → rope (238,104) **once** (status "Seil", pointer disappears) → portrait c0 (32,170) **once** (= the purchase; no visible change) → exit stone (288,62) → „Glückauf, bis wir uns wiedertreffen.“ → street → disk → SAVE (240,58) → `shopb` → Return |
| After | SHOPB.SAV `22b8f790befd…` (full: private SW-10.3-c) |
| Captures (private) | `shots/ishar2/c2/s2a…s7` |

### 10.4 Data contract (known, MARCHAND)
- Press and release on a grid item sets 0x2d16 = item code (0x00436) and hides the pointer (`cmousoff` 0x00435). Nothing is bought yet.
- Left click on an occupied portrait (screen y ≥ 139, character = x/64) with 0x2d16 ≠ 0: gold check (message −21 if short), first free backpack slot 0–8 (L_006dd; −43 „Das ist zuviel für den Rucksack.“ if full), gold subtraction with thousands borrow (L_00603), writes 0x2d8e slot (0x006ef) and gold (0x005b6/0x005c0).
- Rope: price 0 thousands + 700 units (0x00950/0x0095c).
- **Selling does not exist (known).** MARCHAND writes gold only at 0x005b6/0x005c0, and only with the result of L_00603 (`csub` 0x00614/0x00619/0x0065d; the single `cadd` 0x0062a is the borrow normalisation). It writes the inventory 0x2d8e only at 0x006ef, storing the bought code into an empty slot. No path adds gold or clears an inventory slot, and 0x2d16 is only loaded from the shop grid (0x00436). The opening question offers only buying.

### 10.5 Result
**Exact diff SHOPB vs S.SAV (40 bytes, complete):**
| file offset | before → after | meaning | class |
|---|---|---|---|
| 7 | 03 → 01 | facing 0x2ab6, 3 → 1: reversal on leaving the building (MAIN 0x0346f–0x034a0, 1↔3, 2↔4) | known |
| 45, 48/49 | 0E → 10, 01 FE → 00 96 | hour 0x4fc6 14 → 16, tick 0x4fca (clock) | known |
| 1007 | (see private SW-10.5-a) | known |
| 1026/27 | (see private SW-10.5-b) | known |
| 1036/37 | 00 00 → FF D7 | c0 backpack slot 0 = −41 (rope) | known |
| 31 bytes 3444–6874 | various | EDPLT re-roll of wandering actors 91–94 in scene 10 (HP 0x36ac, 0x3d9e/0x3e0e/0x3e7e/0x3eee/0x3f5e/0x41fc, attitude 0x43ba, scene 0x449a; actor 93 newly placed in scene 10) | known mechanism, RNG outcome |

- (see private SW-10.5-c) (−700). Other characters unchanged.
- `case_diff.py S.SAV SHOPB.SAV SHOP --char 0 --code -41 --price 700`: all checks OK, `tolerated: facing reversal (MAIN 0x0346f) offsets [7]: facing 3 -> 1`, no unexpected offsets, CONT1–7 unchanged, **exit 0**.
- **SHOPA (noted double buy, 18:23–18:25 CEST):** SHOPA.SAV `0c4a99a81df6…` (full: private SW-10.5-f). The operator did rope → portrait twice, so two complete purchases: (see private SW-10.5-d) (−1 400), slots 0 and 1 = −41, byte 7 3 → 1, clock 45/49. Exact 10-byte diff: 7 03→01, 45 0E→11, 49 FE→72, (see private SW-10.5-e), 1036/37 and 1038/39 00 00→FF D7. `case_diff` SHOP exits 1 (deviation: −1400, 2 slots), as it should.

### 10.6 Limits
- One item type (rope, non-stack) in shop #1. Stack items (bread −50, 0x4bd4 counts) are not covered (`case_diff` SHOPS, untested).
- No visual feedback while an item is "held" (pointer hidden, known); operators must count their portrait clicks.

### 10.7 Code proposals
None for the game. Tooling: `private/case_diff.py` now tolerates the building-exit facing reversal at offsets 6/7 for SHOP/SHOPS/MEAL/ROOM/TALK (applied 2026-10-18, backup `/tmp/case_diff.py.before`).

## 11. Ishar 2 tavern meal record (reference MEALB; handoff 7-section format)

### 11.1 Base commit and game profile
- As §10.1, plus TAVERNE.IO `ea315973f218`, TEXTIND.IO `b36ded430e7d`. Run 18:44–18:45 CEST.

### 11.2 Question
Original behaviour of the tavern meal (button 2 "Essen"): price, confirmation, payment, food effect.

### 11.3 Reproducible input
| item | value |
|---|---|
| Start save | S.SAV `49c2bb82ca24…` (full: private SW-11.3-b) (unpatched) |
| Map / position | map 3, scene 10, (see private SW-11.3-a) |
| Target | tavern cell (17,55): A = −5, B = −3 → t = \|B\| − 1 = 2 (MAIN 0x03183) (known) |
| Inputs | load `s` → turn left (266,30) → turn left (266,30) (facing 3→2→1) → forward (287,26) (blocked, tavern opens) → **no "Lauschen"** → "Essen" (120,132) → bar line „Preis für ein Essen: 580 po“ with ok/exit → **ok (270,132)** (in this state the point is "ok", not "Rekrutieren") → eating picture + message → **one closing click (128,60)** → button bar back → exit stone (288,62) → street, facing 3 → save `mealb` |
| After | MEALB.SAV `091c36a8c064…` (full: private SW-11.3-c) |
| Captures (private) | `shots/ishar2/c2/m4a…m9` (m5: price line, m6: message, m7: after closing) |

### 11.4 Data contract (known, TAVERNE 0x00182–0x0069d)
- Price 500 + 40t = 580 (TEXTIND −20 shows it, no wait). ok at x 258–287, exit at x ≥ 288 (y 127–137); right click / exit cancels.
- ok: hour +1 (0x00443), then message −22, one of three random variants (TEXTIND L_02527): „Dieses Gargoyle-Fondue ist himmlisch!“ / „Diese Glupschaugensuppe ist köstlich!“ / „Dwililidong - dieser Gehirnpudding ...“. The tavern sleeps (0x00477) until the message is closed with one press and release.
- **Only after that click** is the meal paid (0x00499–0x0062b): split evenly over the members, the remainder from whoever can pay (L_00bff/L_00b6f). Food 0x2ef6 (file 1326 + c): 100 if > 60, else +40, cap 100 (0x0062e–0x0069d).
- Text scrolls consume the click that closes them (TEXTIND L_02331). That is why MEALA failed (below).

### 11.5 Result
- Screen: „Preis für ein Essen: 580 po“; after ok: „Diese Glupschaugensuppe ist köstlich!“ (variant 2 of 3); hour display 15 → 17 during the run.

**Exact diff MEALB vs S.SAV (11 bytes, complete):**
| file offset | before → after | meaning | class |
|---|---|---|---|
| 45, 48/49 | 0E → 11, 01 FE → 03 11 | hour 0x4fc6 14 → 17 (+1 by the meal, rest clock ticking), tick 0x4fca | known |
| 1007 | (see private SW-11.5-a) | known |
| 1026/27 | (see private SW-11.5-b) | known |
| 1326–1330 | (see private SW-11.5-c) (all > 60) | known |

- (see private SW-11.5-d) (−580)**; c1–c4 hold no gold, so c0 paid everything. No re-roll bytes appeared in this run (why the EDPLT re-roll left no trace here is unknown; the RNG outcome may have matched). Byte 7 unchanged (turned 3→1, exit reversed 1→3).
- `case_diff.py S.SAV MEALB.SAV MEAL --tavern 2`: total −580 OK, hour 14→17, no unexpected offsets, CONT unchanged, **exit 0**.
- **MEALA (negative case):** MEALA.SAV `5844578953c7…` (full: private SW-11.5-e). "Essen" was clicked while the "Lauschen" scroll was still open; the click only closed it. No payment, no food change (clock + 28 re-roll bytes only, §9.5).

### 11.6 Limits
- Only tavern t = 2 and a party where one character holds all gold. The even split across several paying members is known from code but not observed.
- Which text variant appears is random (known); the exact hour after saving includes clock ticking.
- ROOM (button 3, 1 060 po, +7 h) not run.

### 11.7 Code proposals
None.

## 12. Ishar 2 enemy encounter record (reference ENCB; handoff 7-section format)

### 12.1 Base commit and game profile
- As §10.1, plus EATT.IO `d5ef72a5b25e`, FRISE.IO `27117c124caf`, SOURIS.IO `78df7c73f880`, GUARD3.IO `267b32ea6391`, EDPLT.IO `2f6156c6a2ae`. Run 18:45–18:48 CEST.

### 12.2 Question
Original behaviour of a melee encounter: approach, attack input, damage taken, kill and XP.

### 12.3 Reproducible input
| item | value |
|---|---|
| Start save | LEVELING.SAV `dac7e0a405fa…` (full: private SW-12.3-e) (unpatched) |
| Map / position | map 3, scene 21, (see private SW-12.3-a) |
| Target | 12 hostile GUARD3 actors (0x43ba = −1, facing 1, (see private SW-12.3-b) (known, from the save) |
| Inputs | load `leveling` → forward (287,26) **once** (see private SW-12.3-c)the front guards' cell; first hit on c0 immediately) → 8 rounds: F6 (c0), ~1.5 s, F7 (c1), ~1.5 s (18:46:14–18:47:38) → Back (287,62) once (see private SW-12.3-d)out of reach) → save `encb`. Not F8 (c2 has no melee). **Never** Act icon 3 at (80,160) |
| After | ENCB.SAV `5d7cf5b56745…` (full: private SW-12.3-f) |
| Captures (private) | `shots/ishar2/c2/e1a…e4`, `r1a…r8b` (r8: front-left guard no longer drawn) |

### 12.4 Data contract
- Known, EATT 0x00102–0x00180: on maps ≠ 1 guards attack only an actor/party on their **own cell** (EATT L_00553 → party HP 0x2d5c).
- Known, GERDEP 0x00c8b–0x00e3e: on maps ≠ 1 hostile actors block moves out of the party's current cell only in their facing direction; stepping onto their cell and stepping back are allowed. (`render-tables/collision_maps1-4.json` says "target cell" for all maps; that is wrong for maps ≠ 1.)
- Known: F6–F10 = DOS codes 192–196 → 0x4f12 = 15–19 → FRISE L_00909 for c0–c4. Each swing costs 1 food 0x2ef6 (FRISE 0x04fbb/0x05357). Kill XP via FRISE 0x05846/0x0585d.
- Suspected: only guards drawn at depth 0 can be hit (FRISE L_05552 `ctstform`, GUARD3 `cforme 0+depth`), which explains ENCA.

### 12.5 Result
- Hits taken shown on the portraits ([name SW-N-1] = c0 in rounds 0, 1, 5, 6, 8; [name SW-N-2] = c1 in round 3); no HP bar below ~1/3; after round 8 the front-left guard was gone.

**Exact diff ENCB vs LEVELING (78 bytes, complete):**
| file offset | before → after | meaning | class |
|---|---|---|---|
| 45, 49 | 14 → 17, 6F → D9 | hour 20 → 23, tick (clock) | known |
| 91, 93 | 02 → 03 | day phase 0x519f/0x51a0 evening → night | known |
| 987/989/991/993/995 | +3/+4/+3/+3/+3 | XP 0x2d50 c0–c4 (kill XP goes to all five) | known |
| 997 | (see private SW-12.5-a) (−51) | known |
| 999 | (see private SW-12.5-b) (−35) | known |
| 1326/1327 | (see private SW-12.5-c): swings | known (that c0 shows 7, not 8, is unknown: a press during recovery or regeneration) |
| 3444 | (see private SW-12.5-d) | known (kill) |
| 6872 | 15 → 00 | actor 91 scene 0x449a 21 → 0 (removed) | known |
| 64 other bytes 3442–6221 | various | actors 90/92/94–101: HP 0x36ac and stat blocks 0x3d9e/0x3e0e/0x3e7e/0x3eee/0x3f5e/0x41fc; EDPLT re-roll after load (hits on surviving guards cannot be separated from the re-roll) | known mechanism, RNG outcome |

- Party position and facing (bytes 2–7) unchanged: forward then Back.
- `case_diff.py LEVELING.SAV ENCB.SAV ENC`: combat proof OK (XP [3,4,3,3,3], HP [−51,−35,0,0,0]), "actor 91 left scene/died (see private SW-12.5-e)", no unexpected offsets, CONT unchanged, **exit 0**.
- **ENCA (negative case):** ENCA.SAV `88b7442c3fbd…` (full: private SW-12.5-f), no approach step. F6/F7 swung 8× each (food −8) but hit nothing and took no hits: the guards were one cell ahead. Diff: clock, day phase, 1326/1327, 66 re-roll bytes.

### 12.6 Limits
- One guard group, melee via keys only. The mouse attack icons (right panel, I ≈ (267,83), II ≈ (277,111)) are suspected, not used.
- Which guard took how much damage is not recoverable from the save (re-roll).
- Encounter rule "same cell" is for maps ≠ 1; map 1 uses the adjacent cell (EATT, known, not run).

### 12.7 Code proposals
None for the game. Data: `render-tables/collision_maps1-4.json` should say "current cell, blocked only in the actor's facing direction" for maps ≠ 1 (proposal, not changed: not our file).

### 12.8 ENCB replay: blow-by-blow check of Quesh's combat contract (2026-10-18, 19:44–19:48 CEST)
Checked against `quesh/combat-contract-ishar2.md` (SHA-256 `6e8de6fa…10ae`) and `.json` (`65ea6eed…b2b2`). Quesh's files were not edited.

**Setup**
- Replay of the ENCB inputs from LEVELING.SAV, with a save after every step.
- Log `private/run_enc_replay.md`.
- Lossless video `private/shots/ishar2/enc_replay.mkv` (ffv1, 320×200, 15 fps, 188.3 s, 2 825 frames). Video t = 0 is 19:44:58.42 CEST: the first F6 (logged 19:45:26.220) appears at frame 418, and all 16 swings fall within −0.02…+0.07 s of their logged keys.
- Counting tool `private/tools/enc_count.py`. Its evidence is in `private/shots/ishar2/enc_count/`: `events.csv`, plus crops of every portrait splash, guard splash, swing and the round-7 kill.
- Detection: the hit splash uses palette colour (125,24,0).
  - On a portrait it means a guard hit that character (all runs are 6–7 frames, none merged).
  - In the viewport it means a party hit on a guard.
  - A swing shows as an animation in weapon panel I/II.
- During the ten save-name prompts the screen is covered (about 3.2 s each). No hits are missing from the video totals (the counts match the save HP exactly), so the game appears to pause there (suspected).

**Saves** (all in `private/work/ishar2`, unchanged; hash list OK). The .SAV mtimes come from the DOS clock, about 0.5 min ahead of the log.

| save | SHA-256 | state |
|---|---|---|
| LEVELING | `dac7e0a405fa…` (full: private SW-12.8-i) | start |
| ENCZ | `084e51507561…` (full: private SW-12.8-j) | after load (EDPLT re-roll; actor 91 (see private SW-12.8-a)) |
| ENCYA | `437ab955adb6…` (full: private SW-12.8-k) | after forward (see private SW-12.8-b) |
| ENCYB | `94da9228afee…` (full: private SW-12.8-l) | round 1 |
| ENCYC | `8a5a8fdd111d…` (full: private SW-12.8-m) | round 2 |
| ENCYD | `1bcef6e41df5…` (full: private SW-12.8-n) | round 3 |
| ENCYE | `54f925421148…` (full: private SW-12.8-o) | round 4 |
| ENCYF | `4df3dde6ff68…` (full: private SW-12.8-p) | round 5 |
| ENCYG | `c8e75068e13e…` (full: private SW-12.8-q) | round 6 |
| ENCYH | `233f3293ba74…` (full: private SW-12.8-r) | round 7 (kill) |
| ENCYI | `9990bbfc1869…` (full: private SW-12.8-s) | round 8 |
| ENCYJ | `1401ab9a40b7…` (full: private SW-12.8-t) | after Back (see private SW-12.8-c) |

**Per-step table** (video counts against save values; "splash n" = the number drawn in the guard splash)

| step (save) | c0 swing (F6) | c1 swing (F7) | guard hits on c0 / c1 (video splashes, every one shows „1“) | Δ HP | XP Δ c0–c4 |
|---|---|---|---|---|---|
| forward (ENCYA) | – | – | 4 / 1 | −4 / −1 | 0 |
| r1 (ENCYB) | hit, splash 7 | hit, splash 17 | 7 / 6 | −7 / −6 | 0 |
| r2 (ENCYC) | hit, 4 | miss | 8 / 1 | −8 / −1 | 0 |
| r3 (ENCYD) | hit, 7 | hit, 3 | 7 / 3 | −7 / −3 | 0 |
| r4 (ENCYE) | hit, 5 | hit, 14 | 4 / 5 | −4 / −5 | 0 |
| r5 (ENCYF) | hit, 17 | miss | 7 / 4 | −7 / −4 | 0 |
| r6 (ENCYG) | miss | miss | 6 / 3 | −6 / −3 | 0 |
| r7 (ENCYH) | **kill**: no splash; front-left guard removed at frames 2039–2046 | hit, 3 on **actor 90** (−3) | 6 / 6 | −6 / −6 | **+4 / +2 / +2 / +2 / +2** |
| r8 (ENCYI) | miss | miss | 3 / 3 | −3 / −3 | 0 |
| Back (ENCYJ) | – | – | 2 / 1 | −2 / −1 | 0 |
| **total** | 8 swings: 6 hits, 2 misses | 8 swings: 4 hits, 4 misses | **54 / 33** | **−54 / −33** | +4 / +2 ×4 |

Absolute actor-91 HP, party HP and food per step: see private SW-12.8-h. Totals relative: food −8 / −8.

- Every guard splash number equals the save HP change of actor 91 (or 90 in r7) for that round. The c0 hits (7, 4, 7, 5, 17) lie within the contract range 2–21; the c1 hits (17, 3, 14, 3) lie within 1–20.
- Hits on c2–c4: none (their HP is unchanged).

**Other changed offsets (known)**
- 7576–7578 = 0x4b80[0..2], the three front-cell slots. EAFF 0x0057f/0x005a1/0x005cb fill them when the party steps onto the guard cell (ENCZ → ENCYA: 0,0,0 → 91,90,92). FRISE 0x057b3 clears the killer's form slot on the kill (ENCYH: 7576 91 → 0). GERDEP 0x013d5–0x013e9 clears all three on movement (Back, ENCYJ). They are therefore 0 at both ends of ENCB, which is why the contract lists them as "unchanged".
- 7409 = 0x4aa4[28] (block 0x4aa4 at file 7381, + 28), a time-of-day world flag. GERDEP 0x004f3–0x0054a sets it to 1 when the hour 0x4fc6 = 1 and to 0 at hour 4, and wakes the entity of type 0x5b. The hour went 20 → 2 during the replay (2 game hours per real minute). The flag changed between ENCYH and ENCYI although ENCYH was already at hour 1, because GERDEP checks on its own hour-change test (dirb 0x33); that timing is suspected. It is **not combat-related**. What entity type 0x5b does is unknown.
- 45/47/48/49, 91/93: clock and day phase (known noise).

**Script check (own reading of the listings)**
- **Guard damage (EATT 0x00b49, L_00b88–0x00c15):**
  - `dmax = STR_m + 2 − CON_p/2`, then `− ARM_p`, clamped at ≥ 0. Then `dmg = rnd(dmax) + 1`, halved if 0x2e56; 0 is skipped; then subtracted from HP 0x2d5c.
  - ENCZ values: (see private SW-12.8-d) → clamped 0 → **dmg = 1 always**. 0x2e56 = 0, so no halving.
  - Hit chance `9·LVL_m + 3·AGI_p − AGI_m`: (see private SW-12.8-e).
- **Food (FRISE 0x04fac–0x04fbb and 0x05348–0x05357):**
  - −1 per swing (if food > 0) after the form search L_05552.
  - Both outcomes (target found or not) reach 0x04fac, so a swing costs 1 food **whether it hits or misses**.
- **XP (FRISE 0x05806–0x0587d):**
  - L = victim level 0x3d9e[id], read after the kill.
  - For c = 0..4 with HP > 0: the killer (the attacker, dirb 0x13) gets `L/3 + 1`, everyone else `L/5 + 1`.
  - It depends on the **victim's (re-rolled) level** only, not on the party's level or the guard type.
  - (see private SW-12.8-f)

**Verdicts on the contract predictions**

| prediction | verdict | evidence |
|---|---|---|
| Each guard hit costs exactly 1 HP (so HP loss = hit count) | **confirmed** | 87/87 portrait splashes show „1“. Per step, splashes = save HP loss in all 10 intervals (total 54/33 = −54/−33). Script: dmax clamps to 0, so dmg = 1. For ENCB this means 51 hits on c0 and 35 on c1 (inferred; ENCB has no video) |
| Food −1 per party swing | **confirmed** | 8 + 8 swings → −8/−8, hits and misses alike (c0 6/2, c1 4/4). The contract's R2.5 wording "on a miss" is too narrow: the code takes 1 food on every swing. ENCB's c0 −7 after 8 F6 presses means one press gave no swing (cause unknown) |
| Killer +4 XP, everyone else +3 | **the fixed numbers are contradicted for this replay (+4 / +2); the contract's formula is confirmed** | Here killer c0 +4 and c1–c4 +2 (see private SW-12.8-g). The values depend on the re-rolled victim level, read at 5021 + id after load |
| Kill writes 0x36ac = 0, 0x449a = 0, 0x4b80[slot] = 0 | **confirmed** | ENCYH 3443/3444 → 0, 6872 21 → 0, 7576 91 → 0 |
| Player damage ranges c0 2–21, c1 1–20 | **consistent** (small sample) | 7, 4, 7, 5, 17 / 17, 3, 14, 3 |
| Hit chance c0 ≈ 88 %, c1 ≈ 57 % | **unknown** (sample too small; r8 had no target in slot 0) | Observed 6/8 and 4/8 |
| Monster hit chance (c0 always, c1 74 %) | **unknown** (attempts are not visible; only hits are) | Guard hits c0 54, c1 33 over the same time |

### 12.9 Limits of the replay check
- Misses by guards leave no trace in the video or the save, so guard attack attempts, the cooldown 0x4fcc/480·2 and the target choice cannot be counted.
- The killing blow shows no number: ckill comes before csend 40 in FRISE 0x057bd. That the splash comes from the hit reaction is suspected.
- The view palette changes to night colours after round 1 (day phase): cosmetic.

## 13. Ishar 1 NPC record: trainer interaction (reference NPCA; handoff 7-section format)

### 13.1 Base commit and game profile
- Handoff/commit as §1. Ishar 1, start.exe `3ea63234c97b`, MAIN.IO `27c5834de005`. Scripts:
  - STAGE.IO `1b5f4b5ce722`
  - GERDEP.IO `8b3f93c1acf8`
  - SOSD.IO `c3aa7a31d4d8`
  - CONT1.FIC `5303c1ccc760`
- Run in `private/work/ishar1` with the German version (Keypad 3), DOSBox-X 2025.02.01 with cycles fixed at 25000. Log `private/run_cases_ishar1.md`, captures `private/shots/ishar1/c/10_…24_*`. Run 19:32:21–19:33:50 CEST.
- The .SAV mtimes come from the emulated DOS clock, which runs 0.5–2 min ahead of the box clock (known from the mtimes vs the log).

### 13.2 Question
Reach an NPC in Ishar 1 and interact. The only NPC reachable from S1 is the trainer (STAGE); the taverns at (29,16)/(33,18) are not reachable by walking (§6).

### 13.3 Reproducible input
| item | value |
|---|---|
| Start save | S1.SAV `92023f2b51e3…` (full: private SW-13.3-c) |
| Map / position | zone 1 (CONT1, Pragonia street), (see private SW-13.3-a) |
| Target | training entrance at (31,18) (A = −43; message 17, parameter 3 → STAGE) |
| Inputs | load `s1` (`s`, Keypad 1, Return) → turn right (310,101) ×2 (4→1→2) → forward (289,82) → (see private SW-13.3-b) → turn right (2→3) → forward → „GESCHICKLICHKEITSKURS ?“ → OK (270,132) → „WÄHLT DEN KANDIDATEN“ → portrait c3 (224,160) → „ZAUBERSPRUCHPREIS : 1500 GS“ → **EXIT (300,132)**, no payment → screen shows the street, facing N → save `npca` („SICHERN DES SPIELS KOSTET : 1000 GS“ → OK (272,157)) |
| After | NPCA.SAV `bfc6f29e6952…` (full: private SW-13.3-d) |

### 13.4 Data contract
- Known: GERDEP 0x00d44–0x0100a maps A = −43 → message 17, parameter 3 (training). STAGE 0x001d4 lists the eligible class ids {0,2,5,6,9,16,18} from party table 0x1664. STAGE 0x0079e loads the gold only on OK at the price prompt (not taken).
- Known: save cost 1 000 GS (SOSD 0x00b04/0x00b0a), deducted at save time.
- Suspected: the facing reversal on leaving a building (3 → 1 here) uses the same mechanism as Ishar 2 MAIN 0x0346f; the Ishar 1 code path is not located.

### 13.5 Result
**Exact diff NPCA vs S1 (3 bytes, complete):**
| file offset | before → after | meaning | class |
|---|---|---|---|
| 3 | (see private SW-13.5-a) | known |
| 7 | 04 → 01 | facing 4 → 1: walked 4→1→2→3, then reversed 3 → 1 on leaving | known (value); mechanism suspected |
| 483 | (see private SW-13.5-b): **save cost**, no training paid | known |

- `case_diff_i1.py S1.SAV NPCA.SAV TALK (see private SW-13.5-c)` → exit 0 ((see private SW-13.5-d), no unexpected offsets, CONT1–6 identical to the originals).

### 13.6 Limits
- This is a service NPC (trainer). No tavern/dialogue NPC reference for Ishar 1 yet: it needs a start save near a reachable tavern (unknown which).
- Paying for the course (OK at the price prompt) was not run; the effect on stats 0x16de is suspected.

### 13.7 Code proposals
None.

## 14. Ishar 1 item record: transfer between inventories (reference ITEMA; handoff 7-section format)

### 14.1 Base commit and game profile
- As §13.1, plus FRISE.IO `3bd158963fda` and SOURIS.IO `2bbc1362e2f8`. Captures `shots/ishar1/c/30_…39_*`. Run 19:33:50–19:34:52 CEST.

### 14.2 Question
Move an item from one character's inventory to another's. Floor pickup/drop is in the plan as well.

### 14.3 Reproducible input
| item | value |
|---|---|
| Start save | S1.SAV `92023f2b51e3…` (full: private SW-14.3-c) |
| Map / position | zone 1, (see private SW-14.3-a) (no movement) |
| Inputs | load `s1` → c0 name (32,195) → sheet (see private SW-14.3-b) → key in backpack slot 7 (196,42) → portrait c3 (224,160) → sheet EXIT (246,110) → save `itema` (OK at 1000 GS) |
| After | ITEMA.SAV `f65417663dca…` (full: private SW-14.3-d) |

### 14.4 Data contract
- Known: inventory 0x1568, 13 words per member, file 498 + 2·(13c + s). Slots 0–8 are the backpack (grid slot s at (148 + 24·(s div 3), 14 + 28·(2 − s mod 3))). A portrait drop goes to the first free backpack slot.
- Suspected: slots 9–12 are hands/body.

### 14.5 Result
**Exact diff ITEMA vs S1 (3 bytes, complete):**
| file offset | before → after | meaning | class |
|---|---|---|---|
| 483 | (see private SW-14.5-a) (save cost) | known |
| 513 | 0C → 00 | c0 slot 7: key (code 12) removed | known |
| 577 | 00 → 0C | c3 slot 0: key added (first free slot) | known |

- `case_diff_i1.py S1.SAV ITEMA.SAV ITEM --mode transfer (see private SW-14.5-b)` → exit 0 (item count 39 → 39, multiset unchanged, CONT identical).

### 14.6 Limits
- **Transfer only.** Floor drop and pickup are covered separately in §17 (FLRA/FLRB, done 20:28–20:29 CEST). Destroying an item via the sheet bin (237,90) is from the manual (suspected), not run.

### 14.7 Code proposals
None.

## 15. Ishar 1 shop record: buy (reference SHOPA; handoff 7-section format)

### 15.1 Base commit and game profile
- As §13.1, plus MARCHAND.IO `77db63b52c23` and PARAM.IO `f42ea12ceffa`. Captures `shots/ishar1/c/40_…54_*`. Run 19:34:52–19:36:18 CEST.

### 15.2 Question
Enter a shop, buy one item and, if possible, sell one.

### 15.3 Reproducible input
| item | value |
|---|---|
| Start save | S1.SAV `92023f2b51e3…` (full: private SW-15.3-c) |
| Map / position | zone 1, (see private SW-15.3-a); shop #1 at (31,16) (table 0x3fd6) |
| Inputs | load `s1` → turn right (310,101) ×2 (4→1→2) → forward (289,82) → (see private SW-15.3-b) → turn left (266,101) (2→1) → forward → „MÖCHTET IHR ETWAS KAUFEN?“ → OK (270,132) → grid + „WÄHLT AUS, STOLZE ABENTEURER.“ → hover shows „WURFDOLCH (+1)“, price 1100 → dagger (201,20) **once** → portrait c2 (160,160) **once** (c2 holds all the gold) → exit stone (288,112) → street, facing S → save `shopa` (OK at 1000 GS) |
| After | SHOPA.SAV `6802d3e77df8…` (full: private SW-15.3-d) |

- SHOPA is **byte-identical to the scratch probe PROBEB** (19:21 CEST, separate copy `private/probe_i1/game`, same base and inputs). This is evidence that the outcome is deterministic: the Ishar 1 save stores no clock.

### 15.4 Data contract (known, MARCHAND)
- The held item 0x1506 is set only from the grid (0x00496).
- Gold check: 0x00500 tests the buyer's own gold. Gold is written only at 0x005ca–0x005ec: it is loaded, then L_0062f subtracts the price (the cadd at 0x00656 is borrow normalisation), then it is stored back.
- The inventory is written only at 0x0071b, into the first free slot (0x00709, L_00704). Stack items (codes −66…−57) instead add to counter 0x3e22 (0x0085a).
- „UNMÖGLICH, EUER BÜNDEL IST VOLL.“ keeps the item held.
- **Selling does not exist in Ishar 1 (known):** MARCHAND has no path that adds gold to 0x154e/0x3770 or takes an item out of the inventory, and the UI offers only buy (OK/EXIT). The only "verkaufte" text is story text (TEXTIND 0x0173b). The other scripts that touch gold (FRISE, ITAVERNE, STAGE, SOS*) are not shop scripts.

### 15.5 Result
**Exact diff SHOPA vs S1 (6 bytes, complete):**
| file offset | before → after | meaning | class |
|---|---|---|---|
| 3 | (see private SW-15.5-a) | known |
| 7 | 04 → 03 | facing: walked to 1, reversed 1 → 3 on leaving | known (value); mechanism suspected |
| 483 | (see private SW-15.5-b) | known |
| 556/557 | 00 00 → FF CA | c2 backpack slot 3 = −54 (Wurfdolch) | known |
| 3998 | (see private SW-15.5-c) | known |

- (see private SW-15.5-d) = −1 100 (dagger) −1 000 (save).
- `case_diff_i1.py S1.SAV SHOPA.SAV SHOP --char 2 --price 1100 --code -54 (see private SW-15.5-e)` → exit 0 (CONT identical).

### 15.6 Limits
- One non-stack item. Stack items and the „BÜNDEL VOLL“ path are known from code and the probe, but not referenced.

### 15.7 Code proposals
None.

## 16. Ishar 1 enemy encounter record (reference ENCA; handoff 7-section format)

### 16.1 Base commit and game profile
- As §13.1, plus FRISE.IO (§14.1), ENCONT.IO `5746e6a7169a`, GEREN.IO `60405e4537ab` and CONT5.FIC `c41354257bd2`. Captures `shots/ishar1/c/60_…72_*` (`68_round1…8`). Run 19:36:18–19:38:15 CEST. **Unpatched.**

### 16.2 Question
Original behaviour of a melee encounter in Ishar 1: approach, attack, damage taken, kill.

### 16.3 Reproducible input
| item | value |
|---|---|
| Start save | LP1.SAV `76cf91a104ec…` (full: private SW-16.3-e) |
| Map / position | zone 15 (CONT5 cave), (see private SW-16.3-a) |
| Target | 6 monsters, actors 63–68 (type −4, (see private SW-16.3-b); no direct path (CONT5 x22/23 y54 = −99) |
| Inputs | load `lp1` (`l`, `p`, Keypad 1, Return) → turn left (266,101) ×2 (3→2→1) → forward (289,82) (see private SW-16.3-c)→ turn right (310,101) (1→2) → forward (see private SW-16.3-d)group visible 2 cells ahead → forward again is blocked → 8 rounds: ATTACK c0 (48,132), ~2 s, ATTACK c1 (112,132), ~3 s (19:37:05–19:37:46) → save `enca` (OK at 1000 GS). Never the icon at (80,160) |
| After | ENCA.SAV `8003a1965ef2…` (full: private SW-16.3-f) |

### 16.4 Data contract
- Known:
  - FRISE 0x00985 subtracts damage from party HP 0x1542.
  - FRISE 0x06888 gives kill XP to the killer (+50·T) and others +20·T.
  - FRISE 0x070cc caps XP at 31 000. All of LP1's party is at the cap, so **XP cannot show a kill. The proof is monster HP 0x1b22 → 0 plus party HP loss.**
- Suspected: the monsters approach by AI (GEREN/ENCONT movement); they were not adjacent at load time.
- Suspected: per-member byte 0x16bc (file 773+c) is "Kondition", spent per swing.

### 16.5 Result
- In both the probe and this run the group (see private SW-16.5-a), in front of the party. In the probe the party (see private SW-16.5-b); in the run, (see private SW-16.5-c). The monsters faded out from about round 4 and were gone by round 8. No HP bar dropped below 1/3.
- The encounter has been **seen twice** (probe PROBED 19:29 CEST and ENCA): suspected reproducible, not guaranteed.

**Exact diff ENCA vs LP1 (26 bytes, complete):**
| file offset | before → after | meaning | class |
|---|---|---|---|
| 3 / 5 / 7 | (see private SW-16.5-d) | known |
| 469 | (see private SW-16.5-e) (−11) | known |
| 471 | (see private SW-16.5-f) (−14) | known |
| 479 | (see private SW-16.5-g) | known |
| 773 / 774 | (see private SW-16.5-h) (−8 each = 8 swings) | value known, meaning suspected |
| 1575–1585 (odd) | (see private SW-16.5-i) | known |
| 1715–1725 (odd) | (see private SW-16.5-j) | known |
| 1855–1865 (odd) | (see private SW-16.5-k) | actors 63–68 HP → 0 (all six killed) | known |

- `case_diff_i1.py LP1.SAV ENCA.SAV ENC` → exit 0: party XP Δ [0,0,0,0,0] (cap), party HP Δ [−11,−14,0,0,0], 6 kills, gold −1 000, CONT identical.
- Actor zone (4033+i) stays 15; dead actors are not removed from the zone in the save (known, unlike Ishar 2 §12).

### 16.6 Limits
- The approach depends on monster AI (suspected). If the group does not come within about 60 s, use P1 (§7, proposal only, not applied).
- A kill XP rule visible in the save needs a party below the cap (unknown which save has one).
- Which character dealt which kill is not recoverable from the save.

### 16.7 Code proposals
None. P1 stays a proposal only (§7).

## 17. Ishar 1 floor record: drop and pick up again (references FLRA/FLRB; handoff 7-section format)

### 17.1 Base commit and game profile
- As §13.1, plus SOURIS.IO `2bbc1362e2f8`, AFFOBJ.IO `abe105fad328`, FRISE.IO `3bd158963fda`. Working copy `private/work/ishar1`. Run 20:26:27–20:29:45 CEST, log `private/run_cases_open.md`, captures `private/shots/ishar1/floor/`. The same sequence was rehearsed headless at 20:14–20:21 CEST in a separate scratch copy, with byte-identical results.

### 17.2 Question
Put an item from an inventory onto the floor, then pick it up again into an inventory.

### 17.3 Reproducible input
| item | value |
|---|---|
| Start save | S1.SAV `92023f2b51e3…` (full: private SW-17.3-b) |
| Map / position | zone 1, (see private SW-17.3-a) |
| Inputs, drop | load `s1` → turn right 2× (310,101) → c0 name (32,195) → key, backpack slot 7 (196,42) → name (32,195) again (the sheet closes, the key stays on the cursor) → viewport floor (128,100) → the key is drawn one cell ahead at x 121–134, y 119–122 → save `flra` (disk (309,56) → (160,146) → OK (272,157) → name → Return) |
| Inputs, pickup | click the floor key (127,120) → key on the cursor, sprite gone → portrait c0 (32,160) → save `flrb` |
| After | FLRA.SAV `b7ec6de7534b…` (full: private SW-17.3-c); FLRB.SAV `14955ef5465c…` (full: private SW-17.3-d) |

### 17.4 Data contract
- Known (SOURIS L_0076a → 0x00841–0x008e4): a drop needs a held positive item (0x1506 > 0), the sheet closed (0x137f = 0), 0x399e = 0, a click in the viewport (x < 256, screen y < 127), and no floor object or form under the cursor. The item goes to the cell in front by facing (1: y−1, 2: x+1, 3: y+1, 4: x−1) with zone 0x1508. Item code 31 has a special branch.
- Known: floor object tables are bytes indexed by item code N: x 0x1382 = file 34+N, y 0x1404 = file 162+N, zone 0x1486 = file 290+N. 0 = not on the floor.
- Known (SOURIS 0x00451–0x00650): a pickup with an empty cursor hits the floor object (ctstform 128), clears its three table bytes and puts it on the cursor. A portrait drop goes to the first free backpack slot (§14.4).
- Known: AFFOBJ draws floor objects in the zone 1–6 cells ahead with |lateral| ≤ distance.

### 17.5 Result
**Exact diff S1 → FLRA (6 bytes, complete):**
| file offset | before → after | meaning | class |
|---|---|---|---|
| 7 | 04 → 02 | facing 4 → 2 (two right turns) | known |
| 46 / 174 / 302 | (see private SW-17.5-a) | known |
| 513 | 0C → 00 | c0 slot 7: key removed | known |
| 483 | (see private SW-17.5-b) (save cost) | known |

**Exact diff FLRA → FLRB (5 bytes, complete):** 46/174/302 → 00 (floor entry cleared); 499 00 → 0C (c0 slot 0 = key, first free slot); (see private SW-17.5-c) (save cost).
- `case_diff_i1.py S1.SAV FLRA.SAV FLOOR --mode drop --item 12 (see private SW-17.5-d)` → exit 0.
- `case_diff_i1.py FLRA.SAV FLRB.SAV FLOOR --mode pick --item 12` → exit 0. The base hash shows "unknown" because FLRA is new. CONT files are identical to the originals.
- The operator run and the scratch rehearsal produced the same two hashes.

### 17.6 Limits
- One item (key, code 12), one cell, facing 2. Other facings and codes (including the code 31 branch and the code 50–93 cursor type) were not run. The pickup hit box was not bisected; only the click at (127,120) was tested.
- Closing the sheet by clicking the name again while holding an item is observed behaviour (the path has no held-item check, suspected from code); EXIT (246,110) was not needed.

### 17.7 Code proposals
None.

## 18. Ishar 2 item record: transfer between characters (references XFERA/XFERB; handoff 7-section format)

### 18.1 Base commit and game profile
- As §8.1 (FRISE.IO `27117c124caf`, SOURIS.IO `78df7c73f880`). Working copy `private/work/ishar2`. Run 20:30:04–20:34:05 CEST, log `private/run_cases_open.md`, captures `private/shots/ishar2/xfer/`.

### 18.2 Question
Move an item from one character to another, from an unpatched base. The PICKQ/PICKR/PICKT moves in §8.5c came from toolkit-patched bases.

### 18.3 Reproducible input
| item | value |
|---|---|
| Start save | LEVELING.SAV `dac7e0a405fa…` (full: private SW-18.3-b) |
| Map / position | map 3, scene 21, (see private SW-18.3-a) (no movement) |
| Inputs, V1 hand → hand | load `leveling` → c3 hands icon (232,131) → c3 slot 10 (242,168) → c4 hands icon (296,131) → c4 slot 9 (282,168) → disk (266,12) → SAVE (240,58) → `xfera` → Return |
| Inputs, V2 hand → backpack | load `leveling` → c3 hands icon (232,131) → slot 10 (242,168) → portrait c4 (288,170) → save `xferb` |
| After | XFERA.SAV `3e37fdf0a085…` (full: private SW-18.3-c); XFERB.SAV `46bfac7ad6d0…` (full: private SW-18.3-d) |
| Click points | c3/c4 points were derived from the FRISE R7 formula (icon 40+64c,131; slot 9 x 14..39+64c, slot 10 x 38..63+64c, y 168; portrait 32+64c,170); all worked first time |

### 18.4 Data contract
- Known: inventory word file 1036 + 2·(15c + s), BE; slots 9/10 = hands; armour byte 1336 + c. Taking an item out of a hand subtracts armour(code), putting it into a hand adds it, the backpack adds nothing (§8.5c). armour(−25) = 4.
- Known: the disk menu is blocked while an item is held, so only before/after states can be saved.

### 18.5 Result
| save | case bytes vs LEVELING | other changes | case_diff |
|---|---|---|---|
| XFERA | 1146/1147 FF E7 → 00 00 (c3 slot 10); 1174/1175 00 00 → FF E7 (c4 slot 9); (see private SW-18.5-a) | 5 clock bytes, 66 actor re-roll/AI bytes (tolerated noise, 77 bytes in total) | `XFER --src 3,10 --dst 4,9 --code -25 --armour 4` → exit 0 |
| XFERB | 1146/1147 FF E7 → 00 00; 1158/1159 00 00 → FF E7 (c4 backpack slot 1); (see private SW-18.5-b) | 3 clock bytes, no re-roll bytes (8 bytes in total) | `XFER --src 3,10 --dst 4,1 --code -25 --armour 4` → exit 0 |
- CONT files are identical to the originals; no non-SAV file changed.

### 18.6 Limits
- One item (−25). Slot-9 swap onto an occupied hand was not run.
- A floor drop of a negative item code is not possible in Ishar 2 (known); the floor case is only the positive-object pickup of §8.
- The actor re-roll noise in XFERA but not XFERB is seen, not explained.

### 18.7 Code proposals
None.

## 19. Ishar 2 row 1b MARIN: attempt and corrected plan (not a reference yet)

### 19.1 What happened (20:34–20:36 CEST, no saves)
- After loading LP3 the compass shows **E**. Left turns go E → N → W → S → E (captures `private/shots/ishar2/marin/m1_loaded`, `m2a`, `m2_turned`, `x_tl3`, `x_tl4`). After two left turns (compass W) a stone wall with an arched door was ahead; forward entered the tavern (left via (288,62)). N and S views showed fields. No sailor was seen and no figure was clicked.
- From a fresh load, forward once and twice (facing E) moved the party twice (the view changed each time); no boat or map screen appeared.

### 19.2 Corrected reading (code)
- **Party:** (see private SW-19.2-a), file 8 = map 3, file 18 = scene 23. Movement and drawing (SOURIS 0x008f0, EAFF 0x00060) use facing 1: c−1, 2: r+1, 3: c+1, 4: r−1. **Compass mapping (from the captures): 1 = N, 2 = W, 3 = S, 4 = E; turning left adds 1 (4 → 1 → 2 → 3).** The plan's labels "facing 4 = W" and "left = 4 → 3 → 2" were wrong. Two turns still reach facing 2, so the labels were not the real cause.
- **Real cause:** CONT3 (offset r·60 + c) has A = 12 at r4 c55, which is the tavern building between (see private SW-19.2-b). Forward with facing 2 enters the tavern, and the building hides anything behind it.
- **MARIN:** actor 55, (see private SW-19.2-c) (3261+2i), type 12 (4911+i) → marin.IO, scene 23 (6781+i). MAIN loads marin.IO for scene 23 together with vport.IO and varche.IO (L_01c0e).
- **Visibility (EAFF, known):** drawn if HP > 0, actor scene = 0x4ef2, 0 ≤ dist < 6 and |lat| ≤ dist. L_00ba5 first sets the actor's facing to the direction from the party to the actor (diagonals take the party facing), and maps 2/3/5/6/7 then require it to equal the party facing. So this is a view-cone test, not "MARIN faces the party". There is no line-of-sight test in EAFF; buildings hide sprites only through drawing order (suspected).
- **No time or flag gate:** EAFF type 12 → clive 0x26 unconditionally; MARIN.IO only switches palette by time of day (0x519f) and handles message 35 (known).
- **Interaction:** MARIN.IO has no click or message-40 handler (known). Message 40 comes only from FRISE's hit reaction, so attacking him is the only reaction path; do not do it.
- **Boat:** the plan's "B = −125 ahead → message 25 → boat map" was wrong. Message 25 is sent by FRISE 0x01158, the top-icon bar's map button, and MAIN L_0360e then loads map.IO (map view). boat.IO is loaded only for scene 3 (L_0197b). No boat-trigger cell in scene 23 was found.
- Side finding (known, SOURIS 0x00bc5): using item −20 on the B = 89 cell (r6 c55) with facing 2 starts ANIMALS.IO with parameter 2; B = 71 with facing 4 and item −19 gives parameter 1. Not needed for this case.

### 19.3 ~~Corrected sequence~~ CONTRADICTED by the 21:01 run (§19.4) (suspected route: open cells A = −1 at c54 are assumed walkable, as the r2 cell (A = −1) seemed to be during the boat attempt; §19.5 shows that was a map exit, not a step)
1. Load `lp3` → compass E, fields and towers (as `m1_loaded`).
2. Turn left once (266,30) → compass N (facing 1).
3. Forward (287,26) → r3 c54.
4. Turn left once → compass W (facing 2). The tavern (r4 c55) should be front-left.
5. Forward → r4 c54. Capture: MARIN at dist 2, lat +1 (one cell to the left of centre, suspected side), drawn small.
6. Forward → r5 c54. Capture: MARIN front-left at the diagonal (dist 1, lat 1).
7. Click the figure → expect no reaction (no text, no screen change). Capture. Do not attack and do not save.
- If step 3 or 5 is blocked, use the c56 side instead: turn right from the start (compass S, facing 3) → forward → r3 c56 → turn right (compass W) → forward 2× → r5 c56; MARIN is front-right at the diagonal.
- Do not step onto r6 c52–54 (B = −50 / −63 / 92: scene-change codes, pp11.IO for −50).

### 19.4 Second attempt (21:01–21:02 CEST, log `private/run_marin.md`, captures `private/shots/ishar2/marin2/`, no saves) and re-check
- Observed: LP3 compass E; turn left → compass N, corn field ahead, forward **blocked** (pixel-identical view). Fresh load, turn right → compass S, corn field, forward **blocked**. So the §19.3 route (step to r3 c54) is **contradicted**, and so is the c56 fallback.
- **Mapping re-check (all captures agree):** SOURIS 0x008f0 / EAFF 0x00060: facing 1 = c−1, 2 = r+1, 3 = c+1, 4 = r−1 (known). Compass: 1 = N, 2 = W, 3 = S, 4 = E (seen); left = +1. Check against CONT3 around the (see private SW-19.4-a) (A = 97):
  | compass | facing | cell ahead | A / B | observed | fits |
  |---|---|---|---|---|---|
  | W | 2 | r4 c55 | 12 / 0 | stone wall with arched door; forward opens the tavern (20:35) | yes |
  | N | 1 | r3 c54 | −1 / 0 | corn, blocked (21:01) | yes |
  | S | 3 | r3 c56 | −1 / 0 | corn, blocked (21:02) | yes |
  | E | 4 | r2 c55 | −1 / **−125** | the view changed after each of two forwards (20:36) | only if B = −125 makes the cell passable or triggers a transition (suspected) |
- A = −1 blocks movement, which matches Hoth's proven run C4 (A = 0xFF solid). Movement itself is native: no script writes 0x2ab4/0x2ab5 except load and teleports, so the full collision rule cannot be read from the scripts.
- "Tavern on the left when facing E" does not fit: by this mapping the tavern (r4 c55) is behind the party when facing E. The stone edge at the left of the E view is unexplained (suspected: wall rendering of the −1 cell r2/r3 c54).
- **Why MARIN is not seen from LP3:** the party cell faces him in the view cone (facing 2, dist 3, lat 0, so EAFF would draw him), but the tavern cell r4 c55 is in between and hides him (suspected: drawing order).
- **View-cone cells (EAFF rules, A > 0):** r3 c55 / r4 c55 / r5 c55 facing W (behind or inside the tavern); r6 c52–54 facing S (excluded); r7 c52, r8 c51–53, r9 c51/53, r10 c51/53, r11 c51/53 facing S or E. The r7–r11 cells all have A = −1 cells between them and r6 c55, so they are probably hidden as well. r10 c51 (B = −50) and r11 c51 (B = −52) are scene-change cells.
- **Result:** no reachable view cell with a clear line to MARIN was found outside r6 c52–54. The pier r6 c52–55 is enclosed by A = −1; its links are the tavern door and r6 c52 ↔ r7 c52. Row 1b stays: interaction **known from script (none)**, location **unverified**, in-game route **unknown**.
- Diagnostic step E + save `MARA`: done, §19.5.

### 19.5 MARA probe (21:10–21:11 CEST, log `private/run_mara.md`, captures `private/shots/ishar2/mara/`) and conclusion
- MARA.SAV `4f85769387a0…` (full: private SW-19.5-e) (verified). Inputs: load `lp3` (compass E) → forward (287,26) → save `mara`.
- Decoded (BE16 words, file 2/4/6/8/18): **(see private SW-19.5-a).** 977 bytes differ (map change). Actor 55 is unchanged in MARA ((see private SW-19.5-b)type 12, scene 23; its facing word 3041+110 reads 0 instead of 2).
- **So E (facing 4 = r−1) onto r2 c55 (A −1, B −125) is a map exit, not a walkable step.** The party leaves map 3 for map 1 (the start island; (see private SW-19.5-c)). The −1 cell itself is not entered. This explains the "moved" views of 20:36 and the fields/towers: they are map 1 (towers seen N and W in MARA's cell; CONT1 r12 c11 A = −12, r10 c12 A = −20).
- **The LP3 coordinates are not misread:** (see private SW-19.5-d) fits all four views (corn = A −1 at c54/c56, tavern door = A 12 at r4 c55, map exit = B −125 at r2 c55). Scene 23 is the scene that loads vport/varche/marin (MAIN L_01c0e). The harbour itself (pier codes 31/33/34 at r6 c52–55) lies behind the tavern and is not visible from this cell.
- Compass note: map 3 shows facing 4 as E, while map 1 shows facing 2 as E (§8, MARA). The compass orientation therefore differs between maps; only the facing → cell delta (1 c−1, 2 r+1, 3 c+1, 4 r−1) is code-known.
- **Conclusion (verified):** from LP3 MARIN can be neither reached nor seen. The start cell is a closed pocket: N/S solid, W = tavern menu without a step, E = map exit. The view cone toward him (W, dist 3) is blocked by the tavern. No reasonable route exists from this save.
- What remains: **known (script)** = MARIN has no click/message-40 handler, so clicking him would do nothing; presence has no time/flag gate. **Unknown** = his on-screen appearance and an in-game route onto the pier network (r6–r12 c51–57). None of the known saves has the party in scene 23 on that network.

## 20. Ishar 2 hit-chance sample: player melee vs the contract formula (handoff 7-section format)

### 20.1 Base commit and game profile
- As §12.1. Contract checked: `codex-support/quesh/combat-contract-ishar2.md` `a3310c98e8b5` (updated since §12.8; the hit formula R2.3 is unchanged). Tools `private/tools/enc_count.py`, `private/tools/hit_eval.py` (kill-blow handling extended in this run).
- Run 20:37:38–20:58:47 CEST, log `private/run_hit_sample.md`, videos `private/shots/ishar2/hit/batch_a..l.mkv`, per-batch outputs `hit/count_x/`, per-swing table `hit/hit_swings.csv`.

### 20.2 Question
Is the player hit chance `hit% = 50 + 2·LVL + 3·(AGI·FOOD//80 − AGI_t) + skill//5` (FRISE 0x05651, roll `rnd(100) < hit`) right, with FOOD the attacker's food before the swing?

### 20.3 Reproducible input
| item | value |
|---|---|
| Base | LEVELING.SAV `dac7e0a405fa…` (full: private SW-20.3-a) |
| Per batch x = a..l | load `leveling` → save `HZx` → forward (287,26) → save `HAx` → 10 × (F6, 1.68 s, F7, 1.68 s) → save `HYx`; ffmpeg per batch (start time = video t0). Batch a also pressed F8/F9/F10 once each |
| Saves | 36 files `work/ishar2/H{Z,A,Y}{A..L}.SAV`; all 36 SHA-256 in `private/run_hit_sample.md` re-verified (36/36 OK) |

### 20.4 Data contract
- Attacker: (see private SW-20.4-a), status arrays 0 (known).
- Target: front slots 7576–7578 = actors 91/90/92 in every HA; AGI_t 6121+i, CON_t 5241+i, ARM_t 6011+i, HP 3261+2i (BE16). (see private SW-20.4-b).
- Target order: first live slot (0 → 1 → 2). All 175 visible splashes (including 1-frame kill splashes) fell on the predicted slot.
- **Kill blows:** 19 kills (slots that became 0, killer from XP: killer +L//3+1, others +L//5+1). 16 kill blows showed a **1-frame splash**, 3 showed **no splash** (batches a/c/d) (the replay round 7 was one of these). In batches c, e and l the XP vector fits two killer assignments; the 1-frame splashes decide.
- Only c0 and c1 swing: F8–F10 in batch a changed no food for c2–c4 (0 swings).

### 20.5 Result
**Video check:** 12 × 20 swings detected, all 240 matched to their F6/F7 key (−0.25 … +1.5 s), no orphan splashes. Food A→Y = 10/10 per batch = swings counted.

**Damage cross-check (per guard, HA→HY):** with dmg = (STR+2−CON_t)//2 − ARM_t + 1..20 (contract R2.4; (see private SW-20.5-a)), all 36 guard rows are consistent. For killed guards, the hits before the kill stay below HP and the total can reach HP. For surviving guards, the HP loss lies in [Σmin, Σmax]: total 374 HP over 10 guard rows vs 466 expected mean.

**Hit rate:**
| char | n | hits | observed | Wilson 95 % | Clopper-Pearson 95 % | expected mean (E[hits]) | Poisson-binomial p (two-sided) |
|---|---|---|---|---|---|---|---|
| c0 | 120 | 111 | 0.925 | 0.864–0.960 | 0.862–0.965 | 0.932 (111.8 ± 2.7) | 0.71 |
| c1 | 120 | 67 | 0.558 | 0.469–0.644 | 0.465–0.649 | 0.609 (73.1 ± 5.3) | 0.26 |

**By expected-p band:** c0 85–89 %: 16/17 (exp 0.87); 90–94 %: 54/60 (0.92); 95–99 %: 41/43 (0.97). c1 55–59 %: 3/12 (0.57); 60–64 %: 64/108 (0.61).

**By target:**
| char | target | n | hits | expected | P(≤ hits) |
|---|---|---|---|---|---|
| c0 | 91 | 62 | 57 | 59.5 | 0.10 |
| c0 | 90 | 49 | 46 | 44.5 | 0.84 |
| c0 | 92 | 9 | 8 | 7.8 | 0.72 |
| c1 | 91 | 51 | 30 | 32.0 | 0.33 |
| c1 | 90 | 55 | 34 | 33.1 | 0.65 |
| c1 | 92 | 14 | 3 | 8.0 | **0.007** (≈ 0.04 after Bonferroni over 6 cells) |

**Per batch:** c0 hits 9,10,10,10,10,9,6,9,10,10,9,9. Batch g has 6/10 (P = 0.0015; dispersion χ² 27.5 on 12 batches). The misses in g have no splash pixels at all, and the guard HP fits. c1: dispersion χ² 7.0 (no overdispersion).

**Identical saves (HZB = HZD = HZJ, HZC = HZE = HZG, HZH = HZI, HAD = HAE, HAH = HAJ):**
- Every HZx except HZA differs from LEVELING only in bytes 48/49 = 0x4fca, the in-game tick counter inside the hour (MAIN 0x03faa). It shows 117–121 depending on the load→save time, so equal timing gives equal files. HZA (first load after boot) also had 72 more changed bytes, including the guards' level, AGI, CON and HP: the re-roll.
- Re-roll source: EDPLT 0x0039a calls L_006ce when the party scene 0x4ef2 ≠ 0x4f06 (last scene seen). 0x4f06 is not in the save, so the re-roll runs once per session on the first entry into scene 21, not on every load (known from code, seen: HZA/XFERA re-rolled, HZB–L/XFERB did not). This corrects the earlier note "re-roll on every load".
- **Independence:** the hit/miss sequences differ inside every identical-start group (b/d/j, c/e/g, h/i, d/e, h/j), and HY differs (e.g. (see private SW-20.5-b)). The roll RNG state is not in the save. Grouping the 12 batches into the 10 distinct HA states (cluster bootstrap over groups, 4000 draws): observed − expected c0 −0.007 (95 % −0.088 … +0.045), c1 −0.051 (−0.110 … +0.004). Same verdict.

**Verdict:**
- c0: **confirmed** (observed 92.5 % vs 93.2 %, p = 0.71; CI ±5 points).
- c1: **confirmed overall** (55.8 % vs 60.9 %, p = 0.26). The sub-group c1 vs guard 92 (see private SW-20.5-c) is **flagged, unknown**: 3/14, p = 0.007 uncorrected. No missed-splash evidence was found (guard 92 HP matches). Either chance, or a target/form effect for c1 on slot 2. Needs a dedicated sample.
- FOOD-before-swing and the per-swing decrement: consistent (food A−Y = swings; the c0 bands track food).

### 20.6 Limits
- (see private SW-20.6-a). The formula's other terms (LVL, skill/5, the blind = 20 rule, ranged loc172) are not tested beyond these fixed values.
- Kill-blow detection relies on 1-frame or missing splashes plus XP. The 3 no-splash kills are inferred.
- Batch g's game-time palette change (from frame 692) did not affect splash detection (a hit at f744 was detected), but this was checked only in batch g.

### 20.7 Code proposals
None. Suggested follow-up: 100 c1 swings against slot 2 only (kill slots 0/1 first in a session, then save and reload with the same timing).

## 21. Ishar 2 magic records: T1 / T2 / T3 / kill share / Metamorphosis (references MTAA–MTHB; handoff 7-section format)

### 21.1 Base commit and game profile
- As §1 / §12.1: Ishar 2, Deutsch (KP_3), DOSBox-X 2025.02.01.
- Run 2026-11-03 12:20–12:31 CET. Log: `private/run_magic_party_i2.md`. Captures: `private/shots/ishar2/magic/`.
- Contract checked: `codex-support/quesh/magic-contract-ishar2.md` `0d80d798d23d` (read-only).
- Check tool: `private/case_diff.py` `b02c3988…d290`.
- Re-verified 2026-11-03:
  - All save SHA-256 in the log match (sha256sum -c, 0 failures).
  - START, LEVELING, GRIMZEL and CONT1–7.FIC in `work/ishar2` are byte-identical to the originals (cmp).
- Plan: `private/cases_magic_party_plan.md` §1.

### 21.2 Question
Do Quesh's R9 predictions hold? These are T1 Physical protection, T2 Healing and T3 Lightning. Two questions were open in the contract:
- Who gets the killer XP share on a spell kill?
- What does Metamorphosis (spell 7) visibly do?

### 21.3 Reproducible input
Common steps:
- Load: disk (266,12) → LOAD (238,32) → name → Return. Wait 14 s; the first T3 try waited too little.
- Save A at once. Save: disk → SAVE (240,58) → name → Return. Then close the menu with (266,12).

| ref | base | clicks after save A | saves (SHA-256 prefix) |
|---|---|---|---|
| T1 | START | (248,131) c3 dot → (200,145) spell 2 → (32,160) c0 → save within about 10 s | MTAA d6494e0b, MTAB 9bd39052 |
| T2 | LEVELING | (312,131) → (264,145) spell 1 → (32,160) | MTBA 97ce7b70, MTBB 3cf3e346 |
| T3 | LEVELING | (184,131) → (184,160) next page → (168,160) spell 25 | MTCC 59301f85, MTCD fec55a29 (the first try left only an orphan MTCB 120bb128: no MTCA was written because the load had not finished; not a reference) |
| T3K try 1 | LEVELING | 6 × Lightning (casts 2–3 of the first batch misfired: the dot click toggled the grid and "next" paged on to page 2) | MTGA 3486a777, MTGB bdedaaad, MTGC 1c142a10 |
| T3K try 2 | LEVELING | 6 × Lightning (dot → next → slot 5 per cast) | MTGD 2f8b4f74, MTGE 51e33c3f |
| Meta | LEVELING | (184,131) → (152,160) page 0 slot 4 = spell 7 | MTHA 4a0fd632, MTHB 9c34a5b2 |

### 21.4 Data contract
- MP: 1321 + c.
- HP: 996 + 20c (BE16). XP: 986 + 2c.
- Actor HP: 3261 + 2id. Actor level: 5021 + id.
- Protection timer 0x2e56[0]: 1216/1217. Status icons: 7579 + 10c.
- Clock: 45/48/49. In MTG*, 91/93 also changed: actor AI fields, allowed as clock/AI noise by the tool.

### 21.5 Result (rerun 2026-11-03; every check exit 0 with 0 unexpected offsets; CONT unchanged)

| prediction (contract R9 / plan) | observed | verdict |
|---|---|---|
| T1: (see private SW-21.5-a) | **proven** |
| T1: timer 1216/1217 between 1 and 30 | 24 (save about 9 s after the cast) | **proven** |
| T1: status icon 2 on c0 in 7579..7588 | 7579 = 2 | **proven** |
| T1: icon gone after about 13 s; save C at 1216 = 0 | not captured (no save C) | open |
| T2: (see private SW-21.5-b) | **proven** |
| T2: (see private SW-21.5-c) | **proven** |
| T3: (see private SW-21.5-d) | **proven** |
| T3: guards 90–95 lose the same D ∈ the ⌊6s/4⌋ set | all 13 (s = 9) | **proven** |
| T3: guards 96–101 unchanged | unchanged | **proven** |
| T3: no deaths; sleep words unchanged | none; no unexpected offsets | **proven** |
| T3K try 1: equal D per cast, per guard | per guard 90–95: 16 after cast 1 (MTGB), 48 in total (MTGC); (see private SW-21.5-e) (6 paid casts × 12, the 2 misfires included) | consistent |
| Lightning has no MP ≥ cost check | not tested (MP kept ≥ 12) | open |
| **Killer share** (contract: "open"; plan: caster through FRISE dirb13, suspected) | MTGD → MTGE: guards 91 and 94 (see private SW-21.5-f) killed, the others in 90–95 (see private SW-21.5-g). XP delta c0..c4 = **4, 4, 6, 4, 4**. (see private SW-21.5-h) | **proven: the caster (c2) gets the killer share** (dirb13 = the clicked red-dot column) |
| Metamorphosis cost 3 × power 3 = 9; no other byte | (see private SW-21.5-i); no other byte | **proven** |
| Metamorphosis visible (contract: "open"; plan: all living portraits become the same BUSTE bust, resource 33) | all five portraits replaced by the same bust | **proven** |
| Metamorphosis reverts on the next portrait redraw (plan, suspected; listed senders of message 22: FRISE 0x00dfc / 0x0609c, TAVERNE 0x008f8, "MAIN on menu rebuild") | the bust stayed through the save / disk-menu redraw | **contradicted** for the disk menu. Revert through message 22 (formation change, tavern, party change) is still **open** |
| Spell names on cast | no spell-name text appears on any cast | observed (contract names come from the manual: still a hypothesis) |
| Lightning animation | a fireball-like animation | observed; the animation resource is not traced |

### 21.6 Limits
- One sample per RNG case. In T3K the kill blow itself (which cast) is not isolated, but this does not affect the share.
- The Metamorphosis revert was tried only with the disk menu.
- T1 decay was not captured.

### 21.7 Code proposals
- VM: the killer XP slot = FRISE dirb13, set by the spell-panel click.
- Metamorphosis is cosmetic: it sets a portrait override that survives menu redraws and is cleared only on message 22.
- No save patches.

## 22. Ishar 2 party records: E2 expel + recruit on GRIMZEL, E3 refused + granted expel on START (references PEAA–PEBC; handoff 7-section format)

### 22.1 Base commit and game profile
- As §21.1. Run 12:31–12:37 CET, two fresh boots. Captures: `private/shots/ishar2/party/`.
- Contract: `codex-support/quesh/party-contract-ishar2.md` `7bb0a7dec2f2` (read-only).

### 22.2 Question
Do the contract's E2 and E3 reference sequences produce the predicted votes, texts and bytes? Specifically:
- the deterministic vote (R4/R7);
- the losers' penalty (R6);
- the recruit copy (R9);
- the expel clearing (R10).

### 22.3 Reproducible input

| ref | base | clicks after save A | saves |
|---|---|---|---|
| E2a | GRIMZEL | (72,131) [name SW-N-1] menu → (48,150) expel → (32,170) [name SW-N-6] → OK (127,136) | PEAA 40cde9b8, PEAB 11a42a7c |
| E2b | in-session after PEAB | (72,131) → (16,150) recruit → (128,90) [name SW-N-7] sprite → OK (127,136) on the sheet → OK (127,136) after the vote. The contract's step 9 (second OK) was not needed | PEAC 3865f46d |
| E3a | START (fresh boot) | (8,131) [name SW-N-9] menu → (48,150) → (288,170) [name SW-N-10] → OK (127,136) | PEBA 03d1d1cb, PEBB 159a678e |
| E3b | in-session after PEBB | (8,131) → (48,150) → (160,170) [name SW-N-11] → OK (127,136) | PEBC 00bd1f75 |

The task brief said "recruit [name SW-N-11] 4:0". [name SW-N-11] is already a START member, so the contract's granted path (expel [name SW-N-11] 4:0) was run.

### 22.4 Data contract
As contract §E2/§E3 (offsets table above E2): name 936 + 10n, XP 986 + 2n, HP 996 + 2n, class 1276 + n, actor id 1476 + n, grid 7111 + 5col + row, relations 7356 + 5a + b, skills 7546.. / 7729, 0x5068 = 8034 + n.

### 22.5 Result
Game texts (German, verbatim from the captures/log):
- E2a vote panel: (see private SW-22.5-a).
- E2b candidate sheet: (see private SW-22.5-b). Vote: all four „dafür“ → „Mitglied aufgenommen“.
- E3a: (see private SW-22.5-c).
- E3b: (see private SW-22.5-d).

| prediction (contract) | observed | verdict |
|---|---|---|
| E2a vote 3:1, [name SW-N-3] the only "against" (see private SW-22.5-e) | as predicted, „akzeptiert“ | **proven** |
| E2a expel clearing (R10): id 1476 → FF, HP 0, class FF, grid 7114 → 0, penalty on [name SW-N-3]'s relations | as predicted (case-allowed bytes 997, 1276, 1476, 7114, 7363/7367/7369/7370/7373/7378) | **proven** |
| **XP 986/987 (see private SW-22.5-f), attributed to R10 (expel, L_05f26)** in the cumulative GRIMZEL → PARTY1 table | zeroed already at E2a (PEAA → PEAB: (see private SW-22.5-g)) | **proven, the contract is right**. The row sits in the E2 cumulative table, but its rule is R10 = expel. The deviation was in my plan's E2a check list, which omitted it; it now passes with `--word 986=0`. It also matches E3's "XP 990–991 already 0" |
| E2b sheet: (see private SW-22.5-h) | as predicted | **proven** (sprite hit at (128,90): proven for this position) |
| E2b vote 4:0 (forced 10 for id 51) | 4:0 „Mitglied aufgenommen“ | **proven** |
| E2b copy (R9): (see private SW-22.5-i), id 51, 3363 → 0, grid 7125 → 1, relation rows R8, (see private SW-22.5-j), inventory/0x4fde zeroed | all as predicted (PEAB → PEAC, 0 unexpected) | **proven** |
| E2b needs two OKs (step 9) | one OK was enough; the view returned with [name SW-N-7] in slot 0 | **contradicted** (UI detail only) |
| E3a 1:3 refused, no save change | „abgelehnt“; no change besides the clock | **proven** |
| E3b 4:0 granted, no penalty: 1000 → 0, 1278 → FF, 1478 → FF, 7125 → 0, 8036 → 0 | exactly these bytes | **proven** |

**Spelling "[name SW-N-8]" vs "[name SW-N-7]":**
- The save and data bytes read (see private SW-22.5-k). This is the same in PEAC, all 20 original saves that contain it, and EN1.FIC. The leading "X␣" pattern is common to all names, e.g. (see private SW-22.5-l).
- A pixel dump of the sheet capture (`e2b_vote.png`, y 33–41) shows that the 4th glyph has three stems (`##.##` / `#.#.#`): a narrow „m“.
- The text reads **„[name SW-N-7]“**. "[name SW-N-8]" in the log is a misreading of the 320×200 font.

### 22.6 Limits
- The relation matrices were checked only through the tool's allowed-offset sets plus the contract values. There was no independent decode beyond the case check.
- The stale-v[0] variance (R6) was not provoked.
- The tavern recruit after E3b is not covered (open in the contract).

### 22.7 Code proposals
- VM: clear XP in the expel path (R10), not the recruit path.
- After the admission vote, a single OK returns to the view.
- No save patches.

## 23. Ishar 1 magic records: T1 Mental shield / T2 rune Regeneration / T3 Fireball (references MTDA–MTFB; handoff 7-section format)

### 23.1 Base commit and game profile
- Ishar 1, Deutsch (KP_3), DOSBox-X; run 2026-11-03 12:38–12:45 CET.
- Log: `private/run_magic_i1.md`. Captures: `private/shots/ishar1/magic/` (98 files).
- Contract checked: `quesh/magic-contract-ishar1.md` `6ae893f708ad` (read-only).
- Base saves are letter copies: SONE (= S1, 92023f2b…) and LPONE (= LP1, 76cf91a1…), listed in `private/letter_copies_sha256.txt`.
- Re-verified 2026-11-03 12:47 CET:
  - All six save hashes match the log.
  - MTEA == MTDA (6334711f…), so reloading the base is deterministic.
  - CONT unchanged.
  - The `case_diff_i1.py` reruns give the same exit codes as the log (0 / 0 / 1).

### 23.2 Question
Do the R9 predictions T1–T3 hold? These are:
- the cost formula `max(0, M − (sl+5))` and the R3 off-by-one;
- the timer and icon bytes;
- the rune is not consumed;
- Fireball damage `L + sl` with no RNG.

### 23.3 Reproducible input
- Load: disk (309,56) → LOAD (160,155) → name → Return.
- Save: disk (309,56) → SPIEL SICHERN (160,146) → OK (272,157) → name → Return. Each save costs 1000 GS.

| ref | base | clicks between save A and save B | saves (SHA-256 prefix) |
|---|---|---|---|
| T1 | SONE | (208,132) ACTION c3 → (40,193) CAST SPELL → (40,163) spell 28 → (32,160) c0 | MTDA 6334711f, MTDB 366db16e |
| T2 | SONE | (224,160) portrait c3 → (199,168) rune → (96,160) c1 | MTEA 6334711f, MTEB 24438aeb |
| T3 | LPONE | turn left (266,101) ×2 → forward (289,82) → turn right (310,101) → forward; save A; then (272,132) ACTION c4 → (40,193) → (40,163) FEUERBALL → (120,80) monster | MTFA e446d34c, MTFB bc6751e6 |

### 23.4 Observed (verbatim German texts)
- Spell list texts:
  - T1: "BRENNENDE HÄNDE 1", "REGENERIERUNG 7", "GEISTIGES SCHILD 6", "RUNEN SCHREIBEN", "EXIT".
  - T3: "BINDUNG 5", "REGENERIERUNG", "FEUERBALL 3", "GEISTIGES SCHILD 6".
- T1: (see private SW-23.4-a) (the timer is running); 4921 = 0x1C; c2 gold −1000 (byte 483, the save fee). No other changes.
- T2: (see private SW-23.4-b); 4185/4186 in 1..720; 4931 = 0x1E; rune byte 5024 stays 30; (see private SW-23.4-c). No other changes.
- T3:
  - (see private SW-23.4-d).
  - Only actor 68 changed (see private SW-23.4-e); actors 63–67 unchanged.
  - Party HP: (see private SW-23.4-f), from monster melee during the walk and the cast.
  - Byte 479 −1 = c0 thousands of gold (0x154e) = the 1000 GS fee for save B. In LPONE, c0 holds all the gold.
  - XP unchanged; (see private SW-23.4-g), at the cap.

### 23.5 Evaluation against the contract
- **proven**:
  - T1 cost 5: sl(28)+5, so the R3 off-by-one holds; (see private SW-23.5-a).
  - Icon 28 and the 720 timer.
  - T2 cost 14; icon 30; the rune is not consumed; rune casting works with no class check.
  - Fireball cost 9 = sl(23)+5 (4+5).
  - Deterministic reload.
- **contradicted**: "all monsters of the group take 14" (the expectation for 63–68). The code agrees with the run that Fireball hits ONE actor:
  - FRISE L_02676 → L_02d80 → L_02de6 reads the actor id from the single picked entity, `ohimb(0x015e,0x0d)`.
  - It makes one roll, one `HP 0x1b22[a] −= L+sl` and one ckill.
  - There is no loop over actors. Only Lightning (L_02f66) is an area spell.
  - So the contract's T3 text was wrong; R6 itself ("damage spells … actor") is right.
- **consistent, not exact**: damage 14. (see private SW-23.5-b), but this one sample does not measure the exact amount.
- **explained**: the 479 change is the save fee and not part of the spell. Party HP 469/471 is melee damage.

### 23.6 Open
- Exact damage value: needs a target with HP > 14, e.g. a re-run on 65/66 (see private SW-23.6-a).
- The hit-roll rate (93 %): one sample only.
- Timer expiry after about 720 passes: not observed.

### 23.7 Next step
- Codex: keep single-target damage for 14/17/18/19/23/31/32 and area damage only for Lightning.
- Quesh: correct the T3 expectation in magic-contract-ishar1 (owner: Quesh; not edited here).
- Optional: T3b on LPONE, Fireball on actor 65 or 66 → (see private SW-23.7-a). Check: `case_diff_i1.py MTFA.SAV <B> CAST --char 4 --cost 9 --dmg 14 --ids 65`.

## Addendum 3 (2026-11-03, run log private/run_quesh_addendum3.md)
- QF-T4 (byte 21 survives save/load): PROVEN (with patch). QFLB..QFLE -> QFMB..QFME, offset 21 stays 1/2/3/4, header [x,y,face,map,scene]=(see private SW-A3-a) unchanged; diffs only clock/world ticks.
- T5 lock-picking door 29: plan location CONTRADICTED (map 3 (6,55) is town scene 23, not DJ1 decor; PCAVE lock entity cannot spawn; walked through unblocked in SASCHA (d29=1) and LCKBASE (d29=0); lock click LCKH->LCKI leaves 0x4aa4[29]=0). Runtime success rate OPEN. "0x4b58 has no gameplay read" remains known (code).
- T4 ritual GRIMZRIT: **PROVEN (unpatched)**, RITC → RITB. 0x50b4 (file 82) 0 → 1; 0x50ae (file 106..110) all 0 → the five placement codes in placement order; party ids 1476..1480 unchanged (no id swap, prediction confirmed); XP/HP unchanged. Text „Duilgelindildong!“ and a druid sprite appeared. Extra changed bytes: 1339 (armour, from moving the hand item) and 8041..8045 (object table). The earlier "freeze" was a non-redrawing sheet; right-click closes it.
- T4 negative control RITNA/RITNB: **OPEN (blocked)**. Expelling the needed member triggers a party vote that was refused (1:3, „abgelehnt“); forcing it would need a save patch, which is not allowed.
- QF-T2 unpatched from QFPN (QFQA = QFPN state): **OPEN**. No PEOPLE1 actor was visible in any of the four directions; the arrest path needs a hit (fight action), excluded by the no-fight rule.
- Integrity after the 13:23 rollback: all recorded save hashes and letter copies match; originals `sha256sum -c` OK. No REFERENCES sections for Quesh addenda 1/2 exist (never written or lost: unknown).

## Addendum 4: Ishar 1 door/lever contract (quesh/tuer-hebel-trigger-ishar1.md), run log private/run_door_lever_i1.md
- T7 new-game init: **PROVEN (unpatched)**. Fresh new game saved: door bytes 4613+d = 1 exactly for d ∈ {25,27,28,30,33,34,36,38}, all others 0; lever bytes 4663+k all 0.
- T5 no reset on step/turn: **PROVEN (unpatched)**. LPONE → LPSTEP via many forward steps and turns (position and facing changed; values in private log): bytes 4613..4712 unchanged (0/100).
- T1, T2, T3, T6: OPEN (not yet run). T4: OPEN (needs a save patch, not allowed).
