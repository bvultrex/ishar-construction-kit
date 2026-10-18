# HOTH acceptance 18.10.2026: STEP_RESET_DOORS in the original (door 5 and door 6 after steps)

Author: Hoth (Grok Bot, executor). Time: 21:12–21:34 CEST. Private evidence: `codex-support/hoth/private/stepreset/` (session.sh, snap.sh, session1-3.out, session.log, snaps/, screenshots 01–81, mont1.png, mont2.png, sha-vorher/nachher.txt, audit-output.txt).
Offsets count from 0, `cmp -l` from 1 (cmp = from-0 + 1).

## 0. Setup and rules
- Work copy `private/stepreset/work-20261018-2115`, a copy (`cp -a`) of `private/hebel/work-20261018-1740`. It contains the CONT5 mod bytes from the lever setup (cmp 124 = 67, 5525 = 33, i.e. r2 c3/c4, far from both test sites; sha 56e0771f…). During all 66 snapshots, the sha and mtime of every CONT*.FIC stayed constant. CONT1–4/6/7 are identical to the originals. **The game did not write CONT.**
- New slots only:
  - HOTSR0 = copy of HOTHBB (map 5, r40 c31, facing 3, zone 33, 7386 = 0).
  - HOTSL0 = copy of HOTHBA (K5F005 patch r23 c19 facing 3, 7387 = 7437 = 1).
  - New saves: HOTSR1–3 and HOTSL1–4. Nothing was overwritten.
- `savenew.sh` with the close click (266,12) after each save. All 7 saves went through on the first try.
- DOSBox-X `cycles=fixed 25000` on Xvfb :97. Three sessions; each instance is ended at the end of its session (`pkill` on its own conf). The foreign `dosbox-x -conf probe.conf` instances (PIDs 215214 and 229203, not mine) were not touched.
- One input path only (auto_shots_hoth: clicks/keys via xdotool).
- Steps: forward (287,24), back (287,50), turn left (266,30), turn right (308,30). Turn left = facing −1 (3→2), confirmed by the HOTSL3 position.
- sha256 of the originals and of all saves under dosbox/ishar2* (1418 files): before = after (`sha-vorher.txt` = `sha-nachher.txt`).

## 1. Door 5 (frame, map 5 r40 c31): kit is right, the door closes after the first step
Session 1:
1. GRIMZEL, then load HOTSR0. Frame visible (`03`).
2. Click (128,70): the passage opens (`04`, 3 996 px).
3. **HOTSR1**.
4. B, F, then **HOTSR2**.
5. F (into the door), B×4, TL×2 (door out of sight), TR×2, F×3, then **HOTSR3**.

| Save | Position (r/c/facing) | 7386 = 0x4aa4[5] | cmp against previous save |
|---|---|---|---|
| HOTSR0 | 40/31/3 | 0 | – |
| HOTSR1 (after opening) | 40/31/3 | **1** | 49, 50 (game time), **7387 0→1** |
| HOTSR2 (after 1 step back + 1 forward) | 40/31/3 | **0** | 46 (hour 6→7), 50, **7387 1→0** |
| HOTSR3 (after several steps with return) | 40/30/3 | **0** | 6 (col 31→30), 46, 49, 50, 92, 94 |

- Screenshots: after the click (`04`) the opening is there. After stepping back (`06`) you see the corridor. After returning (`07`) there is a wall again where the frame was; door 5 is closed.
- `09` F: blocked, the image is unchanged (344 px). The party cannot pass through the door, because it has already closed again.
- That is why HOTSR3 ends at c30: F blocked, B×4 to c27, F×3 to c30.
- Reload in a fresh session (session 3, GRIMZEL in between each time):
  - HOTSR1: GRIMZEL→HOTSR1 42 811 px. Against the image before saving (`05`, open): 375 px; against `08` (closed): 4 147 px. **Open.**
  - HOTSR2: GRIMZEL→HOTSR2 22 928 px. Against `08`: 375 px; against `05`: 4 147 px. **Closed.**
  - HOTSR3: 21 451 px. Against `21`: 376 px.
- Note: loading is not a step. HOTSR1, and HOTHC0/C1 from HEBEL_TUER_2, stay open after loading.

**Verdict point 1: known. Door 5 closes on the first successful step, in the original just as in the kit.** Quesh's "stays open" (suspected) is refuted. This is consistent with my earlier results "frame only opens" (no click closes it) and "7386 = 1 in HOTHB1/HOTHC1" (no step in between).

## 2. Door 6 (lever 6): stays closed across all steps
Session 2:
1. GRIMZEL, then load HOTSL0.
2. Click (152,58): lever down (`34`). **HOTSL1**.
3. B, F, then **HOTSL2**.
4. Route B B TL F TL F F TR F F F TR, ending at r27 c15 facing 3 with door 6 (r27 c17) in view (`50`/`51`: closed portcullis in the arch). **HOTSL3**.
5. Back TR F F F TL F F TR F TL F F. **HOTSL4**.

| Save | Position | 7387 = 0x4aa4[6] | 7437 = 0x4ad8[6] | cmp (door-relevant) |
|---|---|---|---|---|
| HOTSL0 | 23/19/3 | 1 | 1 | – |
| HOTSL1 (lever) | 23/19/3 | **0** | **0** | 7388 1→0, 7438 1→0 (cmp) + zone world noise, see below |
| HOTSL2 (1 step back + forward) | 23/19/3 | 0 | 0 | only 46, 50 |
| HOTSL3 (r27 c15, door 6 in view) | 27/15/3 | 0 | 0 | 4, 6 (position), 46, 49, 50, 92, 94 |
| HOTSL4 (back at the start) | 23/19/3 | 0 | 0 | 4, 6, 46, 49, 50 |

- Reload: HOTSL3 21 451/22 001 px from GRIMZEL, 377 px against `51` (door closed). HOTSL4 23 645 px, 377 px against `64`.
- World noise HOTSL0→HOTSL1: actor tables (2783…, 3003…, 3443…), 5002…, 6652…, 6872…, 7227…7354. HOTSL0 is a position patch (HOTHBA), and on the first load the game fills zone 31 with its actors. This is not door-relevant; no door or switch byte other than 6 changed.

**Verdict point 2: known. Door 6 and lever 6 keep their state (0/0) over 22 steps/turns, also with the door in view. Kit (door 6 not in STEP_RESET_DOORS) = original.**

## 3. Kit code against the original
- Kit `src/lib/ishar/door-mechanics.ts` (clone 319819c):
  - `STEP_RESET_DOORS = [5, 9, 17]`.
  - `afterStep(grid, r, c, state)` sets doors 5, 9 and 17 to 0 on **every call, on all maps**. The dungeon check (maps ≥5) only comes after that, for plates and door 48.
  - Callers: `src/routes/playtest.tsx:1062` (`afterStep` after a move onto a grid cell) and `:1063` (without a grid: filters STEP_RESET_DOORS out of `openDoors`). `:1084` suppresses the messages for these doors.
  - Test `scripts/check-grid-world.mjs:176`.
- Original GERDEP (own reading of `decompile/alis/listings/ishar2/GERDEP.IO.asm`):
  - L_013af is called in 12 movement paths (e.g. 0x00682, 0x006cc …), only if the move succeeded (`odirb(0x16) == 1`, after the position change at 0x00676).
  - L_013af first wakes the entities with `ohimb(…,0x0c) == 33` (0x013b2–0x013d3).
  - Then it sets **0x4b80[0], [1], [2] = 0** (contact list, 0x013d5–0x013e9).
  - Then **0x4aa4[5], [9], [17] = 0** (0x013f3–0x01407).
  - Then `cjsr L_0162a` (zone/scene type).

| Door | Original | Kit | Verdict |
|---|---|---|---|
| 5 | closes on the first successful step (HOTSR2; bytecode 0x013f3) | closes in afterStep | **known: kit = original** |
| 6 | stays (HOTSL1–4) | not in the list, stays | **known: kit = original** |
| 9 | bytecode: closes on every step | closes | **suspected: kit = bytecode**, not tested in the original |
| 17 | bytecode: closes on every step | closes | **suspected: kit = bytecode**, not tested in the original |
| Turn / blocked step | no L_013af (only in the success branch) | playtest only calls afterStep on a move | suspected: matches. In HOTSR3 the blocked forward step had no further effect |
| Other maps | GERDEP paths are not tied to a map | afterStep resets on all maps | suspected: matches |
| Contact list 0x4b80[0..2] = 0, wake-up of entities with field 0x0c = 33 | part of L_013af | **missing** in afterStep | suspected: gap in the kit, not door-relevant |

**Verdict point 3: there is no door bug in the kit. STEP_RESET_DOORS is right.** Fix proposal only as a diff, for the missing contact-list reset (suspected, not checked in the original; Codex decides). Kit files were not changed:
```diff
--- a/src/lib/ishar/door-mechanics.ts
+++ b/src/lib/ishar/door-mechanics.ts
@@ export type MechState = {
   /** main 0x4ad8, switch flags 0..49 (save offset 7431). */
   switches: number[];
+  /** main 0x4b80[0..2], contact list (save 7576..7578); GERDEP L_013af clears it on every step. */
+  contacts?: number[];
@@ export function afterStep(grid: IsharGrid, r: number, c: number, state: MechState) {
   const s = clone(state), ev: MechEvent[] = [];
+  // GERDEP L_013af 0x013d5..0x013e9 (suspected): contact list reset before the door reset.
+  if (s.contacts) s.contacts = s.contacts.map((v, i) => (i < 3 ? 0 : v));
   for (const d of STEP_RESET_DOORS) setDoor(s, ev, d, false, "GERDEP L_013af");
```
(`clone` would also need to copy `contacts`. Waking entities with field 0x0c = 33 is not modelled in this module.)

Fixture vectors on branch `grok/hoth-contract-fixtures`, new commit **f040ebf** (not pushed; the clone is back on detached 319819c):
- M45: door 5 1→0 after a step (known).
- M46: door 6 / lever 6 stay at 0 over 6 steps (known).
- M47: loading is not a step (known).
- M48: L_013af also clears doors 9/17 and 0x4b80[0..2], door 6 stays (suspected).
- M49: turning / a blocked step does not reset (suspected).

Checker: 109 vectors, exit 0 (mechanics 27 known / 22 suspected, all green). Kit probe: M45 and M46 fit `afterStep`. M48 does not fit, only because the contact list is missing (kit diff only 7390/7398). Audit: no original bytes, 0 hits. The same files are in `codex-support/hoth/fixtures/`.

## Open points
- Doors 9 and 17 were not checked in the original (bytecode only).
- The meaning of the contact list 0x4b80 and the wake-up of type-33 entities are open.
- The zone world noise when first loading position patches (HOTSL0→HOTSL1) is known as a phenomenon, but the actors involved are not identified.
