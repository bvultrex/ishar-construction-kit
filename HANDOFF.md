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


## 2026-09-26 — Dungeon-crawler runtime decision

User feedback on the first runnable slice: the end-to-end workflow worked as planned, but the runtime felt like a text adventure rather than a dungeon crawler. Treat this as a product correction, not cosmetic polish.

### Runtime direction

The authored 1.0 runtime is a **grid-based first-person dungeon crawler**. Room text, quest text and logs are supporting UI only. The primary play surface must be visual dungeon navigation.

Implemented on `workbench/playable-slice` after that feedback:

- authored locations have integer X/Y dungeon coordinates
- project has a starting facing direction
- validation rejects overlapping cells, diagonal/non-adjacent links and one-way links
- Adventure Builder shows a live dungeon grid
- Playtest renders a perspective corridor/room view from the grid
- player turns left/right and steps forward/back relative to facing
- WASD and arrow-key controls
- side passages and blocking walls are rendered from topology
- active encounters appear directly in the viewport
- five-slot party HUD scaffold is visible below the viewport
- room/quest/inventory/log text moved to secondary sidebar UI
- starter adventure expanded into a small multi-turn dungeon with a branch, encounter and ending

### Near-term crawler work

1. verify the new crawler build with user playtest
2. replace placeholder geometry with a stronger Ishar-like visual language without shipping original assets
3. add doors, blocked/locked transitions and interaction targets
4. expand party to multiple authored members and combat selection
5. add map/event authoring on top of the grid
6. preserve original-game format research as a separate compatibility/import track


## 2026-09-26 — External asset pipeline checkpoint

Work continued on `workbench/playable-slice` following the crawler-first decision.

Implemented:

- generic `ishar-ck-asset-pack` manifest v1
- semantic image roles for viewport/background, floor/ceiling, perspective walls/openings, doors, encounters, items and portraits
- depth-specific layers (0–3)
- optional `targetId` mapping for authored encounters/items
- multiple named tilesets per pack
- Asset Lab route with local ZIP/folder import and image previews
- browser-only Blob URLs; original graphics are never added to project JSON or Git
- project stores only expected `assetPackId`; dungeon locations may store `tilesetId`
- Playtest overlays imported image layers over the existing SVG crawler fallback
- Adventure Builder can assign imported tilesets per dungeon cell
- sparse packs are valid: missing images fall back to procedural SVG geometry
- `ASSET_PACK.md` documents the boundary and manifest schema

Verification strategy: GitHub Actions must pass typecheck, production build and smoke test on every checkpoint.

Next asset work:

1. add door/blocked transition data to authored world model and render door roles
2. add per-character portrait assets to the five-slot HUD
3. test a hand-authored external pack with real image files
4. begin Ishar-specific source-file mapping from user-owned local corpus; do not claim extraction semantics until verified


## 2026-09-26 — Door runtime checkpoint

Added authored doors as explicit transitions between adjacent dungeon cells.

- doors may start open or closed
- doors may require an authored item ID as a key
- closed doors block movement while preserving the underlying room link
- the first-person ray stops at a closed door
- asset packs can render `door.front.closed` and `door.front.open`; a procedural door is used as fallback
- playtest exposes an Open action for the door in front of the party
- starter dungeon now uses the crypt rune to open the sealed route into the sanctum
- Adventure Builder has door authoring and project validation checks door endpoints/key references

This establishes the world-state hook required for Ishar-style door graphics and later switch/quest-controlled transitions.


## 2026-09-26 — Synthetic asset-pack smoke path

Asset Lab now has a generated `CK Demo Layers` pack. It creates temporary SVG Blob assets entirely in-browser and exercises the same runtime mapping path as imported external packs. This gives a zero-corpus smoke test:

1. open Asset Lab
2. click **Demo-Pack laden**
3. open Playtest
4. verify background/wall/door/enemy/item image layers appear
5. collect the crypt rune, defeat the guardian, open the sealed sanctum door, reach the ending

No generated demo image is committed as a binary asset; the SVG strings exist only as test scaffolding in code.
