# Routine contract: Ishar 2 ground pickup → cursor → party/hand slot (map 1, objects 9/10)

- **Base commit:** `bb42748` (handoff), reviewed code `319819c`. Read-only; nothing committed.
- **Profile:** Ishar 2 DOS, `start.exe` `5e35e58d2d133dadeed4b233b7f962f9c941c3d635feb9d3a067a63c340dadf9`.
- **Script hashes (SHA-256, packed originals):**
  - AFFOBJ.IO `40b882fbadff3ea452c76a2af3fdbba9d2b3e4c62d0f19dd838c41f0d5ebdf1e`
  - OBJET.IO `51ec1fdf24bea52fd07cfc5bf01fa46c6ae7b75bbccb93433d6d0c66b0d99e08`
  - SOURIS.IO `78df7c73f880466303867b63dd5e20897777802b0595c64935b9f4462354f9d3`
  - FRISE.IO `27117c124caf904a31568f5c58f615946083dd3429c02ade1dc1e17552cc2b64`
  - IO.IO `0df1f34cf2519341ef20825d49c7f1e7ff204878814db744f7e5cb58ce6b5918`
- **Question:** close the static gaps of the smallest end-to-end flow: (1) hit rectangle, (2) held-at-cursor state, (3) FRISE drop into a slot plus the armour recompute.
- **Method:** static only. Local ALIS listings (`decompile/alis/listings/ishar2/*.asm`); form tables decoded with the kit's `readDosAlisForms` (`npx tsx`, read-only); `ctstform`/`clipform` semantics from the separate C reference maestun/alis `opcodes.c:3911, 1862` (reference, not DOS code). Save offsets come from the IO.IO derivation (`private/ishar2-save-layout-derived.json`).
- **Evidence words:**
  - **proven** = read directly from the original script bytes/listing at the address given.
  - **hypothesis** = a derived number or a meaning inferred from that code.
  - **open** = not determined.
  - **contradicted** = an earlier claim found wrong.
- **Coordinates:** "game" means 320×200 screen pixels, y downward. MAIN 0x76 = mouse x. **MAIN 0x78 = 199 − mouse y** (SOURIS 0x00223 flips y; up is positive).

## Key result in one paragraph
There is no screen rectangle test. The pickup is an ALIS **form collision**. While visible at depth index 0, the ground object entity (OBJET, spawned by AFFOBJ) sets a 3D box form (`cforme 40` for object 9, `cforme 16` for object 10) with material 512+id. On a left click in the viewport, SOURIS tests its own form 0 against all entities with material mask 512. That form is a ray of x = mx−128, z = (199−my)−122, depth 0..499, so it is centred on the view origin (128,122 in y-up terms = screen 128,77). `cmatent & 511` returns the object id. For object 9 straight ahead at distance 1 this yields **game x 116..141, y 104..123** (hypothesis on the ±1 edges); object 10: **x 122..135, y 101..119**. The item then becomes a new OBJET entity in "cursor mode" (param 0x0d=1). It follows the mouse; its id is in **MAIN 0x2d16** and its handle in **MAIN 0x2fc0**; the hardware pointer is hidden (`cmousoff`). Dropping on a portrait writes 0x2d16 into the first free backpack slot. Dropping on a hand slot (hands panel open) writes slot 9/10, and for armour items adds the per-item armour table value to 0x2f0e[char].

---

## R1. AFFOBJ: project ground objects (spawn visible OBJET entities)
- **Script / offset:** AFFOBJ.IO, main loop 0x0003b–0x00286, per-object 0x00287–0x003d6, depth table 0x003d7–0x004f6. **proven**
- **Entry:** AFFOBJ task running (woken by SOURIS 0x00a11 / FRISE after changes).
  - 0x00041–0x00064: first kills every type-4 (OBJET) entity with param 0x0d == 0 (old ground sprites).
- **Inputs:**
  - MAIN 0x2ab4 row, 0x2ab5 col, 0x2ab6 facing (1=N col−1, 2=E row+1, 3=S col+1, 4=W row−1), 0x2d18 map.
  - Per object i = 0..110: T2aba[i] row, T2b84[i] col, T2c4e[i] map, T50c8[i] facing.
  - Terrain tables MAIN 0x0080 / 0x159c (CONT A/B).
- **Logic:** `cswitch2 facing` (0x00064) picks one of 4 equivalent loops.
  - Each computes d = forward distance and l = lateral offset; e.g. facing 2 gives d = T2aba[i]−row, l = T2b84[i]−col.
  - Accept if T2c4e[i] == map, 0 ≤ d (sign per facing), |d| < 7, |l| ≤ |d|. Then dirb1d = |d|, dirb1e = ±l and `cjsr L_004f7` → L_00287.
  - **L_00287:** if map ≠ 1 and T50c8[i] ≠ facing: skip (on map 1 facing is ignored, **proven** 0x00287).
    - dirb21 = A[row,col], dirb22 = B[row,col] terrain bytes; dirb20 = i.
    - `cjsr L_003d7`; offsets dirw24 = dirw26 = 0, with per-id exceptions (switch 0x00308; ids 9/10 take the default, offsets 0).
  - **L_003d7 (depth):** map 1: dirw10 = d·99; other maps (d+1)·99. Then `cswitch1` on dirw10:

    | dirw10 | 99 | 198 | 297 | 396 | 495 | 594 | 693 |
    |---|---|---|---|---|---|---|---|
    | y (dirw16) | −42 | −25 | −12 | −7 | −4 | −2 | −1 |
    | x step (×l) | 192 | 92 | 60 | 44 | 34 | 28 | 24 |
    | scale (28/2a) | 10/10 | 21/16 | 32/28 | 44/40 | 56/56 | 69/69 | 80/80 |

    Map 1 with d = 0 (object on the party's own cell) hits no case, so dirw14/16 keep stale values (**open**; the kit's exclusion of d=0 is consistent with "not drawn correctly").
  - Spawn (0x003a1): `clive 4` (OBJET); entity +0 = dirw14 + dirw24·10/dirw28; +4 = dirw16 + dirw26·10/dirw2a; +2 = dirw10 − 10; +0x0c = i. +0x0d is not written (0 = ground mode; **hypothesis**: clive zeroes the vars).
- **Outputs/side effects:** one OBJET child per visible object; no MAIN writes in this path (the T50c8 writer 0x00514 is a separate helper for maps ≠ 1).
- **Kit:** `original-ground-runtime.ts` (`frames` 192/−42, 92/−25, 60/−12; z = d·99−10) matches. **proven** agreement for d = 1..3 on map 1.

## R2. OBJET ground mode: sprite and hit form
- **Script / offset:** OBJET.IO 0x0001f (switch 0x0d), 0x00085, id 9 → 0x003ad, id 10 → 0x003db. **proven**
- **Inputs:** +0x0c id, +0x0d mode, +2 depth.
- **Logic:**
  - dirb0e = (+2)/100, i.e. depth index 0 for d = 1 (89/100), 1 for d = 2, etc.
  - id 9: if mode == 0: `cput 115 + idx`, and if idx == 0, `cforme 40`. Else `cput 115`.
  - id 10: same with 90 + idx, and `cforme 16` at idx 0.
  - Then 0x00698 → 0x006a4 switch (ids 8..16 → 0x007d9, no extra effect for 9/10) → 0x00a16: mode 0 → `csleep` loop.
- **Forms** (OBJET resource form table, decoded; box = signed origin + extent, axes x, depth, z(up)):

  | form | material | origin | extent |
  |---|---|---|---|
  | 40 | 521 = 512+9 | (−12, 0, −4) | (25, 1, 19) |
  | 16 | 522 = 512+10 | (−6, 0, 0) | (13, 1, 18) |

  **proven** (bytes in private derivation). Material low 9 bits = object id: **proven**, by SOURIS `& 511` at 0x0049b.
- **Pickable only at depth index 0** (cforme only set then; otherwise no form = no collision). **proven**
- **Sprite size:** irrelevant for the hit test (the collision uses the form, not the bitmap). Draw position goes through the engine projection (deptopix, origin 127,78 per render-runtime.md) and is not needed for the contract.

## R3. SOURIS: click → pickup
- **Script / offset:** SOURIS.IO 0x00409–0x0066b. **proven**
- **Entry:** MAIN 0x7a == 1 (left button; Shift on keyboard also sets 1, 0x00080).
  - **Viewport gate** (0x0041c): 0x76 < 256 and 0x78 > 72 (screen y < 127), MAIN 0x2ab7 == 0 (no full-screen panel), MAIN 0x4fcf == 0.
  - **Pickup gate** (0x00445): MAIN 0x2d16 == 0 (nothing held), 0x49d3 == 0, 0x4b34 == 0.
- **Hit test:**
  - If MAIN 0x4aa0 == 0: `ctstform 512, 0`; else `ctstmov 128,0,122, 512, 0` (an explicit offset variant).
  - The SOURIS entity sits at (0x76, 0, 0x78) (`cset` 0x003f4/0x00400); its form 0 = origin (−128, 0, −122), extent (0, 499, 0) (decoded).
  - `ctstform` (C reference): collides own form 0 with every entity of the same context word +6 whose cforme ≥ 0 and whose material & 512. First hit → handle in dirw26 (−1 = none).
- **Derived rectangle:** cursor point (x' = mx−128, z' = 77−my) inside the box [X+ox, X+ox+ex] × [Z+oz, Z+oz+ez], depth 0..499 ∋ D. With X = 0, Z = −42 (d = 1, straight ahead):
  - **object 9:** mx 116..141, my 104..123
  - **object 10:** mx 122..135, my 101..119

  **hypothesis:** inclusive/exclusive edges, and that OBJET coordinates share the cursor frame. Mechanism **proven**.
  - Lateral ±1 at d = 1 gives X = ±192, i.e. off the 256-px viewport, so effectively only the centre lane can be picked. **hypothesis**
- **Logic after a hit:**
  1. 0x00498 `cmatent` → dirw1a = material & 511 (object id).
  2. 0x004a6/0x004b0/0x004ba: T2c4e[id] = 0, T2aba[id] = 0, T2b84[id] = 0. **T50c8[id] is not cleared.**
  3. ids 151..160: special sends (not this flow). Default 0x00576: dirw1a = hit entity +0x0c; `ckill` the hit entity.
  4. 1 < id < 7: clear the matching entry in T50ae[0..4] (not 9/10). 17..22: water/terrain handling (not 9/10).
  5. 0x0062e `clive 4` (new OBJET): +0x0c = id, +2 = 0, +0 = MAIN 0x76, +4 = MAIN 0x78, **+0x0d = 1** (cursor mode).
  6. **MAIN 0x2fc0 = new handle; MAIN 0x2d16 = id**; `cstop`; `cmousoff`.
- **Writes:** MAIN 0x2c4e+id, 0x2aba+id, 0x2b84+id, 0x2d16, 0x2fc0. Entities: kill ground OBJET, create cursor OBJET. Pointer hidden.
- **Kit:** `pickOriginalGround` zeroes the 3 fields (matches); it does not model 0x2d16/0x2fc0 or the cursor entity.

## R4. OBJET cursor mode (item held at the cursor)
- **Script / offset:** OBJET.IO, id 9 → 0x003d4 `cput 115` (id 10: 0x00402 `cput 90`), then 0x00a16–0x00a72. **proven**
- **Logic:** mode 1: +2 = 1. Loop:
  - if −59 ≤ 0x2d16 ≤ −49 (stack items) print the count with the digit font (`cfont 48,1,4,5,10`, `cnumput`), not for 9/10;
  - +0 = MAIN 0x76; +4 = MAIN 0x78; `cstop`; repeat.
- **State variables:**
  - MAIN 0x2d16 = held code (positive world id or negative inventory code; 0 = none)
  - MAIN 0x2fc0 = cursor entity handle
  - neither is in the save (not in the IO.IO field list) → **proven** transient
- **Cleared by:** SOURIS 0x009fc–0x00a1a (ground drop), FRISE 0x03cc3 (portrait drop), FRISE 0x03003 (slot drop), plus others (0x0036b init, …). All of them do `ckill 0x2fc0`, `0x2d16 = 0`, `cmouson`.

## R5. Drop back on the ground (for completeness)
- **Script / offset:** SOURIS 0x007b0–0x00a1b. **proven**
- **Entry:** viewport gate as R3, 0x2d16 > 0, 0x4aa0 == 0, not on a type-69 entity, and `ctstform 512` finds **no** other object under the cursor.
- **Target cell:** map 1 = the cell in front (facing 1: col−1; 2: row+1; 3: col+1; 4: row−1); other maps = own cell.
- **Writes:** T2c4e[id] = map, T2aba[id] = row, T2b84[id] = col, T50c8[id] = facing. Then `ckill 0x2fc0`, `cwakeup` AFFOBJ (type 0x0b), 0x2d16 = 0, `cmouson`.

## R6. FRISE: drop on a portrait (backpack)
- **Script / offset:** FRISE.IO party-bar click 0x007b1–0x0080c → L_03bef–0x03cce. **proven**
- **Entry:**
  - FRISE click handler with MAIN 0x78 < 62 (screen y > 137); char c = 0x76/64.
  - T2d5c[c] > 0 (alive) and T2e9e[c] ≠ −1 (present).
  - (0x2d16 < −14 or 0x2d16 > 0) **and** T4f0a[c] ≠ 1 (hands panel not open).
- **Logic (L_03bef):** dirb5e = c.
  - Stack items (−59..−49): merge into an existing equal slot 0..10.
  - Otherwise find the first slot s in 0..8 with T2d8e[c·15+s] == 0 and write T2d8e[c·15+s] = 0x2d16.
  - Then `L_03580` (stack bookkeeping; returns immediately for non-stack codes); redraw if this char's panel is open (`L_03a6c`) else `L_0365f`.
  - **Release:** 0x03c9b only if all T4bbc[0..19] == 0: 0x2d16 = 0, `ckill 0x2fc0`, `cmouson`.
  - Backpack full: nothing written, the item stays at the cursor.
- **Writes:** MAIN 0x2d8e + 2·(15c+s) (word), 0x2d16, entity kill. **No armour change** (backpack).
- **Kit:** `receiveOriginalGround` (first free slot 0..8) matches the slot choice. It does not model the release condition or the redraw.

## R7. FRISE: drop on a hand slot (hands panel) + armour recompute
- **Script / offset:** FRISE.IO 0x0080c–0x0089b → L_0259c → L_02c0f → L_02e20–0x0300e; armour table L_03f22–0x0401b. **proven**
- **Opening the hands panel:** the slot's icon 2 sets T4f0a[c] = 1 (FRISE 0x005a9, draws panel res 34 at x = 31+64c). Icon 1 sets 2 (0x00420). Toggling back sets 0. **proven**
- **Entry:** T4f0a[c] == 1 and 17 < 0x78 < 45 (screen y 155..181):
  - x in (14+64c, 39+64c) → slot 9
  - x in (38+64c, 63+64c) → slot 10
  - (boundaries exclusive, **proven** from the `osup`/`oinf` operands)
- **L_0259c:** dirb5e = c; icon position dirw be = 26 + 64c + (slot mod 9)·24, dirw c2 = 32, dirw c0 = 15 + 10c; dirb89 = 3 (hand); `L_02c0f`.
- **L_02c0f, held ≠ 0 → L_02e20:** loc100 = T2d8e[c·15+slot].
  1. `L_03580`, `L_03b98` (stack/redraw helpers).
  2. **Two-handed weapon** (0x02e36): −116 ≤ code ≤ −90 and T4a08[code+116] mod 10 == 2. If dropping into 9 and slot 10 is empty or −125, set slot 10 = −125 (blocked marker, draws res 100 at x+23); mirror case for slot 10/9.
  3. **Slot empty** (0x02f0c): T2d8e[c·15+slot] = 0x2d16.
  4. **Armour** (0x02f68): the condition `(code ≤ −26) OR (code ≥ −29)` is always true, AND slot ∈ {9,10}. So `L_03f22` gives dirb51 = armour(code) and **T2f0e[c] += dirb51**.
  5. Spawn an OBJET icon in mode 2: +0x0c = code, +0x0d = 2, +9 = c, +0x0a = dirb89, +0/+2/+4 = (be, c0, c2).
  6. Release: same T4bbc condition, 0x2d16 = 0, `ckill 0x2fc0`, `cmouson`.
- **Armour table L_03f22** (dirb51 by code), **proven**:

  | code | −89 | −87 | −85 | −83 | −79 | −77 | −75 | −71 | −69 | −67 | −65 | −63 | −61 | −29 | −28 | −27 | −26 | −25 | other |
  |---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
  | armour | (0x0400d) | (0x04004) | 2 | 1 | 1 | 6 | 2 | 12 | 9 | 7 | 5 | 3 | 2 | 6 | 3 | 2 | 1 | **4** | 0 |

  The two values in brackets were not read; see the listing at those addresses (**open**). Objects 9/10 → 0 (no armour change).
- **Pick up from a hand** (0x02c0f–0x02ca1): `clive` a cursor OBJET (mode 1), 0x2d16 = slot code, 0x2fc0 = handle; same armour condition → **T2f0e[c] −= armour**.
- **Cross-check (Hoth's charsaves CH1N→CH2N, original EXE):** item −25 moved from Bragl's (char 1) hand to Eliandr's (char 0) hand. Save 0x2f0e changed slot0 0→4 and slot1 16→12. That is exactly armour(−25) = 4, subtracted on pickup and added on drop. **proven** (contract and original agree).
- **Open:** occupied-slot swap path from 0x03012 (not read); the meaning of T4bbc / L_03b98.

---

## Reference input sequence (for Alderaan/Hoth, DOSBox-X, original EXE)
**Save:** no existing save has object 9 or 10 lying on map 1 (checked all saves in `ishar2-quesh`, `ishar2-auto`, `charsaves`, originals: T2c4e[9/10] = 0 everywhere, and no inventory holds 9/10). Use a **labelled patched copy** of START.SAV (SHA-256 `e685cd6902575392a9fe445e649863885f75832ed28657a5f6faf612c6305555`; map 1, row 11, col 12, facing 2 = E). Make it with the kit CLI, which only writes mapped fields:
```
# writes.json (toolkit format): object 9 one cell ahead (row 12, col 12), map 1, facing 2
[{"address":10947,"width":1,"value":12},   # 0x2ac3 = T2aba+9  (file 345)
 {"address":11149,"width":1,"value":12},   # 0x2b8d = T2b84+9  (file 545)
 {"address":11351,"width":1,"value":1},    # 0x2c57 = T2c4e+9  (file 745)
 {"address":20689,"width":1,"value":2}]    # 0x50d1 = T50c8+9  (file 8048; irrelevant on map 1)
npm run save:main -- patch IO.IO START.SAV writes.json PICK9.SAV
```
(Delete the `#` comments before use; JSON allows none.) Cell 12/12 is walkable (K1A011–K1A014 stand there).

**Steps** (window 320×200, `windowresolution=original`, so screen = game coordinates):
1. Load PICK9 (Ctrl+9, type `PICK9` with letters and **keypad digits**, Enter).
   - **Expect:** in the viewport, object 9 drawn with OBJET res 115 at the bottom centre (~x 128, y ~120).
   - Screenshot Ctrl+F5.
2. Left-click **(128, 113)**: inside the predicted box x 116..141, y 104..123.
   - **Expect:** the floor sprite disappears, the mouse pointer is replaced by the item icon (res 115) following the mouse.
   - Also try **(114, 113)** and **(143, 113)** on separate runs to bracket the edges (should miss).
3. **Variant A (backpack):** left-click the first portrait at **(32, 170)**.
   - **Expect:** the icon vanishes, the normal pointer returns. Character 0's backpack slot 0 = object 9.
4. **Variant B (hand):** first click character 0's icon 2 (hands; slot-local x≈39 → screen (40, 131) per hud-spec), then drop at **(50, 168)** (slot 10; slot 9 is occupied by −104 in START).
   - **Expect:** item drawn in the left hand.
5. Save to a new name (Ctrl+…: same save dialog), e.g. `PICK9A` / `PICK9B`.

**Expected save diff vs PICK9.SAV:**
| file offset | MAIN | before → after | note |
|---|---|---|---|
| 345 | 0x2aba+9 | 12 → 0 | R3 |
| 545 | 0x2b84+9 | 12 → 0 | R3 |
| 745 | 0x2c4e+9 | 1 → 0 | R3 |
| 8048 | 0x50c8+9 | 2 → 2 | not cleared by pickup (proven) |
| A: 1036–1037 | 0x2d8e c0 s0 | 00 00 → 00 09 | R6 |
| B: 1056–1057 | 0x2d8e c0 s10 | 00 00 → 00 09 | R7 |
| 1336 | 0x2f0e c0 | unchanged | armour(9) = 0 |
| 45/48/49 | 0x4fc6/0x4fca | vary | clock (Hoth, K87) |

Nothing else should change. 0x2d16/0x2fc0/0x4f0a are not saved.

**DOSBox pitfalls** (from earlier traces):
- `xdotool windowfocus <win>` before every key or click; search the window by PID, not by title.
- Digits only on the **keypad** (`KP_1`…); hold keys ~150–400 ms (`keydown`, sleep, `keyup`).
- After any debugger break (Alt+Pause), **release Alt explicitly** (`xdotool keydown Alt_L keyup Alt_L`), otherwise clicks turn into right clicks (Alt = right button in Ishar).
- Send a `mousemove` first and wait ~0.3 s before `mousedown`/`mouseup` (0.2 s hold); otherwise SDL drops the click.
- Never break inside a click; click, wait 1–2 s, then break.
- Use your own copy of the game directory, never Hoth's active one or the originals.

## Limits
- Static. Exact pixel edges depend on the `formhit` comparison (inclusive or not) and on OBJET and SOURIS coordinates sharing one frame (**hypothesis**); step 2's bracket clicks settle this.
- The two-handed branch, occupied-slot swap (0x03012), T4bbc meaning and the two unread armour entries are **open**.
- The patched save is a toolkit-made input, explicitly labelled; the flow after loading is original.

## Next step (Codex)
In the VM, implement `ctstform`/`clipform` and `cmatent` (material & mask, context word +6, first hit). Then run AFFOBJ → OBJET → SOURIS natively with the click at (128,113) and compare against Alderaan's PICK9A/B diffs. Kit-side, `pickOriginalGround`/`receiveOriginalGround` could gain the 0x2d16/0x2fc0 cursor state and the R7 armour rule. That is a proposal, not done here.

## 2026-10-18 addendum: R7 armour check (Alderaan variant B, obj 9 → slot 10, 1336 unchanged)
Base bb42748, static only. FRISE.IO listing (Ishar 2).
- **L_03f22 fully decoded** (`cswitch1 omainw(0x2d16)`, 0x03f22–0x0401b, default 0x04016 → 0). **proven**

  | code | −89 | −87 | −85 | −83 | −79 | −77 | −75 | −71 | −69 | −67 | −65 | −63 | −61 | −29 | −28 | −27 | −26 | −25 | everything else |
  |---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
  | armour | **4** | **3** | 2 | 1 | 1 | 6 | 2 | 12 | 9 | 7 | 5 | 3 | 2 | 6 | 3 | 2 | 1 | 4 | 0 |

  The two previously open entries are now closed: −89 → 4 (0x0400d), −87 → 3 (0x04004). Only these 18 negative codes are non-zero. Every positive id (ground-object ids such as 9 and 10) falls to the default → 0. So Alderaan's B result (1336 unchanged) **confirms** the contract.
- **Guard (drop 0x02f68, pickup 0x02c71, identical):** `(code ≤ −26 OR code ≥ −29) AND (slot == 9 OR slot == 10)`. The first part is always true (a tautology, probably intended as −29..−26), so effectively the slot test is the only guard. **Slots 9 and 10 are treated identically.** There is no item-class restriction. **proven**
- **Apply:** drop `T2f0e[c] += dirb51` (0x02f92), pickup from a hand `T2f0e[c] −= dirb51` (0x02c9b). `maintc` is a **byte** table (IO.IO cfwriteb 0x2f0e len 5), so the save offset is **1336 + c**, not 1336 + 2·c. No clamping. Armour from slots 11–13 (body pieces) comes from elsewhere and is not part of R7 (open).
- **Contract status:** confirmed; table completed; offset formula clarified (+c).

### Variant C recommendation (visible change, item −25 = 4)
- **Start save:** `codex-support/quesh/private/PICK25.SAV` sha256 `78d3fbdb51aaf7ac053e2804bd9d4e5957302b763391012ef695a0224f2309ca`. This is a labelled toolkit patch of Alderaan's PICK9.SAV (c306cfc7…), 3 bytes:
  - file 1056/1057 = FF E7: c0 slot 10 = −25 (MAIN 0x2d8e + 2·10)
  - file 1336 = 04: c0 armour consistent with the item already held
  - Slot 9 still holds −104 (armour 0), and object 9 is still on the ground (irrelevant here).
  - It reuses only the click points Alderaan already measured.
- **Sequence:**
  1. Load `pick25`.
  2. Hands icon c0 (40,131).
  3. Click slot 10 (50,168): the item lifts onto the cursor.
  4. Disk → SAVE → `pick25a`. Expected: 1336 4→0, 1056/57 → 00 00.
  5. Click slot 10 (50,168) again: drop.
  6. SAVE → `pick25b`. Expected: 1336 0→4, 1056/57 = FF E7.
  - If saving while the cursor is holding the item is refused, skip step 4 and only check the A→B round trip (4 → 4), plus the screenshot of the armour display.
- **Unpatched alternative (original save):** `decompile/charsaves/CH1N.SAV` (4d0219fe…).
  - Move Bragl's (c1) −25 from slot 10 into Eliandr's (c0) empty slot 9.
  - Expected: 1337 16→12, 1336 0→4. This equals Hoth's CH2N (5ba27aa6…).
  - It needs the not-yet-measured c1 hands icon and c0 slot-9 coordinates; calibrate those first.
- Tolerated noise as in §8.4 (clock, day phase, monster re-roll).

## 2026-10-18 addendum: hit-box formula re-checked against the lever hit (152,58)
OBJET form 40 = origin [−12, 0, −4], extent [25, 1, 19]; form 16 = [−6, 0, 0] + [13, 1, 18] (axes x, depth, h). With entity h = −42 and the SOURIS ray mx = 128 + x, my = 77 − h:
- object 9 → mx 116..141, my 104..123 (unchanged)
- object 10 → **mx 122..134** (previously 135), my 101..119
The same formula reproduces Hoth's lever hit (152,58) with PCAVE form 0. proven. Details: hebel-tuer-trigger-ishar2.md, 2026-10-18 corrections.
