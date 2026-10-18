# Party contract, Ishar 2 DOS (recruit, team vote, expel, leave, murder, cure, formation grid)

## Handoff header
| Field | Value |
|---|---|
| Base commit | bvultrex/ishar-construction-kit `bb42748` (branch workbench/playable-slice, clone `clones/quesh`, read-only; nothing committed) |
| Question | What exactly happens when the party admits or dismisses a member (vote, affinity, alignment, RNG, threshold, consequences), how the formation grid 0x49e6 works, which save bytes change, and how to reproduce it on the original EXE |
| Commands | `rg` over `decompile/alis/listings/ishar2/*.asm`; `python3 codex-support/quesh/private/party-decode.py <SAV>` (party/grid/rel decoder); `python3 private/rel-check.py` (relation formula vs. all saves); `python3 private/savediff.py A.SAV B.SAV` (field-labelled diff); `sha256sum` |
| Main addresses | FRISE L_00f74 (menu), L_01fa1 (target pick), L_01213/L_01240 (recruit), 0x01446 (admission vote), L_019ec (tally), L_018b3 (OK/cancel), L_0194b (losers' penalty), L_02151 (copy actor → slot), L_01a94 (expel), L_00c12 + L_05f26 (remove member), L_01b88 (murder), L_01dd1 (cure), L_05be5 / L_0595d (grid); PARAM 0x01f6b (affinity table 0x4c42), PARAM 0x020ba–0x023cc (tavern lists 0x4ca0); TAVERNE 0x009d6–0x00ad8 (offer), 0x00818 (leaver/thief); EAFF 0x00079 (NPC visibility) |
| Result | Fully deterministic team vote (**no RNG**), threshold `yes ≥ no`. Affinity = `A[race_a][race_b] − 3·|align_a − align_b|`. Confirmed byte-exactly by the user's own save pair GRIMZEL→GRIMZ (expel + recruit: 12 relation bytes and 7 skill bytes predicted exactly). |
| Limits | Static analysis plus save consistency. No DOSBox run. Pixel coordinates are derived from listing comparisons (see R1). The Grimzel→Grimz swap path is not traced (open). |
| Next step | Alderaan/Hoth: run the reference sequence in §E on GRIMZEL.SAV and compare with the expected diff table. Codex: wire the vote/penalty/copy rules into the VM as listed in the JSON (`routines`). |

SHA-256 (originals in `originals/ishar2/Ishar2/`):
| File | SHA-256 |
|---|---|
| FRISE.IO | 27117c124caf904a… |
| PARAM.IO | d06a65de13628470… |
| TAVERNE.IO | ea315973f2187950… |
| MESSAGEE.IO | 7ef08cd36e37d6a5… |
| SOURIS.IO | 78df7c73f8804663… |
| MAIN.IO | bfab5e9175931dbb… |
| IO.IO | 0df1f34cf2519341… |
| EAFF.IO | 6ab9102e2566617a… |
| DRUIDE4.IO | 6b66d1ed23c301e6… |
| START.SAV | e685cd6902575392a9fe445e649863885f75832ed28657a5f6faf612c6305555 |
| GRIMZEL.SAV | 4b42d32b6a682bb71cd112d7a30d172114bf13117c63ad5d5fee76e57884d3bf |
| GRIMZ.SAV | f901acf37abc91b34191c591f0f0a77e097d2801ed58e2b6c29cc8535b3b2630 |
| SASCHA2.SAV | 35205bbf8271c90e50a0baa315893b9708bf7c62a2efadaad6675e98a2a8e624 |

Notes:
- Expression semantics: `opushacc … op(opile)` = popped operand (maestun opile), so `x opushacc y osub(z) oabs omul(3) osub(opile)` = `x − 3·|y − z|`.
- 2-D arrays: flat index = `i·stride + j`, stride from MAIN `cdim`: 0x49e6, 0x4a86, 0x4b1a stride 5; 0x4b88 stride 10; 0x4c42 stride 7; 0x4ca0 stride 8.
- `rnd(n)` = `ornd` = `(r·n) >> 16`, start.exe 1000:6d7b, state not saved (combat contract).
- Save offsets are zero-based in the 8359-byte SAV; words BE (element i at off+2i). Per-slot byte fields are signed.
- Ratings: **proven** = listing + (where stated) save evidence; **hypothesis**; **open**; **contradicted**.
- Slot = party position 0..4; "id" = actor id 0..109 (0x2fa2[slot] = id, −1 = none).

---

## A. Recruiting

### R1. Portrait menu (FRISE L_0037e → L_00f74) — proven
- Each portrait has four 16-px icons in the band y_up 62..73 (`0x0078`), x = 64·slot + 16·icon. Icon 0 opens the party menu (`dirb10 % 4 == 0` → L_00f74). Requires the slot to be alive (`HP > 0`, `class ≠ −1`) and 0x4aa0 == 0.
- Menu buttons: y_up 37..60, button index `x/32`; mapping `dirtc 0x8e`:
  | Proposer slot | Menu x | buttons x/32 → option |
  |---|---|---|
  | 0, 1 | 0 | 0..4 → 1..5 |
  | 2 | 63 | 2..6 → 1..5 |
  | 3 | 127 | 4..8 → 1..5 |
  | 4 | 159 | 5..9 → 1..5 |
  Options: 1 recruit (L_01213), 2 expel (L_01a94), 3 murder (L_01b88), 4 cure (L_01dd1), 5 `csend 25` to entity 0 (MAIN; **open**, outside party logic).
- Screen coordinates: I use screen_y = 199 − y_up, the convention used in the pickup contract (portrait (32,170) / hand icon (40,131)). **hypothesis** (consistent with those clicks; the edges are not measured).

### R2. Target pick (FRISE L_01fa1) — proven (viewport hit: hypothesis)
- Sets 0x49d3 = 1, 0x4a00 = −2 and waits. Left click with y_up < 71 → `dirb15 = x/64` (a portrait slot). Left click in the viewport → SOURIS 0x00781 `ctstform 32767` stores the hit entity in 0x4a00 and `cmatent` in 0x4a02 (→ loc 0x018a / 0x0102). Right click aborts (dirb15 = −1).
- Which pixels of an NPC sprite give `cmatent == 1` is **hypothesis** (body material); take a screenshot and click the sprite centre.

### R3. Recruit gates (L_01213, L_01240) — proven
- World NPC: needs `loc102 == 1` (material) and `0x4f4c[id] ≠ 0` with id = entity byte +0x0d.
- Tavern: TAVERNE offers `0x4ca0[tavern][k]` (8 per tavern; 2×4 grid, k = (x−1)/64, +4 for the lower row, y_up 75..135; exit y_up 63..71, x > 287 or right click). Clicking sends `csend 24, id` to FRISE (type 6) → msg 24 → loc 0x0178 = id, dirb69 = 1, L_01240 (skips the material/0x4f4c check). On acceptance TAVERNE sets that list entry to −1.
- NPC visibility (EAFF 0x00079): only ids ≥ 50 can stand in the world, and only if `0x449a[id] == zone (0x4ef2)` and `0x36ac[id] > 0`. Ids 0..49 are tavern-only (0x449a = 0).
- Special case id 52 (Grimz): needs a living slot with id 51 (Grimzel); otherwise message 13 ("where is my daughter") and abort.
- Team complete: `dirb44` = number of slots with class ≠ −1 and HP > 0; if ≥ 5 → message −10 and abort (after the vote rows are computed).
- **No gold cost**, no item cost (no write to 0x2d68/0x2d80 on this path).
- Candidate sheet (name, level, STR, CON, AGI, INT, …). OK = x 116..139, y_up 56..70; Cancel = x 187..210 (same band) or right click.

---

## B. The team vote

### R4. Admission vote (FRISE 0x01446–0x0150c) — proven (static + 20 saves + GRIMZEL→GRIMZ exact)
For every slot b with class ≠ −1 and HP > 0:
```
v[b] = A[race_b − 1][race_cand − 1] − 3 · |align_b − align_cand|
     (race_b = 0x2ea6[b], align_b = 0x2f06[b], race_cand = 0x3d2e[id], align_cand = 0x3fce[id])
if id == 51 or id == 52: v[b] = 10
```
A = 0x4c42 (stride 7), written by PARAM 0x01f6b on every boot, **not in the save**. Races: 1 human, 2 elf, 3 dwarf, 4 orc, 5 (fifth race).
| A | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| **1** | 50 | 30 | 20 | 10 | 15 |
| **2** | 30 | 50 | 10 | 5 | 10 |
| **3** | 20 | 10 | 50 | 5 | 10 |
| **4** | 10 | 5 | 5 | 50 | 30 |
| **5** | 15 | 10 | 10 | 30 | 50 |

### R5. Tally and threshold (L_019ec) — proven
- Voters: slots with class ≠ −1, HP > 0, slot ≠ dirb15 (the expel target; −1 for admission). The proposer votes too.
- `v > 0` → "for" (MESSAGEE −15), yes++; `v == 0` → "neutral" (−14); `v < 0` → "against" (−13), no++. Header −16 (team vote).
- **Accepted iff yes ≥ no.** Ties pass; neutrals do not count; an empty electorate (0 ≥ 0) passes.
- **No RNG** anywhere in recruit/expel/vote (scan of 0x01213–0x0259b and 0x01a94–0x01b84: no `ornd`).
- Admission: accepted → −12 (member admitted), then OK/cancel L_018b3 (OK x 116..139, y_up 56..70; cancel x 187..210 or right click). Rejected → −11 (person rejected), nothing saved changes. Also no penalty.
- Expel: granted → −9 (expulsion granted) + OK/cancel; refused → −8 (expulsion refused), nothing changes, no penalty.

### R6. Losers' penalty after an accepted vote (L_0194b) — proven (GRIMZEL→GRIMZ exact)
Runs only after an accepted and confirmed admission or expulsion:
```
for a in 0..4 with v[a] < 0:
  for b in 0..4 with v[b] > 0:
    rel[a][b] −= 10; rel[b][a] −= 10; clamp each at ≥ 0
```
then L_00e31 (cohesion average, display only). Quirk: `v[]` (FRISE dirtc 0x4a) is **not reset**. Entries for slots that were not polled this time (the expel target, dead or empty slots) keep the value from the previous vote in the same session. That is a faithful original effect. At a fresh load the entries are presumably 0 (**hypothesis**: entity variables zeroed at start).

### R7. Expel vote (L_01a94) — proven
- Target = dirb15 from R2; must be present, alive and ≠ proposer (dirb13).
- `v[a] = 10 − rel[a][target]` for every present alive a ≠ target (rel = 0x4a86).
- Same tally and threshold; granted + OK → L_0194b, then L_00c12(target) (R10).

### R8. Relations 0x4a86 — proven
- On admission (after L_02151, R9), for every present alive a (including the new slot n itself):
  `rel[a][n] = rel[n][a] = A[race_a − 1][race_n − 1] − 3·|align_a − align_n|`. It is not clamped and can be negative. The diagonal becomes A[r][r] = 50. Exception: PARAM start-of-game sets rel[i][i] = 100 (0x00f21).
- All later changes are clamped to 0..100 (murder/cure/penalties).
- Save check: all 20 originals are symmetric. Each entry equals the formula, or the formula − 10k, or the clamped 0, with occasional +10/+20 from murder/cure (R12/R13). No counterexample.

---

## C. Consequences

### R9. Accepted admission (0x01530–0x0178a, L_02151 0x02151–0x0259b) — proven (GRIMZ, SASCHA2)
1. Slot n = first slot with `HP == 0` (an empty or dead slot). Quirk: if none exists, dirb18 keeps its old value (cannot happen behind the team-complete gate).
2. L_02151 copies actor → slot: name 0x2d1c ← 0x2fc4[id]; race 0x2ea6 ← 0x3d2e; class 0x2e9e ← 0x3cbe; level 0x2eb6 ← 0x3d9e; HP 0x2d5c and max HP 0x2d74 ← 0x36ac[id]; STR 0x2ebe ← 0x3e0e; CON 0x2ec6 ← 0x3e7e; 0x2ece ← 0x3eee; INT 0x2ed6 ← 0x3f5e; AGI 0x2ede ← 0x41fc; alignment 0x2f06 ← 0x3fce; gold 0x2d68 ← 0x378a, 0x2d80 ← 0x3868; armour 0x2f0e ← 0x418c; 0x4fd4[n] = (0x4f4c[id] == 2); food 0x2ef6 = 100; 0x2eee = 100; inventory 0x2d8e[n][0..14] = 0 (arrives empty-handed); 0x2f18[n][0..26] = 0; 0x4fde[n][0..26] = 0; dirti 0xf6[n] = −1 (forces a level check).
3. Skills by class (a+AGI → 0x4b58, b+INT → 0x4c76, c+INT → 0x4b68 (cure skill), d+AGI → 0x4b38, e+AGI → 0x4b40, f+AGI → 0x4b48, g+AGI → 0x4b50):
   | Classes | a | b | c | d | e | f | g |
   |---|---|---|---|---|---|---|---|
   | 0, 1, 3, 10, 17 | 20 | 30 | 30 | 77 | 78 | 70 | 68 |
   | 2 | 30 | 70 | 40 | 65 | 63 | 62 | 58 |
   | 4, 8, 12 | 70 | 50 | 35 | 67 | 70 | 65 | 69 |
   | 5, 6, 9, 16, 18, 19 | 20 | 40 | 70 | 18 | 14 | 15 | 13 |
   | 7 | 30 | 50 | 45 | 60 | 63 | 62 | 80 |
   | 11 | 20 | 15 | 50 | 40 | 12 | 12 | 15 |
   | 15 | 2 | 20 | 80 | 13 | 12 | 12 | 15 |
   Classes 13, 14 and others skip the switch → the seven skills get **stale** FRISE dirb6c..72 values from the previous recruit (original quirk). Save check: Grimzel (class 5, AGI 2, INT 15) → 22/55/85/20/16/17/15, and Grimz (class 19, AGI 8, INT 18) → 28/58/88/26/22/23/21. Both match GRIMZ.SAV and SASCHA2.SAV exactly. **proven**
4. XP 0x2d50 is **not** written. It is 0 for a slot freed by L_05f26, so the forced level check gives level(0) = 1, which is not > old: no level-up, no RNG. If a slot still carries XP (see R16), the check can raise the level once (one HP gain `rnd(T4b0c[race]) + max(0,(CON−8)/2)`, combat contract R5).
5. 0x2fa2[n] = id. If dirb69 == 0 (world NPC): `ckill` the clicked entity, then **0x36ac[id] = 0** (actor HP zeroed; EAFF never shows it again).
6. L_0194b (R6), new relations (R8), name drawn.
7. Grid: first empty cell scanning row 4 → 0 (outer), col 0 → 4 (inner): `0x49e6[col][row] = n + 1`.
8. World NPC: `csend 23` to entity 0. Tavern: 0x4c3d = 1, wake type 0x2f, `csend 22` to types 0x13/0x90.

### R10. Removal of a member (L_00c12 + L_05f26) — proven
Used by an accepted expulsion and by corpse cleanup:
- HP 0x2d5c = 0, 0x2fa2 = −1, class 0x2e9e = −1, gold 0x2d68 = 0x2d80 = 0 (gold is lost), portrait erased.
- L_05f26: 0x4f0a = 0 (not saved), 0x5068[n] = 0, 0x4c7e[n] = 0, XP 0x2d50 = 0, 0x2e4a / 0x2e92 / 0x2e26 / 0x2e86 / 0x2fb6 [n] = 0; first grid cell == n+1 cleared (col-outer/row-inner scan); held-item cursor 0x2d16 == −(n+1) → 0; 0x4b88[n][0..9] = 0; `csend −101` to loc 0x019e; `csend 22` to 0x13/0x90; L_05be5 (front-row recompute).
- **Not** cleared: name, stats, inventory 0x2d8e (kept in the save, overwritten by the next recruit), relations row/column (overwritten by the next recruit).
- The expelled actor never returns: 0x36ac[id] stays 0 from its own recruitment, and nothing re-adds it to 0x4ca0 (only PARAM writes tavern lists, at new game; PARAM 0x023b5 removes current members). Consistent with the saves: Fandhir (17) is still in tavern list 0 in S.SAV/LEVELING.SAV (timeline where he is not in the party) and gone from it in START.SAV (recruited).
- Dead members: L_05e20 draws the dead portrait and calls L_05f26 (XP zeroed); if all are dead → `csend 18` (game over). L_00ae1: when the party position changes, every slot with HP ≤ 0 and class ≠ −1 → L_00c12 (corpse removed, gold lost).

### R11. Leaving on its own (TAVERNE, after a room rest, dirb12 ≠ 2) — proven (static)
- `rnd(3) == 0` → the first member with id ∈ {21, 28, 15, 10} becomes the thief (leaves via L_00818).
- Otherwise (or if no such member): the first member a whose relation to every other present member is ≤ −2 leaves.
- L_00818 (only if another member is present): from every other member remove the first backpack item in slots 0..8 with a code in −56..−20; leaver class = 1 (sic), HP = 0, 0x2fa2 = −1; `csend 22`; message entity 0x35 with +0x0c = −29, +0x0d = id. L_05f26 is **not** called here, so XP/grid entries stay until FRISE's death/cleanup paths see HP 0 (**hypothesis** for the exact cleanup order).
- RNG: exactly one `rnd(3)` per rest.

### R12. Murder (L_01b88, menu option 3, no vote) — proven (static)
- Victim HP = 0 → L_05e20. If the victim's id is 51 (Grimzel): after 3 frames the killer's HP = 0 too.
- For each living a ≠ killer, with K = rel[a][killer], V = rel[a][victim], both directions: K > 50 & V ≤ 50 → +30; K > 50 & V > 50 → −20; K ≤ 50 & V ≤ 50 → +10; K ≤ 50 & V > 50 → −40, and then if rel[a][killer] < 30 → **revenge**: a murders the killer (the loop restarts at L_01b9e with the new pair; the remaining members of the first loop are not updated). Clamp 0..100 (L_01d4c). No RNG.

### R13. Cure (L_01dd1) — proven (static)
- rel[helper][target] < 10 → message −3 (refuses to cure).
- Else, if 0x4b1a[t][t] == 0: always one `rnd(100)`. Success iff rnd < 0x4b68[helper] and 0x4b1a[t][helper] == 0 → 0x4b1a[t][t] = 1 and HP += `rnd(5) + 1` (capped at max). Otherwise 0x4b1a[t][helper] = 1. Then for other living a (≠ t, ≠ helper): rel[a][t] < 20 → rel[a][helper] −20; rel[a][t] > 80 → +20; clamp 0..100.
- 0x4b1a[slot][*] is reset to 0 when the member is hit (EATT; FRISE 0x054aa).
- Confused member hitting an ally (FRISE 0x05460): rel −10 both ways (clamp), damage `rnd(10) + 1`. The nearest-ally distance expression multiplies (`dirb11·dirb5b`) instead of subtracting: an original bug, keep it.

### R14. Cohesion (L_00e31) — proven
- dirb86 = mean of rel over living pairs including the diagonal. Display only (sheet 0x06b23), not saved, no gameplay effect found.

---

## D. Formation grid 0x49e6 — proven

| Item | Value |
|---|---|
| Layout | `0x49e6[col][row]`, flat = 5·col + row, save offset **7111 + 5·col + row**, value = slot + 1, 0 = empty |
| Front row | the highest row index holding anyone (L_05be5). dirtc 0x9a[slot] = col + 1 for front-row members, else 0 (melee eligibility, combat contract) |
| New game | PARAM: only [0][4] = 1 (party = actor 33); debug paths fill row 4 |
| Recruit | first empty cell, row 4 → 0 (outer), col 0 → 4 (inner) (FRISE 0x0169f) |
| Removal | first cell equal to slot+1 cleared, col-outer/row-inner (L_05f26) |
| Revive (msg 32 → L_00d89) | first empty cell, col-outer/row-inner, row 0 first |
| Editor (L_0595d) | F-key code 1 or 0x4f10 == 12; mini-map cell at x = 263 + 12·col, y_up = 129 + 11·row; a click picks a member (0x2d16 = −value), the next click drops or swaps |
| Enemy targeting | EATT takes the first non-zero cell from the attacking side (combat contract A3) |
| Quirk | duplicate values occur in originals (FINALE/LP2/LP3, SASCHA2 has two cells = 1). The editor allows it; rules must not assume uniqueness |

---

## E. Save bytes and reference sequences

### E1. Field offsets touched by party logic (slot n, actor id)
| Field | Save offset | Field | Save offset |
|---|---|---|---|
| name 0x2d1c | 936 + 10n | XP 0x2d50 (BE) | 986 + 2n |
| HP 0x2d5c (BE) | 996 + 2n | gold 0x2d68 / 0x2d80 (BE) | 1006 + 2n / 1026 + 2n |
| max HP 0x2d74 (BE) | 1016 + 2n | inventory 0x2d8e (15 BE words) | 1036 + 30n |
| 0x2e26 / 0x2e4a / 0x2e86 / 0x2e92 (BE) | 1186 / 1206 / 1256 / 1266 + 2n | class 0x2e9e | 1276 + n |
| race 0x2ea6 | 1281 + n | level 0x2eb6 | 1291 + n |
| STR / CON / 0x2ece / INT / AGI | 1296 / 1301 / 1306 / 1311 / 1316 + n | 0x2eee / food 0x2ef6 | 1321 / 1326 + n |
| alignment 0x2f06 | 1331 + n | armour 0x2f0e | 1336 + n |
| 0x2f18 (27 B/slot) | 1341 + 27n | actor id 0x2fa2 | 1476 + n |
| 0x2fb6 (BE) | 1491 + 2n | 0x4fd4 (female flag, hyp.) | 111 + n |
| actor HP 0x36ac (BE) | 3261 + 2·id | actor zone 0x449a | 6781 + id |
| recruitable 0x4f4c | 7789 + id | tavern lists 0x4ca0 | 8239 + 8·tavern + k |
| grid 0x49e6 | 7111 + 5col + row | relations 0x4a86 | 7356 + 5a + b |
| cure flags 0x4b1a | 7521 + 5t + h | skills 0x4b38/40/48/50/58/68 | 7546/7551/7556/7561/7566/7571 + n |
| 0x4b88 (10 B/slot) | 7579 + 10n | 0x4c76 / 0x4c7e | 7729 / 7734 + n |
| 0x4fde (27 B/slot) | 7899 + 27n | 0x5068 | 8034 + n |
Not saved: 0x4c42 (affinity), 0x4f0a, FRISE dirtc 0x4a (votes), dirti 0xf6, dirb86, 0x2d16.

### E2. Reference sequence 1: expel + recruit on GRIMZEL.SAV (for Alderaan/Hoth, DOSBox-X, original EXE)
**Why this save:** it is Sascha's own save. The next save in that timeline (GRIMZ.SAV) shows exactly this expel + recruit, among other later play, so the relation and skill bytes can be cross-checked. Start state: map 5, zone 36, party row 53 / col 16, facing 3; Grimzel (id 51, 0x36ac = 14, zone 36) stands at row 53 / col 17, **one cell straight ahead**. Party: 0 Eliandr (39), 1 Bragl (38), 2 Noegh (45), 3 Brom (13), 4 Molgo (22), all alive.

Use your own copy of the game directory (never the originals or Hoth's active one). Same DOSBox pitfalls as in pickup-contract-ishar2.md (focus, keypad digits, release Alt, mousemove before click).

| # | Input (screen coords, 320×200) | Expected observable result | Basis |
|---|---|---|---|
| 1 | Load GRIMZEL | Grimzel's sprite one cell ahead | EAFF 0x00079 |
| 2 | Left-click Bragl's menu icon **(72, 131)** (slot 1, icon 0) | 5-button menu at the top-left of the portrait strip (x 0..159) | R1 |
| 3 | Left-click option 2 "expel" **(48, 150)** | target-pick mode | R1 |
| 4 | Left-click Eliandr's portrait **(32, 170)** | Vote panel: Bragl **for** (10), Noegh **against** (10 − 14 = −4), Brom **for** (10), Molgo **for** (10) → 3 : 1 → **expulsion granted** (−9) | R7/R5 |
| 5 | Left-click OK **(127, 136)** | Eliandr's portrait becomes empty | R10 |
| 6 | Left-click Bragl's menu icon **(72, 131)**, then option 1 "recruit" **(16, 150)** | target-pick mode | R1 |
| 7 | Left-click Grimzel's sprite (centre of the viewport sprite; screenshot first, approx. (128, 90)) | Candidate sheet: Grimzel, level 4, STR 3, CON 5, AGI 2, INT 15 | R2/R3 (hit: hypothesis) |
| 8 | Left-click OK **(127, 136)** | Vote: all four **for** (forced 10 for id 51) → **member admitted** (−12) | R4 |
| 9 | Left-click OK **(127, 136)** | Grimzel's portrait in slot 0; the NPC sprite disappears | R9 |
| 10 | Save as `PARTY1` | — | — |

**Expected diff PARTY1 vs GRIMZEL.SAV** (party-relevant bytes; plus clock fields 44–49, which vary):
| Save offset | Field | Before → after | Rule |
|---|---|---|---|
| 936–945 | name slot 0 | Eliandr → Grimzel string (copy of 0x2fc4[51], file 2011–2020) | R9 |
| 986–987 | XP slot 0 | 539 → **0** | R10 (L_05f26); not rewritten by R9 |
| 996–997 / 1016–1017 | HP / max HP slot 0 | 87 / 87 → **14 / 14** | R9 |
| 1036–1065 | inventory slot 0 | → all 0 | R9 |
| 1276 / 1281 | class / race | 5 / 1 → 5 / 1 (unchanged; was −1 between steps 5 and 9) | R10, R9 |
| 1291 | level | 13 → **4** | R9 (no level-up, XP 0) |
| 1296 / 1301 / 1306 / 1311 / 1316 | STR / CON / 0x2ece / INT / AGI | 6/6/17/16/11 → **3/5/16/15/2** | R9 |
| 1321 / 1326 | 0x2eee / food | → 100 / 100 | R9 |
| 1331 / 1336 | alignment / armour | 8 / 0 → 8 / 0 | R9 |
| 1341–1367, 7899–7925 | 0x2f18 / 0x4fde slot 0 | → all 0 | R9 |
| 1476 | actor id slot 0 | 39 → **51** | R9 |
| 111 | 0x4fd4 slot 0 | 1 → 1 | R9 |
| 3363–3364 | 0x36ac[51] | 14 → **0** | R9 |
| 7114 / 7125 | grid [0][3] / [2][4] | 1 → 0 / 0 → **1** | R10 / R9 |
| 7363, 7367 | rel[1][2], rel[2][1] | −28 → **0** (−38 clamped) | R6 |
| 7369, 7373 | rel[2][3], rel[3][2] | 5 → **0** (clamped) | R6 |
| 7370, 7378 | rel[2][4], rel[4][2] | 38 → **28** | R6 |
| 7357, 7361 | rel[0][1], rel[1][0] | 0 → **−4** (50 − 3·18) | R8 |
| 7359, 7371 | rel[0][3], rel[3][0] | 0 → **29** (50 − 3·7) | R8 |
| 7360, 7376 | rel[0][4], rel[4][0] | 0 → **14** (20 − 3·2) | R8 |
| 7356, 7358, 7366 | rel[0][0], [0][2], [2][0] | 50, 14, 14 unchanged (formula gives the same values as for Eliandr) | R8 |
| 7546 / 7551 / 7556 / 7561 / 7566 / 7571 / 7729 | skills slot 0 | 29/25/26/24/31/86/56 → **20/16/17/15/22/85/55** | R9 (class 5 row) |
| 7579–7588, 7734, 8034 | 0x4b88[0][*], 0x4c7e[0], 0x5068[0] | already 0 → 0 (unchanged) | R10 |
| 1006–1007, 1026–1027 | gold slot 0 | 0 → 0 (unchanged; R10 zeroes it, R9 copies 0x378a/0x3868[51] = 0) | R10/R9 |
Nothing else should change: the other slots' stats, tavern lists, and 0x449a/0x4f4c stay. Variance: the step 4 vote assumes FRISE's stale v[0] is 0 at a fresh load (R6). If it were non-zero, extra −10 penalties would hit row/column 0, which R8 overwrites anyway, so the expected bytes do not depend on it.

**Cross-check already done (static):** the 12 relation bytes and the 7 skill bytes above appear with exactly these values in GRIMZ.SAV (the user's own continuation). GRIMZ also differs in level/HP/XP/food/grid from later play: there the grid has Grimzel at [1][3] and Molgo at [0][3], presumably after a manual formation edit (**hypothesis**; the recruit rule predicts [2][4]).

### E3. Reference sequence 2: refused and granted expulsions on START.SAV
START: map 1, row 11, col 12, facing 2. Party 0 Zubaran (33, human, align 3), 1 Fandhir (17, elf, 4), 2 Dhrurhn (41, orc, −8), 3 Unknown (7, human, −10), 4 Yornh (16, human, 0); grid row 4 = 1..5; rel row 4 = [41, 18, −14, 20, 50], column 2 = [0, 0, 50, 0, −14].
- **Refused:** Zubaran's menu (8, 131) → option 2 (48, 150) → Yornh's portrait (288, 170). Votes `10 − rel[a][4]`: Zubaran −31 against, Fandhir −8 against, Dhrurhn +24 for, Unknown −10 against → 1 : 3 → **expulsion refused** (−8). **Save diff: none** (except clock). No penalty on refusal.
- **Granted:** Zubaran's menu → option 2 → Dhrurhn's portrait (160, 170). Votes `10 − rel[a][2]`: +10, +10, +10 (Unknown), +24 (Yornh) → 4 : 0 → granted → OK (127, 136). No against-voters → no penalty. Expected diff: 1000–1001 HP 60 → 0; 1278 class 3 → −1; 1478 id 41 → −1; gold slot 2 (1010–1011 / 1030–1031) already 0; XP 990–991 already 0; 7125 grid [2][4] 3 → 0; 8036 0x5068[2] −1 → 0; 7599–7608 0x4b88[2][*] stay 0; 7736 stays 0. Name, stats, inventory, relations unchanged.
- **Then a tavern recruit** fills slot 2 (first HP == 0 slot). The tavern location on map 1 is not derived here (**open**). The diff pattern equals E2's recruit part with n = 2.

---

## Findings summary
| # | Finding | Rating |
|---|---|---|
| R1 | Menu, icon bands, option mapping | proven (pixel edges: hypothesis) |
| R2 | Target pick (portrait slot = x/64) | proven; NPC sprite hit material = hypothesis |
| R3 | Recruit gates, no cost, Grimz needs Grimzel, team complete at 5 | proven |
| R4 | Vote value = A[r][r'] − 3·|Δalign|, 51/52 forced 10 | proven (static + saves + GRIMZ) |
| R5 | Threshold yes ≥ no, ties pass, neutral ignored, no RNG | proven |
| R6 | Losers' −10 penalty, clamp ≥ 0, stale-vote quirk | proven (exact in GRIMZ); stale initial value = hypothesis |
| R7 | Expel vote 10 − rel | proven |
| R8 | New relations (unclamped) | proven |
| R9 | Actor → slot copy, skill table, actor HP zeroed | proven (GRIMZ, SASCHA2 exact) |
| R10 | Removal clears; gold lost; never returns | proven |
| R11 | Tavern thief rnd(3) / leaver rule | proven (static only) |
| R12 | Murder relation table and revenge | proven (static only) |
| R13 | Cure rnd(100), rnd(5)+1 | proven (static only) |
| R14 | Cohesion display only | proven |
| D | Grid layout and scan orders | proven |
| — | 0x4fd4 = female flag | hypothesis (0x4f4c == 2 exactly for female names; Grimzel = "daughter"; flips 1 → 0 on Grimzel → Grimz) |
| — | Grimzel → Grimz in-place swap (SASCHA2: slot 0 keeps XP 259 and level 9, gets class 19 skills) | **open**: L_02151 evidently ran on Grimzel's living slot without L_05f26. The trigger (DRUIDE4 0x50b4 / message entity +0x0d = 23) is not traced |
| — | START.SAV history (orc Dhrurhn admitted despite negative affinity to Zubaran/Fandhir) | open (earlier party composition unknown; not a contradiction) |
| — | Contradictions | none found |

## Limits
- Static listings plus save consistency. No DOSBox run. Pixel coordinates follow the pickup-contract convention and still need measuring.
- Message texts are referenced by MESSAGEE code with a short gist, not quoted.
- Option 5 (MAIN msg 25), the meaning of skills 0x4b38/40/48/50/58 and 0x4c76 (only 0x4b68 = cure is proven), and class 13/14 stale skills at runtime remain open.

## Next step
1. Alderaan/Hoth: run E2 (and E3 refused/granted) on copies, save PARTY1/EXP1, and diff against the tables above.
2. Codex: the VM needs `ctstform`/`cmatent` for the NPC click (already needed for pickup). The rules in the JSON `routines` are directly testable against PARTY1.
3. Optional: trace DRUIDE4 → Grimz swap; locate the map-1 tavern for a tavern-recruit sequence.
