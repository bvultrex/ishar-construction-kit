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

## 2026-09-26 checkpoint and path to 1.0

- Done: six real 8,359-byte Ishar 2 saves pass byte-identical codec identity roundtrips; synthetic slot-0 HP +1 changes only offset 997. Details and hashes in `AUDIT.md`.
- Next RE control: game-produced before/after pair with displayed values, ideally a 16-bit value crossing a byte boundary; test gold separately. Synthetic editor patches establish write isolation, not field semantics.
- Define the original project schema and target runtime/export with one complete acceptance example: location, encounter, item, quest and ending.
- Build persistent authoring and reference validation for that vertical slice: party, map, events, items, encounters, quest and dialogue.
- Prove an exported project can be reopened, run and completed end to end. Continue evidence-gated original-game import research in parallel rather than waiting for every proprietary format.

- Triage legacy Ishar 1 research against original bytes: `CONT*.FIC` 54×90 addressing, `EN1.FIC` template tables and ALIS A1 repack behavior. Track evidence separately from Ishar 2 save offsets.
- At the 1.0 design checkpoint choose and document the executable target and legal asset workflow, informed by the existing Ishar 1 Workbench compatibility research. Keep a complete authored RPG as the acceptance criterion.


## Playable slice checkpoint

- Added original project schema: character, item, location, encounter, quest and start/ending references.
- Added browser persistence plus project import/export and reset.
- Added reference validation before playtest.
- Added Adventure Builder for the starter vertical slice.
- Added browser Playtest with movement, combat, quest completion, inventory pickup, defeat/reset and ending.
- Draft PR #1 is the integration gate; CI runs typecheck + production build.

Next after the first green playable build: harden project migrations, add/delete entity workflows, improve map editing, then expand runtime systems without coupling them to unverified proprietary formats.


## Crawler-first follow-up

User test of the first runnable slice passed functionally but exposed the wrong presentation model: it felt like a text adventure. The next test checkpoint therefore requires a visual first-person dungeon loop, not further text-flow polish.

- Done: X/Y dungeon grid + start facing in authored schema.
- Done: grid topology validation and live Builder map.
- Done: perspective viewport with turn/step navigation and keyboard controls.
- Done: encounters in viewport and five-slot party HUD scaffold.
- Next: user test of the crawler build, then doors/interactions, party expansion, richer combat and stronger original visual identity.


## Asset pipeline follow-up

- Done: generic external asset-pack manifest and local ZIP/folder import.
- Done: depth-aware wall/opening render roles, target-specific encounter/item layers and per-location tilesets.
- Done: authored doors with optional key items plus door image roles.
- Done: synthetic in-browser demo pack for zero-corpus smoke testing.
- Done: conservative File Lab → Asset Lab Ishar source-candidate queue.
- Next: verify actual graphics-bearing containers from the local Ishar corpus, beginning with old-packer candidates where decode already exists.
- Next: add palette/bitmap signature inspection to unpacked resource previews before writing any automatic extractor.
- Then: map verified extracted graphics into `ishar-ck-asset-pack` roles and record provenance/hash metadata locally without committing original bytes.
