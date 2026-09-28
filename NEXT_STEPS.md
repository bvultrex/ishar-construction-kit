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


## Immediate compatibility target — original terrain slots

1. Re-import Ishar 2 and verify the new report shows non-zero "Terrain" resources.
2. Confirm 0x1C/0x1E thumbnails include the missing brick/stone level materials.
3. Decode or statically scan Ishar-era ctexmap definitions so terrain slot -> resource relationships are recovered from the original scripts.
4. Separate genuine flat-color masks/material helpers from palette failures.
5. Promote verified original terrain sets into deterministic Ishar 1/2 material presets.


## Immediate scene-renderer target

1. Re-test both Ishar 1 and Ishar 2 imports with the corrected signature detector.
2. Verify Ishar 1 selects STAGE.IO/#4 and reports the Ishar 1 DOS render profile.
3. Compare Ishar 2 palette-base label, scene repair count and remaining "Palette offen" count.
4. Port the recovered Ishar 1 tile-previews.json evidence into a typed scene-preview table and render MCAVE/ville field components in script draw order.
5. Reverse the corresponding Ishar 2 DJ1.IO/DJ2.IO draw branches; treat large 0xFF composites as scene assemblies, not repeatable textures.
6. Only after placement is verified, promote scene components into automatic wall/opening/door rendering for the authored crawler.


## Immediate item-graphics target

- Done: verified distance families are modeled explicitly for OBJET.IO #69/#70/#71, #72/#73/#74 and user-verified mushroom family #232/#233/#234.
- Done: conservative OBJET.IO-only detection groups consecutive sprite triples when their visible footprint shrinks near -> mid -> far.
- Done: Asset Lab labels distance-set membership/confidence; Adventure Builder can apply a whole set; Playtest resolves missing distance siblings automatically.

Next:
1. Re-import Ishar 2 and verify #232/#233/#234 scale/alignment in current / +1 / +2 rooms.
2. Review heuristic OBJET.IO triples for false positives; promote only manually confirmed families to verified mappings.
3. Identify the exact semantic subtype represented by #72/#73/#74.
4. Determine whether #75/#76 are inventory/close-up states and whether #121 is the inventory key-ring icon.
5. Search enemy-bearing resources for equivalent near/mid/far sequences before extending the detector beyond OBJET.IO.

## 2026-09-26 — Palette blocker resolved

Solid-red Ishar 2 scene/actor imports were caused by MAIN placeholder palette
selection and ignored post-image actor palettes. These are corrected and covered
by npm run test:palettes. Preserve explicit scene provenance and daylight preview
labels. Future scene rendering should use the corrected assets without treating
a generic preview as a verified original lighting state. See AUDIT.md.

## User-prioritized scene worklist — 2026-09-26

Use [DUNGEON_ASSET_EVIDENCE.md](DUNGEON_ASSET_EVIDENCE.md) for the 77
user-identified DJ1/DJ2 geometry/decor composites. All IDs were checked against
the local corpus. Trace exact scene placement and roles before runtime binding.

## Latest checkpoint: 2026-09-26
Automatic DJ1/DJ2 walls and startup asset restoration are implemented. Next priority: original camera/decor placement evidence and remaining dungeon composites; see HANDOFF.md.

FDJ floor/solid ceiling and original door surrounds are integrated. Next: identify original door leaves/animation and original camera parameters; closed leaves currently use a procedural placeholder.

2026-09-26 passage checkpoint: DJ1 #73–76 are now assigned as near-to-far
side-passage arches and automatically restored from the local ZIP. DJ1 #114–119
are hanging lamps, not closed doors; DJ2 #77–80 are stained glass. Continue the
door search in remaining resource modules and script draw paths; only promote a
closed-door role after visual and resource evidence. The current wooden leaf is
a clearly documented placeholder.

2026-09-26 video cross-check: the playthrough's part 22 at 1:00 shows the
open skull passage assembled by `DJ2.IO #51` with the matching `#26` skull
component. This corroborates the open-surround role, not a closed leaf. Find
an unmistakably closed original dungeon door and its matching archive resource
before replacing the procedural closed panel. See DUNGEON_ASSET_EVIDENCE.md.

2026-09-27 closed-door checkpoint: original closed silhouettes are now visible
at part 31, 0:10 (DJ1 vertical slats under carved arch) and part 22, 3:33–3:40
(DJ2 barred gate below skull). The playtest fallback now reflects these distinct
shapes, but remains a reconstruction. The DJ1/DJ2 graphic tables have no
matching standalone leaf. Trace the actual script/runtime draw path or inspect
remaining modules before mapping any resource to `door.front.closed`. In
particular, determine whether another module is loaded at the lock state and
whether the bars are assembled from small primitives. See
DUNGEON_ASSET_EVIDENCE.md for exact links, asset IDs, and evidence limits.

## 2026-09-27 — World and interface priorities

1. Compare side branches at near/mid/far distances with original gameplay and trace the relevant DJ1 drawing calls. Current branch backing is a documented CK heuristic; prove or replace it with the original scene assembly.
2. Extend wall-free outdoor cells into coherent maps with outdoor-specific navigation, backdrop selection and distance placement of `VHOUSE1/2.IO` facades. Current outdoor renderer displays a selected facade in the current cell only.
3. Refine room camera for multi-cell spaces, including visible internal openings, floor/ceiling continuity and doors on room boundaries. Current 2×2–5×5 topology and wall suppression are functional but visual projection is a CK approximation.
4. Map `FRISE.IO` HUD parts and `MAIN.IO` glyph encoding against original video/source evidence. Action/life strips are integrated; the full HUD and bitmap font remain incomplete.
5. Continue searching for an actual closed-door leaf/animation; the current door silhouettes remain procedural despite matching video references.

## 2026-09-27 — After multi-level/HUD milestone

1. Compare DJ1/DJ2 side apertures and room-boundary arches with captured original frames at all distance tiers; refine projection and clipping where the floor/wall joins still diverge. The renderer now uses imported passage art without the synthetic black window, but exact original draw order remains unproven.
2. Expand outdoor/house asset-set support beyond choosing a dungeon tileset: identify original overworld palette/background/distance families and build a world-scene set from those verified assets. Current outdoor sky and ground are CK placeholders, and houses are selectable facades.
3. Reconstruct further `FRISE.IO` HUD panels and `MAIN.IO` glyph encoding from resource/script evidence. The party/menu controls work for the playable slice but original Ishar 2 command coverage, layout and typography are incomplete.
4. Give room groups more faithful continuous floor/ceiling perspective and verify every internal/boundary transition, including locked doors and intersections.
5. Preserve project migration tests while adding level deletion/reordering or broader transition rules; current Builder supports creation, selection, editing and portals but does not delete levels.

## 2026-09-27 — After native-room comparison

1. Trace the original lateral room/side-passage draw sequence for DJ1/DJ2 and compare near, middle and far openings with gameplay. The shifted adjacent wall and branch backing are still CK heuristics.
2. Identify original closed leaves or draw primitives and their placement at all four distance tiers. The open surrounds are imported; closed DJ1/DJ2 panels remain procedural.
3. Map remaining FRISE HUD pieces and MAIN glyphs through source/video evidence. Command tabs now work in the game frame, but original equipment, magic and statistics panels are incomplete.
4. Exercise mixed room/corridor boundaries, locked doors and wider rooms on both DJ1 and DJ2, including alternate facings and deep visibility. The current browser checkpoint covered one DJ1 2×2 room and original video corridors; it is not exhaustive.

## 2026-09-27 — After 4×4 open-room milestone

1. Project entrances/doors on distant lateral perimeter cells. A continuous room now places outer walls correctly, but openings beyond the immediate side cell still lack their own perspective treatment.
2. Compare the reconstructed wide-room side projection against original gameplay or ALIS draw code; it is geometry-based, not verified Ishar behavior.
3. Check nonrectangular groups and hand-edited missing exits. The Builder's rectangular blocks create all reciprocal internal exits and are covered by the 4×4 topology regression.

## 2026-09-27 — After side-niche checkpoint

1. Compare the room/corridor side niche now drawn from DJ1 #71/#72 with original Ishar 2 footage or script draw calls at depths 1/2; the mapping is still a CK reconstruction. Check left-mirrored and DJ2 counterparts separately.
2. Determine from original map data whether empty/blocked grid cells separate corridors and rooms. Do not convert the current traversable authored exits to blocked cells solely from the visual hypothesis.
3. Continue the original closed-door leaf search; a stone niche does not establish door-panel pixels or door-state behavior.

## 2026-09-28 — Swamp slice and rejected side niche

1. The user confirmed DJ1 #71 still is **not** the correct side-door texture. Treat its current room-boundary assignment as provisional; trace the original side draw path before another replacement.
2. Compare the new playable swamp preset against Ishar 2 footage. Its use of original `FOND1/PLAINE1/ARBO/FORET1` pixels is verified by extraction, while composition, placement and palette state are CK heuristics.
3. Extend outdoor authoring beyond the 5×5 test area: authored visibility blockers and passable vegetation should be separate properties, and larger maps need level-specific materials and backdrop choices.
4. Keep the user-reported three dungeon visual families separate until their exact `.IO` module and level associations are established.

## 2026-09-28 — After swamp vegetation correction

1. Compare multiple Irvan's Island camera positions against the revised test scene. Complete outdoor ALIS composites and grid-anchored vegetation are now used; precise original draw order, spacing and palette transitions remain unverified.
2. Trace the original `FORET1`/`PLAINE1` placement code before claiming exact Ishar behavior. In particular, determine how near bark and tree-foot composites share an anchor and which palette states correspond to time of day.
3. Keep the 4176 swamp test as a separate level; the 4175 authored dungeon and the unresolved DJ1 room-side texture remain unchanged.

## 2026-09-28 — After Irvan grass/water correction

1. Compare additional Irvan's Island views with different water adjacency and day/night palette states. Current `FOND1 #0` water-cell projection and repeated `PLAINE1 #92–95` grass are deliberate CK approximations, not recovered ALIS draw coordinates.
2. Trace original `FORET1` placement and clipping to refine the near-root scale and distant branch spacing. Do not add the brown `ARBO #0/#1` Thorm-style panels back to the Irvan swamp.
3. Preserve the separate 4176 water test and main 4175 project. The rejected DJ1 room-side door texture still needs direct original evidence.

## 2026-09-28 — After fixed scenery anchors

1. Compare more camera loops around one Irvan swamp tree with original footage. CK trees now stay attached to a world cell, but original ALIS anchor coordinates and occlusion order are unknown.
2. Refine water depth blending across *adjacent* water cells, including diagonal shores and day/night palette changes. The current screen-wide masked projection is a visual heuristic for the user's blocked-water case.
3. Keep passable plants and impassable terrain separate in future outdoor levels; do not infer that every Irvan tree is a hard movement blocker from the current visual test.

## 2026-09-28 — After radial tree sizing

1. Compare the same tree while walking through and past its own tile. The current same-cell root is pinned near a screen edge; original near clipping and occlusion are still unknown.
2. Compare distant `FORET1` silhouettes and `PLAINE1` reeds across several Irvan viewpoints and palette states. Radial distance now prevents size changes on rotation, but the distance thresholds and scales remain CK estimates.
3. Keep the now-confirmed water appearance stable while refining vegetation. The unresolved dungeon side-door texture remains a separate investigation.
