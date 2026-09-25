# Ishar Construction Kit — Recovery Handoff

Date: 2026-09-25  
Recovered from: `GROK files.zip`

## What this project is

Ishar Construction Kit is intended to become a full authoring workbench for making new RPGs in the design space of Ishar 1 and Ishar 2. It should combine useful mechanics from both titles rather than merely edit a savegame.

Core principle: **audit first, edit second**. Never silently turn a hypothesis into a file-format fact.

## Recovery facts

GitHub initially contained only an initial README commit. The actual Grok implementation survived in the user's exported workspace ZIPs.

Recovered:

- React/TanStack/Vite/Grok App Builder scaffold fragments
- Zustand app store
- Ishar reverse-engineering/domain library
- Silmarils packer detection/unpack groundwork
- Ishar 1 and Ishar 2 candidate save maps
- save patch/readback/diff architecture
- knowledge/evidence ledger and 12-phase RE plan
- favicon brand asset
- local Ishar 1 / Ishar 2 corpora

Not recovered: completed route shell or core UI pages.

## Important implementation decisions

### Save editing is surgical

`patchParty()` starts from a copy of the original bytes and writes only mapped fields. Unknown bytes must survive unchanged. `losslessIdentityTest()` exists to verify byte-identical decode/rewrite behavior.

Do not replace this with serialization from a newly created save object until the complete format is understood.

### Names are overlays for now

Character-name offsets are not verified. Names therefore live in `project.nameOverlays` and are not written to `.SAV` yet.

### Endianness stays explicit

The Ishar 2 map defaults to big-endian based on public RE notes, but the app retains an endian toggle. Do not remove it before corpus validation.

### Evidence vocabulary matters

Evidence uses `known | suspected | unknown`. Field/file confidence separately uses `confirmed | probable | possible | unknown`. Keep those concepts separate.

### Original game data stays local

`Ishar1.zip` and `Ishar2.zip` include original game data/manuals. They are local fixtures only and must never enter the public repository.

## Read first

1. `PROJECT_STATE.md`
2. `AUDIT.md`
3. `src/lib/ishar/types.ts`
4. `src/lib/ishar/knowledge.ts`
5. `src/lib/ishar/save-maps.ts`
6. `src/lib/ishar/save-codec.ts`
7. `src/lib/store.ts`
8. `NEXT_STEPS.md`

## Reverse-engineering status

The code recognizes Silmarils packer IDs `0x81`, `0x80`, and `0xA1`; old packer decoding exists, while new-packer decode is not claimed complete.

The Ishar 2 candidate map includes XP, HP, max HP, gold, inventory, class, race, level, attributes, skills, spell bytes and perception. Ishar 1 has a smaller candidate map derived from public DEBUG/cheat information. Most of this still needs controlled real-save verification.

A prior note cites a 60-byte `Cont1.fic` map claim. The supplied DOS corpora contain much larger `CONT*.FIC` files, so that statement must be treated as version/platform/context-specific until reconciled.

## Current technical debt

The recovered source has three TypeScript errors documented in `PROJECT_STATE.md` and `AUDIT.md`.

Front-end entry files/routes are absent from the export, so a full application build is not expected to pass yet.

## Brand direction

App: **Ishar Construction Kit**

Palette:

- dark stone `#12100e`
- parchment `#e8dcc4`
- copper `#b08a62`
- sage `#6f7f5e`
- ink `#1a1510`

Direction: late-80s / early-90s fantasy-computer-RPG construction workbench, dark stone, parchment and copper inlay, with no copied Ishar character art or original logos.

## Continuation order

1. Type hardening.
2. App shell/router.
3. Workbench navigation and project overview.
4. Character Lab using existing save/store code.
5. File Lab using inventory/classification code.
6. Knowledge/Audit page exposing evidence.
7. Real-save corpus verification.
8. Item/magic/world codecs only after verified diffs.

## Next stable checkpoint

Stable means:

- typecheck passes
- app boots with a real route shell
- demo save loads
- Character Lab reads/edits demo data
- identity round-trip changes zero unintended bytes
- local real-save fixtures can be selected without shipping them
- Project State/Audit docs are updated
- checkpoint is committed to GitHub
