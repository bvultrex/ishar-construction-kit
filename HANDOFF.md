# Ishar Construction Kit — Handoff

Date: 2026-09-25  
Origin: recovered from `GROK files.zip`

## Mission

Build a full authoring workbench for new Ishar-style RPG projects while learning the original data formats through reproducible evidence.

**Audit first, edit second.**

## Current stable checkpoint

The lost Grok work has been recovered into GitHub and the missing shell was rebuilt.

Current app:

- standalone TanStack/Vite project
- typecheck passes
- production client + SSR build passes
- Overview / Character Lab / File Lab / Knowledge / Project routes
- local save loading
- candidate Ishar 1/2 character decoding
- surgical patch export
- local ZIP/file inventory and classification
- evidence ledger exposed in the UI

## Critical implementation rules

### Surgical save editing

`patchParty()` copies the original buffer and touches only mapped offsets. Unknown bytes must survive unchanged. Do not replace this with whole-save serialization until the format is fully decoded.

### Names are overlays

Character name offsets are not verified. Names live in `project.nameOverlays` and are not written to `.SAV`.

### Endian remains selectable

Ishar 2 defaults to big-endian based on public RE notes. Keep the toggle until real-save experiments settle this conclusively.

### Evidence vocabulary

Evidence: `known | suspected | unknown`  
Field/file confidence: `confirmed | probable | possible | unknown`

Keep these separate.

### Original game files stay local

Never commit the supplied Ishar archives, extracted original assets, manuals or music.

## Read first

1. `PROJECT_STATE.md`
2. `AUDIT.md`
3. `src/lib/ishar/types.ts`
4. `src/lib/ishar/knowledge.ts`
5. `src/lib/ishar/save-maps.ts`
6. `src/lib/ishar/save-codec.ts`
7. `src/lib/store.ts`
8. `NEXT_STEPS.md`

## RE status

Silmarils packer IDs recognized:

- `0x81` old
- `0x80` old interlaced
- `0xA1` new

Old packer decode exists. New-packer decode is not claimed complete.

The Ishar 2 candidate map includes XP, HP/max HP, gold, inventory, class, race, level, attributes, skills and perception. Ishar 1 contains a smaller candidate map based on public DEBUG information.

A previous 60-byte `Cont1.fic` claim conflicts with the supplied DOS corpora, whose `CONT*.FIC` files are thousands of bytes. Treat that claim as contextual until reconciled.

## Next continuation order

1. Validate Ishar 2 candidate offsets against multiple real 8,359-byte saves.
2. Resolve endian with known-value searches and controlled changes.
3. Run byte-identical identity checks on real saves.
4. Verify Ishar 1 offsets against 5,216-byte saves.
5. Compare Ishar 2 `IMP2.SAV` with Ishar 1 layout.
6. Add inventory/spell views and explicit byte-diff preview.
7. Decode items/spells only from recorded evidence.
8. Move to `.FIC`, text/dialogue and quest flags after the character layer is stable.

## Definition of the next checkpoint

- experiment log records fixture hash + before/after action + changed offsets
- verified fields promoted in confidence
- regression fixtures are synthetic or metadata-only, never copyrighted originals
- UI exposes the new verified knowledge
- docs and GitHub are updated in the same checkpoint
