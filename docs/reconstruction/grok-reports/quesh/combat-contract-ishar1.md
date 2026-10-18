# Combat contract Ishar 1 (DOS): static, handoff format
Status 2026-10-18 20:12 CEST, Quesh. Read-only. Nothing committed. Original bytes only under `private/`.

## 1. Base and profile
| file | SHA-256 |
|---|---|
| start.exe (I1) | 3ea63234c97b77d88e3c18aa5d88ac10dede1f10daf2854225b88b7d948d588b |
| FRISE.IO (I1) | 3bd158963fdaf0f88517b03509002100159a7587c8e2486389314b8abc707e15 |
| GEREN.IO (I1) | 60405e4537abff12c5756a79506eb555c616a91b64069451fcc11419bcb8a405 |
| MAIN.IO (I1) | 27c5834de005afc99d7819a0b2244e7d176421451c80a3befd6c273b0ef0bd7b |
| LP1.SAV / ENCA.SAV (Alderaan §16) | 76cf91a1…b64b / 8003a196…5605 |
Listings: `decompile/alis/listings/ishar1/*.asm`. Operand order is the same as in Ishar 2 (`osub(opile)` = popped − acc).

## 2. Scripts
- Player attack: **FRISE** L_05a9d (0x05a9d–0x0631d) → target loop L_064fb → hit 0x06609 → damage 0x06721 → kill 0x067e8–0x068b9. No EAFF.
- Monster attack: **GEREN** 0x00920–0x00c20 (the enemy manager, the Ishar-2 EATT equivalent). No EATT.
- Level-up/XP cap: FRISE 0x06f23–0x07147. Party damage from a confused member hitting allies: FRISE 0x06431–0x06493 (`rnd(5)+1`).

## R1. Attack input
- ATTACK icon per character (screen (48+64c,132); Alderaan's c0/c1 clicks) → FRISE 0x0039b: `0x426e == 0 && 0x137f == 0 && food 0x16bc[c] > 0 && 0x15ec[c] == 0 && cooldown dirtc 0x44[c] == 0` → `cjsr L_05a9d`. **proven**
- L_05a9d: `0x1610[c] == 0` is required (else L_06321: cooldown 15, no swing). Weapon = hand slot 9 or 10 (`0x1568[c][9/10]`), alternating via `dirtc 0x76[c]`. Melee items −40..−45, −48..−53 or bare hand (0, bonus −3). **proven**
- Front-row rule: the character must be in the first occupied row of the formation grid `0x364c[5][5]` (save 3758; scanned from row 4 down). Otherwise `dirb3e = −1` → no swing, no food. **proven**
- Cooldown: `dirtc 0x44[c] = speed·2 + 5` (two-weapon alternation `(speed+1)·2`), speed = `0x366e[item+59][0]`. Counted down −1 per pass in FRISE 0x07e42–0x07e71, the header ret_offset interrupt block (once per frame: **hypothesis**). At 0 the ATTACK icon redraws. Not saved. **proven** (code)
- Food: `0x16bc[c] −= 1` once per attack action that found a front position (0x05f3f melee, 0x0630d ranged), whether it hits or misses. 0x16bc is food/satiety (tavern +40/+15, cap 100; ITAVERNE 0x00602–0x00673), **not** "Kondition". **proven**

## R2. Player hit roll (FRISE 0x06609)
`hit = 30 + 2·LVL + 5·(AGI·FOOD/80 − AGI_t) − loc146 + skill/5`
- LVL 0x167c[c], AGI 0x16a4[c], FOOD 0x16bc[c], AGI_t 0x21d4[m], loc146 = 0 for melee (0x05aac; distance/15 for ranged), skill = 0x3d0c/0x3d14[c] (by weapon class). **proven**
- `0x164c[c] ≠ 0` → hit = 20 (blind). Hits if `rnd(100) < hit` **or** target 0x1c3e/0x1ccc/0x1de8[m] ≠ 0 (held/asleep). The RNG call always happens. **proven**
- Compared with Ishar 2: base 30 (not 50), factor 5 (not 3), no `−d/2`.

## R3. Player damage (FRISE 0x06721–0x0678a)
`dmax = (STR + 2 − CON_t)/2`, clamped ≥ 0; `dmg = (bonus − ARM_t) + rnd(dmax) + 1`, clamped ≥ 0; `0x1b22[m] −= dmg`.
- STR 0x1684[c], CON_t 0x1f96[m], bonus loc138 = `0x366e[item+59][1]` (bare hand −3; item −51 class 6 → 1), ARM_t 0x218c[m]. **proven**
- Special case: target 39 with every living member holding items 25–29 → `dmg = dmax·20` (and STR/AGI ×5 at 0x065f1). **proven** (code); boss context **hypothesis**.

## R4. Monster attack (GEREN 0x00920)
- Only when `dirti 0x20[id] ≤ 0`. Countdown −1 per GEREN pass (0x003ac). **proven**
- Target: the first non-zero cell of `0x364c` (row 0→4, column 4→0 at 0x008e3; other sites similar) → member = value−1. Dead members are removed from the grid when HP reaches 0 (0x00bc4), so they are skipped. **proven**
- `hit = 9·T_m + 3·AGI_p − AGI_m` (T_m 0x1f06, AGI_p 0x16a4, AGI_m 0x21d4; same literal form as Ishar 2 EATT). Overrides: 0x15ec[c] ≠ 0 → 90; 0x1de8[m] or 0x15f8[c] ≠ 0 → 10; 0x1604/0x1628[c] ≠ 0 → −1 (never hits). Hits if `rnd(100) < hit` or dirti20 == −1, plus a sync on the sprite (0x3fff == 1 within 10 frames). **proven**
- Damage (actor ≠ 50): `dmax = STR_m(0x1f4e) + 2 − CON_p(0x168c)/2 − ARM_p(0x16d4)`, clamped ≥ 0; `dmg = rnd(dmax) + 1` → **minimum 1** (same as Ishar 2). Plus `2·(0x161c/10000) + 4` if `0x161c % 10000 ≠ 0`. Actor 50: `2 + rnd(4)` if the target holds 35–39, else 30. Applied only if `0x39ae[c] == 0`. HP clamped at 0 → grid cell cleared. **proven**
- Cooldown after every attempt (hit or miss): `40/(AGI_m+1) + rnd(5)` (0x00a9a). **proven**
- RNG order per attempt: rnd(100) → [hit: rnd(dmax); actor 50 rnd(4); splash rnd(2) at 0x00b88 when dirb b8 == 0] → rnd(5) cooldown. **proven**

## R5. Death and XP (FRISE 0x067e8–0x068b9)
- `0x1b22[m] ≤ 0` → kill entity, `0x1ccc[m] = 0`, `0x1b22[m] = 0` (0x06845). Actor 39 → game end (`csend −100`). **proven**
- XP: for each living member (HP 0x1542 > 0): **killer `+ 50·T`, others `+ 20·T`**, with T = `0x1f06[m]` (loc156) (0x06888 / 0x0689c). **verified**: ×50/×20 is right, and the multiplier applies to the monster byte 0x1f06, which also serves as the monster's level in R4. **proven**
- No contact-list clearing like Ishar 2's 0x4b80. Dead actors stay in the zone table (save 4033+i), as Alderaan saw. **proven** / consistent

## R6. XP cap and level-up (FRISE 0x06f23–0x07147)
- Runs when `XP ≠ dirti 0xf8[c]` (previous XP in process memory, initialised from XP at FRISE start 0x001a6) → **loading a save never levels up** (same as Ishar 2). **proven**
- Thresholds (prev < T ≤ XP): 700→L2, 1700→L3, 3000→L4, 5000→L5, 8000→L6, 12000→L7, 17000→L8, 23000→L9, 30000→L10. Each step writes `0x167c[c] = L` and calls L_072f2 (stat/HP gains; **open**, not decoded). **proven** (thresholds)
- Cap: `XP > 31000 → 31000` (0x070cc), then `dirti f8 = XP`. Max level 10. **proven**

## R7. RNG
- Same code in both start.exe files (unpacked images byte-identical at 1000:6d7b): `ss:[0x0c4e] = ss:[0x0c4e]·0x7ab7 + 0xf881`; result `(r·n)>>16`. Seeded once at 1000:2b10 from the BIOS tick `0040:006c`. **Not in the save**; a load does not reseed. **proven** (the start.exe files differ elsewhere: Ishar 1 3ea6…, Ishar 2 5e35…)

## R8. Save layout check (MAIN L_0480e)
107 cfwriteb fields, total 5216 bytes (`private/ishar1-save-layout-derived.txt`, sum checked). XP 0x1536 → 458+2c, HP 0x1542 → 468+2c, gold 0x154e → 478+2c, max HP 0x155a → 488+2c, monster HP 0x1b22 → 1728+2i, monster T 0x1f06 → 2708+i (a **byte** per actor; "monster XP" is really the level/XP factor). Also: LVL 738+c, STR 743+c, CON 748+c, AGI 763+c, food 773+c, ARM 783+c, monster STR 2778+i, CON 2848+i, ARM 3338+i, AGI 3408+i, grid 3758. Words are big-endian. **proven**

## 7. Expected diffs ENCA vs LP1 (checked against the real 26-byte diff)
LP1: c0/c1 LVL 10, STR 20, CON 18/19, ARM 14/17, AGI 20, food 96/100, hands (−49,−125)/(−43,−56). Monsters 63–68: T 1/5/10/10/5/7, CON 6/10/15/15/10/12, ARM 0, AGI 6–15.
| item | expected | real | rating |
|---|---|---|---|
| party HP per monster hit | c0: dmax = STR_m+2−9−14 < 0 → **exactly 1**; c1 likewise (CON 19, ARM 17). Loss = number of hits | −11 / −14 | ✓ consistent |
| player hit chance | c0: 30+20+5·(24−AGI_t)+skill/5 ≥ 95 → nearly always hits | all 6 dead within 8 rounds | ✓ |
| player damage | bonus(item) + 1..(22−CON_t)/2, e.g. vs 63: +1..8 | HP → 0 | ✓ |
| monster HP 1855–1865 | → 0 (0x06845) | → 00 ×6 | ✓ |
| XP 458–467 | +50·T killer / +20·T others, then capped at 31000 → **no change** | unchanged | ✓ |
| food 773/774 | −1 per ATTACK action with a front position → −8 each | 96→88, 100→92 | ✓ (8 actions each) |
| level 738+ | unchanged (L10, cap) | unchanged | ✓ |
| actor x/y, party pos, gold −1000 | AI movement / walking / save cost | as recorded | ✓ (out of scope) |
| RNG state | not saved | n/a | ✓ |
No contradiction with the real diff. To see XP, use a party below 31000: expect killer +50·T, others +20·T (T from 2708+i), level-up only on crossing a threshold.

## 8. Open
L_072f2 gains per level; the exact meaning of status words 0x15ec/0x15f8/0x1604/0x1610/0x1628/0x164c and actor 0x1c3e/0x1de8; whether the interrupt runs exactly once per frame.

## Addendum 2026-10-18 21:2x CEST: level-up gains L_072f2 (closes the R6 / §8 open point)
Base: bb42748, static. FRISE.IO 3bd15896…, MAIN.IO 27c5834d…, MESSAGEE.IO 1b6a76f2….

**What L_072f2 (FRISE 0x072f2–0x07348) does, per level step of slot c** (`dirb22 = c`):
```
bonus = max(0, CON[c] − 15)                       CON = 0x168c (save 748+c)
gain  = rnd(T3ce0[race[c]]) + bonus + 3           race = 0x166c (save 733+c)
HP[c]    += gain                                  0x1542 (save 468+2c, BE)
maxHP[c] += gain                                  0x155a (save 488+2c, BE)
```
| Item | Finding | Rating |
|---|---|---|
| HP / max HP | both increase by the same `gain`. Current HP rises too. No cap, no clamp | **proven** |
| Hit die T3ce0 | MAIN 0x002d3–0x0030f (local table, set at boot, **not saved**): race 1 human 12, 2 elf 8, 3 dwarf 12, 4 orc 14, 5 lizard 10, 6 → 15, 7 → 11; index 0 never written (0 → rnd(0) = 0) | **proven** (values); race names from MESSAGEE 0x01b74 **proven** |
| CON bonus | `CON − 15`, floored at 0 (byte compare `oinf 0`). CON identity: FRISE sheet prints 0x168c on the CONSTITUTION line (y 160) and the damage formula uses it (R3) | **proven** |
| Attributes (STR 0x1684, CON, WIS 0x1694, INT 0x169c, AGI 0x16a4), skills, spells, food, gold | **not touched** by L_072f2 or by the caller | **proven** (only two stores in the routine) |
| Level | the caller (0x06f23) writes `0x167c[c] = L` (save 738+c) before calling. Absolute value, not +1 | **proven** |
| RNG | exactly **one** `rnd(n)` per level step, n = T3ce0[race]; `rnd(n) = (r·n)>>16` → 0..n−1. So gain ∈ [3 + bonus, n + 2 + bonus] | **proven** |
| Conditions | runs only if `XP ≠ dirti 0xf8[c]` (never on load). The thresholds are an **else-if chain** starting from the lowest: the first T with `prev < T ≤ XP` wins. Then `0xf8 = XP`. If one award crosses two thresholds, only the lower level is set and the higher one is skipped until the next threshold is crossed (e.g. prev 600 → XP 1800: level 2, one gain; level 3 is never granted, the next level set is 4 at 3000). There is no alive/class check in the loop, but dead members get no XP (R5), so they never level | **proven** (static); the skip quirk has no save evidence |
| Cap | XP > 31000 → 31000 after the level check (unchanged, R6) | proven |

Save plausibility (no before/after pair exists): IMP1 slot 0 XP 5300 ↔ level 5 (5000 ≤ XP < 8000) ✓. All level-10 parties have max HP inside the range allowed by 9 gains on top of their start HP. Not a proof. Note: S1.SAV slot 2 holds XP 39530 > 31000. The cap only runs after an XP change, so a loaded value above the cap persists until the next award (origin of that value **open**, possibly edited).

Expected diff for one level step (e.g. a human with CON 18 crossing 700 XP): 738+c → 2; 468+2c and 488+2c each + (rnd(12) + 3 + 3) = +6..+17; XP 458+2c as awarded; nothing else.

Open: none for the gains. Still open from §8: status words 0x15ec…0x164c, actor 0x1c3e/0x1de8, interrupt cadence.
