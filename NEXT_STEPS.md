# Ishar Construction Kit — Next Steps

## Recovery checkpoint completed

- recovered Ishar core into GitHub
- restored standalone TanStack/Vite shell
- restored five core workbench routes
- fixed recovered TypeScript errors
- Character Lab loads local saves and exports surgical patches
- File Lab inventories local ZIPs/files
- `npm run typecheck` passes
- `npm run build` passes
- original Ishar corpora remain excluded from Git

## P0 — real-save validation

### Ishar 2 first

- inspect several 8,359-byte saves
- match known in-game values to candidate offsets
- conclusively resolve endian
- run identity patch and require zero unintended differences
- perform one-value controlled edits in copies
- record fixture hash, action, offsets and interpretation in the audit

### Ishar 1 second

- verify 5,216-byte save layout
- verify the public DEBUG offsets
- compare Ishar 2 `IMP2.SAV` against Ishar 1 saves to study the import bridge

## P1 — deepen Character Lab

- inventory slot editor/view
- raw spell-byte inspector
- before/after byte diff panel
- warnings for unverified fields
- export validation summary
- optional project overlays for names and future metadata

## P2 — deepen File Lab

- hex/string inspector
- Silmarils packed-header detail
- old-packer unpack preview
- side-by-side file comparison
- classification filters and unknown-file queue

## P3 — format research

After character maps are hardened:

- item ID/template table
- learned-spell semantics
- multilingual `TEXTIN*.IO` / `MESSAGE*.IO`
- `.FIC` structures across Ishar 1 and 2
- quest/persistence flags from controlled before/after saves

## P4 — construction-kit authoring

Only build authoring systems after their schemas are verified:

- races/classes/characters
- items/spells
- map/event editor
- NPC/enemy editor
- quests/dialogue
- dependency validation
- build/export pipeline

Grow from verified schemas outward, not from speculative UI inward.
