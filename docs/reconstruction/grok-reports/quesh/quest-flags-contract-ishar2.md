# Routine contract: Ishar 2 quest flags (dialog-driven state bytes)

- *(Savewerte → `private/quest-flags-contract-ishar2-savewerte.md`, SW-1)*
- Evidence: **known** / **suspected** / **unknown** (as in dialog contract).
- Storage: MAIN bytes, saved by IO.IO `cfwritev` as BE16 words (value in low byte, high byte = sign). File offset = word offset below (low byte at +1). **known** (IO.IO 0x00ac5–0x00b29 write, 0x00e1c–0x00e80 read; PARAM 0x008de… reads the same layout).
- *(Savewerte → `private/quest-flags-contract-ishar2-savewerte.md`, SW-2)*

## Flag table
| flag | file off | writers (module pc → value) | readers | meaning |
|---|---|---|---|---|
| 0x4f13 | 20 | PP11 0x00038 →1; TEXTIN code 2: 0x003af (1→2), 0x0056e (3→4); SOURIS 0x00c81 →3 | TEXTIN code 2 branches 0..4; PP11 0x000aa–0x000f6 | Gordbnoeuf chain (QF-1). writes **known**, meaning **suspected** |
| 0x4fbd | 26 | MAIN 0x006c6 →1 (new game), MAIN 0x01039 →−1; PARAM 0x00f52 →1; PP3MN 0x00041 →0; PP3TB 0x000cd →2; TEXTIN code 10: →2, →3, →2 | PP3MN, PP3TB, TEXTIN 10/11, MAIN 0x02d6c (≤0) | multi-state NPC chain; meaning **unknown** |
| 0x4fbe | 28 | TEXTIN code 13: →1 (0x00db5), →2 (0x00f11), →1 (0x00fd8) | TEXTIN 13 | **known** writes, meaning **unknown** |
| 0x4fc0 | 32 | PP3TB 0x0002b →0; SOURIS 0x00ca3 →1 (drop item −15 on material 101) | PP3TB 0x00085/0x000b3 | item-delivery flag, **suspected** |
| 0x4fc1 | 34 | MAIN 0x01026 +1, clamp 3 (0x01050) | TEXTIN 13 (>1), MAIN | counter, **known** writes |
| 0x4fc4 | 40 | TEXTIN code 13 0x00dbb →1; SOURIS 0x00e4d →1 | MAP 0x00077/0x001c6/0x002a2/0x0042e (>0) | map/route unlock, **suspected** |
| 0x4fc5 | 42 | PP3MN 0x00037 →1; SOURIS 0x00e53 →1 | MAP (>0); TEXTIN 17 (==0), PP3MN 0x001ba | map/route unlock, **suspected** |
| 0x50a5 | 70 | TEXTIN code 23 0x0134e →1 (if ==0; also reads HP 0x2d5c) | TEXTIN 23 | one-shot, **known** |
All writer addresses identical in TEXTINE/TEXTIND at shifted pcs (listed in JSON). **known**

## QF-1. Gordbnoeuf chain (0x4f13), smallest complete chain
1. Scene code ±50/51 arrives in MAIN loc 0x51bc (`oscan`, MAIN 0x003af; sender **unknown**). MAIN 0x02ec6 `abs`-switch: −50 → L_02f08 spawns PP11 with +0x0d untouched (0); 51 → L_02f49 spawns PP11 with +0x0d = 1, sets MAIN 0x4aa0 = 1, then teleports the party (0x2ab4 = 18 at 0x02fb9). **known**
2. PP11 +0x0d ≠ 0 (test at 0x0002a): the arrest scene: writes 0x4f13 = 1, TEXTIN code 1 (4 lines), waits for a click, ends. **known**
3. PP11 +0x0d = 0 (L_000aa): the audience: `cforme 0` (material 100, box origin (93,0,174), extent (60,1,−94)), TEXTIN code 2. It loops while the click is in the viewport. Whenever 0x4f13 changes to 3, it re-opens code 2 and clears MAIN tc 0x449a[62]. **known**
4. TEXTIN code 2 branch by 0x4f13: 0 → text only; 1 → text, set 2; 2 → text; 3 → spawn OLBAR (type 0x91), text, set 4; 4 → text. **known**
5. 0x4f13 = 3 only via SOURIS 0x00c74: held item (MAIN 0x2d16) == 9 dropped on material 100 → 3, cursor item killed, 0x2d16 = 0. **known**. Screen hit box: depends on 0x4aa0 at that moment (ctstform vs ctstmov). If 0x4aa0 = 1 (left over from the arrest): x 93..153, y 25..119 (game px) **suspected**; otherwise **unknown**. Calibrate with clicks.
- *(Savewerte → `private/quest-flags-contract-ishar2-savewerte.md`, SW-3)*

## Test cases
- **QF-T0 (Hoth, static, deterministic).** `python3 flagcheck-ishar2.py <save>` on originals. Expected (0x4f13,4fbd,4fbe,4fc0,4fc1,4fc4,4fc5,50a5):
  *(Savewerte → `private/quest-flags-contract-ishar2-savewerte.md`, SW-4)*
- **QF-T1 (Alderaan, DOSBox) arrest.** Load START, play until the guards scene. Save as `QF1A`. Expect diff vs START: off 21: 0→1 (or →2 if the audience followed before saving). Nothing else among the flags. Trigger location **unknown** → note map/row/col (off 2–9) when it fires.
- **QF-T2 (Alderaan) item 9 to Gordbnoeuf.** From a save in the audience with 0x4f13 = 2 and object 9 held (combine with pickup contract PICK9 flow, or patch: off 21 = 2 is a toolkit patch → label it). Drop the item at (123, 72) (centre of the suspected box); if nothing happens, grid-scan the Gordbnoeuf sprite at 10-px steps and record the first hit. Expect: icon vanishes, dialog code 2 state-3 page, OLBAR appears; save `QF2A`: off 21 = 4, item 9 not in any slot, 0x2d16 not saved. Bracket clicks (90,72)/(156,72) should not trigger.
- **QF-T3 (Hoth) negative.** Drop any item ≠ 9 on the same spot: 0x4f13 unchanged. **suspected** (code compares only == 9 then falls to L_00cb4).
- *(Savewerte → `private/quest-flags-contract-ishar2-savewerte.md`, SW-5)*

## Open
Scene-code sender for ±50/51; full semantics of 0x4fbd (−1, 7 seen); 0x4fc4/0x4fc5 MAP gates (which exits); OLBAR spawn side effects.
