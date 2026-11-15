# Quesh: NPC/actor/item data flow (READ-ONLY analysis), 2026-10-18

- **Base commit:** clone `/workspace/ishar/clones/quesh` from `https://github.com/bvultrex/ishar-construction-kit`, branch `workbench/playable-slice`, HEAD `bb42748` (handoff). The reviewed code state is `319819c83d8dfe30675bba3ad8a51b43c3afc871`, and both commits are present. Nothing changed, committed or pushed.
- **Profiles:** local DOS originals in `/workspace/ishar/originals` (read only).
  - Ishar 1 `start.exe` `3ea63234…988b`, MAIN.IO `27c5834d…06c5`.
  - Ishar 2 `start.exe` `5e35e58d…adf9`, MAIN.IO `bfab5e91…db95`.
  - Hashes for each script are in the matrices.
- **Question:** data flow, per game, from original resource/address → spawn/placement → visibility → interaction → inventory/gold → combat/death → persistence. For each step: evidence, existing kit function or test, and the gap. Then the smallest real end-to-end flow.
- **Files:** `dataflow-ishar2.md`, `dataflow-ishar1.md`. `private/` holds the derived save layouts (contain original addresses and offsets only, no asset bytes); keep it out of git.
- **Evidence words:** **proven** = static, from the original script/IO code with address, or from an original-game save diff. **hypothesis** = plausible, not tied down. **open** = not located. **contradicted** = an earlier claim is wrong.
  - "Proven" here is level 1 (static analysis) or level 5 save diffs (Hoth's charsaves, original EXE) in the handoff's 5-level scale. It never means the browser runs it.

## Commands
```
git clone -b workbench/playable-slice https://github.com/bvultrex/ishar-construction-kit /workspace/ishar/clones/quesh
git -C /workspace/ishar/clones/quesh cat-file -t bb42748; git -C … cat-file -t 319819c
sha256sum originals/ishar{1,2}/Ishar{1,2}/{start.exe,*.IO}
npx tsx (deriveIshar1SaveLayout on Ishar-1 MAIN.IO)      # → private/ishar1-save-layout-derived.txt
grep in local ALIS listings (decompile/alis/listings/ishar{1,2}/*.asm) for csub/cadd/cstore on main tables
python3 byte-diff decompile/charsaves/CH1V→CH1N→CH2N.SAV
```
No kit tests were run: most `*-local` tests need Windows env vars. That is open for Hoth.

## Headline
- **Ishar 2:**
  - These stages each have **proven original paths, mostly with kit functions**: save layout, actor records, EAFF spawn/placement/view, EATT gate+signal, gold selection/transfer, merchant purchase, ground pickup (objects 9/10, map 1), inventory layout.
  - **Combat resolution, death and XP/level-up are proven statically (FRISE/EATT) but have no kit function at all.**
  - Nothing is chained end to end, and none of it has been checked by loading the result in the original game.
- **Ishar 1:** only the save layout (107 fields, 5216 B) has a kit function. HP/maxHP/gold/XP/monster-HP addresses and the kill-XP rule are now located statically (below). Spawn, visibility, interaction and inventory are **open** for Ishar 1. The EAFF/EATT modules are Ishar-2-only, and Ishar 1 uses FRISE plus per-monster scripts.
- **Smallest real end-to-end flow:** Ishar 2 ground item pickup on map 1 (object 9 or 10): SAV → AFFOBJ projection → SOURIS selection → OBJET receive → inventory slot 0x2d8e → SAV.
  - Kit pieces exist: `save-world-items.ts`, `original-ground-runtime.ts`, `original-commerce.ts` (carrier read), `ishar2-save-layout.ts` / `save:main`.
  - Missing: see dataflow-ishar2.md §Smallest flow.

## Notes for Hoth (XP / gold without walking)
Ishar 2 save file offsets (IO.IO block loads, 5 slots × BE16; proven by IO.IO, Hoth's display values and CH-diffs):
| field | MAIN | file offset | notes |
|---|---|---|---|
| XP | 0x2d50 | 986 (+2·slot) | HUD shows XP·100 (539 → "53900", 615 → "61500"); script caps at 10000 |
| gold thousands | 0x2d68 | 1006 (+2·slot) | Bragl 132 / 345 = displayed 132345 |
| gold remainder | 0x2d80 | 1026 (+2·slot) | |
| level | 0x2eb6 | 1291 (+slot, byte) | recomputed by FRISE 0x60e0 from XP whenever XP changes |
| HP / max HP | 0x2d5c / 0x2d74 | 996 / 1016 | |
| armour | 0x2f0e | 1336 (+slot, byte) | CH1N→CH2N: slot0 0→4, slot1 16→12 when item −25 moved = armour recomputed from equipment (proven) |
- **Patch route without scripts:** the kit CLI `npm run save:main -- patch IO.IO X.SAV writes.json out.SAV` with addresses 0x2d50/0x2d68/0x2d80 (Toolkit format). Then load in the original. Expected effects (static prediction, not yet checked):
  - Raising XP past the next n² boundary (level ≈ round(sqrt(0.3·XP))) should trigger the level-up routine on the next FRISE check (+HP, new spells).
  - The gold display should follow 0x2d68·1000+0x2d80.
- **Script writers, for an in-game test without walking:**
  - XP on kill: FRISE 0x05846 (killer +lvl/3+1) and 0x0585d (others +lvl/5+1).
  - XP reset on new character: 0x05fd5. Cap: 0x06106.
  - Gold: FRISE 0x046ac–0x04756 (give gold to NPC; selection 0x044cd–0x046a4) and MARCHAND 0x004b8–0x005c0 (purchase).
  - Giving gold to an NPC in front of the party is the only gold change reachable without walking, if one stands at the start position.
- **Ishar 1** (hypothesis on field names, offsets proven from MAIN.IO 0x4816/0x4a43):
  - 0x1536 XP? (file 458)
  - 0x1542 HP (468)
  - 0x154e gold (478)
  - 0x155a max HP (488)
  - Monster HP 0x1b22 (1728)
  - Monster XP value 0x1f06 (2708)
