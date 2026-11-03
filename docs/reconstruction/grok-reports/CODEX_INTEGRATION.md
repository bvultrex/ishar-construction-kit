# Codex integration review — 2026-10-18

## Second addendum: clock, door 28 and actor 69

Merged Grok tip `c4ba9ee` without replacing Codex changes. Reports and references
remain unchanged. Hoth reports original runtime/save-reload evidence for door
28 (map 7, r6 c11) opening at hour 1 and closing at hour 4. Actor 69's recorded
position is map 3 r18 c36; its scene byte changes to 12 around hour 2 and to 0
around hour 4. The identification of the visible figure as actor 69 is strongly
supported but explicitly rated suspected by Hoth, unlike the observed pixels.

Locally inspected MAIN listing 03F95–03FDD agrees with Quesh's clock branch:
51C6 gates the block; 2AB7=0 gates only the increment of 4FCA. The threshold
check still executes when that increment is skipped. Crossing the threshold
increments 4FC6, resets ticks to zero, and wraps hour 24 with a day increment.
Save offsets 44/46/48 are reported big-endian hour/day/ticks; 4FCC is not saved.

Do not turn the measured roughly 43 seconds/hour into a fixed host timer.
Quesh's 1000 passes/hour is specific to the DOS platform profile. Moreover,
Hoth observes time crossing during the save menu and delayed GERDEP updates,
whereas Quesh describes pause through 2AB7. Actual menu-flag transitions and
scheduler ordering still need a trace before reproducing pause behavior.
Never recompute door/actor state from the loaded hour alone: saved state may
precede GERDEP's next evaluation.

The disk-menu save failure has a concrete external explanation: Hoth's second
click closed an already-open menu and subsequent inputs reached the game.
This supersedes the earlier suggestion of an hour-2 restriction. No local
replay of the private save/image evidence is claimed.

Existing `door-mechanics.ts::hourTick` implements the hour-1/hour-4 door rule,
but has no runtime caller. Report import therefore does not make time events
playable. Next verification: clock field read/write mapping, exact menu flag
transitions, then clock/GERDEP scheduling with save/reload checkpoints.

Imported the 21 report files unchanged from Grok branch tip `be14a6b`
onto `workbench/playable-slice` by fast-forward. This includes both combat
contracts and the Ishar 2 cooldown/status/target-selection addendum.
Report import is not runtime implementation or independent confirmation of
every claim. Private saves, screenshots and execution logs remain on Grok's
machine; their cited observations cannot yet be replayed locally.

## First accepted correction: stale diagnostic expectations

Hoth's two bisect diagnoses match the current source:

- Physical context preparation delegates to the shared scheduler and permits
  globals/context aliasing. The old rejection assertion now checks the fixture's
  `skip`/`0x2632` result and source preservation. Native scheduler coverage is
  documented separately in DOS_STARTUP.md and its shared-scheduler checker.
- Expression tag 10 now reads a local string. Hoth suggested tag 160 as an
  unsupported fixture; current source already supports 160 with explicit drive
  services. The unknown-tag fixture therefore uses 255 and checks atomic stop.

Both diagnostic scripts are now exposed in package.json. Verified locally:
`npm run test:dos-physical-frame`, `npm run test:native-script-diagnostic`,
and `npm run typecheck`, all exit 0. These checks do not validate combat.

## Implementation order and evidence boundaries

1. Finish original DOS module loading/decompression and compare memory effects
   with native execution. The physical A1 decoder is still an uncommitted draft.
2. Reconcile pickup, lever/door and combat contracts with the exact local
   original resource hashes and script listings before changing gameplay.
3. Test separate Ishar 1/2 contracts, including RNG call order and persistent
   versus process-local state. Do not substitute one game's formulas for the
   other or hard-code observed XP deltas from a re-rolled monster.
4. Keep unnamed status effects unnamed until supported by original text or
   runtime evidence. The reports distinguish effect behavior from guessed names.
5. Obtain private reference artifacts through the user when needed for replay;
   do not describe a cited remote run as a locally reproduced result.

The save-position warning remains a proposal: its code is not in this reports
branch and the reported restart cause is unresolved. No warning implementation
or combat implementation is claimed by this integration.
