# Ishar Construction Kit — Project State

Recovered: 2026-09-25  
Source: user-provided `GROK files.zip`  
Status: **recovered, standalone shell restored, buildable checkpoint**

## Product goal

Ishar Construction Kit is a creative authoring workbench for building new Ishar-style RPG content. It is not a game and not merely a save editor.

The governing rule is **audit first, edit second**: verified facts, probable interpretations and unknowns remain visibly distinct.

## Recovered core

The repository now contains the recovered Ishar-specific TypeScript core:

- binary inspection, entropy, strings and DOS MZ hints
- ZIP/loose-file inventory and evidence-aware classification
- Silmarils packer detection and old-packer decode path
- Ishar 1 / Ishar 2 candidate save maps
- party decoding and surgical byte patching
- byte diff and lossless identity helpers
- project model, evidence ledger and RE roadmap
- Zustand application state

Approximate Ishar-domain size: **2,200+ lines of TypeScript**.

## Application shell

Restored routes:

- **Overview**
- **Character Lab**
- **File Lab**
- **Knowledge**
- **Project**

Character Lab can load a local `.SAV`, switch game/endian interpretation, edit mapped fields and export a patched copy. Character names remain project overlays because their save offset is not verified.

File Lab can open a local ZIP or loose files and classify them by extension, magic, entropy, known filenames and Silmarils packer headers. Files stay local in the browser.

## Build state

The three recovered TypeScript issues were fixed without changing save offsets or binary semantics.

Current gates:

- `npm run typecheck` ✅
- `npm run build` ✅ client + SSR bundles

The original Grok template test suite is no longer a project gate because several template tests intentionally assume the app has no custom project identity.

## Module readiness

| Module | Status | Notes |
| --- | --- | --- |
| Character | partial | Candidate maps + surgical patch architecture; real-save verification still required. |
| Item | audit | Inventory slots represented; complete item table not decoded. |
| Magic | audit | Candidate Ishar 2 spell-byte region exists; semantics remain open. |
| World | planned | `.FIC` hypothesis documented; generalized codec/editor pending. |
| NPC | planned | No decoded schema yet. |
| Quest | planned | No verified flag schema yet. |
| Dialogue | planned | `TEXTIN*.IO` / `MESSAGE*.IO` targets identified. |
| Asset | partial | Local file inventory/classification UI now exists. |
| Build | planned | Construction Kit project format exists; standalone game pipeline does not. |

## Local original-game corpus

Do **not** commit these archives:

- Ishar 1: 122 files, SHA-256 `ddaac10886bc369b2aa12a396196268e89a92a74d9adb7fa964b2044de65459b`
- Ishar 2: 187 files, SHA-256 `ba90e28654e4532736e91b2070789be0f6f03fdbb1354d316a12a83a43461b54`

Observed corpus facts:

- Ishar 1 saves commonly: 5,216 bytes
- Ishar 2 saves commonly: 8,359 bytes
- Ishar 1 `CONT1.FIC`–`CONT6.FIC`: 4,860 bytes each
- Ishar 2 `CONT1.FIC`–`CONT7.FIC`: 10,800 bytes each
- Ishar 2 `IMP2.SAV`: 5,216 bytes, useful for I→II import research

## Brand state

- recovered keep/fortress favicon: present in Git
- site identity: present in `src/lib/og/site.json`
- a titleless Grok-generated OG source scene was recovered from the workspace and a 1200×630 card was reconstructed in the recovery bundle
- no X game banner is required

## Immediate target

The recovery phase is complete enough to resume reverse engineering.

Next: validate the candidate character maps against the supplied real saves, record controlled diffs and only then deepen items, spells and world formats.

## 2026-09-26 evidence checkpoint

Six real Ishar 2 saves passed byte-identical codec identity patches. Synthetic slot-0 HP +1 changed exactly offset 997 in each save. The supplied HEX guide and corpus support five-member BE candidate arrays; field meanings and gold structure still require game-produced controls. See `AUDIT.md` for hashes and offsets. Original files remain outside Git.

## Build 1.0 target

A usable 1.0 lets an author create and reopen an original project, define a small complete RPG (party/characters, world/maps, items, encounters, quests and text), validate references, and export a documented playable package for a specified runtime. Save inspection/import is a research and migration aid, not the main output. The runtime and export format need a concrete design checkpoint; unknown original file formats need not block an original-data authoring path.

The older Ishar 1 Python Workbench supplies candidate template, map, script and quest findings. Its `EN1.FIC` tables are distinct from `.SAV` fields. Its original-engine patch workflow could inform a future compatibility export, but no code or derived game assets have been imported into this repository. The 1.0 export/runtime decision must account for both an original-format compatibility path and an original-data runtime path without claiming either is already implemented.


## 2026-09-26 playable vertical slice

Draft PR #1 adds the first original-data authoring-to-runtime path. The project now contains a starter adventure schema for characters, locations, items, encounters and quests; local browser persistence; import/export; reference validation; an Adventure Builder; and a browser Playtest that can be completed from start to ending. This is deliberately separate from original Ishar save/file compatibility research.

Acceptance path: edit the starter project, keep validation green, start Playtest, defeat the guardian, reach the ending location, export the project JSON, reopen it and replay it.


## 2026-09-26 product correction: crawler-first runtime

The first runnable authoring slice proved persistence, validation, combat, completion and import/export, but user testing correctly identified that its button-and-text presentation behaved like a text adventure. The runtime target is therefore now explicit: **grid-based first-person dungeon crawler**.

Current branch adds X/Y dungeon geometry, facing, cardinal topology validation, live map authoring, perspective dungeon rendering, relative movement/turning, keyboard controls, viewport encounters and a five-slot party HUD scaffold. Text remains secondary UI. This is the basis for the playable 1.0 runtime; original Ishar binary compatibility remains a parallel research track.


## 2026-09-26 local asset pipeline

The crawler runtime now has a generic external asset-pack layer. Asset Lab accepts local ZIPs/folders with a documented manifest, supports multiple tilesets and target-specific encounter/item sprites, and keeps imported image bytes session-local through browser Blob URLs. Project JSON stores only pack/tileset IDs. The Playtest overlays available image layers on the procedural crawler renderer and keeps SVG as a sparse-pack fallback.

A built-in synthetic demo pack is available from Asset Lab so the image pipeline can be exercised without original assets. Authored doors are now first-class world transitions and can be opened/locked by item references; the viewport can render dedicated closed/open door roles.


## 2026-09-26 branching builder correction

Adventure Builder topology authoring now works from each room in four cardinal directions. Empty adjacent cells create and auto-link a new room; occupied cells can be linked or disconnected. Rooms and doors can be deleted with cascading cleanup of exit/door references. This removes the earlier vertical-only room creation path and makes branches, loops and crossroads practical in the UI.


## 2026-09-26 guided original-archive import

Asset Lab now treats a user-owned Ishar ZIP as the primary input. One selection populates the file inventory, detects Ishar 1/2 where corpus signatures allow it, classifies resources, attempts verified old-packer decoding, scans decoded data for standard embedded images, and auto-assigns only semantically strong image matches to runtime roles. The UI reports blocked A1/new-packer resources and deliberately leaves ambiguous graphics unmapped rather than guessing. Manual manifest packs are now an expert path.


## 2026-09-26 A1 + ALIS graphics extraction

The original-archive import path now includes a bounded DOS A1/New-Packer decoder plus a conservative DOS ALIS graphics-resource reader. Decoded scripts are inspected for resource tables, indexed 4-/8-bit images and palettes; extracted images are converted to local browser PNG previews. Ambiguous original graphics are deliberately shown as unassigned candidates rather than guessed into runtime roles. This is the first path capable of surfacing proprietary Ishar graphics from an original ZIP without a user-authored manifest.
