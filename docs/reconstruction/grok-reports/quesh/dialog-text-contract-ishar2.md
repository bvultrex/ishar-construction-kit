# Routine contract: Ishar 2 dialog text (TEXTIN/TEXTINE/TEXTIND)

- Base commit `bb42748` (handoff), code `319819c`. Static only; read-only; no asset text reproduced here (only codes, counts, lengths). Strings stay in `private/dialog/textcases-private.json`.
- Script hashes (SHA-256): TEXTIN.IO `e0c8293e…5a6c`, TEXTINE.IO `a8f9dc4b…c1e6`, TEXTIND.IO `b36ded43…465d`, MAIN.IO `bfab5e91…db95`, PP11.IO `5e7672ec…9423`, MARCHAND.IO `a5b84f95…3529`, SOURIS.IO `78df7c73…f9d3`.
- Evidence levels: **known** = read from original script bytes/listing at the given address (or observed in an original save). **suspected** = derived/inferred, not yet confirmed in the running game. **unknown** = not determined.

## D1. Language selection
- MAIN 0x02960: `cswitch2 loc 0x51c1` → 1 = `textine.IO` (EN), 2 = `textind.IO` (DE), else `textin.IO` (FR). Init −1 at MAIN 0x00304. **known**
- Callers always `clive 0x0035` (FR type id) although EN/DE are loaded with ids 0x32/0x33. That the engine maps them onto the same entity type: **suspected**. Who sets 0x51c1 to 1/2 (start.exe/config): **unknown**.
- All three variants have identical case sets and the same flag reads/writes (EN/DE offsets shift only). **known** (textcases.py segmentation).

## D2. Call contract (how a dialog is started)
- Caller: `clive 0x0035 → h`; `h+0x0c = code` (signed byte); usually `h+0x09 = 37`; optional `h+0x0d` = sub-parameter. **known** (33 call sites: MARCHAND, PP11, PP12, PP2I, PP3BAN, PP3MN, PP3TB, PPSAC, TAVERNE).
- Dispatch (TEXTIN 0x00063–0x00083): code > 124 → L_03604 (10-line list/menu page, code 126 adds an "Exit" entry); code < 0 → L_0250d (kills other TEXTIN instances, then switch 0x02555 / 0x02dfc); else switch 0x000c6. **known**
- Code families **known**:
  | switch | codes | cases | lines total | max len | notes |
  |---|---|---|---|---|---|
  | 0x000c6 (positive) | 1,2,3,10–14,16–20,23,24,100–110 | 26 | 167 (FR) | 47 | NPC scenes; only family that touches quest flags |
  | 0x02555 (negative) | −52…−10 | 16 | 40 | 45 | merchant/tavern/bank replies (+0x0d selects variant) |
  | 0x02dfc (negative, item names) | −116…−14 | 103 | 146 | 28 | item/description texts, many share default L_035f3 |
- Caller → code map (static): PP11 1/2, PP12 3, PP3BAN 12/−50/−51/−52, PP3MN 10/14/16/17, PP3TB 11/13/18, PP2I 23 and 78+x, PPSAC 24, TAVERNE −10/−20…/−22…/−29/−31/100+x, MARCHAND −21/−40…−43. **known**

## D3. Layout and pacing (L_02399 / L_02442)
- Up to 4 line slots (dir tp 0x34[0..3]); line count n = index of first empty slot. **known**
- y per line (value stored in tc 0x12, printed at `tc[i] − 5 + dirb28`):
  n=1: 39 · n=2: 47, 31 · n=3: 51, 39, 27 · n=4: 54, 44, 34, 24. **known**; that these are y-up (screen y = 199 − v) like other HUD prints: **suspected**.
- x = 159 − 3·len (centred on x≈159, 6-px cells from `cfont 33,18,6,9,119`). **known** formula; pixel exactness **suspected**.
- One `cstop` (frame) per line → lines appear one per frame. **known**
- Dismiss (L_0248b): put types 6 and 7 to sleep (`casleep`), wait until no button & no key, then button-or-key down, then release; clear 4 slots (`cerasen`). **known**. Types 6/7 are woken again after the dialog (0x00097–0x000c0) → game frozen during text: **suspected** (6/7 = FRISE/SOURIS-like actors, not verified).
- Max 47 chars FR / 48 EN / 46 DE per line in family 0x000c6 → x ≥ 18. **known**

## D4. Multi-page cases
Most cases select ONE 4-line page by a state flag (code 2: 5 branches × 4 lines on 0x4f13, exit via 0x00641 → L_02399, dismissal by the generic 0x00093 → L_0248b). **known**. Codes 13/19/20 call L_02399 + L_0248b inline → multi-page (2–3 pages). **known** (calls at the case addresses); exact page count per branch **suspected**.

## Test cases (reproducible; Alderaan = DOSBox runs, Hoth = save checks)
Window 320×200, `windowresolution=original`; DOSBox pitfalls as in pickup contract (keypad digits, release Alt, mousemove before click).
- **DT-1 (Alderaan) merchant greeting layout.** Any save standing in front of a merchant (MARCHAND code −40 at 0x000a4). Enter shop. Expect: text lines horizontally centred on x≈159 (left edge = 159 − 3·len ±1), line count/height matching D3; game blocks until click. Screenshot before and after click. Pass: left edges fit the formula within ±1 px; text disappears only after press+release.
- **DT-2 (Alderaan) Gordbnoeuf audience (code 2).** From a save with 0x4f13 = 1 entering the audience (see quest contract QF-1). Expect 4-line pages; Expect exactly 1 page (4 lines) per visit, 1 click to dismiss. Pass if 1 page and the save afterwards shows 0x4f13 = 2.
- **DT-3 (Hoth) language.** Run EN and DE builds if available: same code produces same number of pages (static: identical branches). **unknown** whether the local install can switch language.
- **DT-4 (static, Codex/Hoth)** `python3 private/dialog/textcases.py` regenerates case counts; expected numbers = table D2 (26/16/103 for TEXTIN). Deterministic.

## Open
Language variable source; whether types 6/7 = all game actors; exact pixel y frame; meaning of `+0x09 = 37` (suspected: priority/depth).
