# Routine contract: Ishar 2 ground pickup → cursor → party/hand slot (map 1, objects 9/10)

- **Base commit:** `bb42748` (handoff), reviewed code `319819c`. Read-only; nothing committed.
- **Profile:** Ishar 2 DOS, `start.exe` `5e35e58d2d13…`.
- **Script hashes (SHA-256, packed originals):**
  - AFFOBJ.IO `40b882fbadff…`
  - OBJET.IO `51ec1fdf24be…`
  - SOURIS.IO `78df7c73f880…`
  - FRISE.IO `27117c124caf…`
  - IO.IO `0df1f34cf251…`
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
- *(Savewerte → `private/pickup-contract-ishar2-savewerte.md`, SW-1)*
- **Open:** occupied-slot swap path from 0x03012 (not read); the meaning of T4bbc / L_03b98.

---

## Reference input sequence (for Alderaan/Hoth, DOSBox-X, original EXE)
*(Savewerte → `private/pickup-contract-ishar2-savewerte.md`, SW-2)*
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
| 345 | 0x2aba+9 | → 0 | R3 |
| 545 | 0x2b84+9 | → 0 | R3 |
| 745 | 0x2c4e+9 | → 0 | R3 |
| 8048 | 0x50c8+9 | unverändert | not cleared by pickup (proven) |
| A: 1036–1037 | 0x2d8e c0 s0 | 0 → Item-ID 9 | R6 |
| B: 1056–1057 | 0x2d8e c0 s10 | 0 → Item-ID 9 | R7 |
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
- *(Savewerte → `private/pickup-contract-ishar2-savewerte.md`, SW-3)*
  - file 1056/1057: c0 slot 10 = −25 (MAIN 0x2d8e + 2·10); Bytewerte privat (SW-PK2-ARM-C)
  - file 1336: c0 armour consistent with the item already held; Bytewert privat (SW-PK2-ARM-C)
  - Slot 9 still holds −104 (armour 0), and object 9 is still on the ground (irrelevant here).
  - It reuses only the click points Alderaan already measured.
- **Sequence:**
  1. Load `pick25`.
  2. Hands icon c0 (40,131).
  3. Click slot 10 (50,168): the item lifts onto the cursor.
  4. Disk → SAVE → `pick25a`. Expected: Rüstungsbyte 1336 sinkt um den Rüstungswert des Gegenstands, 1056/57 geleert (Werte: privat (SW-PK2-ARM-C)).
  5. Click slot 10 (50,168) again: drop.
  6. SAVE → `pick25b`. Expected: 1336 steigt um den Rüstungswert, 1056/57 = Item-Code des Gegenstands (Werte → private SW-B2).
  - If saving while the cursor is holding the item is refused, skip step 4 and only check the A→B round trip (1336 unverändert), plus the screenshot of the armour display.
- *(Savewerte → `private/pickup-contract-ishar2-savewerte.md`, SW-4)*
  - *(Savewerte → `private/pickup-contract-ishar2-savewerte.md`, SW-5)*
  - Expected: Rüstungsbytes 1336/1337 verschieben sich um den Rüstungswert des Gegenstands (Werte: private). This equals Hoth's CH2N (5ba27aa6…).
  - It needs the not-yet-measured c1 hands icon and c0 slot-9 coordinates; calibrate those first.
- Tolerated noise as in §8.4 (clock, day phase, monster re-roll).

## 2026-10-18 addendum: hit-box formula re-checked against the lever hit (152,58)
OBJET form 40 = origin [−12, 0, −4], extent [25, 1, 19]; form 16 = [−6, 0, 0] + [13, 1, 18] (axes x, depth, h). With entity h = −42 and the SOURIS ray mx = 128 + x, my = 77 − h:
- object 9 → mx 116..141, my 104..123 (unchanged)
- object 10 → **mx 122..134** (previously 135), my 101..119
The same formula reproduces Hoth's lever hit (152,58) with PCAVE form 0. proven. Details: hebel-tuer-trigger-ishar2.md, 2026-10-18 corrections.

## Nachtrag 2026-11-14 (Europe/Berlin): Kit-Abgleich f4cf659, Code 10 am Porträt, Tausch, Ablage, Speichern
Basis: Kit `workbench/playable-slice` `f4cf659` (statt `319819c`). Nur statische Arbeit. Quellen: FRISE.IO `27117c124caf`, SOURIS.IO `78df7c73f880` (Listings), Save-Offsets aus der IO.IO-Ableitung. Der Bestand bleibt stehen. Was folgt, korrigiert oder ergänzt ihn. Vollbericht: `pickup-contract-check-ishar2.md` (Nachtrag 32).

1. **R6 widerlegt für Code 10 (known, Listing):**
   - Im FRISE-Klickpfad liegt vor 0x007b1 die Prüfung bei 0x0032b. Bedingung: `0x7a == 1`, gehalten ≠ −6, `0x78 < 75` und **|0x2d16| == 10** (`oabs`).
   - Ablauf:
     - c = 0x76 / 64.
     - Lebend-Prädikat wie 007C9 (0x0034d).
     - → `L_04825`: Gold von c (Tausender T2d68[c], Einheiten T2d80[c]) += (0x4c94, 0x4c96) über `L_06865` (Übertrag > 999). Danach 0x4c94 = 0x4c96 = 0.
     - Anschließend 0x2d16 = 0, `ckill 0x2fc0`, `cmouson` (0x0036b–0x00375).
   - **Objekt 10 landet also über Porträt oder Handfeld nie im Gepäck. Es verschwindet** und gilt als Geldbeutel, wie −10 aus SOURIS 0x00761.
   - Die Weltfelder waren schon beim Aufheben genullt.
   - Ist c nicht handlungsfähig, passiert nichts, und das Objekt bleibt am Cursor.
   - Save: 1006 + 2c, 1026 + 2c, 14–15, 16–17.
   - Der „Variante A“-Erwartungswert gilt nur für Objekt 9.
2. **R5 ergänzt (known):** Die Bodenablage schreibt auch **T50c8[id] = 0x2ab6** (SOURIS 0x009f0, Save 8039 + id).
   - Zielfeld auf Karte 1: das Feld vor der Gruppe (0x008f0). Eine Begehbarkeitsprüfung gibt es hier nicht.
   - Abbruch, das Objekt bleibt am Cursor:
     - ein anderes Objekt mit Material 512 unter dem Cursor (0x008cf),
     - Material 69 (0x00877; bei 9/10 ohne Wirkung),
     - `0x4aa0 ≠ 0` (0x007b0).
3. **R7 offen → geschlossen: Tausch bei belegtem Slot (0x03012–0x03347, known):**
   - Slot = −125 → keine Aktion.
   - Sonst, nur wenn alle T4bbc[0..19] == 0:
     - neuer Cursor für den alten Code,
     - Slot = gehaltener Code (0x0328b),
     - T2f0e[c] += Rüstung(neu) (0x03302), 0x2d16 = alter Code, T2f0e[c] −= Rüstung(alt) (0x0333d).
   - **Abweichung zur Ablage/Aufnahme:** Beim Tausch ist die Bedingung `code ≤ −26 AND code ≥ −29` (0x032d8/0x03313), also nur −29..−26. Bei Ablage/Aufnahme gilt die Tautologie (OR).
   - Tauscht Objekt 9 z. B. −25 aus Handfeld 9/10 heraus, bleibt dessen Rüstung in 1336 + c stehen (known, Code).
4. **Aufnahme aus Slot (Übergabe, known):**
   - `L_02c0f` mit 0x2d16 == 0: Slot ≠ 0 und ≠ −125 → Cursor-OBJET, 0x2d16 = Code, Rüstung −= (Slots 9/10), danach **Slot = 0** (0x02dbb).
   - Die Lücke 0x02cbb–0x02dba im Listing betrifft nur den Stapelzweig.
5. **Speichern mit Item am Cursor ist im Original unmöglich (known):**
   - Das Disk-Menü `L_05c6e` (lädt io.IO) wird nur bei 0x2d16 == 0 und 0x4aa0 == 0 geöffnet: Taste 0x002b0, Klick 0x00982.
   - Bewegung über GERDEP `L_0055e` (0x00572) ist bei 0x2d16 ≠ 0 gesperrt (Umfang: suspected).
6. **Code 9 als Übergabe in Szenen mit 0x4aa0 == 1 (known, Code):**
   - SOURIS 0x00c74: Material 100 und gehalten == 9 → **0x4f13 = 3** (Save 20–21, IO.IO 0x00ac5 `cfwritev`), Freigabe.
   - PP11 reagiert bei 0x000e9/0x000fc mit T449a[62] = 0 (Save 6905). Ob Material 100 zu PP11 gehört: suspected.
7. **Freigabe:** Am Porträt, am Handfeld und beim Tausch nur, wenn alle T4bbc[0..19] == 0 (0x03c9b, 0x02fdb, 0x0315b).
   - T4bbc ist transient und hält die Stapelmenge in Bewegung. Für 9/10 normalerweise 0 (suspected).
   - Ein Wert ≠ 0 bedeutet: Slot geschrieben, Cursor nicht freigegeben.
8. **Formfehler im JSON:** R3 `hit_rect_game.10` nennt noch 135. Gültig ist 134 laut Nachtrag 2026-10-18.

## Nachtrag 2026-11-14 (Europe/Berlin): Listinglücke FRISE 0x02cbb–0x02dba geschlossen (Stapelentnahme)
Ursache der Lücke: Das Ausdrucksbudget des Disassemblers war zu klein. Mit großem Budget endet der lange Ausdruck bei 0x02d4f; FRISE.IO `27117c124caf` ist damit lückenlos dekodiert. Das ersetzt den Satz „Lücke 0x02cbb–0x02dba (nur Stapelzweig)“ im vorigen Nachtrag. Alles known (Listing).
- **Auswahl 0x02cbb:** Ein Klick in eine Teilzone des Slots bedeutet ganzer Stapel, jeder andere Klick ein Stück.
  - Charakterblatt: x in (148 + 24·d10, 159 + 24·d10), y_up in (116 + 28·d11, 122 + 28·d11).
  - Handfeld: x in (26 + 64c + 24·(s mod 9), 38 + 64c + 24·(s mod 9)), 17 < y_up < 24.
  - Dass die Zone die Zahlenanzeige ist: suspected.
- **Ganzer Stapel 0x02d53–0x02d7e:** T4bbc[j] = T4bd4[c][j], dann T4bd4[c][j] = 0 und anschließend Slot = 0 (0x02dbb).
- **Ein Stück 0x02d82–0x02db7:** T4bbc[j] = 1, T4bd4[c][j] −= 1.
  - Zähler > 0 → `L_02e1b`: Slot und Icon bleiben.
  - Sonst Slot = 0 (0x02dbb).
- **Ziel `L_03bef` + `L_03580`:**
  - Gleicher Code in Slots 0..10, sonst erster freier Slot 0..8.
  - Deckel D = 20 für −49, sonst 10 (0x035a4–0x035d2).
  - Zähler + gehalten ≤ D → Zähler += gehalten, T4bbc = 0 (0x035fb/0x03615).
  - Sonst T4bbc −= D − Zähler und Zähler = D (0x0363e/0x0364c). **Der Rest bleibt am Cursor, nichts wird verworfen.**
  - Freigabe nur bei allen T4bbc == 0 (0x03c9b).
- **Adressen:**
  - j = Code + 59.
  - T4bd4 (MAIN `cdim` 0x0024c, Schritt 20, Byte) ↔ Save 7629 + 20c + j.
  - T4bbc (MAIN 0x00247) ist transient und das Ishar-2-Pendant zu 0x403a aus Ishar 1.

## Nachtrag 2026-11-14 (Europe/Berlin): Zweihand-Reservierung und L_03b98 (offen → geschlossen)
Quelle: FRISE.IO `27117c124caf` in vollständiger Dekodierung, PARAM.IO-Initialisierung. Alles known (Listing), außer wo anders vermerkt.

**L_03b98 (Freigabe der Reservierung):**
- Für Slot 9: Steht T2d8e[c][10] auf −125, wird es 0, und die Reservierungsgrafik wird gelöscht (0x03ba6–0x03bc5).
- Für Slot 10 gilt dasselbe spiegelbildlich (0x03bcc–0x03beb).
- Aufgerufen wird die Routine bei der Entnahme aus einer Hand (0x02c6d) und vor jeder Ablage auf eine Hand (0x02e32). Sie läuft **unabhängig vom gehaltenen Code** und vor allen weiteren Prüfungen.

**Ablagereihenfolge bei L_02e20:**
1. Alten Code lesen, dann `L_03580` und `L_03b98` (Freigabe).
2. Zweihand-Prüfung 0x02e36/0x02e4c: gehalten in −116..−90 und T4a08[Code+116][2] mod 10 == 2.
   - Zielslot 9: Ist die andere Hand 0 oder −125, wird sie auf **−125** gesetzt (0x02ea1). Sonst `cret` ohne Write, das Item bleibt.
   - Zielslot 10: spiegelbildlich (0x02eea / 0x02f0b).
3. Erst danach folgen Slot-Write bzw. Tausch (0x02f0c/0x03012).
   - Wird der Tausch nach gesetzter Reservierung noch abgelehnt (nur über T4bbc ≠ 0 in `L_0315b`), bliebe −125 ohne Waffe stehen. Dass das bei gehaltener Waffe erreichbar ist: suspected nicht erreichbar.

**T4a08:**
- MAIN `cdim` 0x001ea, Schritt 4.
- Wird nur von PARAM ab 0x00f58 geschrieben: 27 Datensätze für die Codes −116..−90, darunter 12 Zweihand-Einträge (Feld 2 mod 10 == 2).
- Nicht im Save.

## Nachtrag 2026-11-14 (Europe/Berlin): Stapel auf Handfeld, Reihenfolge der Mengenwrites in L_02e20
Quelle: FRISE.IO `27117c124caf`, vollständige Dekodierung. Alles known (Listing), außer wo anders vermerkt.

1. **0x02e2e `L_03580` läuft vor allen Zielprüfungen.**
   - Der gehaltene Stapel wird sofort in den figurweiten Zähler T4bd4[c][j] (Save 7629 + 20c + j) gebucht, mit Deckel D. Ein Überhang bleibt in T4bbc.
   - Das gilt unabhängig davon, was im Zielslot liegt. Ausgenommen ist nur ein alter Code 16 (0x03596).
2. **0x02e32 `L_03b98`:** gibt eine −125-Reservierung der anderen Hand frei, ebenfalls vor allen Prüfungen.
3. **Ziel leer, oder Ziel = gleicher Stapel** (0x02f0c/0x03035 → `L_02f19`):
   - Gibt es den Code schon in Slot 0..10, wird kein Slot geschrieben.
   - Sonst Slot = Code (0x02f5a).
   - Freigabe nur, wenn alle T4bbc == 0 (0x02fdb).
4. **Ziel = −125** (0x03012 → `L_03348`): Es folgt kein Slot-Write und **keine Freigabeprüfung**. Die Buchung aus Punkt 1 bleibt aber bestehen.
   - Existiert der Code in keinem Slot, steht der Zähler ohne Slot da.
   - Der Cursor behält den Code, auch wenn T4bbc dann 0 ist (Folgezustand suspected).
5. **Anderer Zielcode** → `L_0315b`:
   - **0x03161:** Ist irgendein T4bbc ≠ 0, endet der Ablauf ohne Tausch (`L_03348`). Der Zähler ist schon gebucht, Slot und alter Code bleiben.
   - Sonst: neuer Cursor für den alten Code.
     - Ist der alte Code ein Stapel: T4bbc[alt] = T4bd4[c][alt], danach T4bd4[c][alt] = 0 (0x03212/0x0322c).
     - Ist der gehaltene Code ein Stapel, der schon in Slot 0..10 existiert: Zielslot = 0 (0x0326b; doppelten Slot unterdrücken). Sonst Zielslot = gehaltener Code (0x0328b).
     - Rüstung: Tausch-Regel mit AND (−29..−26). Danach 0x2d16 = alter Code.
