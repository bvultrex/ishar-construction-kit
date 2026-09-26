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


## 2026-09-26 — Ishar asset source mapping scaffold

Asset Lab now consumes the existing File Lab inventory through `mapIsharAssetSources()`.

Important evidence boundary:

- packed non-text/system `.IO` files are only **possible** graphics containers
- `.FIC` remains map/data-oriented and is not promoted to graphics
- unknown resources stay unknown
- old-packer resources can be routed toward the existing decoder
- A1/new-packer resources remain blocked until decoding is reproducible

The intended compatibility architecture is now explicit:

`user-owned Ishar files -> audited extractor -> generic asset-pack manifest + local images -> crawler runtime`

This keeps proprietary binary knowledge out of the runtime and prevents speculative format assumptions from contaminating the authoring model.


## 2026-09-26 — Builder topology UX correction

User test found two blocking authoring gaps: rooms/doors could not be deleted, and the generic room-add action only stacked rooms vertically, making practical branch construction awkward.

Fixed on `workbench/playable-slice`:

- doors now have an explicit delete action
- rooms now have an explicit delete action; the final remaining room cannot be deleted
- deleting a room removes inbound/outbound exit references and any doors attached to that room
- deleting the current start room automatically moves the start to the first remaining room
- generic vertical room creation was removed from the header
- each room now has N/O/S/W topology controls
- pressing a direction into an empty cell creates a new room there and creates a bidirectional connection automatically
- pressing toward an existing unlinked room creates a bidirectional connection
- pressing toward an existing linked room disconnects it and removes any door on that edge
- new adjacent rooms inherit the source room's tileset ID
- raw comma-separated exit editing remains available as an advanced escape hatch

This makes T-junctions, crossroads, loops and side branches first-class builder operations instead of requiring manual X/Y plus exit-ID editing.


## 2026-09-26 — Playtest freeze + builder focus fix

User test exposed two concrete usability defects.

Playtest:
- reaching an ending cell no longer disables movement or door interaction
- completion is now a status/message, not a hard runtime freeze
- keyboard movement now refreshes when `openDoors` changes, avoiding stale door-state closures after opening a door

Builder:
- the map now has an explicit selected-room focus
- rooms are clickable in the live map and visibly highlighted
- all N/O/S/W create/connect/disconnect operations are relative only to the selected room
- existing neighbor navigation ("Auswählen") is separate from topology mutation ("Verbinden/Trennen")
- creating an adjacent room automatically selects the new room
- manual X/Y editing is demoted to an advanced section to reduce accidental topology corruption
- room list cards can explicitly select the corresponding map cell

This replaces the ambiguous per-card topology controls that made it easy to edit the wrong room.


## 2026-09-26 — Guided Ishar ZIP import

Asset onboarding was changed from manifest-first to archive-first after user feedback.

New default flow in Asset Lab:

1. user selects one local Ishar ZIP
2. archive is inventoried and the detected game is inferred from known corpus signatures
3. File Lab inventory is populated automatically
4. Silmarils containers are classified
5. old-packer resources (0x80/0x81) are automatically decoded for inspection
6. uncompressed/decoded bytes are scanned for embedded PNG/JPEG/GIF/BMP/WebP images
7. direct standard images are collected
8. only filename patterns with a clear semantic match are auto-assigned to runtime roles (background, door, encounter, item, portrait, floor/ceiling/front/side wall)
9. uncertain images remain unassigned and appear in the import report
10. A1/new-packer resources remain explicitly blocked until a verified decoder exists

Manual manifest ZIP/folder import remains available under **Expertenmodus**.

Important: this is an automatic ingestion/orchestration path, not yet a claim that proprietary Ishar raw bitmap formats are decoded. The architecture is now ready for those decoders: future format support can improve the same one-ZIP workflow without changing user interaction.


## 2026-09-26 — Safer test-build packaging

Chrome flagged the downloadable test ZIP as potentially harmful. Inspection confirmed the artifact contained executable helper scripts (`START_TEST_BUILD.cmd` and `START_TEST_BUILD.sh`).

Packaging was changed so CI test artifacts no longer include executable launch scripts. The artifact now contains:

- `dist/`
- `package.json`
- `package-lock.json`
- `scripts/serve-build.mjs`
- `README_TEST_BUILD.txt`

The README contains manual Node/PowerShell startup instructions. This reduces browser/AV risk heuristics without bypassing or weakening security controls. Do not tell users to disable Safe Browsing or antivirus to obtain a build.


## 2026-09-26 — DOS A1/New-Packer decoder checkpoint

User's real Ishar 2 auto-import report identified the decisive blocker: 141 of 152 candidate resource containers were recognized as A1/New-Packer and therefore skipped.

Implemented:

- bounded DOS/Little-Endian A1 bitstream decoder in `silm-pack.ts`
- six-byte vs 22-byte MAIN header handling
- eight-byte A1 dictionary validation
- zero-lookahead behavior reproduced in an explicitly bounded buffer
- literal-run and backreference bounds checks; corrupt streams fail closed
- DOS signature is preferred when byte 3 is a known packer marker, reducing endian ambiguity
- Auto Import now reports Old-Packer and A1 decode counts separately plus actual decode failures
- A1 resources are fed into the same downstream asset scanner instead of being categorically blocked
- two synthetic regression fixtures (normal module + MAIN module) generated with the independently recovered legacy codec and checked byte-for-byte in CI
- CI now runs `npm run test:a1` before the production build

Reference provenance: the recovered legacy Workbench codec cites maestun/alis `src/unpack.c` (MIT); the implementation was cross-checked against that upstream algorithm. No original Ishar bytes are committed.

Expected next real-corpus signal: the previous `141 A1 blocked` count should become a large `A1 entpackt` count. Standard embedded PNG/JPEG/BMP scanning may still find few images because ALIS uses proprietary indexed bitmap resources; the next layer is ALIS resource-table image extraction.


## 2026-09-26 — ALIS indexed-image extraction scaffold

Built the next stage after A1 decoding using the public MIT-licensed `skruug/silm-extract` resource-table model as a reference.

Implemented a bounded DOS ALIS image reader:

- locates the graphics resource table from the unpacked script header
- validates table count/pointers before following them
- finds the active 16- or 256-color palette
- supports DOS indexed image resource headers `0x00/0x02`, `0x10/0x12`, and `0x14/0x16`
- decodes 4-bit packed nibbles, palette-offset 4-bit pixels and raw 8-bit pixels
- preserves transparent-index metadata where the format supplies it
- caps dimensions/table counts and rejects out-of-range resource payloads
- converts extracted indexed images to browser PNGs locally through Canvas
- Asset Lab now shows an extracted-original-graphics gallery, including unassigned images
- strong filename category matches can be catalogued automatically; ambiguous images remain previews and do not silently replace runtime walls/enemies/items
- browser memory guard: max 1,500 ALIS previews / 64M pixels per import

This changes the next user test substantially: the same Ishar 2 ZIP should now report both A1 decode success and ALIS image counts/previews. Exact semantic mapping from original resource IDs to authored runtime roles remains a separate evidence step.


## 2026-09-26 — Automatic default dungeon textures

Real Ishar 2 corpus test succeeded at the extraction layer: 141/141 A1 resources decoded, 120 ALIS graphics tables found and 2,244 proprietary indexed images extracted. User correctly noted that extraction alone is not enough: a fresh ZIP import should visibly change Playtest without manual mapping.

Implemented an explicit **auto-default tileset** stage:

- scores ALIS images by source filename context, dimensions/aspect and entity-negative keywords
- selects a coherent preferred dungeon/decor source where possible
- automatically chooses defaults for:
  - wall.front
  - wall.left
  - wall.right
  - surface.floor
  - surface.ceiling
  - door.front.closed
  - viewport.background when a sufficiently strong sky/background candidate exists
- wall/floor/ceiling defaults use a new `renderMode: "texture"` and are tiled/clipped into the procedural perspective polygons instead of being stretched across the whole viewport
- auto door textures are clipped into the front door rectangle
- default candidates are processed before the preview memory budget, so a selected runtime texture cannot be skipped just because 1,500 other images were discovered first
- default entries are ordered before other inferred tileset entries so runtime lookup chooses them deterministically
- Asset Lab reports the exact source file + ALIS entry + confidence/reason for every default role
- weak matches are labeled `possible`, strong matches `probable`; the heuristic remains inspectable rather than pretending semantic certainty

Expected user-visible behavior: after selecting the same Ishar 2 ZIP, Playtest should immediately show imported Ishar-derived wall/floor/ceiling textures and, when a candidate is found, a door texture. The next test should report whether the selected sources visually correspond to actual dungeon art; those concrete source IDs can then be promoted into Ishar-2-specific mappings.


## 2026-09-26 — Verified Ishar drawspace profiles + stricter texture selection

User screenshots confirmed that original Ishar 2 ALIS graphics now render in the crawler. They also exposed two concrete problems: the first automatic wall choice was an ornamental vertical sprite repeated as a texture, and the viewport still used the generic 640×400/16:10 construction profile.

Verified DOS dimensions were introduced as explicit render profiles:

- Ishar 1: 320×200 screen, active 3D drawspace 256×126
- Ishar 2: 320×200 screen, active 3D drawspace 256×113
- DOS pixel-aspect metadata: vertical pixel factor 1.2
- imported manifests now carry `renderProfileId`, native drawspace size and pixel-aspect metadata
- Playtest display aspect and native ALIS texture scaling derive from the imported profile
- normalized SVG geometry remains resolution-independent, so authored rooms do not need per-game coordinates

Default dungeon texture ranking was tightened after the screenshot evidence:

- transparency ratio, palette variety, aspect ratio and opposite-edge continuity are measured from indexed ALIS pixels
- repeatable opaque square-ish resources score higher as wall textures
- UI/entity source contexts are strongly penalized
- floor/ceiling only diverge from the wall texture when their source context is explicit; otherwise a coherent stone base is preferred to unrelated guesses
- door scoring now requires a stronger portal/tall-sprite signal
- full drawspace-sized images receive a strong background score
- assignment reasons now include score and source dimensions

Next validation target: import the same Ishar 2 ZIP and compare the reported default source IDs plus the resulting Playtest screenshot. Confirmed source IDs should then become deterministic Ishar-2 mappings rather than remaining heuristic.


## 2026-09-26 — Ishar-style Playtest shell + texture-first dungeon import

User supplied an Ishar 2 UI reference and reported that the previous build showed a constant background and incorrect door art instead of a coherent wall/floor/ceiling dungeon.

Product correction implemented:

### Playtest layout
- Playtest now follows the original Ishar information hierarchy rather than a generic editor layout:
  - large first-person dungeon viewport on the left
  - room plaque, minimap and movement pad on the right
  - five party cards across the bottom
  - quest/inventory/log moved below the primary game surface
- minimap is derived directly from authored grid coordinates and highlights current room/facing
- party strip is ready for later imported portraits but keeps safe placeholders today

### Dungeon texture import
- default auto-selection now prefers a coherent group of opaque, near-square, repeatable ALIS images from the same source container
- wall/floor/ceiling are selected from that same texture group instead of unrelated global best guesses
- automatic full-screen background selection is disabled for normal interior resources; only explicit sky/background filenames can become viewport backgrounds
- automatic door selection now requires explicit door/portal source context; tall shape alone is no longer enough
- extracted asset cards now expose one-click in-session remapping:
  - Basis = same image for wall/floor/ceiling
  - Wand
  - Boden
  - Decke
- manual quick remapping does not require a manifest or re-import and is intended to accelerate identification of the actual Ishar brickwall/brickfloor/brickroof entries

Next verification:
1. re-import the same Ishar 2 ZIP
2. confirm no generic constant background masks the perspective
3. inspect the auto-selected texture set
4. if necessary, click the correct extracted brick textures as Basis/Wand/Boden/Decke
5. record the exact sourcePath + ALIS entry IDs and promote them to deterministic Ishar 2 mappings
