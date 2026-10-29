# Magic system contract, Ishar 1 DOS (spell list, learning, casting, effects, timers, save)

## Handoff header
- **Base commit:** bvultrex/ishar-construction-kit `bb42748`, branch `workbench/playable-slice`, clone `/workspace/ishar/clones/quesh` (read-only, nothing committed or pushed).
- **Question:** the full contract for the Ishar 1 magic system: spell list, who can cast, learning/buying, costs, casting input path, MP deduction, targets, effect formulas, status timers, RNG calls, save persistence, reproducible tests.
- **Method:** static only. ALIS listings `decompile/alis/listings/ishar1/*.IO.asm` (disasm.py), PARAM table simulation (private helper `/tmp/q1/ptab.py`, copy in `private/ishar1-contracts/`), manual `ishar-manual.pdf` (pdftotext), 14 unique original 5216-byte saves (originals + Alderaan `private/work/ishar1` + Hoth work dirs).
- **Commands:** `rg`/`awk` over the listings; `sha256sum`; python dump of save offsets 768/788/4921/5021/628–718/4183 on all saves.
- **Result:** R1–R9. The whole cast path is in **FRISE** (no GESORT in Ishar 1). Learning is **bought at a trainer (STAGE)**, not level-derived as in Ishar 2. Costs and spell levels come from one table with an **index off-by-one between STAGE and FRISE** (R3, faithful quirk).
- **Limits:** no runtime cast diff exists (no save shows an active timer or a cast pair). Frame rate of the FRISE interrupt and the 1-px screen-y offset are hypotheses.
- **Next step:** Alderaan/Hoth run T1 (deterministic) and T2 (deterministic), then T3 (R9).

Ratings: **proven** = read in code (and checked against saves where stated). **hypothesis** = plausible, not fully closed. **open**. **contradicted** = a source claim the code refutes.

## SHA-256 prefixes (originals/ishar1/Ishar1)
| File | SHA-256 prefix |
|---|---|
| FRISE.IO (HUD, action menu, casting, timers; id 4) | 3bd158963fdaf0f8 |
| STAGE.IO (trainer; id 0x36) | 1b5f4b5ce7222aa7 |
| PARAM.IO (init, spell-level table 0x4010) | f42ea12ceffa6b87 |
| GEREN.IO (actor manager, actor timers, monster spells) | 60405e4537abff12 |
| SOURIS.IO (mouse, 3-D pick) | 2bbc1362e2f84c51 |
| MESSAGEE.IO (English texts: names, menus) | 1b6a76f2c931e4dd |
| MAIN.IO (save list, building dispatch) | 27c5834de005afc9 |
| ITAVERNE.IO (sleep: mental restore) | f3bed78c5fb97360 |
| start.exe | 3ea63234c97b77d8 |
| S1.SAV / LP1.SAV | 92023f2b51e34f74 / 76cf91a104ec8675 |

Conventions: `op(opile)` = popped OP acc. `rnd(n)` = (r·n)>>16 ∈ 0..n−1, start.exe 1000:6d7b, always advances. Words big-endian, element i at off+2i. c/t = party slot 0..4 (caster/target), a = actor id, s = spell id, L = caster level 0x167c[c], M = caster MENTAL 0x16b4[c] at cast start.

## R1. MENTAL ("MP") and the stats magic uses
- **MENTAL = 0x16b4[c]**, byte, save **768+c**, 0..100. FRISE sheet prints it on the MENTAL/PSYCHE line (FRISE 0x07735, y 100); HUD bar from 0x0076a. **proven**
- **No max-MENTAL variable**; every writer uses 100. Complete writer list (all .IO): FRISE L_02cee (cast cost), ITAVERNE 0x0067d–0x006b3 (sleep: >50 → 100 else +50, cap 100), FRISE 0x0363d (recruit = 100), FRISE 0x05129 (flask potion code 1010/1 "Ghoslam" = 100), PARAM 0x0024a/0x00979 (init 100), save load. **No passive regeneration.** **proven**
- Level 0x167c[c] (save 738+c), class 0x1664[c] (728+c, −1/255 = empty), WIS 0x1694[c] (753+c), INT 0x169c[c] (758+c; FRISE sheet line y 140 = INTELLIGENCE). **proven**
- Note: FRISE 0x02371 computes a "power stat" loc130 (classes 3/4/6 → 0x1694, else 0x169c) but **never reads it**: WIS/INT do not affect any cast. **proven** (dead store)

## R2. Who can cast
- ACTION menu (FRISE L_00bcf) shows CAST SPELL only for classes **{0 Paladin, 2 Ranger, 5 Cleric, 6 Wizard, 9 Priest, 16 Witch, 18 Occult monk}** (0x00ca8; class names MESSAGEE 0x01bcd). **proven**
- Opening the spell list additionally needs **MENTAL > 0** (0x00e2a). **proven**
- Class gate is menu-only; the rune shortcut (R5) checks only that a rune is stored. **proven**

## R3. Spell list and the level table (PARAM 0x02d5d–0x02f6f → main 0x4010, not saved)
Names: MESSAGEE L_01d0e (number in the name = intended level). `lvl(s) = T[s−1]` is what STAGE uses; `sl(s) = T[s]` is what FRISE uses for cost/roll/damage (**off-by-one, faithful quirk**, proven code; no runtime sample).

| s | name (MESSAGEE) | lvl(s) STAGE | sl(s) FRISE | target | effect (FRISE) |
|---|---|---|---|---|---|
| 1/2/3 | Healing 1/3/5 | 1/3/5 | 3/5/1 | party, alive | L × (HP += rnd(2s+2)+1, cap maxHP) |
| 4/5/6 | Protection 1/3/5 | 1/3/5 | 3/5/1 | party | 0x161c[t] = 10000·(s−4) + ⌊5ML/4⌋, icon 4 |
| 7 | Sleep 1 | 1 | 2 | actor | 0x1ccc[a] = ⌊ML/4⌋ |
| 8 | Cure poison 2 | 2 | 0 | party | if 0x1658[t] < 3: 0x1658 = 0, icon 99 removed |
| 10 | "Fire protection 5" | **8** | 0 | front actor | 0x22f2[a] = −10 (R5) |
| 12 | Dissolve 6 | 6 | 3 | party | 0x1604[t] = 5ML, icon 12 |
| 13 | Radar 3 | 3 | 8 | – | actor map ±6 cells on the HUD |
| 14 | Flame wall 8 | 8 | 10 | actor | dmg L+sl |
| 15 | Resurrection 10 | 10 | 4 | party | HP = 1, **XP = 0**, grid re-insert |
| 16 | Inversion 4 | 4 | 6 | actor/party | toggle 0x1d5a[a] / 0x1610[t] |
| 17 | Psychic hammer 6 | 6 | 1 | actor | dmg L+sl |
| 18 | Burning hands 1 | 1 | 1 | actor | dmg L+sl |
| 19 | Magic missile 1 | 1 | 1 | actor | dmg L+sl |
| 20 | Charm 1 | 1 | 0 | actor | 0x39ba[a] = INT[c] |
| 22 | Blindness 3 | 3 | 3 | actor | 0x1de8[a] = ⌊ML/4⌋ |
| 23 | Fireball 3 | 3 | 4 | actor | dmg L+sl |
| 24 | Invisibility 4 | 4 | 4 | party | 0x15f8[t] = 5ML, icon 24 |
| 25 | Lightning 4 | 4 | 5 | area | ⌊(L+sl)/2⌋ − ARM, cumulative |
| 26 | Binding 5 | 5 | 6 | actor | 0x1c3e[a] = ⌊ML/4⌋ |
| 27 | Invulnerability 6 | 6 | 6 | party | 0x1628[t] = ⌊5ML/4⌋, icon 27 |
| 28 | Mental shield 6 | 6 | **0** | party | 0x1640[t] = ⌊5ML/4⌋, icon 28 |
| 29 | Magic shield 7 | **0** | – | – | **no effect, no cost** (switch → L_02ce4) |
| 30 | Regeneration 7 | 7 | 9 | party | 0x39ae[t] = ⌊5ML/4⌋, HP = maxHP, icon 30 |
| 31 | Psychic hand 9 | 9 | 10 | actor | dmg L+sl |
| 32 | Anti Krogh | 10 | 3 | actor | dmg 300 (×4 / ÷60, R5) |
| 33 | Confusion 3 | 3 | 4 | actor | 0x3ad6[a] = ⌊ML/4⌋ |
| 34 | Detect invisibility 4 | 4 | 6 | area | 0x3a48[a] = 0 within ⌊L/2⌋+1 |
| 35 | Party protection 6 | 6 | 5 | all alive | 0x161c = ⌊5ML/4⌋ (tier 0), icon 4 |
| 36 | Invisible team 5 | 5 | T[36] (0, hyp.) | all alive | 0x15f8 = ⌊3ML/4⌋, icon 24 |
- Ids 9, 11, 21 have no name and no effect. **proven**
- **contradicted / naming:** id 10 is named "FIRE PROTECTION 5" but its STAGE level is 8 and its effect repels the actor in front; it matches the manual's cleric "Repulse (Level 8)". Follow the code. id 29 "MAGIC SHIELD 7" has level 0 and no effect. The manual's "Invulnerability 6"/"Mental shield 6" etc. match. **hypothesis** (name mapping), code **proven**.
- T[36] lies outside the 36 initialised bytes (PARAM writes T[0..35]); 0 assumed (main memory zero at boot: **hypothesis**).

## R4. Learning / buying (STAGE.IO; trainer = MAIN building type 3, table 0x4178)
- Spell trainers are STAGE parameter 0..3 (table entries (x,y,zone,param): (35,53,z1)=0, (35,67,z13)=1, (18,8,z4)=2, (30,78,z14)=3). Params 10..13 are the attribute courses (10 = agility, Alderaan NPCA at (31,18)). **proven** (table), locations from the PARAM simulation.
- Offer lists 0x4002[0..10] (STAGE L_00a72): p0 {1,4,7,13,18,19,20,8,25,33,24}, p1 {5,22,13,12,16,17,33,25,26,27,34}, p2 {2,6,30,14,35,36,28,30,24,26,18}, p3 {3,6,23,27,34,33,17,31,10,14,15}. **proven**
- Flow: OK → choose candidate (portrait) → class gate (any party member of class {0,2,5,6,9,16,18} must exist, 0x001d4; chosen one must be in the set, 0x002f0) → choose spell row → per-class allow rule (0x00461):
  - 0 Paladin: lvl(s) == 1 and s < 18; 2 Ranger: lvl(s) < 4 and s < 18, or s = 33; 5 Cleric: s < 18 or s ∈ {33,35,36}; 6 Wizard: 17 < s < 33 or s = 34; 9 Priest: s ∈ {20,22,24,26}; 16 Witch: s ∈ {22,24,26,27,30,34}; 18 Occult monk: lvl(s) < 6 and 17 < s < 33, or s = 34. **proven**
  - **No character-level requirement and no "already known" check.** **proven**
- **Price = 3000·lvl(s)** gold (0x3f12 = 3·lvl thousands, 0x3f10 = 0 units). Paid **from the chosen character only**: refused (message −21) if 1000·gold_k + gold_u < price (compare 0x00747 on 0x154e/0x3770). Subtraction with borrow L_009cf. **proven**
- **Success roll after payment:** `rnd(13) + lvl(s) < WIS` (classes 0, 2, 5; 0x1694) or `< INT` (all others; 0x169c). Fail → message −49, **gold is kept by the trainer**. **proven**
- Success → L_0085f: first empty slot of 0x16de[c][0..9]; if slot 9 is occupied the player picks a slot to overwrite (L_008a7). **proven**
- Recruits bring 3 spells: FRISE 0x03697 copies 0x221e[npc][0..2] → 0x16de[slot][0..2] and clears 3..9 (explains e.g. a witch with 25/32 in LP.SAV). **proven** (code), consistent with all 14 saves (every spell set is either trainable for the class or within the first 3 slots).

## R5. Casting (FRISE)
### Input path
1. **ACTION icon** of c (screen (64c+16,132); script y 62..73, x/32 even, FRISE 0x00309) → L_00bcf menu (2 columns × 6 rows, col = x/159, row = (script_y−1)/10). CAST SPELL = col 0 row 0 (only casters). **proven**
2. **Spell list** L_02063: slots 0..5 left column rows 5→0, slots 6..9 right column rows 5→2; **empty slots are skipped (list is compacted)**; right row 1 = WRITE RUNES (−2), right row 0 = EXIT (−1). The rune slot's spell is highlighted. **proven**
3. Click a spell: if WRITE RUNES was clicked first (loc157 = 1) → **0x3ee6[c] = s** (rune), no cast, no cost. Otherwise dirb5d = s, menu closes, FRISE 0x00387 calls **L_02314** (cast). **proven**
4. **Rune shortcut:** portrait click (64c+32,160) opens the hands panel (dirtc1a[c] = 1, rune icon drawn); then a click at script x ∈ (64c, 64c+14), y ∈ (17,45) with empty cursor and 0x3ee6[c] ≠ 0 casts that spell (0x0060e). **The rune is not consumed.** No class check. **proven**
5. **Gate in L_02314: MENTAL > 0** only. No "MENTAL ≥ cost" test (a caster with 1 MENTAL casts at full effect and ends at 0). **proven**
6. Target pick: party spells L_02f1a (left click with script y < 71 → t = x/64; right click cancels → t = −1); actor spells L_02d80 (0x2339 = 1, SOURIS ctstform; actor id = entity byte +0x0d; material 0x3668 = 1 required); Inversion L_02e93 accepts both. **No range or line-of-sight check** for picked actors. **proven**

### Rolls (one `rnd(100)` per roll)
- **Friendly (party) spells:** success if `rnd(100) < 8·L + M`. **proven**
- **Hostile actor spells:** success if `rnd(100) < M − 3·(sl − L)`. **proven**
- **No roll:** 10, 13, 25, 34 (and 29 does nothing). 35/36: one roll for the whole party. **proven**

### Cost (L_02cee)
- **MENTAL_new = max(0, M − (sl(s) + 5))**, M = value at cast start, sl = FRISE's T[s] (off-by-one). **proven**
- When paid: after any roll (success or fail) once a valid target exists. **Not paid:** cancelled party/actor pick, dead heal target, MENTAL = 0, spells 9/11/21/29. **Paid even on cancel:** 16 Inversion (0x027bb → L_02891). Always paid: 10, 13, 25, 34. **proven**

### Effect details
- **Damage spells** (L_02de6, 14/17/18/19/23/31/32): `dmg = L + sl(s)` (32: 300). **No damage RNG, no armour.** ×4 if actor 39 and the caster carries item 40 in slots 0..10 (dirb8f, 0x0234b); spell 32 against any actor ≠ 39 → ÷60 (= 5). `HP 0x1b22[a] −= dmg`; HP ≤ 0 → ckill + L_06845 (XP as combat R5). **proven** (meaning of item 40 open)
- **Lightning** (L_02f66): actors 28..0x3697−1, alive, same zone 0x3910 == 0x1508, |dx| < 4 and |dy| < 4: `D −= ARM 0x218c[a]` (**cumulative over actors**, Ishar-2-like quirk), if D > 0: HP −= D, wake (0x1ccc = 0), kill check through the visible entity. **proven**
- **Healing** (1/2/3): target alive (HP > 0); L iterations of `rnd(2s+2)+1` (1..4 / 1..6 / 1..8), clamp at maxHP each step. **proven**
- **Resurrection** (15): target needs 0x3908[t] ≠ −1 and class ≠ −1 — **no "is dead" test**: on a living member it still sets HP = 1 and XP 0x1536 = 0. Puts t+1 into the first empty grid cell (loop j = 4→0, i = 0→4) even if t is already in the grid. **proven** (code), gameplay consequence **hypothesis**.
- **Inversion** (16): actor → toggle 0x1d5a[a] (GEREN: inverted actors fight for the party, L_00ca1); party → if 0x1610[t] ≠ 0 clear it and its icon, else set 1 + icon 16. 0x1610 ≠ 0 blocks the member's attack (combat R1). Not timed. **proven**
- **Repulse (id 10)** (L_025b2/L_034aa): actors in zone with |dx|,|dy| < 2; only the one in the cell directly ahead (by facing 0x137e) gets 0x22f2[a] = −10. **proven** (code); what −10 means to GEREN **open**.
- **Radar (13)** L_03258: draws actors within |d| < 7 relative to facing on c's portrait area, waits for a click. **proven**
- **Detect invisibility (34)** L_033d0: actors in zone within ⌊L/2⌋+1 with 0x3a48 = 1 → 0, wakes their entity. **proven**
- **Charm (20):** 0x39ba[a] = caster INT; GEREN 0x00251: if actor INT 0x2026[a] > 0x39ba → resisted marker, else 0x3728[a] = 0x22f2[a]; then 0x39ba = 0. **proven** (code); visible result **open**.
- Status icon list 0x3dec[t][0..9] (L_02d18 adds s if absent; L_07d34 removes and compacts). **proven**

## R6. Timers
**Party timers (word, +2c) decrement by 1 per pass of the FRISE interrupt block** (header ret_offset → 0x07e42–0x08043; once per frame **hypothesis**). At 0 the icon is removed.
| var | save | set by | effect elsewhere | icon |
|---|---|---|---|---|
| 0x161c | 668 | 4/5/6/35 | monster melee dmg −(2·tier+4) (GEREN 0x00ae1); low 4 digits = timer, ≥10000 = tier | 4,5,6 |
| 0x15f8 | 638 | 24/36 | monster hit chance 10 (melee) / 15 (spells); monster spell 34 clears | 24 |
| 0x1604 | 648 | 12 | never hit (GEREN 0x009d2), not attacked by monster spells | 12 |
| 0x1628 | 678 | 27, flask 1010/11 = 1100 | never hit | 27 |
| 0x1640 | 698 | 28 | blocks monster spells 16/22/26/34 | 28 |
| 0x39ae | 4183 | 30 | monster melee damage not applied while > 0 (GEREN 0x00b9a) | 30 |
| 0x15ec | 628 | monster spell 26 = 300·T | paralysed (no attack; monster hit 90/95) | 26 |
| 0x164c | 708 | monster spell 22 = 300·T | blind (player hit = 20) | 22 |
- Not timed: 0x1610 (inversion), 0x1658 (poison strength: HP −= 0x1658 per poison tick, FRISE 0x00979). **proven**
- **Actor timers** (word, +2a): binding 0x1c3e (2008), sleep 0x1ccc (2148), confusion 0x3ad6 (4473), blindness 0x1de8 (2428). GEREN 0x003c3–0x0046f decrements **only the first non-zero** in that order, once per GEREN actor pass; actors 39 and 50 are forced to 0 (immune). Confused actors (0x3ad6 > 0) attack others with 50 % per pass (rnd(100) < 50, GEREN 0x0007e). **proven**
- **Monster casting** (GEREN L_00edf): classes {5,6,9,16,18}; target rnd(5) re-rolled until alive; hit `rnd(80) < 10·T` (95 if 0x15ec, 15 if 0x15f8); spell `0x221e[a][rnd(3)]` (save 3478+3a), only 16,17,19,22,23,25,26,32,34 act; damage base STR' = 4T/T/3T/5T (17/19/23/32), 25 hits every living member with 4T; damage goes through the melee tail (ARM, protection). Cooldown 50/(T+1). **proven**

## R7. Save persistence (5216 bytes, MAIN L_0480e)
All offsets **proven** (MAIN cfwriteb list).
- MENTAL 768+c; spells 0x16de **788+20c+k** (k 0..9, stride 20 checked on all 14 saves); rune 0x3ee6 **5021+c**; status icons 0x3dec **4921+10c+k**.
- Party timers: 628/638/648/658/668/678/698/708/718 (+2c), 0x39ae 4183+2c.
- Actor: HP 1728+2a, binding 2008, sleep 2148, inversion 2288, blind 2428, charm 4193, invisible 4333, confusion 4473 (+2a); 0x22f2 3688+a; ARM 3338+a; monster spells 3478+3a.
- **Not saved:** 0x4010 (level table), 0x4002 (offer list), FRISE dirb/loc state (menu, loc157 rune mode), RNG.
- No save holds an active timer or a status icon (all 14 checked). **open** (no runtime sample)

## R8. Screen coordinates
- Script y = 199 − screen y (SOURIS 0x0021e). Alderaan verified ATTACK (48+64c,132) and the shop exit with this flip. **hypothesis-strong** (1-px offset open).
- ACTION (64c+16,132). Menu row r (both columns): screen y ≈ 193 − 10r; left column x 1..158, right column x 160..317. CAST SPELL (40,193). Spell list left slot k at (40, 143+10k) for k = 0..5 (after compaction), right slot k at (200, 143+10(k−6)); WRITE RUNES (200,183); EXIT (200,193).
- Party target: portrait (64t+32,160). Actor target: the sprite in the 3-D view (screen y ≤ 128).
- Rune: portrait (64c+32,160) then (64c+7,168).

## R9. Reproducible tests
Shared: load as Alderaan (`s1`: disk (309,56) → LOAD (160,155) → name → Return). Take save A immediately (costs 1000 GS from c2: byte 483 −1), do the clicks, take save B. Diff A→B (private/savediff-style on the Ishar 1 layout).

### T1 (deterministic): S1, Mental shield by c3 (Wizard, L 8, MENTAL 72, spells 18/30/28) on c0
1. (208,132) ACTION c3 → menu with CAST SPELL.
2. (40,193) CAST SPELL → list: 18 (y143), 30 (y153), 28 (y163).
3. (40,163) MENTAL SHIELD → target cursor.
4. (32,160) target c0.
Expected (prediction from proven code): roll `rnd(100) < 8·8+72 = 136` always succeeds (1 RNG draw). **771: 0x48 → 0x43** (72 → 67, cost sl(28)+5 = 0+5; if the game used lvl(s) it would be 61 = 0x3D, which would **contradict** R3). **698/699 = 0x02D0 (720)** minus the FRISE passes until the save (1..720). **4921 = 0x1C** (icon 28) while the timer runs; icon and timer 0 after ~720 passes. Only other diff: 483 (save cost).

### T2 (deterministic): S1, rune Regeneration (c3 rune 0x3ee6 = 30 in S1, byte 5024)
1. (224,160) portrait c3 → hands panel.
2. (199,168) rune icon → target cursor.
3. (96,160) target c1.
Expected: 771: 72 → **58** (sl(30) = 9, cost 14); **4185/4186 = 720 − elapsed** (0x39ae[1]); 4931 = 0x1E (icon 30); c1 HP stays 137 (already max). 5024 stays 30 (rune not consumed).

### T3 (RNG): LP1 encounter (Alderaan ENCA route), Fireball by c4 (Wizard L10, MENTAL 75; list 26/30/23/28)
After reaching (21,52) with the group visible: (272,132) ACTION c4 → (40,193) → FIREBALL at (40,163) → click a monster sprite.
Expected: hit with p = 93 % (`rnd(100) < 75 − 3·(4−10)`), **dmg exactly 14** (L+sl(23) = 10+4, no RNG), monster HP at 1728+2a − 14 (floor 0; 63/64/67/68 die, 65/66 keep 1). 772: 75 → **66** on hit or miss. XP capped (no change).

## Limits
- Static only; all diffs are predictions. Timer seconds depend on the FRISE interrupt rate (hypothesis). Meaning of item 40, of 0x22f2 = −10 (Repulse) and the visible Charm result are open. T[36] value open (0 assumed).

## Next step
Run T1/T2 (no luck involved) first: T1 directly decides the R3 off-by-one (67 vs 61). Then T3.
