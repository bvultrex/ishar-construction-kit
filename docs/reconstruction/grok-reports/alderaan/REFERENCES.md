# Alderaan: reproducible original references (manifest, preparation stage)

Status: 2026-10-18 19:55, Europe/Berlin. **Ishar 2 has complete references for all four cases:** floor pickup (§8), NPC via tavern listen (§9), shop buy SHOPB (§10; SHOPA kept as a noted double buy), tavern meal MEALB (§11) and enemy encounter ENCB (§12; blow-by-blow replay check of the combat contract in §12.8). **Ishar 1 has references for all four cases (run 19:31–19:38 CEST in `private/work/ishar1`):** NPC = trainer interaction NPCA (§13), item transfer ITEMA (§14), shop buy SHOPA (§15) and encounter ENCA (§16, unpatched). Selling does not exist in either original (known, §10 / §15). Open gaps: Ishar 1 tavern NPC (not reachable from S1), Ishar 1 floor pickup/drop (unknown), Ishar 2 item transfer/drop (row 2). Images and saves live only under `private/`, and nothing here is in git.

## 1. Base commit and game profile
- Handoff: `docs/reconstruction/GROK_COLLABORATION_HANDOFF_2026-10-18.md`, blob in commit `bb427487ecce407124b5d98df50a8ca9627cbd60`, verified code state `319819c83d8dfe30675bba3ad8a51b43c3afc871`. Read through the GitHub connector; the local repo does not have this commit and was not changed.
- Working copies (byte-identical to `/workspace/ishar/originals`, checked with `diff -rq`): `private/work/ishar1`, `private/work/ishar2`. Full hash lists: `private/sha256_ishar1.txt`, `private/sha256_ishar2.txt`.

| Game | start.exe SHA-256 | MAIN.IO SHA-256 | START.STP |
|---|---|---|---|
| Ishar 1 | `3ea63234c97b77d88e3c18aa5d88ac10dede1f10daf2854225b88b7d948d588b` | `27c5834de005afc99d7819a0b2244e7d176421451c80a3befd6c273b0ef0bd7b` | d4eb29e4… (same in both games) |
| Ishar 2 | `5e35e58d2d133dadeed4b233b7f962f9c941c3d635feb9d3a067a63c340dadf9` | `bfab5e9175931dbb1c2c51f0576092ef423e0bf950579340c8a1715e8cf8db95` | d4eb29e4… |

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
| 1 | Ishar 2 | NPC | S.SAV (`49c2bb82ca246cee`) | Map 3 Zach, scene 10, r17 c56, facing 3 (S) | Red messenger PEOPLE1 (actor 94, type 64) at r18 c56, facing 2. Same figure as K3N000–003 (K86) | Load S → turn left (266,30) once → facing O → figure 1 cell ahead → click the figure (≈128,80) → then try the action icons (F1–F5) for talk | Figure visible (sprite #8+d per EAFF). Interaction response **open**: PEOPLE1 0x00038 reacts to message 40 only in scene 3 | **messenger: not possible** (actor 94 has 0x4f4c = 0, known). **Replaced by the tavern reference, done 18:21 CEST, see §9** |
| 1m | Ishar 2 | Tavern meal (NPC service) | S.SAV (`49c2bb82ca246cee`) | as row 1 | Tavern t = 2 at (17,55), button 2 "Essen" | turn left 2× → forward → Essen → ok → close message → exit | −580 gold, food 100 | **done: MEALB (18:44–18:45 CEST), §11.** MEALA (no ok) kept as the negative case |
| 1b | Ishar 2 | NPC (alternative) | LP3.SAV (`e82bcf3e283020af`) | Map 3, scene 23, r3 c55, facing 4 (W) | Sailor MARIN (type 12) at r6 c55, facing 2 | Turn left twice (W→S→O) → forward 2× → click the figure | Dialogue/boat offer (suspected) | pending |
| 1 | Ishar 1 | NPC (trainer "stage"; tavern as fallback) | S1.SAV (`92023f2b51e34f74`) | Zone 1 (CONT1), x30 y17, facing 4 (x−1) | Training entrance A = −43 at (31,18) (table 0x4178 entry (31,18,zone 1,#10)) | Turn right 2× (4→1→2) → forward → x31 y17 (A = 57) → turn right 1× (2→3) → forward → message 17 parameter 3 → stage.IO → select a character / training dialogue | Training screen (MAIN 0x038c6) | **done: NPCA (19:32–19:33 CEST), §13.** Trainer dialogue up to the price, EXIT without paying. The tavern fallback is not reachable from S1 (§6) |
| **2a (FIRST)** | Ishar 2 | Floor pickup → backpack / hand (Quesh contract `quesh/pickup-contract-ishar2.md`) | **PICK9.SAV**, a labelled toolkit patch of START.SAV (`c306cfc7c77d7aa0`; source START `e685cd6902575392`; 4 bytes: file 345/545/745/8048 = 12/12/1/2) | Map 1, r11 c12, facing 2 (E); object 9 on r12 c12 | Object 9 one cell ahead (sprite OBJET res 115) | Load PICK9 → click (128,113) → A: portrait 1 (32,170), or B: hands icon of char 0 then slot 10 (50,168) → save as a NEW name PICK9A/PICK9B | Pickup clears 345/545/745 (8048 stays 2); A: c0 slot 0 = 9 (file 1037); B: c0 slot 10 = 9 (file 1057); armour 0x2f0e unchanged (armour(9)=0); hit box x 116..141 / y 104..123 (hypothesis, to be bisected). Check: `private/pickup_diff.py`, plan `private/pickup_plan.md` | **done (A 16:50, B 17:06, edges 17:50, armour C2 R/T/U 18:05–18:08 CEST): all checklist bytes confirmed, armour rule confirmed, edges measured (y 1 px higher); open: slot-9 swap, pointer hotspot (§8)** |
| 2 | Ishar 2 | Item: transfer / drop / pick up | S.SAV | as row 1 | Character 4 (slot 3) carries items (inventory word values −51/−57/−59, slot layout suspected) | Click name 4 (≈224,193) → sheet → pick up an item → click portrait 1 (≈32,160) → transfer; then pick up the item again and click into the viewport floor (≈128,110) → lies on the floor → click it → back in the cursor → click a portrait | Item in the other inventory; floor drop writes 0x2c4e/0x2aba/0x2b84 (SOURIS 0x009ce) | pending |
| 2 | Ishar 1 | Item | S1.SAV | as above | Inventory of the active character (manual p. 6/11: "click on item"; "drop" on the sheet destroys the item) | Sheet via the name → move an item to another face (transfer). To place it on the floor: click into the 3D view with the item (suspected) → pick it up again | Transfer known from the manual; floor drop in Ishar 1 **not confirmed in code** | **done (transfer only): ITEMA (19:33–19:34 CEST), §14.** Key c0 slot 7 → c3 slot 0. Floor drop/pickup: **unknown, not run** |
| 3 | Ishar 2 | Shop | S.SAV | Map 3, r17 c56, facing 3 | Cell (17,57): A = −5, B = −18 → shop 1 (marchand.IO) | Load S → forward (287,26) → shop screen → "Buy", choose item, click character → "Sell" | marchand.IO with shop number 1 (MAIN 0x0326a) | **done: SHOPB (18:43–18:44 CEST) = one rope, −700, c0 slot 0 = −41, §10.** SHOPA (2 ropes) kept as a noted double buy. **Sell: does not exist in the original (known, MARCHAND has no gold-increase or slot-clear path, §10)** |
| 3 | Ishar 1 | Shop | S1.SAV | Zone 1, x30 y17, facing 4 | Shop #1 at (31,16), table 0x3fd6 | Turn right 2× (4→1→2) → forward → x31 y17 (A = 57) → turn left 1× (2→1) → forward → message 17 parameter 2 → marchand.IO, shop #1 → buy/sell | Shop (MAIN 0x0381c, PARAM 0x02456 table) | **done: SHOPA (19:34–19:36 CEST), §15.** „WURFDOLCH (+1)“ 1 100 GS to c2 slot 3. **Sell: does not exist (known, §15)** |
| 4 | Ishar 2 | Enemy encounter | LEVELING.SAV (`dac7e0a405fa442a`) | Map 3, scene 21, r65 c12, facing 1 (N) | 5× GUARD3 (actors 90–94, HP 72–80) at r65 c11/c10, facing 1 = directly ahead | Load → screenshot (guards visible at distance 1) → attack icon F6 (character 1) or click a guard | Guards visible (GUARD3 #13+d). Whether they are hostile is **suspected** (GUARD3 handler 21 = attack) | **done: ENCB (18:45–18:48 CEST), §12.** One forward step onto the guards' cell, 8 rounds F6/F7: actor 91 killed (HP 72→0, removed), XP +3/+4/+3/+3/+3, HP c0 −51, c1 −35. Actual layout: 12 guards (actors 90–101), 3 per cell; attacks need the same cell. ENCA (no approach) kept as the negative case |
| 4 | Ishar 1 | Enemy encounter | LP1.SAV (`76cf91a104ec8675`) or IMP1.SAV (`cc4405e2ff12a3b6`) | LP1: zone 15 (CONT5 cave), x20 y53, facing 3. IMP1: zone 14 (CONT4), x27 y72, facing 2 | LP1: 6 actors (63–68, type −4, HP 6–15) at (25,54). IMP1: 3 actors at (35,72) | Wait in place for up to 60 s, screenshot every 10 s; then move toward the group | Encounter **not guaranteed** statically: no direct path (CONT5 x22/23 y54 = −99) | **done: ENCA (19:36–19:38 CEST), §16, unpatched.** The group came to (22,52); 8 rounds ATTACK c0/c1 killed all 6 (HP→0); party HP −11/−14. XP is capped, so the proof is monster HP + party HP. Seen twice (probe + run) |

## 6. Limits and next step
- Rows marked done were run in the original; the remaining rows (Ishar 2 row 1b, row 2) are still static plans.
- Facing and turn directions in Ishar 1 are known from GERDEP. From code reading, the edge codes in the S1 street (x28..33, y17: 54/57 alternating) leave only x30↔x31 reachable: 54 = wall on the x−1 side (blocks leaving toward x−1 and entering while moving x+1), 57 = wall on the y+1 side. The taverns at (29,16) and (33,18) are therefore not reachable from S1 by walking. Trainer and shop both work from x31. If the operator *can* walk further, the edge-group reading is wrong: report it (relevant for U20).
- Next step: an operator runs the table rows, saves shots and the final states under `private/`, and fills in the Result column with: success / different / not reproducible.

## 7. Code proposals
None. **Proposed save patches (not applied):**
- P1, Ishar 1 encounter: copy LP1.SAV and set the party position (bytes 2–7) to x25 y53 facing 3, next to the actor group (25,54). Reason: the encounter depends on monster movement (AI). Mark the result "patched". **Not applied and currently not needed:** ENCA (§16) reached the encounter unpatched; keep P1 only as a fallback if the approach fails twice.
- P2, Ishar 2 NPC with confirmed message 40: none needed; patch only if row 1/1b gives no interaction.

## 8. Case 2a record: Ishar 2 floor pickup (handoff 7-section format)

### 8.1 Base commit and game profile
- Handoff `bb42748`, code `319819c`, routine contract `codex-support/quesh/pickup-contract-ishar2.md` (R1–R7).
- Ishar 2 DOS, `start.exe` `5e35e58d2d133dadeed4b233b7f962f9c941c3d635feb9d3a067a63c340dadf9`.
- Script hashes as in the contract (AFFOBJ/OBJET/SOURIS/FRISE/IO).
- DOSBox-X 2025.02.01, `private/dosbox-ishar2.conf` (cycles fixed 25000, core normal, autolock=false, nosound), working copy `private/work/ishar2`. Language 3 (Deutsch).

### 8.2 Question
Original behaviour of ground pickup → cursor → drop (A: portrait/backpack; B: hand slot with hands panel open), including the armour field 0x2f0e and the exact click box.

### 8.3 Reproducible input
| item | value |
|---|---|
| Start save | **PICK9.SAV** `c306cfc7c77d7aa067eca75de9b6c21db11989dda74135ca35034b3c43e033ee`. **Labelled toolkit patch** of START.SAV `e685cd6902575392a9fe445e649863885f75832ed28657a5f6faf612c6305555`: 4 bytes, file 345/545/745/8048 = 12/12/1/2 (object 9 on map 1 r12 c12), as in the contract |
| Position | map 1, r11 c12, facing 2 (E); object 9 one cell ahead |
| Calibration | game (0,0) = X-screen (730,468) on the operator display, 1:1 |
| Inputs, A | disk (266,12) → LOAD (238,32) → `p i c k KP_9` → Return → click (128,113) → click portrait 1 (32,170) → disk → SAVE (240,58) → `pick9a` → Return |
| Inputs, B | as A up to the pickup → hands icon of char 0 (40,131) → click (50,168) → SAVE → `pick9b` |
| After, A | PICK9A.SAV `4cca3b035c9f006a54c46f8ebcf17b4d9b03beaef867f5533429ef08c1ba2ed4` |
| After, B | PICK9B.SAV `86acb5d64012ca51a2dff5ee1588da8895d2331792115562d25450d9421087b7` |
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
- **Start save:** PICKQ.SAV `78d3fbdb51aaf7ac053e2804bd9d4e5957302b763391012ef695a0224f2309ca`. It is a letter-named byte copy of Quesh's PICK25 (labelled toolkit patch of PICK9: c0 slot 10 = −25, 1336 = 4). A letter name was used because digits in the name field were unreliable.
- **Points used, all hit first time:**
  - c0 hands panel (40,131), c0 slot 10 (50,168)
  - c1 hands panel (104,131), c1 slot 10 (114,168)
  - portrait 1 (32,170)

| save | sha256 | inputs | bytes (vs base) | pickup_diff |
|---|---|---|---|---|
| PICKR | `f9ba3933b9c73cfbee2d4ef25671efc73401ed744dc5c4f3ca151fee5f8a5a70` | load pickq, (40,131), (50,168), (104,131), (114,168), save | vs PICKQ: 1056/57 FF E7→00 00, 1086/87 00 00→FF E7, **1336 4→0, 1337 0→4** | R exit 0 |
| PICKT | `9e9da280230a4cf0a315c58a03fa0006d9833a72273be7dd41d9c0e212e5e206` | from the PICKR state: (114,168), (50,168), save | vs PICKR: reverse, **1336 0→4, 1337 4→0**; vs PICKQ: noise only | T exit 0 |
| PICKU | `c60c95af775d2e28324a6793d39cb9445e97b77f0bc4302a18168a768f9de1c9` | load pickq, (40,131), (50,168), (40,131) close, (32,170), save | vs PICKQ: 1036/37 →FF E7 (c0 backpack 0), 1056/57 →00 00, **1336 4→0**, 1337 unchanged | U exit 0 |
| PICKS | `3ebcb89594bf6ab63d19958b25d6a9abbd313e57f26cd25f985ff2769c81551b` | pick + drop into the same slot | clock only | S exit 0 |

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
- Handoff `bb42748`, code `319819c` (as §1). Ishar 2 DOS, `start.exe` `5e35e58d2d133dadeed4b233b7f962f9c941c3d635feb9d3a067a63c340dadf9`, MAIN.IO `bfab5e9175931dbb…`.
- Scripts involved (SHA-256, byte-identical to `/workspace/ishar/originals`): TAVERNE.IO `ea315973f2187950f7ac72a6c6db4565dd0fd67ede241d56e8a73175fa8bf804`, TEXTIND.IO `b36ded430e7d183ad29be627679aaf8823aeae5cb056394253dec118f048465d`, GERDEP.IO `58d2c57ff3eb8318…`, CONT3.FIC `0340856a122e2a28…`.
- DOSBox-X 2025.02.01, `private/dosbox-ishar2.conf` (cycles fixed 25000, nosound), language 3 (Deutsch), xdotool input only, own instance. Run 2026-10-18 18:19–18:23 CEST.

### 9.2 Question
Original reaction when the party talks to NPCs. The world NPCs near S.SAV cannot react (messenger actor 94 and LP3 sailor have 0x4f4c = 0, known, `private/cases_ishar2_plan.md`). The tavern menu is the guaranteed NPC dialogue.

### 9.3 Reproducible input
| item | value |
|---|---|
| Start save | S.SAV `49c2bb82ca246ceebb2fe3f9c704b41be9350337ec2580d59a6981fdbe747050` (unpatched) |
| Map / position | map 3 (Zach's Island), scene 10, r17 c56, facing 3 (S) |
| Target | tavern cell (17,55): CONT3 A = −5, B = −3 → MAIN 0x03183: tavern index t = \|B\| − 1 = 2 (known) |
| Calibration | game (0,0) = X-screen (730,468), 1:1 |
| Inputs | disk (266,12) → LOAD (238,32) → `s` → Return → turn left (266,30) → turn left (266,30) (facing 3→2→1) → forward (287,26): the move is blocked and the tavern opens (GERDEP 0x00e74 message 17, MAIN 0x03229 `taverne.IO`) → click "Lauschen" (40,132) (bar y 127–137, button = x/80 + 1, TAVERNE 0x00093) |
| Closing | the text scroll stays until one mouse button or key is pressed and released (TEXTIND L_02331, known). That click is consumed; it does **not** act on the menu |
| Leave | exit stone (288,62) (TAVERNE 0x000df: x > 256, screen y < 126) |
| Captures (private) | `shots/ishar2/c/f3.png` (tavern menu), `c/talk3.png` `9b0c2dcb3829b859…` (18:21:52, text scroll) |

### 9.4 Data contract
- TAVERNE 0x00150: button 1 spawns TEXTIND (entity 0x35) with message 100 + t = **102**, then `csleep`. TEXTIND wakes the tavern after the closing click (0x00097). No variable is written (known).
- On leaving any building, MAIN 0x0346f–0x034a0 reverses the party facing (1↔3, 2↔4) (known). Here: entered with facing 1, back in the street with facing 3, so save byte 7 does not differ from S.SAV.

### 9.5 Result
- **Message text (TEXTIND L_01b72, known; matches the capture word for word):** „Unser neues Haus ist sehr angenehm. Das Gefängnis nebenan ist kein echtes Problem, außer nachts ... manchmal um 3 Uhr morgens hört man laute Schreie, aber sonst ...“
- It is shown as a 4-line scroll over the portraits, with button 1 "Lauschen" highlighted.
- State: talk changes nothing. The after-save MEALA.SAV (`5844578953c7d1dd7947eb0a5b15f7916073aa89a388b5a1ebf463800a177c71`; talk plus the failed meal attempt, §11.5) differs from S.SAV only in clock bytes 45/49 (hour 14→17, tick) and 28 bytes of the wandering-monster re-roll of actors 90–93 (EDPLT, §8.4; actor 93 newly placed in scene 10 at (12,53)). Party, gold, inventory, food bytes and position are unchanged. `case_diff.py … TALK` would exit 0. CONT1–7 are unchanged.

### 9.6 Limits
- This is the tavern "listen" dialogue (rumour text of tavern t = 2), not a world-actor conversation. A world NPC needs Act icon 1 on a recruitable actor (plan case 1B, LPD, still open).
- The text depends only on t. Other taverns give messages 100…110 (TEXTIND switch 0x000c6).

### 9.7 Code proposals
None.

## 10. Case 3 record: Ishar 2 shop buy (reference SHOPB; handoff 7-section format)

### 10.1 Base commit and game profile
- Handoff `bb42748`, code `319819c` (as §1). Ishar 2 DOS, `start.exe` `5e35e58d2d133dadeed4b233b7f962f9c941c3d635feb9d3a067a63c340dadf9`, MAIN.IO `bfab5e9175931dbb1c2c51f0576092ef423e0bf950579340c8a1715e8cf8db95`.
- MARCHAND.IO `a5b84f95b8b50f1c68fc8e6c368a67742f9f96a67ca033d6e72ee4d7c4673529`, GERDEP.IO `58d2c57ff3eb8318ac73512d5a89292477fbcc892a4ceb6d75bf7de58b88da4b`, CONT3.FIC `0340856a122e2a28025ab37d5bfc014e25c04d8602db1d668fb9d0b4cd96a276` (all byte-identical to the originals).
- DOSBox-X 2025.02.01, `private/dosbox-ishar2.conf`, language 3 (Deutsch), xdotool input only, own instance. Run 2026-10-18 18:43–18:44 CEST (log `private/run_cases_ishar2_redo.md`).

### 10.2 Question
Original behaviour of entering a shop and buying exactly one item (rope, 700 po), and whether selling exists.

### 10.3 Reproducible input
| item | value |
|---|---|
| Start save | S.SAV `49c2bb82ca246ceebb2fe3f9c704b41be9350337ec2580d59a6981fdbe747050` (unpatched) |
| Map / position | map 3 (Zach's Island), scene 10, r17 c56, facing 3 (S) |
| Target | shop cell (17,57): CONT3 A = −5, B = −18 → shop #1 (MAIN 0x0326a, MARCHAND cswitch 0x00884 → L_008b0) (known) |
| Calibration | game (0,0) = X-screen (730,468), 1:1; click = move, 0.3 s, press 0.2 s, release |
| Inputs | disk (266,12) → LOAD (238,32) → `s` → Return → forward (287,26) → „Möchtet Ihr etwas kaufen?“ → ok (270,134) → grid + „Trefft Eure Wahl, meine Herren.“ → rope (238,104) **once** (status "Seil", pointer disappears) → portrait c0 (32,170) **once** (= the purchase; no visible change) → exit stone (288,62) → „Glückauf, bis wir uns wiedertreffen.“ → street → disk → SAVE (240,58) → `shopb` → Return |
| After | SHOPB.SAV `22b8f790befdc4ca16216b5b2e9ae93a57425b854e9c254cec0f40a48345dc99` |
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
| 1007 | 2A → 29 | c0 gold thousands 0x2d68, 42 → 41 | known |
| 1026/27 | 01 36 → 02 62 | c0 gold units 0x2d80, 310 → 610 | known |
| 1036/37 | 00 00 → FF D7 | c0 backpack slot 0 = −41 (rope) | known |
| 31 bytes 3444–6874 | various | EDPLT re-roll of wandering actors 91–94 in scene 10 (HP 0x36ac, 0x3d9e/0x3e0e/0x3e7e/0x3eee/0x3f5e/0x41fc, attitude 0x43ba, scene 0x449a; actor 93 newly placed in scene 10) | known mechanism, RNG outcome |

- Gold: 310 − 700 = −390 → units 610, thousands 42 − 1 = 41 → **41 610** (−700). Other characters unchanged.
- `case_diff.py S.SAV SHOPB.SAV SHOP --char 0 --code -41 --price 700`: all checks OK, `tolerated: facing reversal (MAIN 0x0346f) offsets [7]: facing 3 -> 1`, no unexpected offsets, CONT1–7 unchanged, **exit 0**.
- **SHOPA (noted double buy, 18:23–18:25 CEST):** SHOPA.SAV `0c4a99a81df6ceb832121550ee5f19e1720471e6135a1add65c70ed21660fac6`. The operator did rope → portrait twice, so two complete purchases: gold 42 310 → 41 610 → 40 910 (−1 400), slots 0 and 1 = −41, byte 7 3 → 1, clock 45/49. Exact 10-byte diff: 7 03→01, 45 0E→11, 49 FE→72, 1007 2A→28, 1026/27 01 36→03 8E, 1036/37 and 1038/39 00 00→FF D7. `case_diff` SHOP exits 1 (deviation: −1400, 2 slots), as it should.

### 10.6 Limits
- One item type (rope, non-stack) in shop #1. Stack items (bread −50, 0x4bd4 counts) are not covered (`case_diff` SHOPS, untested).
- No visual feedback while an item is "held" (pointer hidden, known); operators must count their portrait clicks.

### 10.7 Code proposals
None for the game. Tooling: `private/case_diff.py` now tolerates the building-exit facing reversal at offsets 6/7 for SHOP/SHOPS/MEAL/ROOM/TALK (applied 2026-10-18, backup `/tmp/case_diff.py.before`).

## 11. Ishar 2 tavern meal record (reference MEALB; handoff 7-section format)

### 11.1 Base commit and game profile
- As §10.1, plus TAVERNE.IO `ea315973f2187950f7ac72a6c6db4565dd0fd67ede241d56e8a73175fa8bf804`, TEXTIND.IO `b36ded430e7d183ad29be627679aaf8823aeae5cb056394253dec118f048465d`. Run 18:44–18:45 CEST.

### 11.2 Question
Original behaviour of the tavern meal (button 2 "Essen"): price, confirmation, payment, food effect.

### 11.3 Reproducible input
| item | value |
|---|---|
| Start save | S.SAV `49c2bb82ca246cee…7050` (unpatched) |
| Map / position | map 3, scene 10, r17 c56, facing 3 |
| Target | tavern cell (17,55): A = −5, B = −3 → t = \|B\| − 1 = 2 (MAIN 0x03183) (known) |
| Inputs | load `s` → turn left (266,30) → turn left (266,30) (facing 3→2→1) → forward (287,26) (blocked, tavern opens) → **no "Lauschen"** → "Essen" (120,132) → bar line „Preis für ein Essen: 580 po“ with ok/exit → **ok (270,132)** (in this state the point is "ok", not "Rekrutieren") → eating picture + message → **one closing click (128,60)** → button bar back → exit stone (288,62) → street, facing 3 → save `mealb` |
| After | MEALB.SAV `091c36a8c06428b640054a64016bfe47f8a655d7d9cd6326e84b0ef73bd4ad62` |
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
| 1007 | 2A → 29 | c0 gold thousands 42 → 41 | known |
| 1026/27 | 01 36 → 02 DA | c0 gold units 310 → 730 | known |
| 1326–1330 | 52 61 5D 52 5D → 64 64 64 64 64 | food 0x2ef6 c0–c4 82/97/93/82/93 → 100 (all > 60) | known |

- Party gold 42 310 → **41 730 (−580)**; c1–c4 hold no gold, so c0 paid everything. No re-roll bytes appeared in this run (why the EDPLT re-roll left no trace here is unknown; the RNG outcome may have matched). Byte 7 unchanged (turned 3→1, exit reversed 1→3).
- `case_diff.py S.SAV MEALB.SAV MEAL --tavern 2`: total −580 OK, hour 14→17, no unexpected offsets, CONT unchanged, **exit 0**.
- **MEALA (negative case):** MEALA.SAV `5844578953c7d1dd7947eb0a5b15f7916073aa89a388b5a1ebf463800a177c71`. "Essen" was clicked while the "Lauschen" scroll was still open; the click only closed it. No payment, no food change (clock + 28 re-roll bytes only, §9.5).

### 11.6 Limits
- Only tavern t = 2 and a party where one character holds all gold. The even split across several paying members is known from code but not observed.
- Which text variant appears is random (known); the exact hour after saving includes clock ticking.
- ROOM (button 3, 1 060 po, +7 h) not run.

### 11.7 Code proposals
None.

## 12. Ishar 2 enemy encounter record (reference ENCB; handoff 7-section format)

### 12.1 Base commit and game profile
- As §10.1, plus EATT.IO `d5ef72a5b25eabb50e89a9142ef8acf176f9023c82e694bfe8a06290ba7b14ec`, FRISE.IO `27117c124caf904a31568f5c58f615946083dd3429c02ade1dc1e17552cc2b64`, SOURIS.IO `78df7c73f880466303867b63dd5e20897777802b0595c64935b9f4462354f9d3`, GUARD3.IO `267b32ea639130a6e24e00f6a9a8bfeda048aea2e42ef1174909c47300189c4b`, EDPLT.IO `2f6156c6a2ae2087296a82b62886fe2088dd490571b7419b6ca8bdb214f39ecb`. Run 18:45–18:48 CEST.

### 12.2 Question
Original behaviour of a melee encounter: approach, attack input, damage taken, kill and XP.

### 12.3 Reproducible input
| item | value |
|---|---|
| Start save | LEVELING.SAV `dac7e0a405fa442aae6ec4fb01a3b1aec35a1b1777857c51f183f29def215c57` (unpatched) |
| Map / position | map 3, scene 21, r65 c12, facing 1 (= col − 1); party HP 235/244/115/36/56 |
| Target | 12 hostile GUARD3 actors (0x43ba = −1, facing 1, HP 72–82), 3 per cell: (65,11) = 90–92, (65,10) = 93–95, (65,9) = 96–98, (64,8) = 99–101 (known, from the save) |
| Inputs | load `leveling` → forward (287,26) **once** (party on (65,11), the front guards' cell; first hit on c0 immediately) → 8 rounds: F6 (c0), ~1.5 s, F7 (c1), ~1.5 s (18:46:14–18:47:38) → Back (287,62) once (to (65,12), out of reach) → save `encb`. Not F8 (c2 has no melee). **Never** Act icon 3 at (80,160) |
| After | ENCB.SAV `5d7cf5b567450fa54bdb3407afb10633705f29f993760ca05524b2b2b207d881` |
| Captures (private) | `shots/ishar2/c2/e1a…e4`, `r1a…r8b` (r8: front-left guard no longer drawn) |

### 12.4 Data contract
- Known, EATT 0x00102–0x00180: on maps ≠ 1 guards attack only an actor/party on their **own cell** (EATT L_00553 → party HP 0x2d5c).
- Known, GERDEP 0x00c8b–0x00e3e: on maps ≠ 1 hostile actors block moves out of the party's current cell only in their facing direction; stepping onto their cell and stepping back are allowed. (`render-tables/collision_maps1-4.json` says "target cell" for all maps; that is wrong for maps ≠ 1.)
- Known: F6–F10 = DOS codes 192–196 → 0x4f12 = 15–19 → FRISE L_00909 for c0–c4. Each swing costs 1 food 0x2ef6 (FRISE 0x04fbb/0x05357). Kill XP via FRISE 0x05846/0x0585d.
- Suspected: only guards drawn at depth 0 can be hit (FRISE L_05552 `ctstform`, GUARD3 `cforme 0+depth`), which explains ENCA.

### 12.5 Result
- Hits taken shown on the portraits (Bragl = c0 in rounds 0, 1, 5, 6, 8; Grokr = c1 in round 3); no HP bar below ~1/3; after round 8 the front-left guard was gone.

**Exact diff ENCB vs LEVELING (78 bytes, complete):**
| file offset | before → after | meaning | class |
|---|---|---|---|
| 45, 49 | 14 → 17, 6F → D9 | hour 20 → 23, tick (clock) | known |
| 91, 93 | 02 → 03 | day phase 0x519f/0x51a0 evening → night | known |
| 987/989/991/993/995 | +3/+4/+3/+3/+3 | XP 0x2d50 c0–c4 (kill XP goes to all five) | known |
| 997 | EB → B8 | c0 HP 0x2d5c 235 → 184 (−51) | known |
| 999 | F4 → D1 | c1 HP 244 → 209 (−35) | known |
| 1326/1327 | 44 → 3D, 46 → 3E | food c0 68 → 61 (−7), c1 70 → 62 (−8): swings | known (that c0 shows 7, not 8, is unknown: a press during recovery or regeneration) |
| 3444 | 48 → 00 | actor 91 HP 72 → 0 | known (kill) |
| 6872 | 15 → 00 | actor 91 scene 0x449a 21 → 0 (removed) | known |
| 64 other bytes 3442–6221 | various | actors 90/92/94–101: HP 0x36ac and stat blocks 0x3d9e/0x3e0e/0x3e7e/0x3eee/0x3f5e/0x41fc; EDPLT re-roll after load (hits on surviving guards cannot be separated from the re-roll) | known mechanism, RNG outcome |

- Party position and facing (bytes 2–7) unchanged: forward then Back.
- `case_diff.py LEVELING.SAV ENCB.SAV ENC`: combat proof OK (XP [3,4,3,3,3], HP [−51,−35,0,0,0]), "actor 91 left scene/died (HP 72→0)", no unexpected offsets, CONT unchanged, **exit 0**.
- **ENCA (negative case):** ENCA.SAV `88b7442c3fbda4cefee1816fcf919792824793cafe06673e1c17d16b8242e01f`, no approach step. F6/F7 swung 8× each (food −8) but hit nothing and took no hits: the guards were one cell ahead. Diff: clock, day phase, 1326/1327, 66 re-roll bytes.

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
| LEVELING | `dac7e0a405fa442aae6ec4fb01a3b1aec35a1b1777857c51f183f29def215c57` | start |
| ENCZ | `084e51507561b4aeeb0838a72305f386ad5e440783989c2a5fda58cd81984c63` | after load (EDPLT re-roll; actor 91 level 6 → 9, HP 72 → 78) |
| ENCYA | `437ab955adb657a9c9b97f39ca92b937b0b07d432351e97a6692703c0a6428c0` | after forward onto (65,11) |
| ENCYB | `94da9228afee35a2dfc150c48b0eeeb1596102b08365d96d1c636132d12d00ec` | round 1 |
| ENCYC | `8a5a8fdd111d878a147262c67897f3b777e7ed6cb345171eb1089e5373b3b494` | round 2 |
| ENCYD | `1bcef6e41df56d9616e81a6082200974f7854faa03af0037a9419c9aefce4e97` | round 3 |
| ENCYE | `54f925421148157a526e06c8786abf470bc085bccd5c6f2bb6af7a6e7cfac41c` | round 4 |
| ENCYF | `4df3dde6ff682248573393c8c544f1fe62cf413a24dd2d90d414adcc43388edd` | round 5 |
| ENCYG | `c8e75068e13ea18f07a56dd14436729e626affaa047774d4b1121ad2d48322b5` | round 6 |
| ENCYH | `233f3293ba74748474383d468821e931fa4632c2f40b7d24a30f44540e722238` | round 7 (kill) |
| ENCYI | `9990bbfc18697a8ab6252b37b6efb3d09204f567bad75cdf9acbfd3bb6babefd` | round 8 |
| ENCYJ | `1401ab9a40b7907d0e8057f339eaa0f95641b73ca56fa6b48f71ad269499a52b` | after Back to (65,12) |

**Per-step table** (video counts against save values; "splash n" = the number drawn in the guard splash)

| step (save) | c0 swing (F6) | c1 swing (F7) | actor 91 HP (save) | guard hits on c0 / c1 (video splashes, every one shows „1“) | party HP c0 / c1 (save) | Δ HP | food c0 / c1 | XP Δ c0–c4 |
|---|---|---|---|---|---|---|---|---|
| forward (ENCYA) | – | – | 78 | 4 / 1 | 231 / 243 | −4 / −1 | 68 / 70 | 0 |
| r1 (ENCYB) | hit, splash 7 | hit, splash 17 | 54 (−24) | 7 / 6 | 224 / 237 | −7 / −6 | 67 / 69 | 0 |
| r2 (ENCYC) | hit, 4 | miss | 50 (−4) | 8 / 1 | 216 / 236 | −8 / −1 | 66 / 68 | 0 |
| r3 (ENCYD) | hit, 7 | hit, 3 | 40 (−10) | 7 / 3 | 209 / 233 | −7 / −3 | 65 / 67 | 0 |
| r4 (ENCYE) | hit, 5 | hit, 14 | 21 (−19) | 4 / 5 | 205 / 228 | −4 / −5 | 64 / 66 | 0 |
| r5 (ENCYF) | hit, 17 | miss | 4 (−17) | 7 / 4 | 198 / 224 | −7 / −4 | 63 / 65 | 0 |
| r6 (ENCYG) | miss | miss | 4 | 6 / 3 | 192 / 221 | −6 / −3 | 62 / 64 | 0 |
| r7 (ENCYH) | **kill**: no splash; front-left guard removed at frames 2039–2046 | hit, 3 on **actor 90** (78 → 75) | 0, scene 21 → 0 | 6 / 6 | 186 / 215 | −6 / −6 | 61 / 63 | **+4 / +2 / +2 / +2 / +2** |
| r8 (ENCYI) | miss | miss | 0 | 3 / 3 | 183 / 212 | −3 / −3 | 60 / 62 | 0 |
| Back (ENCYJ) | – | – | 0 | 2 / 1 | 181 / 211 | −2 / −1 | 60 / 62 | 0 |
| **total** | 8 swings: 6 hits, 2 misses | 8 swings: 4 hits, 4 misses | 78 → 0 | **54 / 33** | 235 → 181 / 244 → 211 | **−54 / −33** | **−8 / −8** | +4 / +2 ×4 |

- Every guard splash number equals the save HP change of actor 91 (or 90 in r7) for that round. The c0 hits (7, 4, 7, 5, 17) lie within the contract range 2–21; the c1 hits (17, 3, 14, 3) lie within 1–20.
- Hits on c2–c4: none (their HP is unchanged).

**Other changed offsets (known)**
- 7576–7578 = 0x4b80[0..2], the three front-cell slots. EAFF 0x0057f/0x005a1/0x005cb fill them when the party steps onto the guard cell (ENCZ → ENCYA: 0,0,0 → 91,90,92). FRISE 0x057b3 clears the killer's form slot on the kill (ENCYH: 7576 91 → 0). GERDEP 0x013d5–0x013e9 clears all three on movement (Back, ENCYJ). They are therefore 0 at both ends of ENCB, which is why the contract lists them as "unchanged".
- 7409 = 0x4aa4[28] (block 0x4aa4 at file 7381, + 28), a time-of-day world flag. GERDEP 0x004f3–0x0054a sets it to 1 when the hour 0x4fc6 = 1 and to 0 at hour 4, and wakes the entity of type 0x5b. The hour went 20 → 2 during the replay (2 game hours per real minute). The flag changed between ENCYH and ENCYI although ENCYH was already at hour 1, because GERDEP checks on its own hour-change test (dirb 0x33); that timing is suspected. It is **not combat-related**. What entity type 0x5b does is unknown.
- 45/47/48/49, 91/93: clock and day phase (known noise).

**Script check (own reading of the listings)**
- **Guard damage (EATT 0x00b49, L_00b88–0x00c15):**
  - `dmax = STR_m + 2 − CON_p/2`, then `− ARM_p`, clamped at ≥ 0. Then `dmg = rnd(dmax) + 1`, halved if 0x2e56; 0 is skipped; then subtracted from HP 0x2d5c.
  - ENCZ values: guards 90/91/92 STR 20/20/18, c0/c1 CON 20 and ARM 16 → dmax = 12 − 16 or 10 − 16 → clamped 0 → **dmg = 1 always**. 0x2e56 = 0, so no halving.
  - Hit chance `9·LVL_m + 3·AGI_p − AGI_m`: c0 81 + 48 − 19 = 110 (always hits), c1 81 + 12 − 19 = 74 (with LVL_m 9, AGI_m 19).
- **Food (FRISE 0x04fac–0x04fbb and 0x05348–0x05357):**
  - −1 per swing (if food > 0) after the form search L_05552.
  - Both outcomes (target found or not) reach 0x04fac, so a swing costs 1 food **whether it hits or misses**.
- **XP (FRISE 0x05806–0x0587d):**
  - L = victim level 0x3d9e[id], read after the kill.
  - For c = 0..4 with HP > 0: the killer (the attacker, dirb 0x13) gets `L/3 + 1`, everyone else `L/5 + 1`.
  - It depends on the **victim's (re-rolled) level** only, not on the party's level or the guard type.
  - Replay: L91 = 9 (5112) → 4 / 2. ENCB: L91 = 10 → 4 / 3.

**Verdicts on the contract predictions**

| prediction | verdict | evidence |
|---|---|---|
| Each guard hit costs exactly 1 HP (so HP loss = hit count) | **confirmed** | 87/87 portrait splashes show „1“. Per step, splashes = save HP loss in all 10 intervals (total 54/33 = −54/−33). Script: dmax clamps to 0, so dmg = 1. For ENCB this means 51 hits on c0 and 35 on c1 (inferred; ENCB has no video) |
| Food −1 per party swing | **confirmed** | 8 + 8 swings → −8/−8, hits and misses alike (c0 6/2, c1 4/4). The contract's R2.5 wording "on a miss" is too narrow: the code takes 1 food on every swing. ENCB's c0 −7 after 8 F6 presses means one press gave no swing (cause unknown) |
| Killer +4 XP, everyone else +3 | **the fixed numbers are contradicted for this replay (+4 / +2); the contract's formula is confirmed** | Here killer c0 +4 and c1–c4 +2 with victim level 9 (9/3+1 = 4, 9/5+1 = 2). ENCB's +4/+3 came from level 10. The values depend on the re-rolled victim level, read at 5021 + id after load |
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
- Handoff/commit as §1. Ishar 1, start.exe `3ea63234c97b77d88e3c18aa5d88ac10dede1f10daf2854225b88b7d948d588b`, MAIN.IO `27c5834de005afc99d7819a0b2244e7d176421451c80a3befd6c273b0ef0bd7b`. Scripts:
  - STAGE.IO `1b5f4b5ce7222aa73225be75b5c6995f20301ffd948e904796a69824d33cab2e`
  - GERDEP.IO `8b3f93c1acf8f2c8b07570db77ff78a25723161befd98982ee719a7b27c411f3`
  - SOSD.IO `c3aa7a31d4d87a015e36c897aa5567f31a83a9b6264314548eb3223183f26a04`
  - CONT1.FIC `5303c1ccc7602393c53fa0ae5d177811fa4d160c3581a3695688c3a6036e14d8`
- Run in `private/work/ishar1` with the German version (Keypad 3), DOSBox-X 2025.02.01 with cycles fixed at 25000. Log `private/run_cases_ishar1.md`, captures `private/shots/ishar1/c/10_…24_*`. Run 19:32:21–19:33:50 CEST.
- The .SAV mtimes come from the emulated DOS clock, which runs 0.5–2 min ahead of the box clock (known from the mtimes vs the log).

### 13.2 Question
Reach an NPC in Ishar 1 and interact. The only NPC reachable from S1 is the trainer (STAGE); the taverns at (29,16)/(33,18) are not reachable by walking (§6).

### 13.3 Reproducible input
| item | value |
|---|---|
| Start save | S1.SAV `92023f2b51e34f74f191068d07922a4b1afa28cff1bd04423d98e4505a463f7f` |
| Map / position | zone 1 (CONT1, Pragonia street), x30 y17, facing 4 (x−1) |
| Target | training entrance at (31,18) (A = −43; message 17, parameter 3 → STAGE) |
| Inputs | load `s1` (`s`, Keypad 1, Return) → turn right (310,101) ×2 (4→1→2) → forward (289,82) → x31 y17 → turn right (2→3) → forward → „GESCHICKLICHKEITSKURS ?“ → OK (270,132) → „WÄHLT DEN KANDIDATEN“ → portrait c3 (224,160) → „ZAUBERSPRUCHPREIS : 1500 GS“ → **EXIT (300,132)**, no payment → screen shows the street, facing N → save `npca` („SICHERN DES SPIELS KOSTET : 1000 GS“ → OK (272,157)) |
| After | NPCA.SAV `bfc6f29e69523c1e80d6469e9194ea6a4b9f476638ccf6633bfbcdf2e6aab583` |

### 13.4 Data contract
- Known: GERDEP 0x00d44–0x0100a maps A = −43 → message 17, parameter 3 (training). STAGE 0x001d4 lists the eligible class ids {0,2,5,6,9,16,18} from party table 0x1664. STAGE 0x0079e loads the gold only on OK at the price prompt (not taken).
- Known: save cost 1 000 GS (SOSD 0x00b04/0x00b0a), deducted at save time.
- Suspected: the facing reversal on leaving a building (3 → 1 here) uses the same mechanism as Ishar 2 MAIN 0x0346f; the Ishar 1 code path is not located.

### 13.5 Result
**Exact diff NPCA vs S1 (3 bytes, complete):**
| file offset | before → after | meaning | class |
|---|---|---|---|
| 3 | 1E → 1F | x 30 → 31 | known |
| 7 | 04 → 01 | facing 4 → 1: walked 4→1→2→3, then reversed 3 → 1 on leaving | known (value); mechanism suspected |
| 483 | 13 → 12 | c2 gold thousands 19 → 18: **save cost**, no training paid | known |

- `case_diff_i1.py S1.SAV NPCA.SAV TALK --pos 31,17,1` → exit 0 (gold 19 434 → 18 434, no unexpected offsets, CONT1–6 identical to the originals).

### 13.6 Limits
- This is a service NPC (trainer). No tavern/dialogue NPC reference for Ishar 1 yet: it needs a start save near a reachable tavern (unknown which).
- Paying for the course (OK at the price prompt) was not run; the effect on stats 0x16de is suspected.

### 13.7 Code proposals
None.

## 14. Ishar 1 item record: transfer between inventories (reference ITEMA; handoff 7-section format)

### 14.1 Base commit and game profile
- As §13.1, plus FRISE.IO `3bd158963fdaf0f88517b03509002100159a7587c8e2486389314b8abc707e15` and SOURIS.IO `2bbc1362e2f84c51d107bfccdf58441a8db08ed8c551129a66aee2a32ed4f7d8`. Captures `shots/ishar1/c/30_…39_*`. Run 19:33:50–19:34:52 CEST.

### 14.2 Question
Move an item from one character's inventory to another's. Floor pickup/drop is in the plan as well.

### 14.3 Reproducible input
| item | value |
|---|---|
| Start save | S1.SAV `92023f2b51e34f74f191068d07922a4b1afa28cff1bd04423d98e4505a463f7f` |
| Map / position | zone 1, x30 y17, facing 4 (no movement) |
| Inputs | load `s1` → c0 name (32,195) → sheet „MOGA KRIEGER ORK, LEVEL 10, ERFAHRUNG :31000, ENERGIE 147, KONDITION 99, PSYCHE 100“ → key in backpack slot 7 (196,42) → portrait c3 (224,160) → sheet EXIT (246,110) → save `itema` (OK at 1000 GS) |
| After | ITEMA.SAV `f65417663dca2fbd3a8eb00f178451363a07ed486b71289ec9fee5d937bdb72d` |

### 14.4 Data contract
- Known: inventory 0x1568, 13 words per member, file 498 + 2·(13c + s). Slots 0–8 are the backpack (grid slot s at (148 + 24·(s div 3), 14 + 28·(2 − s mod 3))). A portrait drop goes to the first free backpack slot.
- Suspected: slots 9–12 are hands/body.

### 14.5 Result
**Exact diff ITEMA vs S1 (3 bytes, complete):**
| file offset | before → after | meaning | class |
|---|---|---|---|
| 483 | 13 → 12 | c2 gold thousands 19 → 18 (save cost) | known |
| 513 | 0C → 00 | c0 slot 7: key (code 12) removed | known |
| 577 | 00 → 0C | c3 slot 0: key added (first free slot) | known |

- `case_diff_i1.py S1.SAV ITEMA.SAV ITEM --mode transfer --pos 30,17,4` → exit 0 (item count 39 → 39, multiset unchanged, CONT identical).

### 14.6 Limits
- **Transfer only.** Floor drop and pickup in Ishar 1 are **unknown**: no code path was confirmed and none was run. Destroying an item via the sheet bin (237,90) is from the manual (suspected), not run.

### 14.7 Code proposals
None.

## 15. Ishar 1 shop record: buy (reference SHOPA; handoff 7-section format)

### 15.1 Base commit and game profile
- As §13.1, plus MARCHAND.IO `77db63b52c23075261e7a5776545cc9435dc38f679b29823468eb43872c1c706` and PARAM.IO `f42ea12ceffa6b879aeb88f074a81f8e9fed39f92a11f625d7c815b9b7594afd`. Captures `shots/ishar1/c/40_…54_*`. Run 19:34:52–19:36:18 CEST.

### 15.2 Question
Enter a shop, buy one item and, if possible, sell one.

### 15.3 Reproducible input
| item | value |
|---|---|
| Start save | S1.SAV `92023f2b51e34f74f191068d07922a4b1afa28cff1bd04423d98e4505a463f7f` |
| Map / position | zone 1, x30 y17, facing 4; shop #1 at (31,16) (table 0x3fd6) |
| Inputs | load `s1` → turn right (310,101) ×2 (4→1→2) → forward (289,82) → x31 y17 → turn left (266,101) (2→1) → forward → „MÖCHTET IHR ETWAS KAUFEN?“ → OK (270,132) → grid + „WÄHLT AUS, STOLZE ABENTEURER.“ → hover shows „WURFDOLCH (+1)“, price 1100 → dagger (201,20) **once** → portrait c2 (160,160) **once** (c2 holds all the gold) → exit stone (288,112) → street, facing S → save `shopa` (OK at 1000 GS) |
| After | SHOPA.SAV `6802d3e77df8b11762483d9138059f8773f1b69a14f85384cf0c52f3fb5c6f81` |

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
| 3 | 1E → 1F | x 30 → 31 | known |
| 7 | 04 → 03 | facing: walked to 1, reversed 1 → 3 on leaving | known (value); mechanism suspected |
| 483 | 13 → 11 | c2 gold thousands 19 → 17 | known |
| 556/557 | 00 00 → FF CA | c2 backpack slot 3 = −54 (Wurfdolch) | known |
| 3998 | B2 → 4E | c2 gold units 434 → 334 | known |

- Total 19 434 → 17 334 = −1 100 (dagger) −1 000 (save).
- `case_diff_i1.py S1.SAV SHOPA.SAV SHOP --char 2 --price 1100 --code -54 --pos 31,17,3` → exit 0 (CONT identical).

### 15.6 Limits
- One non-stack item. Stack items and the „BÜNDEL VOLL“ path are known from code and the probe, but not referenced.

### 15.7 Code proposals
None.

## 16. Ishar 1 enemy encounter record (reference ENCA; handoff 7-section format)

### 16.1 Base commit and game profile
- As §13.1, plus FRISE.IO (§14.1), ENCONT.IO `5746e6a7169a315a894145397a3f81fac13adbabc9a239101d8b0088a7d59a82`, GEREN.IO `60405e4537abff12c5756a79506eb555c616a91b64069451fcc11419bcb8a405` and CONT5.FIC `c41354257bd246db54785b2e22c463d641e647d1166e6a000720c22ac8adb017`. Captures `shots/ishar1/c/60_…72_*` (`68_round1…8`). Run 19:36:18–19:38:15 CEST. **Unpatched.**

### 16.2 Question
Original behaviour of a melee encounter in Ishar 1: approach, attack, damage taken, kill.

### 16.3 Reproducible input
| item | value |
|---|---|
| Start save | LP1.SAV `76cf91a104ec8675394ec82b44f7238b016d641a8e0ccf3752d117ae2980b64b` |
| Map / position | zone 15 (CONT5 cave), x20 y53, facing 3 (y+1); party HP 137/131/105/81/62, XP 31000 ×5 |
| Target | 6 monsters, actors 63–68 (type −4, HP 6/10/15/15/10/12) at (25,54); no direct path (CONT5 x22/23 y54 = −99) |
| Inputs | load `lp1` (`l`, `p`, Keypad 1, Return) → turn left (266,101) ×2 (3→2→1) → forward (289,82) → (20,52) → turn right (310,101) (1→2) → forward → (21,52): group visible 2 cells ahead → forward again is blocked → 8 rounds: ATTACK c0 (48,132), ~2 s, ATTACK c1 (112,132), ~3 s (19:37:05–19:37:46) → save `enca` (OK at 1000 GS). Never the icon at (80,160) |
| After | ENCA.SAV `8003a1965ef287cd68f16ff9fb19e16e9a4927ea04366ffece7968c142815605` |

### 16.4 Data contract
- Known:
  - FRISE 0x00985 subtracts damage from party HP 0x1542.
  - FRISE 0x06888 gives kill XP to the killer (+50·T) and others +20·T.
  - FRISE 0x070cc caps XP at 31 000. All of LP1's party is at the cap, so **XP cannot show a kill. The proof is monster HP 0x1b22 → 0 plus party HP loss.**
- Suspected: the monsters approach by AI (GEREN/ENCONT movement); they were not adjacent at load time.
- Suspected: per-member byte 0x16bc (file 773+c) is "Kondition", spent per swing.

### 16.5 Result
- In both the probe and this run the group moved to (22,52), in front of the party. In the probe the party stood at (20,52) facing E; in the run, at (21,52). The monsters faded out from about round 4 and were gone by round 8. No HP bar dropped below 1/3.
- The encounter has been **seen twice** (probe PROBED 19:29 CEST and ENCA): suspected reproducible, not guaranteed.

**Exact diff ENCA vs LP1 (26 bytes, complete):**
| file offset | before → after | meaning | class |
|---|---|---|---|
| 3 / 5 / 7 | 14 → 15, 35 → 34, 03 → 02 | party x 20 → 21, y 53 → 52, facing 3 → 2 | known |
| 469 | 89 → 7E | c0 HP 137 → 126 (−11) | known |
| 471 | 83 → 75 | c1 HP 131 → 117 (−14) | known |
| 479 | A5 → A4 | c0 gold thousands 165 → 164 (save cost; units 798 unchanged) | known |
| 773 / 774 | 60 → 58, 64 → 5C | 0x16bc c0 96 → 88, c1 100 → 92 (−8 each = 8 swings) | value known, meaning suspected |
| 1575–1585 (odd) | 19 → 16 ×6 | actors 63–68 x 25 → 22 | known |
| 1715–1725 (odd) | 36 → 34 ×6 | actors 63–68 y 54 → 52 | known |
| 1855–1865 (odd) | 06/0A/0F/0F/0A/0C → 00 | actors 63–68 HP → 0 (all six killed) | known |

- `case_diff_i1.py LP1.SAV ENCA.SAV ENC` → exit 0: party XP Δ [0,0,0,0,0] (cap), party HP Δ [−11,−14,0,0,0], 6 kills, gold −1 000, CONT identical.
- Actor zone (4033+i) stays 15; dead actors are not removed from the zone in the save (known, unlike Ishar 2 §12).

### 16.6 Limits
- The approach depends on monster AI (suspected). If the group does not come within about 60 s, use P1 (§7, proposal only, not applied).
- A kill XP rule visible in the save needs a party below the cap (unknown which save has one).
- Which character dealt which kill is not recoverable from the save.

### 16.7 Code proposals
None. P1 stays a proposal only (§7).
