# Magic system contract, Ishar 2 DOS (spell list, learning, casting, effects, timers, save)

## Handoff header
- **Base commit:** bvultrex/ishar-construction-kit `bb42748` (bb427487ecce407124b5d98df50a8ca9627cbd60), branch `workbench/playable-slice`, clone `/workspace/ishar/clones/quesh` (read-only, nothing committed or pushed). Reviewed code state 319819c.
- **Question:** the full contract for the Ishar 2 magic system: (a) spell list, (b) learning/buying, (c) casting, (d) effects and timers, (e) save persistence, (f) reproducible test sequences.
- **Method:** static only. I used ALIS listings from `decompile/alis/disasm.py` (`decompile/alis/listings/ishar2/*.IO.asm`), the start.exe unpacked segment 1000 (capstone, for the mouse handler), the manual `ishar2-manual.pdf` (pdftotext, spell chapter), and 257 unique original 8359-byte saves (948 files) from Alderaan's and Hoth's work dirs. Private dump scripts and output are in `private/magic/`.
- **Commands:** `rg`/`awk` over the listings, `sha256sum` over the originals, `private/magic/spells_dump.py` (checks the learning rule on every save), `private/magic/pairs.py` (looks for before/after cast pairs; none found), and the PIL HUD check on `alderaan/private/shots/ishar2/enc_fwd.png`.
- **Result:** see R1–R9. The learning rule is proven on all 4740 character records. Casting, costs, formulas and timers are proven in code. No runtime cast diff exists yet. The test sequences are in R9.
- **Limits:** see "Limits". The main ones are the frame rate of the FRISE interrupt (timer seconds), the screen-coordinate mapping (taken from Alderaan's hypothesis), and the spell names (from the manual).
- **Next step:** Alderaan/Hoth run T1–T3 (R9) and diff the saves.

Ratings: **proven** = read in code (and checked against saves where stated). **hypothesis** = plausible, not fully closed. **open** = not resolved. **contradicted** = a source claim the code refutes.

## SHA-256 (originals/ishar2/Ishar2)
| File | SHA-256 prefix |
|---|---|
| GESORT.IO (spell module, id 7) | 71f842f2a804d80a… |
| FRISE.IO (HUD/party, id 6) | 27117c124caf904a… |
| PARAM.IO (init/spell table) | d06a65de13628470… |
| EATT.IO (actors, monster casting) | d5ef72a5b25eabb5… |
| MAIN.IO | bfab5e9175931dbb… |
| SOURIS.IO (mouse) | 78df7c73f8804663… |
| PPECHAP.IO (timescale scene, id 0x72) | 8d1c67dcccb139e3… |
| TAVERNE.IO | ea315973f2187950… |
| MARCHAND.IO | a5b84f95b8b50f1c… |
| MESSAGEE.IO / MESSAGED.IO | 7ef08cd36e37d6a5… / 94f80de429cc6284… |
| BUSTE.IO (id 0x13) | 8e6ff516cf14c472… |
| start.exe | 5e35e58d…adf9 |
| START.SAV | e685cd6902575392… |
| LEVELING.SAV | dac7e0a405fa442a… |

Conventions:
- `op(opile)` = popped OP acc. `ornd n` = (r·n)>>16, giving 0..n−1. The RNG is start.exe 1000:6d7b and always advances, even for rnd(0).
- Save offsets are zero-based. Word arrays are big-endian (element i at off + 2i).
- c = party slot 0..4, id = actor id, p = spell power, L = level.

## R1. MP ("Psychic") and related stats
- **MP = 0x2eee[c]**, a byte, save **1321 + c**, range 0..100. It is drawn as "Psychic" on the character sheet (FRISE 0x06afc). **proven**
- **There is no max-MP variable.** Every writer caps at a hard-coded 100. **proven**
- **Complete list of MP writers** (all .IO). **proven**
  - GESORT 0x00f3b–0x00f56: cast cost (R4).
  - GESORT L_00d4e: teleport sets MP to 1.
  - TAVERNE 0x006d8–0x0070e (room rest):
    - if MP > 50, then MP = 100; else MP += 50 (cap 100);
    - also physical +15 and HP += (max − HP)/5.
    - That this is the "room/sleep" choice is a **hypothesis**.
  - PPECHAP 0x00026–0x000b4 (timescale): every 10 frames, +1 HP/MP/physical for each living member (caps: maxHP / 100 / 100).
  - FRISE 0x0227c: recruit sets MP = 100.
  - FRISE 0x03e1d: cauldron potion (0x4c38 == 1101 and 0x4c3a == 0) sets MP = 100.
  - PARAM 0x0025e / 0x0075d / 0x00c68: init sets MP = 100.
  - Plus the save load.
- **No passive MP regeneration** while walking or over time. **proven** (no other writer)
- The stats used by magic:
  - WIS = 0x2ece[c] (save 1306 + c) and INT = 0x2ed6[c] (save 1311 + c). The sheet rows y = 130/140 carry the MESSAGEE labels. **proven**
  - Level = 0x2eb6[c] (save 1291 + c).
  - Class = 0x2e9e[c] (save 1276 + c; −1 = empty slot).
  - HP = 0x2d5c[c] (save 996 + 2c) and maxHP = 0x2d74[c] (save 1016 + 2c).
  - Physical = 0x2ef6[c] (save 1326 + c).
- **Caster flag 0x5068[c]** (save 8034 + c):
  - FRISE L_00b20 0x00b94 sets −1 for every class not in {0, 5, 6, 9, 13, 16, 18, 19}, which hides the red-dot magic icon.
  - FRISE 0x05f30 sets 0 otherwise.
  - **proven**
- An MP restore of 54 → 67 seen between two unrelated saves is unexplained. Different save points are involved. **open**

## R2. Classes (MESSAGEE 0x01fe0) and spell access
Class names by id:
- 0 Knight-errant, 1 Warrior, 2 Ranger, 3 Barbarian, 4 Thief
- 5 Scholar, 6 Magician, 7 Archer, 8 Spy, 9 Priest
- 10 Mercenary, 11 Beggar, 12 Murderer, 13 Priestess
- 15 Hypnotist, 16 Witch, 17 Dark knight, 18 Occult monk, 19 Druid

**proven** (text table)

Spell access (FRISE L_060d4, block 0x061a4). **proven**

| Class | Condition | Mask | Cap on minlvl | Power uses |
|---|---|---|---|---|
| 6 Magician | always | 1 | level | INT |
| 5 Scholar | always | 2 | level | WIS |
| 19 Druid | always | 4 | level | WIS |
| 0 Knight-errant | level > 8 | 2 | 5 | WIS |
| 9 Priest / 13 Priestess | level > 2 | 2 | 5 | WIS |
| 16 Witch | level > 0 | 1 | 5 | INT |
| 18 Occult monk | level > 2 | 1 | 5 | INT |
| all others | no spells | – | – | – |

Notes:
- The "Power uses" column is the stat used in damage (R5): INT for classes 6, 16 and 18, WIS for all others (GESORT L_0060f).
- The manual names this group "the sacred" (paladin/priest types). Mapping it to these class ids is a **hypothesis**. The code rule itself is proven.

## R3. Spell list (table 0x4d20[k][minlvl, mask], PARAM 0x02406–0x0277c)
- Mask bits: 1 = magician line (M), 2 = scholar line (S), 4 = druid (D).
- The minlvl/mask values and the effect column are **proven** (code).
- The names come from the manual and are matched to effects. The mapping is **hypothesis (strong)**: every effect matches its description.
- k = 30..40 are scanned by the learning loop but never initialised, so they stay 0 and are never learnt. **proven** (no writer)

| id | Name (manual) | minlvl | mask | Target | Effect (GESORT) |
|---|---|---|---|---|---|
| 1 | Healing | 1 | S D | party (alive) | `level` × (hp += rnd(2p+2)+1, cap maxHP) |
| 2 | Physical protection | 3 | S M | party | 0x2e56[t] = 25+5p, icon 2 |
| 3 | Psychic protection | 4 | M | party | 0x2e7a[t] = 25+5p, icon 3 |
| 4 | Resurrection | 15 | S | party (dead) | HP = 1, **XP 0x2d50 = 0**, csend FRISE 32 |
| 5 | Global psychic protection | 8 | M | all alive | 0x2e7a = 12+5p |
| 6 | Global physical protection | 6 | S M | all alive | 0x2e56 = 12+5p, icon 2 |
| 7 | Metamorphosis | 12 | M | – | csend BUSTE −101 |
| 8 | Fire protection | 7 | D | all | 0x2faa = 25+5p, icon 8 |
| 9 | Specific care: blindness | 7 | S D | party | 0x2e86 = 0; csend FRISE 33 (t, 23) |
| 10 | Specific care: poison | 9 | S D | party | 0x2e92 = 0; csend FRISE 33 (t, 99) |
| 11 | Turn undead | 12 | M | actor | if 0x45e8[id] ≠ 0: 0x3946[id] = 100p/3 |
| 12 | Paranormal detection | 10 | **S** | – | messages 53/55/54 (R5) |
| 13 | Exorcism | 11 | S | zone | lifts the zone curse, clears 0x2fb6, message 56 |
| 14 | Memo-telep | 12 | M | – | stores the teleport anchor; p forced to 2 |
| 15 | Teleportation | 14 | M | – | jumps to the anchor; caster MP/phys/HP = 1 |
| 16 | Change of timescale | 13 | M | – | 0x2e6e[0] = 200p; PPECHAP regeneration |
| 17 | Telepathic reconnaissance | 12 | S | actor | shows HP/AGI/STR/CON |
| 18 | Magic key | 11 | M | object | material 66 / 67 (R5) |
| 19 | Sleep | 5 | M | actor | if 0x45e8 == 0: 0x3a24 = 83p/3 |
| 20 | Inversion | 14 | S M | actor/party | toggles 0x3b02[id] or 0x2e4a[t] |
| 21 | Spiritual hammer | 6 | S | actor | damage, k = 2 |
| 22 | Flaming hand | 6 | M | actor | damage, k = 2 |
| 23 | Blinding | 7 | S D | actor | if 0x45e8 == 0: 0x3be0 = 100p/3 |
| 24 | Fireball | 1 | M | actor | damage, k = 1 |
| 25 | Lightning | 8 | M | area | area damage, k = 2 |
| 26 | Paralysis | 10 | S M | actor | if 0x45e8 == 0: 0x3946 = 100p/3 |
| 27 | Spirit of flame | 16 | M | actor | damage, k = 4 |
| 28 | Fire-storm | 15 | M | area | area damage, k = 4 |
| 29 | Ice-cloud | 8 | M | actor | damage, k = 4, own animation L_012bf, marker −2 |

Notes on the table:
- **Manual contradicted:** the manual lists Paranormal detection (12) as a magician spell, but the code has mask 2 (scholar line). Follow the code.
- **Duration constants** 1000/12 and 100 come from 0x4fcc/12 and 0x4fcc/10. 0x4fcc = 1000 on DOS (MAIN 0x004a7). **proven**

## R4. Learning, buying, power
- **The level routine** is FRISE L_060d4. It runs for c when XP 0x2d50[c] ≠ the FRISE copy dirti 0xf6[c] (not saved).
- **What it does:**
  - It clears 0x2f18[c][0..26] (0x0628a).
  - For k = 0..40 it checks: `(mask(k) & classmask) && minlvl(k) ≤ level && minlvl(k) ≤ cap`.
  - Each spell that passes goes to the next free slot: 0x2f18[c][slot] = k and **0x4fde[c][slot] = (level − minlvl)/3 + 1** (power p). Slots end up in ascending id order.
  - If the panel is open (0x4f0a[c] == 3), it sends csend GESORT −99 (redraw).
  - **proven**
- **Spells are a pure function of class and level. Nothing is learnt individually and nothing is bought.** MARCHAND and TAVERNE never write 0x2f18 or 0x4fde. No item or script grants spells. **proven**
- Recruit (FRISE 0x02151–0x022d3) sets f6 = −1 and copies the EN1 stats. MP and physical become 100, the spell table is cleared and then rebuilt by the rule. **proven**
- **Debug path:** PARAM 0x005e1, when 0x4ef3 == 1, gives character 2 spells 1..27. Not reachable in normal play (**hypothesis**).
- **Save validation:** all **4740 character records in 257 unique original saves** match the rule exactly, ids and power. **proven**
- **Save offsets for spells:**
  - Spell id: 0x2f18[c][s] at save **1341 + 27c + s** (byte).
  - Power: 0x4fde[c][s] at save **7899 + 27c + s** (byte).
  - The strides come from MAIN cdim (27/27/2). **proven**

## R5. Casting (GESORT, script id 7)

### Input path
GESORT runs as a per-frame loop (cstop). Its main loop L_0008d requires 0x4aa0 == 0, 0x4fd0 == 0 and 0x4fba == 0. The mouse state is main 0x76/0x78/0x7a (x, y, button: 1 = left, 2 = right), written by SOURIS from cmouse. **proven**

Steps:
1. **Open the panel (icon row).** Button down with script y 62..73 gives ix = x/16 and c = ix/4. It requires HP > 0 and class ≠ −1.
   - ix%4 = 3 is the **red dot**. If 0x5068[c] ≠ −1, it toggles 0x4f0a[c] between 3 (open: L_0032e draws the spell grid, L_011d2 draws the MP number) and 0.
   - ix%4 = 1 or 2 closes or erases the panel.
   - **proven**
2. **Pick a spell (grid).** This requires a click at script y 17..61, 0x2ab7 == 0, c = x/64, HP > 0, class ≠ −1, cursor 0x2d16 == 0 and panel open. It enters L_00515:
   - col = (x − 64c)/16 and row = 2 − (y − 17)/15.
   - **col < 3:** slot = 3·row + col and spell = 0x2f18[c][9·page + slot]. page = GESORT dirtc 0x22[c] in 0..2 (not saved).
   - **col = 3, row 0:** page −1 (if page > 0).
   - **col = 3, row 1:** page +1 (if page < 2 and the new page's slot 0 is non-empty).
   - **proven**
   - Drawing: icons at x = 64c + 16·col + 7 and y = (2 − row)·15 + 24, with resource 11 + spell (empty slot: resource 41). Hovering shows power p and MP under the arrows. **proven**
3. **Cast (L_0060f).**
   - **If MP == 0, nothing happens:** no cost and no RNG.
   - **The only MP gate is MP > 0. There is no "MP ≥ cost" check**, so a caster with 1 MP casts at full power and ends at 0 (faithful quirk). **proven**
4. **Target pick (L_01026 / L_0102a).**
   - The cursor becomes −6 (0x2d16 = −6), with 0x49d3 = 1 and 0x4a00 = −2.
   - **Left click with script y < 71** (HUD) picks party target t = x/64 (dirw38 = −1).
   - **Right click** cancels.
   - Otherwise (3-D view) SOURIS 0x00781 runs `ctstform 32767,0`. 0x4a00 = entity (or −1) and 0x4a02 = material (cmatent; 1 = actor). Actor id = entity + 0x0d.
   - **There is no range or line-of-sight check** for single-target actor spells beyond what is clickable. **proven**
5. **End:** L_00f07 / L_01422 restore the cursor and set dirb1b = 0. **proven**
- **Keyboard:** GESORT has no hotkey. Keys only move the pointer (SOURIS). **hypothesis**

### Cost (L_00f3b)
- **MP_new = max(0, MP_at_cast_start − 3p)**, followed by a redraw. **proven**
- Which spells pay when (**proven**):
  - Paid only on success: 1, 4, 9, 10, 2/3 (no cost if the pick is cancelled).
  - Paid even if the actor is immune (0x45e8 condition false): 19, 23, 26, 11.
  - **Paid even if cancelled:** 20 (0x00a24 → L_00add).
  - Paid before the effect: 16, 18.
  - 15 pays only if the anchor is in range; otherwise message 52 "too far" and no cost.
  - 14 forces p = 2, so the cost is 6.
  - Damage spells (21/22/24/27/29) pay on a hit or on immunity, not on cancel.

### Damage (L_00f11, computed before the target pick)
- **`dmg = ((k + p) · (rnd(MP/10) + rnd(stat·5/10))) / 4`**
  - k = 2 for 21/22, 1 for 24, 4 for 27/29, 2 for 25, 4 for 28.
  - MP = value at cast start. stat = INT or WIS (R2).
  - The RNG order is rnd(MP/10) then rnd(stat·5/10). **Both are drawn even if the pick is then cancelled.** **proven**
- **Single target (L_00fc5):** applies only if material == 1 (actor) and 0x418c[id] ≠ marker (−1; −2 for 29). Then HP 0x36ac[id] −= dmg.
  - No armour, no hostility change, no zone check. **proven**
  - The meaning of the 0x418c markers (−1/−2 = immune) is a **hypothesis**.
- **Area (L_010c3, under cinteroff)** covers actors 50..0x4a81−1 (0x4a81 = 110, MAIN 0x00a7d). An actor is hit when all of these hold:
  - 0x418c ≠ −1, HP > 0, 0x449a[id] == zone 0x4ef2;
  - |Δrow| < 3 and |Δcol| < 3 from the party;
  - 0x43ba[id] < 0 (hostile).
  - For each hit actor in loop order, **dmg −= 0x418c[id] cumulatively** (the reduction carries over to the next actor; faithful quirk). If dmg > 0 then HP −= dmg.
  - After the entity loop, 0x3a24[id] = 0 for every hit actor (wakes sleepers).
  - **proven**
- **Kill:** if HP ≤ 0 → ckill + csend FRISE 29 → L_057ef (0x449a = 0, HP = 0, XP, loot). **proven**
  - The "killer" XP share uses FRISE's own dirb13 (the last slot FRISE handled), not necessarily the caster. **open**
  - In the area path the kill check sits inside the entity search (cfindcla 35, entity + 0x0d == id). An actor hit without a displayed entity can therefore be left with HP ≤ 0 and not killed. **hypothesis** (code reading; untested)

### Other effects
- **12 Paranormal detection:**
  - If (zone 0x4ef2 == 7 and 0x50a6 == 0) or (46 and 0x50a7 == 0) or (35 and 0x50b5 == 0): message 53 "this place is bewitched".
  - Else, if an alive member has 0x2fb6 set: message 55 "one of the companions is under a spell".
  - Else: message 54 "the air is cool".
  - Then the cost. **proven**
- **13 Exorcism:** sets the zone's flag (0x50a6, 0x50a7 or 0x50b5) to 1, clears 0x2fb6 for all 5, shows message 56 "purified", then the cost. **proven**
- **14 Memo-telep:** writes the anchor: 0x4fd1 = row, 0x5074 = col, 0x5075 = CONT 0x2d18, 0x5076 = zone. **proven**
- **15 Teleportation:**
  - Works if CONT == 0x5075 or the pair is {7,3}/{3,7}.
  - The caster's MP, physical and HP are all set to 1.
  - csend MAIN 14, −3 (MAIN 0x00f1c moves the party to the anchor; facing is unchanged). The anchor is cleared.
  - **proven**
- **16 Timescale:** cost first, then 0x2e6e[0] = 200p. csend MAIN 17, −61 → PPECHAP, which subtracts 1 per frame, gives +1 HP/MP/physical every 10 frames, and ends at ≤ 0. Total: **+20p** of each (capped). **proven**
- **17 Telepathic reconnaissance:** MESSAGE −1 shows the actor's HP 0x36ac, AGI 0x41fc, STR 0x3e0e and CON 0x3e7e. **proven**
- **18 Magic key:** cost first, cursor −11, then a pick.
  - Material 66 → 0x4aa4[8] = 1.
  - Material 67 → PCAVE csend 19 and 0x4aa4[29] = 1.
  - Code **proven**. Which doors these are is **open**.
- **20 Inversion:** on an actor with 0x45e8 == 0 it toggles 0x3b02[id]. On a party member it toggles 0x2e4a[t] (icon 20). Not timed. **proven**
- **7 Metamorphosis:** csend BUSTE −101, then the cost. The visible result is **open** (BUSTE not traced).

## R6. Status timers and their decrement
Party timers are word arrays, +2c. They are decremented by **1 every 10 passes** of the FRISE interrupt routine (header ret_offset 0x7179; code 0x0717f–0x072c1, counter dirb8b). At 0 the icon is removed (L_06f4d). **proven**

| Var | Save | Meaning | Icon | Set by |
|---|---|---|---|---|
| 0x2e56 | 1216 | physical protection: monster melee and damage spells halved | 2 | spells 2/6 |
| 0x2e26 | 1186 | paralysed (no attack; monster spell hit chance → 95) | 26 | monster spell 26 = 3L |
| 0x2e86 | 1256 | blind | 23 | monster spell 23 = 3L; cleared by 9 |
| 0x2e62 | 1226 | blocks monster damage spells | 98 | not set by a player spell (writer **open**) |
| 0x2e7a | 1246 | psychic protection: blocks monster spells 20/23/26 | 3 | spells 3/5 |
| 0x2faa | 1481 | fire protection: monster damage spells /5 | 8 | spell 8 |

- Not timed: 0x2e4a (inversion, save 1206), 0x2fb6 (curse, 1491), 0x2e92 (poison strength, 1266).
- **Poison:** every 251 FRISE main-loop passes (loc104 250 → 0, FRISE 0x00a02–0x00a70), HP −= 0x2e92[c] for members with 0x2fa2 ≠ −1. If HP < 0, HP = 0 and the poison is cleared. **proven**
- **Actor timers** are word arrays, save off + 2id:
  - paralysis/turned 0x3946 (3921), sleep 0x3a24 (4141), blind 0x3be0 (4581), inversion 0x3b02 (4361, a toggle).
  - EATT 0x0024f–0x002a2 decrements **only the first non-zero of 3946 → 3a24 → 3be0**, by 1, when the actor's id is in the current EATT window.
  - The window is 10 actors per pass on DOS (0x5192 = 1), giving one decrement per actor every 6 EATT passes. The loop is gated by 0x2ab7 == 0.
  - **proven**
- **Durations in frames** assume one pass of FRISE/EATT per frame (**hypothesis**) at about 23.3 fps (ctiming 3, from zeit-ishar2.md):
  - Spell 2 at p = 1: 30 × 10 = 300 frames ≈ 12.9 s.
  - Sleep at p = 5: 138 × 6 = 828 frames ≈ 35.5 s.
  - Paralysis at p = 4: 133 × 6 ≈ 34 s.
- **Monster casting** (EATT L_00e6d / L_00f25 / L_01024 / L_01149):
  - **Who casts:** hostile actors of class 0x3cbe ∈ {5, 6, 9, 16, 18} with cooldown dirti 0x20 ≤ 0, at range < 3 (< 4 on CONT 5/6/7; race 45 → 1), in the same row or column.
  - **Target:** rnd(5), re-rolled until the member is alive.
  - **Hit:** succeeds if rnd(80) < 10L (95 if the target has 0x2e26).
  - **Spell choice:** 0x426e[id][rnd(3)] (save 6231 + 3id), re-rolled if 21/22.
  - **Effects:**
    - 20 → 0x2e4a = 1
    - 23 → 0x2e86 = 3L
    - 26 → 0x2e26 = 3L (20/23/26 are blocked by 0x2e7a)
    - 24 → rnd(L) + 10
    - 27 → rnd(3L) + 10
    - 25 → every member takes rnd(4L) + 10
  - **Modifiers:** blocked by 0x2e62; 0x2faa → /5; race 59 with item −25 → /5; non-25 spells −= ARM/2; then the melee tail (/2 with 0x2e56).
  - **Cooldown:** (1000/4)/(L + 1).
  - **proven**

## R7. Save persistence (8359-byte save)
All offsets are **proven** (MAIN save block list and cdim).
- MP: 1321 + c (byte). Max MP: none (100 fixed).
- Spells: 1341 + 27c + s. Power: 7899 + 27c + s. Caster flag: 8034 + c.
- Party timers (word, +2c):
  - 1186 (2e26), 1206 (2e4a), 1216 (2e56), 1226 (2e62);
  - 1236 (2e6e[0], timescale counter);
  - 1246 (2e7a), 1256 (2e86), 1266 (2e92);
  - 1481 (2faa), 1491 (2fb6).
- Status icons 0x4b88[c][0..9]: 7579 + 10c + k.
- Teleport anchor (words): 0x4fd1 at 58, 0x5074 at 60, 0x5075 at 62, 0x5076 at 64.
- Curse flags (words): 0x50a6 at 72, 0x50a7 at 74, 0x50b5 at 84.
- Actor data:
  - HP 0x36ac at 3261 + 2id.
  - Status words 3921/4141/4361/4581 + 2id.
  - Undead flag 0x45e8 at 6891 + 2id.
  - ARM/marker 0x418c at 6011 + id.
  - Relation 0x43ba at 6561 + id.
  - Zone 0x449a at 6781 + id.
  - Spell list 0x426e at 6231 + 3id.
- **Not saved:** panel state 0x4f0a, page dirtc 0x22, FRISE dirti 0xf6 (so the level routine runs after a load and rebuilds 2f18/4fde unchanged), and the RNG state.
- None of the 257 saves has an active status timer, so there are no runtime timer samples. **open**
- No before/after cast save pair exists (pairs.py). The diffs below are **predictions**.

## R8. Screen coordinates (for test input)
- The script y in GESORT/FRISE/MARCHAND is flipped: **screen_y = 199 − script_y**. SOURIS 0x00223 writes 0x78 = 199 − y (noted in Alderaan's REFERENCES.md).
  - This is consistent with the HUD screenshot: icon row at screen 126..137, portraits 138..181.
  - It also fits Alderaan's working clicks (icon (40,131), portrait (32,170)) and the MARCHAND "y > 60" portrait test.
  - start.exe's INT 33h handler (1000:1249/1259) stores raw coordinates; the flip is in the script.
  - Rating: **hypothesis-strong**. A 1-px offset is open, as per Alderaan.
- **Screen targets for character c:**
  - Red magic dot: x = 64c + 48..63, y = 126..137. Use (64c + 56, 131).
  - Grid slot (row r, col k), row 0 = top: x = 64c + 16k + 8, y = 145 / 160 / 175 for r = 0 / 1 / 2.
  - Previous-page arrow: (64c + 56, 145). Next-page arrow: (64c + 56, 160).
  - Party target t: click the portrait (64t + 32, 160). Actor target: click the sprite in the 3-D view (screen y ≤ 128).

## R9. Reproducible tests (for Alderaan/Hoth)
Shared procedure:
- Load the save the way Alderaan does (disk (266,12) → LOAD → name), wait for the scene, then **save once immediately as A** (this baseline absorbs the EDPLT actor re-roll and clock noise).
- Do the clicks, then **save as B**. Diff A → B.
- Expected noise: the clock bytes (45/49) only.

### T1: START.SAV (e685cd69…), Physical protection on the warrior
The party:

| Slot | Class | Level | Spells (id, power) |
|---|---|---|---|
| C0 | Warrior | 5 | – |
| C1 | Archer | 5 | – |
| C2 | Barbarian | 6 | – |
| C3 | Occult monk | 4 | INT 19, MP 100: (2,1) (3,1) (24,2) |
| C4 | Priest | 4 | WIS 19, MP 100: (1,2) (2,1) |

Clicks:
1. (248,131): opens C3's spell panel; icons for 2, 3 and 24 appear in the top row of portrait IV.
2. (200,145): slot 0 = spell 2; the cursor changes to the target cursor.
3. (32,160): target C0.

Expected (**hypothesis = prediction from proven code**):
- C3's MP display goes 100 → **97**.
- Status icon 2 appears for C0 and **disappears after about 300 frames (about 13 s)**.
- Save B, if taken within about 10 s:
  - 1324 = 97 (0x61);
  - 1216/1217 = 0x001E (30) minus the elapsed tenths of passes, so between 1 and 30;
  - one byte in 7579..7588 = 2.
- Save C, taken after more than 20 s: 1216/1217 = 0, the icon byte is 0 again, and 1324 stays 97.
- Optional follow-up: (216,145) spell 3, then (96,160) target C1. Expected 0x2e7a[1] at 1248/1249 = 30, icon 3 on C1 and MP 1324 = 94.
- **No RNG** is involved, so T1 is deterministic.

### T2: LEVELING.SAV (dac7e0a4…), Healing (deterministic)
- Party state: C4 Scholar, level 6, MP 100, spells (1,2) (2,2) (6,1) (21,1). C0 has HP 235/240.
- Clicks:
  1. (312,131): opens C4's panel.
  2. (264,145): slot 0 = Healing.
  3. (32,160): target C0.
- Expected:
  - 6 × (rnd(6) + 1) ≥ 6 > 5 missing, so **C0 HP = 240** exactly (save 996/997 = 0x00F0).
  - **C4 MP = 94** (save 1325).
  - Six RNG draws. **hypothesis-prediction**

### T3: LEVELING.SAV, Lightning on the guard group (RNG)
- C2 Magician, level 19, INT 17, MP 100.
- Page 0 holds 2, 3, 5, 6, 7, 11, 14, 15, 16. Page 1 holds 18, 19, 20, 22, 24(p7), **25(p4)**, 26, 27, 28. Page 2 holds 29.
- The party is at (65,12), zone 21. The hostile guards (race 33, ARM 0x418c = 0) are actors 90–92 at (65,11), 93–95 at (65,10), 96–98 at (65,9) and 99–101 at (64,8).
- Clicks (no target needed):
  1. (184,131): opens C2's panel.
  2. (184,160): next page.
  3. (168,160): page 1 slot 5 = Lightning.
- Expected:
  - **C2 MP 100 → 88** (save 1323).
  - **Actors 90–95** (|Δcol| ≤ 2) lose the **same** amount D = ⌊6·s/4⌋, where s = rnd(10) + rnd(8) ∈ 0..16. So D ∈ {0, 1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22, 24}. Their HP is at 3261 + 2id.
  - **Actors 96–101 are unchanged** (Δcol = 3 / 4).
  - Nobody dies (guard HP is 72+).
  - The guards' sleep words 4141 + 2id stay 0.
- A variant is Fireball: page 1 slot 4 → (152,160), then click a guard sprite. One guard loses an **even** amount 2·s (0..32), and MP goes to 79.

## Limits
- Static only. No game run. All save diffs in R9 are predictions.
- Frame rates of the FRISE interrupt and the EATT loop (seconds per timer unit) are a **hypothesis**.
- The screen-y flip and its 1-px offset are a **hypothesis**.
- Spell names come from the manual (**hypothesis**). Spell 12 contradicts the manual.
- Not traced: BUSTE −101 (Metamorphosis visual); the doors behind materials 66/67 (Magic key); the 0x2e62 writer; the full meaning of the 0x418c marker and the 0x45e8 "undead" flag; the killer-XP slot for spell kills; and MP 54 → 67.

## Next step
1. Alderaan/Hoth run T1 (deterministic, no RNG) and T2 (deterministic), then T3. Report the A → B diffs and a frame count for the icon lifetime in T1.
2. Then trace BUSTE −101 and the 0x2e62 writer, and confirm the timer frame rate with a timed capture.
