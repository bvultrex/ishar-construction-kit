# Combat routine contract, Ishar 2 DOS (ENCB flow: step onto the guard cell, F6/F7, one kill)

## Base commit
bvultrex/ishar-construction-kit bb42748 (read-only). Static only; no runs. Nothing committed.

SHA-256:
| File | SHA-256 |
|---|---|
| FRISE.IO | 27117c124caf904a… |
| EATT.IO | d5ef72a5b25eabb5… |
| PARAM.IO | d06a65de13628470… |
| GUARD3.IO | 267b32ea639130a6… |
| SOURIS.IO | 78df7c73f8804663… |
| EDPLT.IO | 2f6156c6a2ae2087… |
| MAIN.IO | bfab5e91…db95 |
| start.exe | 5e35e58d…adf9 |
| LEVELING.SAV | dac7e0a405fa442aae6ec4fb01a3b1aec35a1b1777857c51f183f29def215c57 |
| ENCA.SAV | 88b7442c3fbda4cefee1816fcf919792824793cafe06673e1c17d16b8242e01f |
| **ENCB.SAV** | **5d7cf5b567450fa54bdb3407afb10633705f29f993760ca05524b2b2b207d881** (Alderaan, 18:49) |

Notes:
- REFERENCES.md does not have an ENCB section yet. I used ENCB.SAV from `alderaan/private/work/ishar2` and compared it with LEVELING.SAV, its start save.
- Expression semantics: `op(opile)` = **popped OP acc** (maestun opile; the correction from 2026-10-11).
- Save offsets are zero-based. Word arrays are big-endian in the file; element i is at off + 2i (high byte) / off + 2i + 1 (low byte).

## Question
A routine contract for player melee, monster melee, death/XP, level-up and RNG, plus the expected save diffs for ENCB.

## R1. Input F6–F10 / attack icons
- Keys F6..F10 = DOS codes 192..196 → 0x4f12 = 15..19. Mouse equivalent: HUD material 0x4f10 = 1..5 (SOURIS 0x00d08). Both lead to FRISE 0x008fe: dirb13 = slot = code − 1. **proven** (Alderaan + listing)
  - **F6 = character 0, F7 = character 1**, F8–F10 = characters 2–4.
- **Entry conditions** (FRISE 0x00909):
  - 0x4fd0 == 0, 0x4aa0 == 0, 0x2ab7 == 0, HP 0x2d5c[c] > 0.
  - Food **0x2ef6[c] > 0**, 0x2e26[c] == 0 (paralysed?).
  - **Cooldown loc 0x150[c] ≤ 0**.
  - All met → L_04b01. **proven**
- **Weapon choice** (0x04b21–0x04c5d): dirtc 0x54[c] alternates hands. Slot 9 (0x54 = 0) or 10 is used if it holds a weapon code −116..−90; otherwise the other hand; 0 = fist. **proven**
  - Characters without a weapon and with flag 0x9a[c] = 0 do not swing (that is F8 in ENCA).
- **Cooldown** (0x04da7, melee): `loc150[c] = (0x4fcc/120) · (T4a08[w,0]·25 / skill + 2)`, halved when dual-wielding (0x04df7/0x04e4e).
  - skill = 0x4b40[c] if T4a08[w,2] mod 10 == 2, else 0x4b38[c]; fist: 80.
  - 0x4fcc is the platform speed constant (MAIN 0x003ff chain).
  - Who decrements loc150 per frame: **open**.
- **Weapon table T4a08[item+116][0..3]** = (speed, damage die, type, ranged) from PARAM 0x00f58 ff. **proven**
  - −108 and −107 = (1, 20, 1, 0)
  - −109 = (4, 12, 11, 0)
  - −116 = (1, 10, 1, 0)
- **Status branch:** if 0x2e4a[c] ≠ 0 or 0x2fb6[c] ≠ 0 (0x04b01 → 0x0536b), the attacker hits the nearest party member for `rnd(10)+1` HP (confusion). **proven** (expression); the meaning of the status is a hypothesis.

## R2. Player melee (FRISE 0x04e78–0x0574d)
1. **Target search:** L_05552 runs `ctstform material 1` at form index **dirb65 = 0..2** (the attack forms in front of the party).
   - The pattern depends on 0x9a[c]: 1/2 → 0,1,2; 3 → 1,0,2; 4/5 → 2,1,0.
   - The first entity hit gives loc178 = actor id (+0x0d of the entity). GUARD3 sets `cforme 0 + depth` (0x000e1), so only depth 0 = **own cell** can be hit. **proven** for the ENCA miss / ENCB hit.
2. **Load the target:**
   - CON_t = 0x3e7e[id], AGI_t = 0x41fc[id], LVL_t = 0x3d9e[id], ARM_t = 0x418c[id]
   - If 0x43ba[id] ≥ 0 and id ≠ 50: relation = −1 and 0x4f4c[id] = 0 (becomes hostile, leaves the party).
3. **Hit value** (0x05651):
   `hit = 50 + 2·LVL_a + 3·(AGI_a·FOOD_a/80 − AGI_t) − loc172/2 + skill/5`
   - AGI_a = 0x2ede[c], FOOD_a = 0x2ef6[c], LVL_a = 0x2eb6[c]; integer division; loc172 = 0 for melee (0x04b1b).
   - If 0x2e86[c] ≠ 0: hit = 20 (blind?).
   - **Hits if `rnd(100) < hit`** or 0x3946/0x3a24/0x3be0[id] ≠ 0 (target asleep/paralysed). The RNG call always happens. **proven**
4. **Damage** (0x056e3), with STR_a = 0x2ebe[c]:
   - Fist: `(STR_a − CON_t)/2 − ARM_t`
   - Weapon: `(STR_a + 2 − CON_t)/2 − ARM_t + rnd(T4a08[w,1]) + 1`
   - Clamped ≥ 0, then **0x36ac[id] −= dmg**. Operand order re-checked: `2 osub(CON_t)` is direct, the rest is commutative. **proven**
   - The number is shown with font 48.
5. On a miss (no hit or no form): **food 0x2ef6[c] −= 1** per swing (0x04fbb), even on a miss. **proven** (ENCA/ENCB 1326/1327).

## R3. Monster melee on the party (EATT 0x009f1–0x00c15)
- **Condition:** the actor is on the **party's own cell** (EATT 0x00102–0x00180 on maps ≠ 1). Cooldown dirti 0x20[id] ≤ 0.
  - The target slot comes from the formation grid 0x49e6 (value = slot + 1, front row first).
- **Hit value:** `hit = 9·LVL_m + 3·AGI_p − AGI_m`
  - LVL_m = 0x3d9e, AGI_p = 0x2ede[slot] (sic, as in the listing), AGI_m = 0x41fc
  - Overrides: 0x2e86 → 70, 0x2e26 → 95, 0x3be0[id] → 15, 0x2e62 → −1 (never)
- **Attack animation first:** csend 21 to the entity of class 35 with +0x0d == id, then wait until 0x4d1b == 1 or 100 frames (0x00ac3–0x00b11).
- **Then the RNG:** hits if `rnd(100) < hit` or dirti 0x20[id] == −1, and hit ≠ −1.
- **Damage:**
  - `dmax = STR_m + 2 − CON_p/2` (0x00b49; STR_m = 0x3e0e, CON_p = 0x2ec6)
  - `dmax −= ARM_p` (0x2f0e), clamped ≥ 0
  - `dmg = rnd(dmax) + 1`; halved if 0x2e56[slot]. The value 0 is skipped.
  - **HP 0x2d5c[slot] −= dmg**, clamped ≥ 0. 0x4b1a[slot][0..4] = 0.
- **Cooldown:** `dirti20[id] = (0x4fcc/480)·(40/(AGI_m+1))`. **proven** (formula)
- **ENCB:** guards STR 20, characters 0/1 CON 20, ARM 16 → dmax = 20 + 2 − 10 − 16 < 0 → 0 → **every hit costs exactly 1 HP** (unless halved → 0).
  - So HP loss = number of hits: c0 −51, c1 −35. **hypothesis** (number of hits not counted); a clear testable prediction.

## R4. Death, XP, loot (FRISE 0x0578e–0x0595b)
- **If 0x36ac[id] ≤ 0:**
  - if dirb65 ≥ 0 and loc168 == 0: **0x4b80[dirb65] = 0** (0x057b3)
  - `ckill` entity, then L_057ef: **0x449a[id] = 0** (scene/contree → removed) and **0x36ac[id] = 0**
  - id 57 → csend −100 (end boss)
- **If still alive:** csend 40 (hit reaction).
- **Always:** 0x3a24[id] = 0 (0x057e3, target wakes up).
- **XP** (0x05826–0x0587d), for every member with HP > 0:
  - killer c: `0x2d50[c] += LVL_t/3 + 1`
  - others: `0x2d50[k] += LVL_t/5 + 1`
  - **Ishar 2 has no ×50/×20 rule** (that is Ishar 1). **proven**
- **Loot:**
  - gold |0x3868[id]| / |0x378a[id]| → 0x4c96/0x4c94 (save 16/14), then L_06865
  - items 0x4040[id][0..2] > 0 → ground tables 0x2c4e/0x2aba/0x2b84/0x50c8 at the actor's position (+ wakeup type 0x0b)
  - ENCB: actor 91 has gold 0 and no items → no change.

## R5. Level-up check (FRISE 0x060d4–0x06435, called every frame from 0x00ab4)
- For each c: **only if 0x2d50[c] ≠ dirti 0xf6[c]** (the previous XP in FRISE's own entity memory, **not in the save**).
- FRISE init (0x00225) sets 0xf6[c] = XP[c], so **loading never levels up**. ✓ Hoth (XP 620 stays level 13). 0x02151 sets −1 (forces a check).
- Formula as in rules.md (cap 10000, level = argmin |3·XP/10 − n²|):
  - **only new > old** raises the level; HP gain L_06668 `rnd(T4b0c[race]) + max(0, (CON−8)/2)`; spells by class
  - at the end 0xf6[c] = XP (0x06427)
- **ENCB:**
  | Character | XP | 3·XP/10 | Level formula | Stored level | Result |
  |---|---|---|---|---|---|
  | c0 | 1600 | 480 | 22 | 22 | no change |
  | c1 | 1468 | 440 | 21 | 21 | no change |
  | c2 | 1209 | 362 | 19 | 19 | no change |
  | c3 | 31 | — | 3 | 7 | not higher → no change |
  | c4 | 16 | — | 2 | 6 | not higher → no change |
  **No level-up and no RNG call.** ✓ ENCB levels unchanged.

## R6. RNG
- start.exe 1000:6d7b: `r = ss:[0x0c4e]; r = r·0x7ab7 + 0xf881 (= −0x77f) mod 2^16; store; result = (r·n) >> 16` (0..n−1). **proven**
- **Seed:** opcode `crandom` handler 1000:2afc: value 0 → BIOS tick counter **0040:006C**. MAIN 0x006c3 `crandom 0` runs once at start. **proven**
- **Not in the save, not reset on load.** The sequence keeps running across loads.
- **Shared** by all scripts: EDPLT re-roll after loading, AI, ambient effects. Determinism therefore needs the same tick seed and the same frame-by-frame sequence. Codex should log r at every ornd.
- **Calls per attack:**
  | Attack | Calls |
  |---|---|
  | Player | 1 × rnd(100) (always, once per form hit); with a hit and a weapon +1 × rnd(die); fist: none |
  | Monster | 1 × rnd(100) (after the animation wait); on a hit +1 × rnd(dmax) |
  | Confused player | 1 × rnd(10) |
  | XP/death | none |
  | Level-up (only with new > old) | 1 × rnd(T4b0c) per character |

## R7. ENCB vs LEVELING, actual diff (78 bytes) with explanation
| Bytes | Change | Explanation | Rating |
|---|---|---|---|
| 45, 49 | clock, hour 20→23 | clock | noise |
| 91, 93 | day phase 2→3 (night) | | noise |
| 986..995 (low bytes 987/989/991/993/995) | XP c0 1597→**1600 (+3)**, c1 1464→**1468 (+4 = killer, F7)**, c2 +3, c3 +3, c4 +3 | victim actor 91 **level 10** (re-rolled after load, 5112: 6→10): killer 10/3 + 1 = 4, others 10/5 + 1 = 3 | proven |
| 997, 999 | HP c0 235→184 (−51), c1 244→209 (−35) | guard hits of 1 HP each (R3) | hypothesis |
| 1326/1327 | food c0 68→61 (7 swings), c1 70→62 (8 swings) | | proven |
| **3443/3444** | actor 91 HP 72→**0** | 0x36ac[91] | proven |
| **6872** | 0x449a[91] 21→**0** | removed from scene | proven |
| 3442–3464 (other guards' HP), 5111–5122, 5221–5232, 5331–5341, 5441–5452, 5551–5562, 6211–6221 | | EDPLT re-roll after load (actors 90–101: HP/level/STR/CON/WIS/INT/AGI) | noise, RNG |

Unchanged: 0x4b80 7576–7578 (0,0,0 before and after), levels 1291–1295, ground tables, gold 14/16, CONT.

**Expected for a repeat** (ranges):
- XP: killer + (L91/3 + 1), others + (L91/5 + 1), with L91 = the **re-rolled** level of the victim (read it from the after save at 5021 + id).
- Victim HP → 0 and 0x449a → 0.
- Party HP −1 per guard hit.
- Food −1 per swing.
- Damage per party hit on actor 91 (CON 20 after the re-roll, ARM 0):
  - c1 (STR 18, −107): 0 + rnd(20) + 1 = 1..20
  - c0 (STR 20, −108): 1 + 1..20 = 2..21
  - So ≥ 4 hits for 72 HP.
- Hit chance (at food ≈ 64):
  - c0 ≈ 50 + 44 + 3·(16·64/80 − 20) + 93/5 = **88 %**
  - c1 ≈ 50 + 42 + 3·(4·64/80 − 20) + 81/5 = **57 %**

## Limits
- Static only.
- Not proven: which frame loop decrements loc150 and dirti20; the meaning of the status bytes (0x2e26/0x2e4a/0x2e62/0x2e86/0x2fb6/0x3946/0x3a24/0x3be0); the EATT target choice per formation.
- The ENCB step: the save is at (65,12) again; how the party left the guard cell is unknown (no notes yet).

## Next step
- Alderaan: record the ENCB sequence in REFERENCES.md (step, number of swings, kill moment).
- For determinism, Codex sets the BIOS tick in DOSBox (or logs ss:0c4e) and compares the number of ornd calls with R6.
- Test: party HP loss per guard hit = 1 (R3).

## Addendum 2026-10-18 19:5x: Alderaan's replay check (REFERENCES.md §12.8/12.9)
| Point | New rating |
|---|---|
| 1 HP per guard hit (87/87 splashes) | **proven** (runtime + script) |
| Food −1 per swing, hit or miss | **proven**. Correction to R2.5: the decrement at 0x04fac/0x04fbb (and 0x05348/0x05357) comes after L_05552 on **both** paths, not only on a miss |
| XP formula killer L/3+1, living L/5+1 (0x05846/0x0585d) | **proven** |
| Kill writes (0x36ac = 0, 0x449a = 0, 0x4b80[slot] = 0) | **proven** (ENCYH 7576 91 → 0) |
| Damage ranges | **proven** (consistent) |
| Fixed values "+4/+3" as an expectation for repeats | **contradicted**. L91 is re-rolled by EDPLT on **every** load (ENCB L = 10 → +4/+3; replay L = 9 → +4/+2). **Only the formula holds**; read L from the after save at file 5021 + id |
| Hit chances (88 % / 57 %, monster 110/74) | **open** (sample too small; monster attempts are not visible) |
| One F6 press without a swing in ENCB (c0 −7 after 8 presses) | open; most likely the cooldown loc150 > 0 (0x00909) |

### R3 correction: no separate clamp at EATT 0x00b49 — proven
- 0x00b49 only computes `dmax = STR_m + 2 − CON_p/2`.
- 0x00b88: `dmax −= ARM_p`; 0x00b8f–0x00b9c: `if dmax < 0 → 0`; 0x00ba2: `dmg = rnd(dmax) + 1`. With dmax = 0 → rnd(0) = 0 → **dmg = 1**.
- So it is the **general minimum of 1** in the single melee routine L_009f1. Every actor attack using EATT goes through it (8 call sites 0x00846–0x009cd, one per formation position); it is not guard-specific and has no type branch. Alderaan's reading and mine **agree**.
- **The minimum is 1 for every hit**, except when 0x2e56[slot] is set: then 1/2 = 0 → skipped (0x00bc7).
- Special case: if loc 0x010a == 0 and race 0x3d2e[id] ≠ 32, an extra effect is spawned (0x00bcf–0x00bf9, entity 0x36 with code 11); its meaning is open.

### Other notes
- 0x4b80 and 7409: see hebel-tuer-trigger-ishar2.md (addendum 19:5x). 0x4b80 = the three front-cell contact slots; Alderaan and I describe the same thing.

---
## Addendum 2026-10-18 20:12 CEST: open points closed (static)
SHA-256: FRISE.IO 27117c12…2b64, EATT.IO d5ef72a5…14ec, GESORT.IO 71f842f2…5a3c, start.exe 5e35e58d…adf9.

### A1. Attack cooldowns
- **Player:** per-character word `loc 0x0150[c]` (FRISE process local, **not in the save**). Set on the swing: `(0x4fcc/120)·(loc163·25/d64 + 2)`, halved on the hand-alternation paths, or `0x4fcc/30` on the alternate path (writer lines at FRISE 0x0150 stores). **proven** (writers)
- Countdown: FRISE 0x0717f–0x07337, the block behind the script-header `ret_offset` (0x7179 → entry 0x717b, `cjmp`, then the block). This is FRISE's interrupt routine, run once per ALIS frame. Each pass: `loc150[c] −= 1` for c = 0..4 when it is non-zero. At ≤ 0 it is set to 0 and the attack icon redraws (`ctrasen 78+c`). **proven** (code); **hypothesis** that it runs once per frame (interrupt semantics). The same pattern is in Ishar 1 (FRISE ret_offset 0x7e3c → 0x07e42).
- The same routine counts `dirb 0x8b` and every 10th pass decrements the party status timers (A2). **proven**
- Attack gate (FRISE 0x0150 entry ceval): `food 0x2ef6[c] > 0 && 0x2e26[c] == 0 && loc150[c] ≤ 0`. **proven**
- **Why ENCB had an F6 without a swing:** the press came while `loc150[c] > 0`, or the cell in front had no live target / the character was not in the front row. The press is dropped with no RNG and no food. **hypothesis** (cooldown is the likely cause; nothing in the save can tell)
- **Monster:** `dirti 0x20[id]` (EATT process, not saved). EATT 0x00238 decrements it once per actor-loop pass (loop 0x00074…0x002ba over ids loc114..loc115). Set after each attempt: `(0x4fcc/480)·(40/(AGI_m+1))` (0x00b69), `50/(AGI+1)` (0x00e37), `0x4fcc/4/(l105+1)` (0x01216). −1 means "attack now". **proven**

### A2. Status bytes
Party: 5 words per field. Countdown: FRISE 0x07195–0x072c1, −1 every 10 interrupt passes. At 0, `L_06f4d` removes effect icon N from `0x4b88[c][0..9]`.
| addr | save | icon at 0 | writers | readers / effect | meaning |
|---|---|---|---|---|---|
| 0x2e26 | 1186+2c | 26 | EATT 0x010b4 (`L·0x4fcc/300`) | FRISE attack gate (blocks), EATT hit = 95 | paralysed (**hypothesis** name; effect **proven**) |
| 0x2e4a | 1206+2c | (no timer) | EATT 0x0105d = 1, GESORT =0/1 | FRISE, GESORT | flag, permanent until cured (poison/curse, **open**) |
| 0x2e56 | 1216+2c | 2 | GESORT `25+5·power` (self) / `12+5·power` | EATT halves damage | protection **proven** |
| 0x2e62 | 1226+2c | 98 | FRISE, PARAM | EATT hit = −1 (never hits) | invisibility/ward (**hypothesis**) |
| 0x2e7a | 1246+2c | 3 | GESORT `25+5p` / `12+5p` | EATT, FRISE | spell buff (**open**) |
| 0x2e86 | 1256+2c | 23 | EATT 0x01082 (`L·0x4fcc/300`), GESORT 0 / 10000 | player hit = 20, EATT hit = 70 | blind (**hypothesis** name; effects **proven**) |
| 0x2faa | 1481+2c | 8 | GESORT `25+5p` | EATT | spell buff (**open**) |
| 0x2fb6 | 1491+2c | (no timer) | GERDEP = 1, GESORT = 0 | FRISE, GESORT | flag (**open**) |
Actors (word per id). EATT 0x0024f–0x002a2 decrements **only the first non-zero one** of 3946 → 3a24 → 3be0 per pass. Any non-zero value makes the player hit automatically (FRISE).
| addr | save | writer | effect |
|---|---|---|---|
| 0x3946 | 3921+2i | GESORT `0x4fcc/10·p/3` | actor held (EATT skips attack) **hypothesis** paralysis |
| 0x3a24 | 4141+2i | GESORT `0x4fcc/12·p/3`, cleared on hit (FRISE, GESORT 0x011b0) | sleep **proven**-ish (clear on hit) |
| 0x3be0 | 4581+2i | GESORT `0x4fcc/10·p/3` | EATT hit forced 15 → weakened/slow (**hypothesis**) |
EDPLT reads 3946/3a24 (actor idle). All 11 arrays are in the save (IO.IO cfread/cfwrite), so timers survive a load. **proven**

### A3. EATT target selection
- The formation grid `0x49e6[5][5]` (save 7111, 25 bytes, value = slot+1, 0 = empty) is written by FRISE (party order, 0 on death: FRISE `cstore 0 → 0x49e6`) and PARAM init (row 4: 1,2,3,4). **proven**
- EATT has 8 scan sites. Each scans the grid from the side the monster attacks from, front row first (e.g. 0x009af: rows 0.., column 4 → 0), and takes **the first non-zero cell** (→ `L_009f1`, target = value−1). One site (0x0081b) calls `rnd(2)` to pick the scan direction (left→right vs right→left). That is 1 extra RNG call before the hit roll. The others are deterministic. **proven**
- Dead members are skipped because FRISE zeroes their grid cell on death, not because of an HP test in EATT. **proven** (writer); not run.
- RNG order for one monster attempt: [rnd(2) at site 0x0081b only] → rnd(100) hit → if hit, rnd(dmax) → no RNG for the cooldown in EATT 0x00b69. **proven**
