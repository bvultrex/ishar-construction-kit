# Ishar Construction Kit — Next Steps

## P0 — harden the recovered core

- Fix the three TypeScript errors without changing binary behavior.
- Add focused tests around field read/write, `patchParty`, identity round-trip and Silmarils old-packer decode.
- Make the existing `selfTest()` part of `npm test`.
- Keep original Ishar archives permanently excluded from Git.

## P1 — restore the application shell

Create/restore:

- `src/router.tsx`
- `src/routes/__root.tsx`
- `src/routes/index.tsx`

Then build a workbench shell using dark stone, parchment, copper and sage.

Core pages:

1. **Overview** — module readiness, loaded corpora, next audit targets.
2. **Character Lab** — party slots, stats, class/race, skills, inventory, spell bytes, patch/diff preview.
3. **File Lab** — ZIP/folder inventory, classification, magic, entropy, strings, Silmarils header/unpack status.
4. **Knowledge** — known/suspected/unknown ledger and next tests.
5. **Project** — Construction Kit project metadata and module roadmap.

## P2 — complete brand identity

- Keep recovered `public/favicon.svg` unless 16px QA finds a problem.
- Create `src/lib/og/site.json` for title `Ishar Construction Kit`, non-game website identity, custom card and dark-stone theme.
- Create a 1200×630 `public/og.jpg` with original workbench imagery.
- Do not add an X game banner.

## P3 — real corpus validation

Use local copies only.

### Ishar 2 first

- load several 8,359-byte saves
- compare known in-game values to decoded values
- run identity patch and assert zero byte differences
- alter one controlled stat in a copy and verify in-game
- resolve endianness conclusively

### Ishar 1 second

- repeat with 5,216-byte saves
- verify public DEBUG offsets
- compare Ishar 2 `IMP2.SAV` against Ishar 1 layout to study the import bridge

## P4 — deepen the format model

After character maps are hardened:

- item IDs/templates
- learned-spell semantics
- multilingual text resources
- `.FIC` structures across both games
- quest/persistence flags from controlled saves

## P5 — construction-kit authoring

Only after codecs are verified:

- character/race/class definitions
- item/spell authoring
- map/event editor
- NPC/quest/dialogue editors
- validation/dependency graph
- export/build pipeline

Grow from verified schemas outward, not from speculative UI inward.
