# Ishar 2: lever/door trigger path (static), for Hoth

## Base commit
bvultrex/ishar-construction-kit bb42748 (read-only clone; verified 319819c). Static only: no emulator runs, nothing committed.
SHA-256:
- PCAVE.IO c6effa5f…8c46
- SOURIS.IO 78df7c73…f9d3
- DJ1.IO 83a0eea9…0013
- DJCAT.IO 20b73dde…5181
- GERDEP.IO 58d2c57f…da4b
- GESORT.IO 71f842f2…5a3c
- EDPLT.IO 2f6156c6…9ecb
- MAIN.IO bfab5e91…db95
- CONT5.FIC 5bc64e4c…f0a0
- base save dosbox/ishar2-alis/K5F005.SAV 324c1ce7…fb88

Sources: ALIS listings `decompile/alis/listings/ishar2/*.asm`. No original bytes in this file.

## Question
Why did clicks on doors #8, #3, #31 and #20 do nothing? What are the trigger path, position, conditions and CONT encoding for levers and doors, plus a concrete test spot, and what is byte 7578 (0x4b80)?

## Result

### 1. Trigger chain (proven)
1. A left click in the viewport goes to SOURIS 0x00445. Conditions: nothing held (0x2d16 == 0), 0x49d3 == 0 and 0x4b34 == 0.
   1. First it tests for ground items (`ctstform 512`, see the pickup contract).
   2. On a miss → 0x0066f: `ctstform 32767` (or `ctstmov(128,0,122)` when 0x4aa0 ≠ 0), then `cmatent` → 0x0069a switch:
      - **material 64 → `csend 20`** to the entity hit (lever)
      - **material 65 → `csend 19`** (door frame)
      - 66–69 → no-op; 70 → 0x006e0
2. Item in hand (0x00a1f: 0x2d16 < −9): material
   - **66 + item −17** → 0x4aa4[8] = 1
   - **67 + item −21** → message 19 to PCAVE, else 0x4aa4[29] = 1
   - **68 + item −22** and 0x50ab == 1 → 0x4aa4[30] = 1
   These are key locks. GESORT 0x01433 (spells) does the same for 66 (door 8) and 67 (door 29).
3. Other senders of 19 to PCAVE:
   - GERDEP 0x01501 (maps > 4: entering a cell with B −100..−119 → door via table 0x507c; no such cells in map 5)
   - GESORT 0x01461
   - ANIMALS 0x00088
4. PCAVE (id 0x43), dispatcher at 0x00020:
   - **19 → L_00282**:
     - frame (dirb09 = 1, L_00385): 0x4aa4[d] = 1, then the frame slides away and the entity exits (opens only).
     - leaf (09 = 0, 0x0031b): toggles 0x4aa4[d] 0 ↔ 1 with a 20-step animation.
   - **20 → L_003c1** (lever): 0x4ad8[k] flips 1 → 0 (anim 38) or 0 → 1 (anim 37), **then 0x4aa4[k] flips**. Lever k opens and closes door k with the same index.
   - Hoth's 0x0031b–0x0039a is the message-19 path; the lever path is 0x003c1–0x0048f.

### 2. Who spawns the clickable entities (proven, DJ1 decor)
Cells are drawn by the decor module selected by zone 0x4ef2 (MAIN 0x01c96):
| Decor | Zones |
|---|---|
| DJ1 | 31–34, 37, 39, 42–44, 52, 58 |
| DJ2 | 35, 45–50 |
| DJCAT | 30, 36, 38, 40, 41, 51, 53 |

DJ1 maps A values to wall faces 1f (0x004b8 / 0x00532 ff.), then spawns PCAVE:
- **Lever** (A 58/60/62/64, visible only facing 4/1/2/3 respectively; L_01d2d): lever index **k = |B| − 10**; PCAVE +0x0b = k, 0x0d = 0.
  - It is spawned **only at depth 0 = the party's own cell**, looking at the cell's front wall.
  - PCAVE 0x001c5 at depth 0 sets `cforme 0`.
- **Door frame** (faces 1–4, from A 70–77; L_021a7): door **d = B − 60** (B 61..109), 0x09 = 1.
  - It is spawned only at depth 0 and **only while 0x4aa4[d] == 0** (closed).
  - It is visible from the door cell itself, or from the neighbouring cell when the door cell is one ahead (depth decrement at 0x00c2c). PCAVE `cforme 1`.
- **Door leaf** (faces 5–8, from A 38–45; L_01f55): d = B − 60, 0x09 = 0. **PCAVE gives a leaf no form except doors 29 (form 4) and 30 (form 5)** (0x000fb–0x0016c).
  - So ordinary leaf doors **cannot be clicked**. This explains Hoth's failure: door 3 (map 5 r44 c40, A=40) and door 20 (map 6 r34 c46) are leaves operated by levers 3 / 20. Door 8 is a key door (−17).
  - Door 31 does not exist as B in CONT1..7 (open: maybe a table index such as 0x507c).
- **DJCAT** (zone 36, where most of Hoth's map-5 saves are) spawns only leaves (0x0167e/0x016e4) and has no 0x4ad8 reference at all. **In DJCAT zones nothing can be clicked**, and levers are not even spawned there. proven
- Forms 0/1 → materials 64/65: **hypothesis** (the material lives in the PCAVE form resources; the SOURIS case labels match). Where the material-66 form for door 8 comes from: **open**.
- Pressure plates: SOURIS 0x005c6 — taking an object 17..22 off a cell with A = 78/79 → 0x4ad8[|B|−10] = 0. proven

### 3. CONT encoding (proven)
| Layer B value | Meaning |
|---|---|
| 61..109 | door d = B − 60 → 0x4aa4[d] |
| −11..−30 | lever k = \|B\| − 10 → 0x4ad8[k] and door k |
| −70..−99 | zone marker: GERDEP 0x01694 sets zone = \|B\| − 40 on maps 2/5/6/7 (map 3: −50..−99 at 0x01637). Markers come in pairs, so the zone depends on which side the party came from |
| −100..−119 | walk trigger (maps > 4) |

Layer A: −1 = solid rock; ≥ 0 = floor cell whose code names its wall faces.

Combination lock: door 48 opens only if 0x4ad8[21..26] are all 1 (GERDEP 0x015f2).

Save layout: 0x4aa4 file 7381 + d, 0x4ad8 file 7431 + k (50-byte blocks; IO.IO 0x010af / 0x010b6).

### 4. Test spot A: lever (recommended, DJ1)
Map 5, lever at **r23 c19** (A = 64, B = −16 → k = 6), door 6 at r27 c17 (A = 43, B = 66).
- Base K5F005.SAV: map 5, zone 31 (DJ1), facing 3; 0x4aa4[6] = 1, 0x4ad8[6] = 1.
- Patch:
  | File offset (BE word) | Value | Meaning |
  |---|---|---|
  | 2 | 23 | row |
  | 4 | 19 | col |
  | 6 | 3 | facing, +col |
  | 8 | 5 | map, unchanged |
  | 18 | 31 | zone, unchanged |
- The lever should be on the front wall (r23 c20 = rock). Left click on the lever with an empty hand. Click point (hypothesis): x = 128; sprite y world −42 → try y ≈ 90, then 70 / 110 / 119.
- Expected:
  - Save diff: **7437 1 → 0** (0x4ad8[6]) and **7387 1 → 0** (0x4aa4[6]; door 6 closes).
  - On screen: the lever changes from anim 37 to 38. A second click reverts both to 1.
- Plus the noise known from §8.4 (clock, day phase, monster re-roll).

### 5. Test spot B: door frame (DJ1)
Map 5, **r40 c31** (A = 70, B = 65 → door 5, closed in K5F005).
- Patch row 40, col 31, facing 3, zone (offset 18) = 33. The zone marker at r40 c30 sets 33 = DJ1.
- Click the door frame (x = 128, y ≈ 70).
- Expected: **7386 0 → 1**. The frame slides away and it is one-way.
- Alternatively, stand at r40 c32 facing 1 (door one cell ahead).

### 6. Key door 8 (optional)
Door 8 = map 5 cells (41..57, 14/16), B = 68.
- Put −17 in a hand: c0 slot 9 = file 1036 + 2·9 = **1054/1055 = FF EF**.
- Pick it onto the cursor (0x2d16 = −17) and click the door.
- Expected: 7389 → 1, but only if a form with material 66 is hit. The source of that form is **open**, so lower priority.

### 7. Byte 7578 = 0x4b80[2]
0x4b80 is a 3-byte block at file 7576 (IO.IO 0x00d9e). It is a list of actor ids that have **entered the party's cell (melee contact)**:
- Set: EDPLT 0x0021a–0x00300 and EAFF 0x00503–0x005cb write the actor id into the first free slot when actor pos == party pos (0x2ab4/0x2ab5).
- Cleared:
  - FRISE 0x057b3: slot 0x65, inside the HP ≤ 0 branch
  - GERDEP 0x013d5: all 3 slots
- 52 → 0 means actor 52 died or the party moved / changed zone. **hypothesis** for the exact cause (role: proven).

## Limits
- Static only.
- Materials 64/65 of forms 0/1, the click y-coordinate, and the material-66 source are hypotheses or open.
- DJ2 (map 6, zone 50) was not traced: it has 3 references to 0x4ad8, so it probably works like DJ1.
- The zone at the test spot depends on the path taken; that is why the patch sets offset 18 explicitly.

## Next step
Hoth runs spot A with the K5F005 patch (y sweep); if it works, spot B.
- If nothing happens: check that zone/DJ1 is active (the lever must be visible on the wall).
- Then compare the 7387/7437 diff.

## 2026-10-18 18:xx corrections after Hoth's acceptance test (HOTH_ABNAHME_2026-10-18_HEBEL_TUER.md)
Static. The PCAVE/OBJET forms were decoded with the kit library (`readDosAlisForms`); script `private/pcave-forms.ts` (no bytes in this file).

### (1) Click position: why (152,58) — proven
- **PCAVE forms** (resource box, origin [x, depth, h], extent):
  | Form | Material | Origin | Extent | Role |
  |---|---|---|---|---|
  | 0 | **64** | [17, 0, 69] | [16, 1, −24] | lever |
  | 1 | **65** | [−6, 0, 56] | [12, 1, −10] | door frame |
  | 2 | 65 | [−16, 0, 67] | [16, 1, −18] | |
  | 3 | 64 | [0, 0, 68] | [17, 1, −20] | |
  | 4 | **67** | [22, 0, 44] | [10, 1, −14] | door 29, key −21 |
  | 5 | **68** | [−14, 0, 71] | [29, 1, −40] | door 30, key −22 |
  So the materials 64/65/67/68 are now **proven**, not a hypothesis.
- **Lever spawn** (DJ1 L_01d2d, depth 0): PCAVE +0 x = dirw10 = 0 (lateral 0), +2 depth = dirw0e = 99, +4 h = dirw12 = −42.
- **Ray:** the SOURIS entity sits at (0x76, 0, 0x78) = (mx, 0, 199−my) with form 0 = origin (−128, 0, −122), extent (0, 499, 0). So x = mx − 128, h = 77 − my, depth 0..499.
- **Lever hit box:**
  - x = 0 + 17..33 → **mx 145..161**
  - h = −42 + 45..69 = 3..27 → **my 50..74**
  - depth 99..100 lies inside the ray.
  - (152,58) → x = 24, h = 19: hit ✓. Hoth's knob at (152, 55–70) ✓. x = 128 lies outside 145..161, so all my suggested clicks missed ✓.
- **My wrong assumption:** the form is not centred on the entity. Lever form 0 is offset +17..+33 to the right; that is the knob on the right wall half.
- **Door frame** (L_021a7: x 0, depth 99+3, h −42), form 1: mx 122..134, my 63..73. Hoth hit (128,70) ✓.
- **Pickup contract re-check:** OBJET form 40 = [−12, 0, −4] + [25, 1, 19], form 16 = [−6, 0, 0] + [13, 1, 18] (materials 521/522 = 512 + id).
  - With entity h = −42 this gives exactly mx 116..141 / my 104..123 and mx 122..134 / my 101..119.
  - The former object-10 range "122..135" was off by 1 at the right edge.
  - Otherwise the derivation is correct; only the axis naming changes: "z" = h (vertical, 199−my), the 2nd coordinate = depth.
  - The general formula for all forms at depth 0 is **mx = 128 + x, my = 77 − h** (y = 78 − h − 1 at the pixel edge).

### (2) 0x4b80 / "86": index error, not a contradiction — proven
- 0x4b80 occupies **file 7576..7578, zero-based** (IO.IO 0x010f5).
  - K5F005: [0, 0, 0]. GRIMZ: **[0, 52, 0]**, so 52 sits in **slot 1**. Hoth's cmp offset 7578 (one-based) = 7577.
- The **86 is byte 7575 = 0x4b68[4]**, not part of 0x4b80. 0x4b68 occupies file 7571..7575, 5 bytes, one per character.
  - It is **"Premiers soins" (first aid, %)**: MESSAGE 0x00729/0x0073e prints it; FRISE 0x01e34 rolls `rnd(100) < 0x4b68[c]`; FRISE 0x02569 sets it (with 0x4b58/0x4c76) on character creation or a level change; PARAM 0x00eea initialises it.
  - 86 is character 4's first-aid value, not an actor id.
- GERDEP 0x013d5 clears all 3 slots of 0x4b80. That fits GRIMZ → HOTTU6 (52 disappears after a step). The claim stands (exact trigger point of GERDEP 0x013d5 in the move: hypothesis).

### (3) 0x519f / 0x51a0 = time-of-day phase — proven
- **Writers:**
  - MAIN 0x00aba init: 0x519f = 1, 0x51a0 = 0x519f.
  - MAIN 0x04018–0x04058, from the hour 0x4fc6: **8..19 → 1 (day), <6 or ≥22 → 3 (night), otherwise 2 (6–7 and 20–21, dawn/dusk)**.
  - MAIN 0x00e4b/0x00e59: when 0x519f ≠ 0x51a0, 0x51a0 = 0x519f and the palette is set per map (switch 0x2d18).
- **Readers:**
  - all actor and scenery scripts (BOB4, DRUIDE*, GUARD*, PEOPLE*, …: `cfopalet/csetpalette 8/9/10` by phase)
  - MAIN 0x02d50/0x02dd4/0x02df4/0x02e14: phase-3 (night) spawns, entity 0x12 with type 57.
- 0x519f is the current phase; 0x51a0 is the phase last applied to the palette.
- In the saves these are words at file 90/92; the value byte is 91/93. Hoth's cmp 92/94 (one-based).
- **2 → 1 means the game clock passed 08:00** (dawn → day) during the slow clicks. This is noise, not a hit effect.

### (4) Door 5 frame: open only — proven
- Message 19 on PCAVE with 0x09 = 1 → L_00385: 0x4aa4[d] = 1, then 100 steps of x += 2 (the frame slides out to the right), then `cexit` (0x003bf). **The entity is destroyed.**
- DJ1 L_021a7 spawns a frame **only while 0x4aa4[d] == 0**. After opening there is no frame, so no form: a second click on the same spot hits nothing.
- Door 5 (A = 70: faces 10 + 4) has no leaf, and map 5 has no lever with index 5. **Nothing closes door 5 by click.** Only GERDEP walk triggers (0x01584/0x01590: 0x4aa4[d] = 0) or a lever k = 5 could; neither exists in CONT5. So: **one-way.**
- Consistent with Hoth: the frame is gone after the click and only 7386 changes. A second click was not tested; expected: no save diff apart from the clock.

### Corrections to the main text above
- §4: lever click point (hypothesis x = 128) → **(152, 58); box mx 145..161, my 50..74**.
- §2: "forms 0/1 → materials 64/65: hypothesis" → **proven**.
- §7: 52 is in **slot 1** of 0x4b80 (file 7577), not 7578 / slot 2. The 86 belongs to 0x4b68.

## 2026-10-18 18:2x key door 8: keyhole found (after HOTH_ABNAHME_2026-10-18_HEBEL_TUER_2.md)
Static. Form scan of **all** Ishar 2 .IO modules for materials 64–70 (`private/mat66.ts`, kit reader `readDosAlisForms`).

### Who carries material 66 (proven)
**Only DJCAT.IO** (20b73dde…): form 0 = box origin [−14, 0, 18], extent [30, 1, −26], material 66.

Other hits:
| Module | Form | Material |
|---|---|---|
| PCAVE | 0, 3 | 64 |
| PCAVE | 1, 2 | 65 |
| PCAVE | 4 | 67 |
| PCAVE | 5 | 68 |
| DJ1 | 0 | 70 |
| DRUIDE4 | 0 | 69 |

No hits in OBJET, ANIMALS, GESORT, FDJCAT or DJ2.

### When DJCAT sets it (proven)
- DJCAT's only `cforme 0` is at **0x010f2** in L_010da, reached from L_00fa2.
- L_00fa2 is the case **face 1f = 78** of switch 0x0068x on dirb(0x1f). Layer-A value **78** has no special mapping, so face = A.
- Conditions:
  - **facing 2** (0x2ab6 == 2, i.e. +row; 0x00fcc)
  - lateral 0 (dirb1a == 0, 0x010da)
  - **depth 0 (dirb1d == 0, own cell)**
- At depth > 0 only sprite 75 + depth is drawn (0x010f5), with no form. Facing 1/3 → other walls (L_01243 / L_011ef).
- So the party must stand **on the A=78 cell, facing +row**. The keyhole is on the wall in front.
- Hoth's attempts (in front of the bars, depth 1) could not hit anything. No form other than material 66 opens door 8. ✓
- In DJ1 zones A=78/79 means pressure plate instead (SOURIS 0x005da). The meaning of A=78 depends on the decor module.

### Door 8 in CONT5 (proven)
- **Leaves:** A 42/38 with B = 68 → d = 8, at r41/45/49/53/57 × c14 and c16: 10 bars on both sides of the corridor in column 15. They all switch together through 0x4aa4[8].
- **Keyhole:** **r61 c15**, A = 78, B = 0. This is the south end of the same corridor; there is no lock marker in B.
- **Zone:** marker r61 c21 = −76 → 36 = DJCAT (MAIN 0x01c96). The K5T0xx saves in this corridor (r57 c15, …) all have zone 36. No other decor module spawns there.
- Ways to open:
  - **Key click:** SOURIS 0x00a50 — material 66 hit + held item −17 → 0x4aa4[8] = 1, plus a PCAVE nudge (0x00a67). No inventory write, so the key is not consumed (static).
  - **Spell:** GESORT 0x01433 (66 → 0x4aa4[8] = 1). Its target test is presumably the same form.
  - No script event found.

### Test spot (for Hoth)
- **Base:** HOTKY1 (map 5, zone 36, key −17 in character 0 slot 9 = file 1054/1055 = FF EF, door 8 closed).
- **Patch** (BE words):
  | File offset | Value | Meaning |
  |---|---|---|
  | 2 | **61** | row |
  | 4 | **15** | col |
  | 6 | **2** | facing |
  | 8 | 5 | map |
  | **18** | **36** | zone |
  r61 c15 is floor (A = 78 ≥ 0).
- **Steps:**
  1. Load the save.
  2. In the sheet, take the key onto the cursor ((30,193) → (222,67) → EXIT), as before.
  3. Click the keyhole.
- **Click box:** mx = 128 + x, my = 77 − h, assuming the decor entity sits at origin (0, 0, 0). DJCAT never sets a position (no cset/cmove), so this is a hypothesis:
  - x −14..16 → **mx 114..144**; h −8..18 → **my 59..85**
  - **Recommended (129, 72)**; fallback (120, 65) and (140, 80).
- **Expected:**
  - Save diff **7389 0 → 1** (0x4aa4[8]), 1054/1055 stay FF EF, plus clock noise.
  - On screen: after turning around (facing 4) the gate leaves in column 14/16 appear open.
- If the click misses, the decor entity's origin is not (0,0,0). Then sweep the viewport centre ± 30 px. A static derivation of the origin is open (clive inheritance in DJ*).

### Corrections
- §6 above: "source of the material-66 form open" → **DJCAT form 0 at the A=78 cell, facing 2, depth 0 (proven)**.
- "Zone 36 has nothing clickable" (§2) → **except the keyhole (A = 78, facing 2)**.

## Addendum 2026-10-18 19:5x: 0x4b80 and byte 7409, reconciled with Alderaan (REFERENCES §12.9)
- **0x4b80 (file 7576–7578):** Alderaan's "guard list of the party's cell" and my "melee-contact list" are **the same**. proven
  - Filled by EAFF 0x0057f/0x005a1/0x005cb (and EDPLT 0x002c6–0x00300) when an actor stands on the party cell.
  - Cleared per slot by FRISE 0x057b3 on a kill, and all three by GERDEP 0x013d5–0x013e9 on movement.
  - Runtime: ENCZ → ENCYA 0,0,0 → 91,90,92; ENCYH 7576 → 0; ENCYJ (Back) → all 0.
  - The slot index is the form/depth slot dirb65 of the player attack.
- **Byte 7409 = 0x4aa4[28]** (door table, 7381 + 28), **not** a second day-phase flag. GERDEP 0x0048a–0x0054d runs on every change of the hour 0x4fc6 (compared with dirb 0x33):
  - hour 1 → 0x4aa4[28] = 1 (door 28 opens), wake entity type 0x5b (DJ1 decor, redraw)
  - hour 4 → 0x4aa4[28] = 0
  - Same block: if object 6 lies on a map (0x2c4e[6] ≠ 0), actor 69 is put into scene 12 at hour 2 and removed at hour 4 (0x449a[69]) — a night NPC.
  - **Door 28 = time-locked door, open from 01:00 to 04:00.** CONT: B = 88 → d = 28 at map 7 r6 c11 (A = 43, a door leaf). The B = 88 cells in maps 3/4 do not have door A codes (hypothesis: different meaning).
  - proven (writers); the map position is a hypothesis.
- **Relation to the day phase:** 0x519f/0x51a0 (file 90–93) are the palette phase 1/2/3 from the same hour 0x4fc6 (MAIN 0x04018). **Both read the same clock, but they are separate variables.** Alderaan's "time-of-day flag" at 7409 is correct as a description of the trigger; by role it is a door state.
