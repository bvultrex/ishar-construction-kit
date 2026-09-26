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


## 2026-09-26 — Palette recovery, ALIS composites and per-room surface overrides

User reported that all extracted assets appeared grayscale and asked whether Ishar walls are single textures or layered resources.

Verified against the public ALIS interpreter/source:

- ALIS palette resources (`0xFE`) are dynamic and can be partial 8-bit updates with an explicit palette offset.
- The previous extractor only accepted full-looking palette entries and therefore fell back to the grayscale default far too often.
- DOS 4-bit palette decoding masks R/B to 3 bits and scales all RGB components to VGA-style 0..224 steps.
- ALIS composite resources (`0xFF`) explicitly reference multiple child graphics with X/Y/Z offsets and optional horizontal flip. So layered visual construction is a real engine feature.
- Separately, the DOS 3D renderer has a dedicated terrain texture path (`bartra_dos`) with texture pointers, width masks, height/subtile and darkness lookup. Therefore "wall texture" is not necessarily just a normal sprite-table image.

Implemented:

- palette timeline reconstruction across each ALIS resource table
- support for partial 8-bit palette updates with palette offset
- corrected DOS 4-bit palette channel decoding
- best global colorful palette fallback for images whose local resource table contains no usable palette
- composite resource metadata extraction/counting
- Asset Lab report now shows recovered palette and composite counts
- `AuthoredLocation` can store independent `wallAssetId`, `floorAssetId`, and `ceilingAssetId`
- Adventure Builder exposes per-room dropdowns for plausible ALIS surface candidates with thumbnail preview
- new adjacent rooms inherit the source room's chosen surface overrides
- Playtest uses per-room surface overrides ahead of the pack default for wall/floor/ceiling

Interpretation boundary:

The editor dropdown currently exposes **plausible extracted surface images**, not a proven original-Ishar "wall definition" table. Exact original wall/floor/ceiling semantics likely live partly in the ALIS terrain/scene data rather than the normal sprite resource table. Decoding that terrain type table is the next compatibility step.

Next validation:

1. re-import the same Ishar 2 ZIP
2. verify whether extracted previews are now colored
3. note palette/composite counts
4. in Adventure Builder select a known good brick image independently for Wand/Boden/Decke and verify it persists per room
5. continue reverse-engineering the scene terrain texture table so original wall assignments can become deterministic instead of manually selected


## 2026-09-26 — Missing Ishar dungeon geometry traced to ALIS terrain formats

User reported that wall/floor/ceiling candidates were effectively absent from imported thumbnails and that the Playtest often showed only a background. Several previews were also plain red.

Root cause found in the public ALIS interpreter:

- Opcode `ctexmap` (0xE8 in the Ishar-era interpreter) resolves terrain texture resources through `adresdes`.
- The terrain renderer explicitly supports DOS bitmap formats `0x1C` / `0x1E` with an 8-byte full header.
- The previous browser extractor only accepted `0x00/02`, `0x10/12`, and `0x14/16`.
- Therefore the primary ALIS terrain texture class was silently excluded from Asset Lab and default surface selection.
- `0x18/0x1A` native 8-bit sprite formats were also previously omitted and are now decoded.

Implementation:

- `AlisIndexedImage` now classifies resources as `sprite` or `terrain`.
- Added `terrain8` decoder for `0x1C/0x1E`:
  - width = mask + 1
  - height = mask + 1
  - pixel payload begins at full header +8
  - palette index 0 remains opaque for terrain previews because the terrain renderer may use it as a real color.
- Added `0x18/0x1A` 8-bit bitmap support.
- Auto-import reports a dedicated terrain texture count.
- Real terrain resources are forced ahead of the browser preview budget and sorted before sprites.
- Dungeon default selection gives a strong priority to true terrain resources.
- Ishar 1/2 auto-import no longer auto-assigns a fullscreen viewport background; interior geometry must remain visible.
- Nearly single-color images are flagged as potential masks/material helpers and are excluded from automatic surface choice.
- Asset Lab visually distinguishes:
  - Terrain 0x1C/0x1E
  - normal ALIS sprites
  - palette provenance
  - flat-color/mask suspects
- Adventure Builder now offers true terrain resources first for per-room Wall/Floor/Ceiling overrides. Sprite assets are only offered if no terrain resources were found.

Remaining compatibility work:

- `ctexmap` gives the authoritative terrain-slot-to-resource assignment at runtime. A static script decoder for those calls would let the editor label original terrain/material slots instead of showing only resource IDs.
- Plain-red assets are not assumed to be broken anymore; many may be masks/material helpers or rely on runtime palette state. They remain visible for diagnostics but are not used as surface defaults.


## 2026-09-26 — Terrain absence confirmed; add hard format diagnostics

User clarified that terrain textures were never listed in Asset Lab. This corrects the previous assumption that 0x1C/0x1E extraction had already surfaced them.

New evidence:

- The older recovered Workbench does not claim terrain textures either; its tested graphics reader only supports normal ALIS bitmap resource types 0x10/0x12/0x14/0x16.
- Its palette work is stronger than the current browser heuristic:
  - STAGE.IO / resource 4 is the verified shared VGA base palette.
  - A module-local scene palette overlays only its declared index range.
  - When several local palettes exist, the old Workbench chooses the nearest resource index as an initial scene-palette guess.
- Therefore plain-red/incorrect-color previews were partly caused by our previous "most colorful global palette" fallback.

Implemented:

- every ALIS graphics table now records a raw format histogram, not just formats we know how to decode
- Asset Lab shows counts for all seen resource headers (for example 0x10, 0x14, 0x1C, 0x1E, 0xFE, 0xFF)
- this makes the next test decisive:
  - if 0x1C/0x1E counts are non-zero but Terrain stays zero, our terrain decoder/bounds are wrong
  - if 0x1C/0x1E counts are zero, the original Ishar terrain data is outside the graphics-resource tables currently scanned and ctexmap/runtime data must be reconstructed directly
- known Ishar 1/2 imports no longer fabricate wall/floor/ceiling defaults from ordinary sprites when no true terrain resource was extracted; SVG geometry remains visible instead
- palette resolution now follows the recovered Workbench model:
  - prefer STAGE.IO / ALIS #4 as shared base palette
  - choose nearest local module palette and overlay only its declared index range
  - fall back to the previous global-palette heuristic only when the verified STAGE base is unavailable
- Asset Lab reports whether STAGE.IO/#4 was found and how many images received local palette overlays

Do not claim that 0x1C/0x1E are present in the user's Ishar 2 archive until the new format histogram confirms it.


## 2026-09-26 — Composite preview path after terrain correction

Further review of the recovered legacy Workbench changed the investigation priority:

- Its verified Ishar tile preview system does not model a visible cave/city field as one texture.
- For known Ishar 1 scene modules (for example MCAVE.IO and VILLE.IO), one map field resolves to several graphic resource IDs plus mirrored variants.
- This strongly supports the user's earlier observation that visible walls/decor can be assembled from multiple sprite resources rather than represented by one seamless wall bitmap.
- Therefore the absence of obvious wall/floor/ceiling thumbnails is not proof that the data is missing; some geometry may only become recognizable after resource composition and script draw ordering.

Implemented now:

- ALIS 0xFF composite resources are recursively expanded into their child image resources.
- Child X/Y/Z offsets and horizontal-flip metadata are honored in a bounded browser canvas renderer.
- Nested composites are supported with recursion/cycle limits.
- Up to 500 composite resources per import are rendered as PNG previews.
- Asset Lab sorts composites ahead of ordinary sprites and labels them separately.
- Composite previews are diagnostic only; they are not treated as repeatable surface textures yet.

This runs in parallel with the new raw-format histogram. The next real Ishar 2 import can now answer two separate questions:
1. Do the currently scanned resource tables contain 0x1C/0x1E at all?
2. Do 0xFF composite previews reconstruct recognizable cave/wall/decor assemblies even if no terrain texture class is present?


## 2026-09-26 — Import regression correction: Ishar 1 detection, visible fallback, palette context

User test + 30-page Asset Lab screenshot exposed three regressions/incorrect assumptions in the previous build.

### Confirmed from real Ishar 2 import

- 187 files
- 141 A1 resources decoded
- 2,244 ALIS bitmap resources
- 161 palette resources
- 1,629 composite resources
- 500 composite previews generated
- raw format histogram: 0x00=125, 0x01=84, 0x10=1851, 0x12=9, 0x14=238, 0x16=21, 0xFE=161, 0xFF=1630
- no 0x1C/0x1E entries at all in the scanned graphics tables
- many sprites/objects/enemies are correctly colored, while several scene/composite families are strongly red-dominant

This invalidates the earlier assumption that missing 0x1C/0x1E "terrain textures" were the primary blocker for Ishar 1/2 scene geometry. The active compatibility target is now normal bitmap resources + script/composite scene assembly.

### Recovered Ishar 1 Workbench evidence

The older verified Workbench confirms:

- visible Ishar 1 resources use 0x10/0x12/0x14/0x16 plus 0xFF composites
- STAGE.IO / resource #4 is the verified Ishar 1 shared VGA scene palette
- module-local partial palettes overlay that shared palette
- cave/city tile previews are built from multiple resource IDs and mirrored variants, not one seamless wall texture
- the verified Ishar 1 corpus contains IMP2.SAV with 5,216 bytes; therefore the filename IMP2.SAV is NOT evidence of Ishar 2
- Ishar 1 corpus signatures include CONT*.FIC = 4,860 bytes, EN1.FIC = 3,640 bytes, saves = 5,216 bytes

### Implemented fixes

Game detection:
- replaced first-match filename detection with weighted verified corpus signatures
- archive/folder name is only one signal
- IMP2.SAV is classified by size, not name
- Ishar 1: CONT=4860, EN1=3640, SAV=5216
- Ishar 2: CONT=10800, EN1=6050, SAV=8359
- ties return unknown instead of guessing

Bitmap semantics:
- corrected transparency: 0x10 and 0x14 carry transparent indices; 0x12 and 0x16 do not

Palette resolution:
- Ishar 1 uses verified STAGE.IO/#4 + nearest local partial palette
- Ishar 2 is resolved separately; broad (>=128-color) palettes are preferred as base
- DJCOL/COL/PAL sources receive priority only among plausible broad bases
- Ishar 2 local palettes are applied only when they precede the image resource, instead of choosing an arbitrary nearest future palette
- strongly red-dominant images are marked "palette-suspect"
- for red-dominant Ishar 2 scene modules (DJ*, FDJ*, PCAVE, FOND), COL/PAL candidates are tested conservatively and only accepted if red dominance improves substantially
- report exposes palette base, confidence, remaining palette suspects, and scene palette repairs

Runtime regression:
- known Ishar imports no longer put uncertain filename-based wall/floor/ceiling/background guesses into the runtime tileset
- Playtest always retains a visible procedural brick/stone wall/floor/ceiling fallback
- imported entity placement is scaled to the active native drawspace instead of using stale 640x400 coordinates
- one safe original encounter and item image are automatically bound as generic Playtest fallbacks when available, so ZIP import still produces an immediate visible original-asset change without inventing dungeon geometry

### Current architecture boundary

Do NOT model original Ishar dungeon scenes as one seamless wall/floor/ceiling bitmap unless later evidence proves it for a specific scene.

The strongest verified model is now:

map/scene field -> script branch -> multiple ALIS resources / composites / mirrored draws -> perspective placement

For Ishar 1, tile-previews.json from the recovered Workbench already contains verified branch/resource/draw lists for RPLAINE.IO, PLAINE.IO, FORET.IO, MCAVE.IO and VILLE.IO. The next renderer milestone should consume that evidence rather than continue texture guessing.

For Ishar 2, DJ1.IO / DJ2.IO / related modules are the next scene-script targets. The real screenshot shows large composites near the native drawspace (for example 192x102 and 201x113), so scene reconstruction should focus on script draw ordering/placement and palette state.


## 2026-09-26 — Visible version/build identity on Overview

User requested an immediately visible way to identify which downloaded test ZIP is currently running.

Implemented:

- Overview now displays a compact build stamp directly below the product title.
- The stamp shows:
  - semantic/application version from `package.json` (`__APP_VERSION__`)
  - exact short build commit (`__BUILD_SHA__`)
- Vite injects both values at build time.
- GitHub Actions automatically provides `GITHUB_SHA`, so every CI artifact identifies its exact source commit without manual editing.
- Local builds fall back to `BUILD_SHA` when supplied, otherwise `local`.
- Current package version remains `0.1.0-recovery`; this can be bumped deliberately at product milestones while the commit suffix continues to distinguish every test build.

Expected Overview label example:

`Version 0.1.0-recovery · Build 545c35f`

This should be used in future bug reports/tests so screenshots and user feedback can always be mapped back to one exact repository state.
