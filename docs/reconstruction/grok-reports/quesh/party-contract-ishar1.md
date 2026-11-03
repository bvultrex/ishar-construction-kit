# Party contract, Ishar 1 DOS (slots, recruit vote, dismiss, kill, relations, tavern leave)

## Handoff header
- **Base commit:** `bb42748` (read-only clone, nothing committed/pushed). Static analysis only.
- **Question:** party slot model, save offsets, recruiting (vote), dismissing, killing a member, relation matrix updates, leaving at the tavern, grid placement; reproducible tests.
- **Method:** FRISE.IO 0x00a76, 0x00d7f, 0x01148–0x01c9b, L_03543; ITAVERNE.IO 0x006e7–0x008ba and L_008bb; MAIN cfwriteb list; S1/LP1 byte dumps.
- **Result:** P1–P7, tests T1–T4.
- **Limits:** what menu cell maps to dismiss/kill (FRISE table dirtc 0x4e) was not dumped; NPC-side base tables 0x1e76/0x1ebe/0x206e/0x379c/0x3eb2 not dumped; the dialog that starts a recruit (NPC dialog contract) skipped as agreed.
- **Next step:** dump dirtc 0x4e to get the menu click for dismiss/kill, then run T1/T2.

Evidence levels: **known** = read in code, **suspected** = plausible, not closed, **unknown** = open.

## SHA-256
| File | SHA-256 |
|---|---|
| FRISE.IO | 3bd158963fdaf0f88517b03509002100159a7587c8e2486389314b8abc707e15 |
| ITAVERNE.IO | f3bed78c5fb97360e1ac2dd46dc4f50052762ebbf2251af5049d02608086e808 |
| BUSTE.IO | 883f807a2b3bc791ff45c4b34c54a0a4fda40012e8eb0dbd1892b97cbb8924a1 |
| MAIN.IO | 27c5834de005afc99d7819a0b2244e7d176421451c80a3befd6c273b0ef0bd7b |
| PARAM.IO | f42ea12ceffa6b879aeb88f074a81f8e9fed39f92a11f625d7c815b9b7594afd |
| S1.SAV / LP1.SAV | 92023f2b51e34f74f191068d07922a4b1afa28cff1bd04423d98e4505a463f7f / 76cf91a104ec8675394ec82b44f7238b016d641a8e0ccf3752d117ae2980b64b |

## P1. Slot model and save offsets — known
5 slots c = 0..4. Per slot: class 0x1664 (728+c, −1 = empty), 0x166c (733+c, attribute used in relations; name **unknown**), HP 0x1542 (468+2c), maxHP 0x155a (488+2c), gold 0x154e/0x3770 (478+2c / 3993+2c), items 0x1568 (498+26c+2k), MENTAL 768+c, food 773+c, 0x16cc (778+c, relation attribute, name **unknown**), **npc id 0x3908 (4028+c, −1 = none)**, **relations 0x377e[i][j] (4003+5i+j, signed byte)**, **grid 0x364c[5][5] (3758+5row+col, value c+1, 0 = empty)**, 0x41e4 (save 20, word: npc 27 flag), NPC HP 0x1b22[npc] (1728+2npc).
- S1: npc [24,26,7,22,16], class [1,17,18,6,9], all HP = max. LP1: npc [3,2,30,29,1].
- Index order rel[i][j] = row i: **suspected** (consistent with symmetric writes in P3; S1 matrix is not symmetric, so row/col matters).

## P2. Who is "in the party" — known
Living = class ≠ −1 and HP > 0. Counts and votes use living members only; tavern price splits over class ≠ −1 (dead included).

## P3. Recruit (FRISE L_01148 → 0x011de) — known (trigger suspected)
1. Allowed only if living count < 5.
2. Vote per living member j: `v_j = 0x379c[cls_j][0x1e76[n]] − 2 + 2·0x3eb2[0x166c_j − 1][0x1ebe[n] − 1] − |0x16cc_j − 0x206e[n]|` (n = npc id 0x014c). v > 0 yes, v = 0 abstain, v < 0 no. **Accepted if yes ≥ no** (0x01327).
3. Slot = first c with HP == 0 (empty **or dead** member is overwritten). L_03543 copies the npc's stats, 3 spells (0x221e[n][0..2], rest cleared) and MENTAL = 100.
4. 0x3908[c] = n; 0x1b22[n] = 0 (world NPC removed); for every other living j: rel[j][c] = rel[c][j] = `0x379c[cls_j][cls_c] − 2 + 2·0x3eb2[0x166c_j][0x166c_c] − |0x16cc_j − 0x16cc_c|` (**symmetric overwrite**; note no −1 on 0x166c here, unlike step 2: faithful quirk, known).
5. Grid: c+1 into first empty cell scanning rows 4→0, cols 0→4.
6. If n ≠ 27: 0x3ead = 1 (tavern removes the candidate, see shop-tavern V6). Message 23 to entity 0 when started from the world (dirb 0x8c = 0).
- Trigger: tavern hire sends message 24 (**suspected** to reach L_01148); world NPC dialog: skipped (NPC dialog contract).

## P4. Dismiss (action menu case 4 → L_0176c) — known
Actor a = dirb 0x11, target t = dirb 0x13 (alive, t ≠ a). Votes of every living j ≠ t: v_j = rel[j][t]; yes ≥ no → L_00a76: **HP = 0, npc = −1, class = −1, gold k/u = 0 (gold is lost)**, portrait erased, L_06dbe (grid/items: **unknown**). npc 27 → 0x41e4 = 2. Else message, nothing changes.

## P5. Kill a member (action menu case 3 → L_0199c) — known
No vote. t removed from the grid (cell = 0), HP = 0; npc 27 → 0x41e4 = −1; npc = −1; L_06c57 (body/items: **unknown**). Then for every living j ≠ a: with A = rel[j][a], T = rel[j][t]:
| A | T | rel[j][a] |
|---|---|---|
| > 0 | ≤ 0 | +2 |
| > 0 | > 0 | −1 |
| ≤ 0 | ≤ 0 | +1 |
| ≤ 0 | > 0 | −2, and if now < −2: **j kills a** (chain: t := a, a := j, repeat) |
Class stays set (dead body). known

## P6. Case 9 (L_01be5) — suspected
If rel[a][t] < −1 → spawns a type 0x0e entity with −3 (refusal); else `rnd(100) < 0x3d3c[a]` and 0x3cee flags 0 → 0x3cee[t][t] = 1, HP[t] += 1 … (healing/first-aid-like). Meaning **unknown**, not analysed further.

## P7. Leaving at the tavern (ITAVERNE, after sleep only) — known
See shop-tavern V5: rnd(3) == 0 → first member with npc ∈ {21,28,15,10}; else first member with no rel[i][j] > −2 to any other member; others lose one item each; leaver HP 0, npc −1, class := 1 (meaning unknown), gold kept in save.

## Tests (Alderaan/Hoth)
Shared: load, save A, act, save B, diff (save cost 1000 GS on c2 byte 483).
### T1 (deterministic, suspected): S1 dismiss c4 (npc 16) by c0
Votes rel[j][4], j = 0..3: −2, 1, 4, −5 → yes 2, no 2 → **accepted**. Expect: 476/477 → 0 (HP 77 → 0), 732 → FF, 4032 → FF, 486/487 and 4001/4002 stay 0. Grid 3771 (value 5): **unknown** (L_06dbe). Click path: ACTION c0 (16,132) → menu cell for case 4 (**unknown**, dirtc 0x4e) → portrait c4 (288,160).
If rel is column-major instead (P1 suspected), votes rel[4][j] = −2, 1, 6, −5 → same outcome, so T1 does not decide the index order.
### T2 (deterministic, suspected): S1 kill c3 (npc 22) by c0
After: rel[1][0] = −2 & rel[1][3] = −9 → +1 → −1; rel[2][0] = −1 & rel[2][3] = −7 → +1 → 0; rel[4][0] = −2 & rel[4][3] = −5 → +1 → −1. Expect 4008 FE→FF, 4013 FF→00, 4023 FE→FF; 474/475 → 0; 4031 → FF; grid 3765 (value 4) → 0; class 731 stays 06. No chain kill. Decides the index order: column-major would read A = rel[0][j], giving different deltas (4004 −2→?, see P5).
### T3 (deterministic once inside, suspected): LP1 sleep → no leaver
See shop-tavern T4 (all LP1 rows have a value > −2; no special npc) → 4028..4032 unchanged.
### T4 (suspected): tavern hire
At tavern t with a free/dead slot and a candidate 0x3f18[t][k] ≠ −1: click (64(k mod 4)+32, row) → vote P3 → on accept 5046+8t+k → FF, 4028+c → n, MENTAL 768+c = 100, rel row/col c rewritten. S1/LP1 have no free slot: needs a save with a dead/dismissed member (e.g. after T1). Route **unknown**.

## Addendum 2026-11-03: action menu table dirtc 0x4e and click sequences

Source: FRISE L_00c23–L_00d1a (fill), 0x00d41/0x00d4d (hit test), switch 0x00d7f, highlight L_00f45. **known** unless marked otherwise.

- Table layout: `dirtc 0x4e[col][row]` with col = mouse_x / 159 and row = (mouse_y_script − 1) / 10. Only col 0..1 and row 0..5 count; 0 = empty cell; the table is cleared at L_00bd4 for 0..5. Screen y = 199 − script y, so row r has its centre at screen y ≈ 193 − 10·r (script y 6+10r; highlight box drawn at script y 6+10r, x 79+159·col).
- Cell contents (fill at 0x00c2e–0x00d1a) with the manual order (Give item, Give money, Kill, Dismiss, Recruit, Cast spell, Lockpick, Orientation, First aid) as labels:

| col,row | case | target | label | click (screen x,y) | evidence |
|---|---|---|---|---|---|
| 0,5 | 1 | L_00db0 (char sheet, dirb20=1) | GIVE ITEM | (40,143) | known cell / suspected label |
| 0,4 | 2 | L_00de0 (char sheet, dirb21=1 → L_052f1) | GIVE MONEY | (40,153) | known / suspected |
| 0,3 | 3 | L_0199c | KILL | (40,163) | known |
| 0,2 | 4 | L_0176c | DISMISS | (40,173) | known |
| 0,1 | 5 | L_00fc0 (L_02d78 pick in 3D view) | RECRUIT | (40,183) | known cell / suspected label |
| 0,0 | 6 or 0 | L_00e2a (spell list) | CAST SPELL; set to 6 only if class (0x1664) ∈ {0,2,5,6,9,…} (0x00ca8), else 0 = empty | (40,193) | known |
| 1,5 | 7 | L_01ca0 (needs 0x4238==1 or dirb aa==0; entity type 6 with msg −10) | LOCKPICK | (200,143) | known cell / suspected label |
| 1,4 | 8 | L_01eca (skill 0x3d34 < 20 check) | ORIENTATION | (200,153) | known cell / suspected label |
| 1,3 | 9 | L_00e63 → L_01be5 | FIRST AID (item 9) | (200,163) | known cell / suspected label (fits skill+"healed once" logic) |
| 1,2 | 10 | L_00e6b: `send n=0, 0, 25` then sleep | not in manual; message 25 to entity 0 | (200,173) | known cell / unknown meaning |
| 1,1 | 0 | – | empty | – | known |
| 1,0 | −1 | L_00da8 → L_00f12 close | EXIT (text printed at 0x00d04) | (200,193) | known |

- Target selection for KILL/DISMISS/FIRST AID: L_02f12 (L_03163 draw, then wait). Left button with script y < 71 (screen y > 128) → target slot t = mouse_x / 64; right button → t = −1 (cancel). **known**. Click portrait at (64·t+32, 160). Checks afterwards (0x01793/0x019c3): target npc ≠ −1, HP > 0, target ≠ actor, else nothing happens. **known**
- Opening the menu: ACTION icon of the actor c at (64c+16, 132) (from the main contract). **suspected** pixel position, the rule x/64 is known.

### T1 as clicks (S1, dismiss c4 by c0)
1. Load S1, wait for 3D view. 2. Click (16,132) → menu opens (EXIT text at the bottom right). 3. Click (40,173) DISMISS. 4. Click (288,160) portrait c4. 5. If a yes/no box appears: the click window is script y 56..70, x 116..139 or 187..210 → screen (127,136) or (198,136); first press (127,136) (yes, **suspected**). 6. Save to a free slot, diff with S1: bytes 476/477 → 0, 732 = FF, 4032 = FF.
### T2 as clicks (S1, kill c3 by c0)
1. Load S1. 2. (16,132). 3. (40,163) KILL. 4. (224,160) portrait c3. 5. Save, diff: 4008 FE→FF, 4013 FF→00, 4023 FE→FF, 474/475 → 0, 4031 → FF, 3765 04→00, 731 stays 06. Revenge kills (manual) can change more slots, so check only these bytes as a minimum.
### T3 (new, Alderaan) menu hit test
Open the menu, move over each cell in the table above: the highlight box (sprite 71) has to appear exactly at the expected cell; (200,183) shows no highlight.
