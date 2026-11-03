# Data-flow matrix: Ishar 2 (DOS), NPC / monster / item

- **Base commit:** `bb42748` (handoff); code `319819c`.
- **Profile:** Ishar 2 DOS, `start.exe` SHA-256 `5e35e58d2d133dadeed4b233b7f962f9c941c3d635feb9d3a067a63c340dadf9`.
- **Script hashes (SHA-256 of the original packed files):**
  - IO.IO `0df1f34cf2519341ef20825d49c7f1e7ff204878814db744f7e5cb58ce6b5918`
  - MAIN.IO `bfab5e9175931dbb1c2c51f0576092ef423e0bf950579340c8a1715e8cf8db95`
  - EAFF.IO `6ab9102e2566617a9e7511ae1503f3302db1e81ea006081f3bb76d08835957ab`
  - EATT.IO `d5ef72a5b25eabb50e89a9142ef8acf176f9023c82e694bfe8a06290ba7b14ec`
  - FRISE.IO `27117c124caf904a31568f5c58f615946083dd3429c02ade1dc1e17552cc2b64`
  - OBJET.IO `51ec1fdf24bea52fd07cfc5bf01fa46c6ae7b75bbccb93433d6d0c66b0d99e08`
  - AFFOBJ.IO `40b882fbadff3ea452c76a2af3fdbba9d2b3e4c62d0f19dd838c41f0d5ebdf1e`
  - SOURIS.IO `78df7c73f880466303867b63dd5e20897777802b0595c64935b9f4462354f9d3`
  - MARCHAND.IO `a5b84f95b8b50f1c68fc8e6c368a67742f9f96a67ca033d6e72ee4d7c4673529`
  - GERDEP.IO `58d2c57ff3eb8318ac73512d5a89292477fbcc892a4ceb6d75bf7de58b88da4b`
  - MESSAGE.IO `d180a5d858c7d188bc1ccf4546c3561bfed1779b8389ad10e7c74599a73e2742`
- **Addresses:** image offsets in the unpacked module; MAIN = ALIS main VRAM.
- **Not run here:** kit tests (node 20 on this box; the repo expects Node 24 TS stripping, and `*-local` needs ISHAR2_DIR/listings).

## Matrix (original paths)
| # | Stage | Original routine / address | Evidence | Kit function / test | Open gap |
|---|---|---|---|---|---|
| 1 | Persistence: load/save | IO.IO writer 0x0a9d–0x0deb, reader 0x0df4–0x1142, 141 fields, 8359 B | proven | `ishar2-save-layout.ts`, `test:ishar2-save-layout(-local)`, `save:main` | Round-trip of a modified save in the original game is not shown (Hoth) |
| 2 | Actor records in SAV | per-id 110-entry tables 0x3412… (row/col 0x3412/0x34f0, HP 0x36ac, gold 0x378a/0x3868), byte tables 0x3cbe…0x41fc | proven (layout) | `save-actors.ts`, `test:save-actors` | Meaning of most byte tables. Stat roles: see my `decompile/engine/rules.md` (level 0x3d9e, STR 0x3e0e, CON 0x3e7e, AGI 0x41fc, armour 0x418c) |
| 3 | Spawn | EAFF 0x61d–0x986 (clive intent), dispatch to 47 module ids, cleanup 0x3a–0x60, placement 0x99a–0x9e8 | proven (bounded) | `original-eaff-spawn.ts`, `-placement.ts`, `-cleanup.ts`, `original-actor-dispatch.ts`; tests `test:original-eaff-*` | Real scheduler/clive allocation (Codex VM). Product limited to CONT1 |
| 4 | Visibility / projection | EAFF 0x60–0x2da geometry, 0xba5 facing, 0x37c–0x4c7 perspective, terrain 0x302 | proven (static) | `original-eaff-view.ts`, `-perspective.ts`, `-terrain.ts` | Map occlusion; maps ≠ CONT1; native draw order (my render-runtime.md) |
| 5 | Actor animation frame | per-monster module scripts (e.g. MARIN, GEANT) | proven for 2 modules (audit) | `original-actor-frame.ts`, `audit:original-actor-modules`, `test:original-actor-frame` | 4 modules hit unsupported ops (LEZARD state, DJFONT cscreen, DRUIDE4 cputnat, TROUBA3 csound) |
| 6 | Click → entity | SOURIS 0x781–0x7ac (if MAIN 0x49d3==1), FRISE 0x1fa5–0x2035 target selection, linked entity hit order | proven (static) | `original-target-selection.ts`, `original-entity-hit.ts`, `test:original-target-selection(-local)` | Real hit rectangles from the renderer; not wired in the playtest |
| 7 | NPC interaction signal | EATT 0x61–0x167 gates, caller 0x188–0x206, signal 0x339–0x552 → starts module 0x12 (MESSAGE*) param 0x0D | proven (static) | `original-actor-ai.ts`, `original-actor-signal.ts`, `test:original-actor-signal(-local)` | Trace only; MESSAGE text routing; not wired; language selection |
| 8 | Gold choose + give to NPC | FRISE 0x044cd–0x046a4 selection, 0x046ac–0x04756 transfer, 0x06865–0x0693d arithmetic; ack MAIN 0x442a+slot | proven (static) | `original-gold-selection.ts`, `original-npc-gold.ts`, tests `test:original-npc-gold(-local)`, `test:original-gold-selection(-local)` | Gold window UI and split; original-game confirmation |
| 9 | Shop purchase | MARCHAND 0x004b8–0x005c0, 0x00603, 0x00693, 0x00775; shop entry MAIN 0x02e14/0x03169/0x0326a | proven (static) | `original-commerce.ts`, `original-merchants.ts`, `original-shop-entry.ts`, `test:original-shop` | Selling path, stock UI; original-game confirmation |
| 10 | Ground items | SAV 200 records (row 336, col 536, scene 736, facing 8039); AFFOBJ scans ids 0..110; OBJET 0x003ad/0x003db; SOURIS 0x004a6–0x004ba clears fields | proven for object ids 9/10, map 1 | `save-world-items.ts`, `original-ground-runtime.ts`, `test:save-world-items`, `test:original-ground` | Other object codes (quest/stack branches), occlusion on other maps, drop path |
| 11 | Inventory layout | MAIN 0x2d8e = 5 chars × 15 words (stride 30 B; cdim at MAIN 0x0009b); slots 9/10 = hands; stacks 0x... file 7629 (5×20) | **proven** (cdim + CH1V→CH1N→CH2N diff: item −109 +48→+20, −25 +50→+18) | `original-commerce.ts` (`ORIGINAL_COMMERCE_OFFSETS.inventory=1036`), `test:inventory` | Hand→hand transfer routine (FRISE) not ported |
| 12 | Armour from equipment | MAIN 0x2f0e (5 bytes, file 1336) | **proven** (CH2N: slot0 0→4, slot1 16→12 when item −25 changed hands) | none | Locate the recompute routine (FRISE, after hand drop) |
| 13 | Player melee | FRISE 0x05600–0x0575d: hit = 50+2·Lvl+3·(AGI·S2ef6/80−AGI_t)−d/2+skill/5; dmg = (STR+2−CON_t)/2−ARM_t+rnd(T4a08[item+116])+1 (bare hands: no weapon roll); `T36ac[t] −= dmg` | proven (static; operand order per opile) | **none** | Kit port + test; d term (entity+2/15) meaning; spells |
| 14 | Monster attack on party | EATT 0x0a3d–0x0bfb (negative branch from 0x00553): hit = 9·L+3·fc−l101, dmax = l104+2−CON/2−armour, HP 0x2d5c −= rnd(dmax)+1 | proven (static) | **none** (`original-actor-signal.ts` explicitly excludes 0x553) | Port; damage/animation handshake |
| 15 | Death signal + XP | FRISE 0x0575d–0x05870: `T36ac≤0` → ckill entity, csend 40, clear 0x449a/0x36ac; killer XP += L_t/3+1 (0x05846), others +L_t/5+1 (0x0585d); id 57 special send −100 | proven (static) | **none** | Port; death of party members (EATT 0x0bfb → ?) open |
| 16 | Level-up | FRISE 0x060e0–0x06190 (level = argmin \|3·XP/10−n²\|), 0x06668 HP gain, spells 0x4d20 → 0x2f18 | proven (static); trigger = actual XP gain only, loading XP 620 keeps level 13 (Hoth runtime 2026-10-18) | **none** | Port |
| 17 | Persistence of results | all of the above live in fields of row 1 (0x2d50, 0x2d68/80, 0x2d8e, 0x36ac, ground records) | proven | `save:main` patch/inspect | Nothing loaded back in the original yet |

## Browser-side kit inventions (NOT original paths)
| Kit file | What it is | Status |
|---|---|---|
| `trading.ts`, `scripts/check-npc-trading.mjs` | generic "pure transaction" with stock/bag-full rules | invention; the original path is row 9 (`original-commerce.ts`) |
| `inventory.ts`, `item-instances.ts`, `test:items-scenes` | authored-project item lists and stable instance ids | invention (editor model) |
| `authored-item-view.ts`, `test:item-view` | authored placements, replaces the starter's invented rune | invention, deliberately separated |
| `save-codec.ts` character "present" heuristic | `level>0 \|\| hp>0` etc. | hypothesis, not from IO.IO |
| any NPC click/dialog in the authored playtest | | invention; the original rows 6–8 are not wired |

## Contradicted
- My earlier `rules.md` called 0x2d68/0x2d80 "MP". **Contradicted:** they are gold thousands/remainder (FRISE 0x046ac, MARCHAND 0x00603; Bragl 132/345 = displayed 132345). The per-id 0x378a/0x3868 are actor gold, not MP.

## Smallest real end-to-end flow
**Ground item pickup, map 1, object 9 or 10** (rows 10 → 11 → 17):
1. SAV ground record → `readSaveWorldItems` (proven offsets)
2. AFFOBJ projection → `originalGroundSprites` (map 1 skips occlusion; resources 115+d / 90+d)
3. click → SOURIS 0x004a6–0x004ba clears the record → `pickOriginalGround`
4. OBJET receive into the first free backpack slot 0..8 of the carrier → `receiveOriginalGround`
5. `save:main`/save copy → reload.

Original routines still missing for this to be "original" rather than "reconstructed pieces":
- **(a)** SOURIS hit rectangle / mouse-to-object mapping, which needs the native draw position.
- **(b)** The OBJET hand/cursor state between pick and drop. The original likely holds the item on the cursor (MAIN cursor state) before the slot drop; the kit drops straight into a slot. **hypothesis, needs check**
- **(c)** FRISE inventory panel drop routine and the armour recompute (row 12) when the slot is a hand.
- **(d)** Native AFFOBJ/OBJET execution through Codex's VM instead of the TS reimplementation.
- **(e)** Reference capture in the original (Alderaan): save hash, position, pick, save, diff. Expected diff: 3 ground bytes zeroed + one 0x2d8e word.

Next-smallest: NPC gold give (rows 6–8, 17). It is ported except for the gold-window UI and the MESSAGE reply, but it depends on an NPC standing in reach.

## Limits / next step
- Static only; nothing executed in the original or the browser by me. Kit tests not run here (Node 20).
- **Next implementation step (proposal, not done):** wire rows 10→11 in the playtest behind the original-only flag. Then port row 12's recompute and rows 13/15 (FRISE melee + kill/XP) as trace-only functions in the same style as `original-npc-gold.ts`, with golden vectors from the listing.


Note 2026-10-18 (Hoth): save offsets confirmed; gold per character; no level-up on load. Stat names: see tableau-editor.md.
