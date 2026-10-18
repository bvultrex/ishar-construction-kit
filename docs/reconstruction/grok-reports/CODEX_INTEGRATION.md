# Codex integration review — 2026-10-18

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
