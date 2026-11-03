# Routine contract: Ishar 1 NPC dialog text (TEXTIN* / MESSAGE*)

- Date 2026-11-03. Static analysis only, read-only, no commits. No game text is reproduced here; dumps (address<TAB>string) are only in `private/dialog-ishar1/*.strings.tsv`.
- SHA-256 prefixes: TEXTIN d1f987bc6e74, TEXTINE a1c22e5de16e, TEXTIND 5120c8885e52, TEXTINI fc00ad2340d2, MESSAGE 38c1082c5901, MESSAGEE 1b6a76f2c931, MESSAGED e2eeeca923fd, MESSAGEI 94cbdf5d1543, INTMAIS 0bf4b5872c98, STAGE 1b5f4b5ce722, MARCHAND 77db63b52c23, ITAVERNE f3bed78c5fb9, MAIN 27c5834de005.
- Evidence levels: **known** = read at the given address; **suspected** = derived but not checked in the running game; **unknown** = not determined.

## N1. Language selection
- MAIN 0x0440f: key at startup `'1'`→loc 0x426f=1, `'2'`→0, `'3'`→2, `'4'`→3 (default 0 at MAIN 393). **known**
- 0x426f: 1 = EN (`textine`/`messagee`/`sose`), 2 = DE (`textind`/`messaged`/`sosd`), 3 = IT (`textini`/`messagei`/`sosi`), else FR (`textin`/`message`/`sos`). Switches at MAIN 0x00b2d, 0x02e56, 0x03654-area, 0x0470a-area. **known**. Mapping key→language label (1=English…): **suspected** (labels come from the prompt text before 0x0440f).
- All variants load with header id 0x2f (TEXTIN*) or 0x0e (MESSAGE*), so callers use `clive 0x002f` / `clive 0x000e` without regard to language. **known** (headers). That makes the case sets identical: **known** for TEXTINE top switch (0x000e1); string counts 246/246/247/245 (TEXTIN/E/D/I) and 266/266/266/264 (MESSAGE/E/D/I) → small per-language differences, **suspected** padding/extra lines.
- Flag 0x4232 (1..3 from `model mod 10`, MAIN 206–216) is a separate version switch (itaverne vs taverne), **not** the language. **suspected**

## N2. Where strings live (format/index)
- No separate text resource: every line is an inline `oimmp('…')` immediate (NUL-terminated, uppercase ASCII) inside `cstore → dirtp 0x2e[i]`, i = 0..3. Index = case label of the dispatch switch, then order inside the case. **known**
- Dispatch TEXTINE (offsets in other languages shift):
  - 0x00059: code > 124 → L_02802 (list/menu page; STAGE uses 125/126). **known**
  - 0x00069: code < 0 → L_01cb7: switch 0x01cff (−49…−16, replies merchants/tavern/training) and switch 0x02442 (−66…, short texts), plus item/description table switch 0x02888 on `0x4002[dirb 0x0e]` (1..36+). **known**
  - else switch 0x000e1 (NPC scenes): codes 1, 3/4 (shared), 5–11, 100–109, 111, 112. **known**
- MESSAGE* (type 0x0e): HUD/system messages (class/spell names, FRISE −3…−24 replies, PCAVE 17/18, GEREN). Written by `clive 0x000e`, `+0x0c = id`. **known**

## N3. Call contract
- Caller: `clive 0x002f → h; h+0x0c = code (signed byte)`; then usually `sleep` until TEXTIN wakes the caller (`wakeup loc 0xffd8` at 0x0008d). **known**
- Callers (static, all languages): INTMAIS 0x0035c `code = dirb 0x0c` (house/interior id, only if ≠ 2), 0x0071f code 3, −21/−27/−28; ITAVERNE −10, 100+t (LISTEN, t = tavern id), −20/−22 − 4·(x−2), −21, −29, −31; MARCHAND −40…−43, −21, computed `dirb13 − 10` for item names; STAGE −12−x, −17−x, −21, −35…−49, 125, 126. **known**
- Positive codes (1…11) therefore come only from INTMAIS (houses) → those are the NPC scenes. Which house id is which NPC: **suspected** from text content (see private dump).

## N4. Layout and pacing (L_01b59 / L_01c48)
- n = number of non-empty lines (max 4). Script y per line: n=1: 39; n=2: 47,31; n=3: 51,39,27; n=4: 54,44,34,24. **known**. Screen y = 199 − y: **suspected** (consistent with FRISE).
- x = 161 − len·7/2 (font 33, 7-px cells). **known**
- One `stop` (frame) per line. **known**
- Dismiss L_01c48: type 4 entity is put to sleep, then wait for no button/key → button or key → release; then clear 4 lines and `erasen`. Type 4 is woken at 0x0008d–0x000a2. **known**; that this freezes the game: **suspected**
- Multi-page scenes call L_01b59 + L_01c48 several times inside a case (e.g. code 1 = 2+ pages). **known**

## N5. Conditions and flags read/written by TEXTINE
| addr (TEXTINE) | read | meaning | evidence |
|---|---|---|---|
| 0x000a7 | code==9 and main 0x41e4==2 and dirb e4==1 → write 0x41e4=1, send msg 24/27 to type 4 | NPC 27 (party flag 0x41e4, save byte 20) joins/leaves after scene 9 | known code / suspected meaning |
| case bodies | 0x3908[c] ≠ −1, 0x377e[i][j] (relationship) | text variant depends on party member/relationship | known reads / suspected meaning |
| case | 0x3d44[c] ≥ 75 | skill/attribute gate for a variant | known / suspected |
| case | 0x1486[111], 0x1486[112], 0x1486[113+x] < 0 | world-object/quest state gates | known / suspected |
| case | 0x41e4 ∈ {2,−1}, ≠2 | NPC 27 state | known |
| 0x02888 | 0x4002[dirb 0x0e] | item type → name | known |
- Other writers of 0x41e4: FRISE 0x0197a (=2), 0x01a4a / 0x06dcd (=−1), INTMAIS 0x001c9 (=0), MAIN 0x008ba (=2 init); saved via MAIN 0x0483e. **known**

## Test cases (Alderaan = DOSBox run; Hoth = static/save checks)
DOSBox 320×200 as in the other contracts.
- **ND-1 (Alderaan) language:** start, press `1` at the language prompt → English text in a tavern LISTEN; restart with `3` → German. Pass: text language changes, layout (line count, y) the same.
- **ND-2 (Alderaan) layout:** tavern LISTEN (ITAVERNE code 100+t). Screenshot: left edge of each line = 161 − 3.5·len ±1; y as in N4; text stays until press+release.
- **ND-3 (Alderaan) house NPC scene:** enter a house with an NPC (INTMAIS, id ≠ 2). Expect code = house id; count pages = number of L_01c48 calls in that case (private dump). Pass: same page count.
- **ND-4 (Hoth/Alderaan) scene 9 flag:** save with byte 20 (0x41e4) = 2 and party condition dirb e4 = 1; trigger scene 9 → save afterwards byte 20 = 1. **suspected** trigger location (unknown house).
- **ND-5 (Hoth, static):** re-run the grep in this contract → string counts 246/246/247/245 and 266/266/266/264; top switch case set identical in all four TEXTIN*. Deterministic.

## Open
Mapping house id → NPC name; meaning of dirb e4; exact role of code 10 in the FRISE action menu (`send 0,25`); whether 125/126 menu pages are used outside STAGE.
