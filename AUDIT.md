# Ishar Construction Kit — Audit Ledger

Recovered 2026-09-25 from the user-provided Grok workspace export.

This file separates what is present in code from what is actually verified against original data.

## Recovery provenance

The public GitHub repository initially contained only an initial README. The implementation was recovered from multiple workspace fragments in `GROK files.zip`.

The missing application shell was reconstructed after recovery.

## Confirmed present in code

- selectable-endian u16 read/write helpers
- field-level reads/writes driven by `SaveMap`
- five-member party decoding architecture
- surgical party patching from original byte buffers
- byte diff utility
- lossless identity helper
- synthetic demo save
- Ishar 1 and Ishar 2 candidate save maps
- inventory-slot representation
- ZIP/loose-file inventory pipeline
- DOS MZ detection, strings and entropy helpers
- Silmarils packed-file header detection
- old Silmarils RLE unpack routine
- versioned Construction Kit project model
- evidence ledger and phased RE roadmap
- standalone TanStack/Vite route shell
- local-save Character Lab with patched-copy export
- local ZIP/file File Lab

## Build verification

Current source gates:

- `npm run typecheck`: **pass**
- `npm run build`: **pass**, client and SSR bundles

Three recovered TypeScript issues were fixed without changing save offsets or binary semantics:

- evidence literal corrected to the supported evidence vocabulary
- inventory-slot literal typing hardened
- browser Blob export made type-safe

## Present but not yet corpus-verified

- most Ishar 2 field offsets
- big-endian default for DOS saves
- Ishar 1 candidate offsets
- inventory layout semantics
- spell-byte semantics
- several class/race IDs and known item IDs

## Explicitly unknown

- character-name save offset
- gender representation
- complete learned-spell format
- full item template table
- generalized map format
- NPC schema
- quest flags
- persistent world/death flags
- dialogue edit/repack pipeline
- location of Ishar 2 improved combat logic
- final standalone game runtime/export format

## Corpus audit

### Ishar 1

Archive SHA-256: `ddaac10886bc369b2aa12a396196268e89a92a74d9adb7fa964b2044de65459b`

Observed: 5,216-byte saves, 4,860-byte `CONT*.FIC`, 3,640-byte `EN1.FIC`, 361-byte `TAB1.FIC`, multilingual message/text files and multiple saves suitable for differential analysis.

### Ishar 2

Archive SHA-256: `ba90e28654e4532736e91b2070789be0f6f03fdbb1354d316a12a83a43461b54`

Observed: usually 8,359-byte saves, a 5,216-byte `IMP2.SAV` useful for I→II import research, 10,800-byte `CONT*.FIC`, 6,050-byte `EN1.FIC`, multilingual message/text files and several saves.

### Important conflict

A prior public note says `Cont1.fic` can be a 60-byte island map. The supplied DOS corpora contain much larger `CONT*.FIC` files. Therefore the 60-byte claim is context/version/platform-specific until proven otherwise.

## Brand audit

In Git:

- `public/favicon.svg` keep/fortress mark
- `src/lib/og/site.json` project identity

Recovered locally from Grok workspace:

- titleless original workbench scene
- reconstructed 1200×630 `public/og.jpg`

No X game banner is required because this is a website/tool, not a game.

## Repository hygiene

Never commit original Ishar archives, extracted original game files, manuals, music, maps, icons, character art or `node_modules/`.

Allowed: Construction Kit source, schemas/notes, hashes and metadata, synthetic fixtures, tests and original Construction Kit brand assets.

## Verification protocol

Whenever a suspected field is promoted:

1. record fixture hash/name
2. record exact player action before/after
3. record exact changed offsets
4. record endian and width interpretation
5. update `knowledge.ts`
6. update save-map confidence
7. add regression coverage using synthetic or metadata-only fixtures
8. update this audit in the same checkpoint

## Ishar 2 corpus checkpoint — 2026-09-26

Six user-supplied DOS saves, each 8,359 bytes, were inspected locally. Original bytes and guide documents are excluded from Git. SHA-256: `TEST.SAV` `325b51dca70c76b1b5a199a9bdb66d788f4ea42602fbd8151c9779fffc3faa15`; `TEST2.SAV` `e81372549eb39c42e8caf042ddb72350bf815e5ef5b6eb829a20a260e41d3b25`; `FINALE.SAV` `2fc3a3d703e03b0e6bd9ded21247a5eeda175dd5ba7dd69fa904aaf9e3316c42`; `GRIMZ.SAV` `f901acf37abc91b34191c591f0f0a77e097d2801ed58e2b6c29cc8535b3b2630`; `GRIMZEL.SAV` `4b42d32b6a682bb71cd112d7a30d172114bf13117c63ad5d5fee76e57884d3bf`; `LEVELING.SAV` `dac7e0a405fa442aae6ec4fb01a3b1aec35a1b1777857c51f183f29def215c57`.

- **Known / confirmed codec behavior:** `losslessIdentityTest` with the Ishar 2 map and BE setting produced zero byte differences and `readbackOk: true` for all six saves. A synthetic editor operation, increasing slot 0 `hp` by one, changed only decimal offset 997 (`2D→2E` on TEST/TEST2, `4C→4D` on FINALE, `1A→1B` on GRIMZ, `57→58` on GRIMZEL, `EB→EC` on LEVELING), with successful readback. This establishes codec behavior, not game semantics.
- **Known / confirmed corpus difference:** TEST→TEST2 changes exactly offsets 967–972: `20 75 64 73 61 63` → `75 64 73 61 63 00`. `Kudsac` starts at offset 966 in TEST2; the full five-name layout is unknown.
- **Suspected / probable mapping:** Supplied `Ishar 2 HEX.docx` specifies zero-based decimal offsets 986–995 XP, 996–1005 current HP, 1016–1025 max HP, 1276–1285 class/race and 1291–1326 level/attributes. These form five-element arrays. BE yields plausible 16-bit values (FINALE XP `524,1364,1067,1348,1037`; HP `76,202,121,240,153`). No semantic field is promoted to `confirmed` solely on plausibility or an editor-written patch.
- **Gold remains suspected:** Candidate 1026–1035 BE pairs in FINALE are `0,487,0,0,0`; in TEST `300,0,0,0,0`. Adjacent 1006–1015 pairs are `0,854,0,0,0` and `39,0,0,0,0`. Ownership, secondary money field and exact semantics are unresolved. The present UI tooltip asserting per-character money is stronger than the evidence.
- **Source defects:** The guide prints portrait range `1476-1408` in reverse order and overlaps shooting/lockpicking at 7566. Treat these as unverified transcription or boundary issues. Its item IDs and class/race table are source claims, not corpus-confirmed semantics.
- **Other references:** Four supplied island documents contain embedded map images; `Die Charaktere.xls` lists names, classes, starting gold and some starting attributes. These are useful for later game-state checks, but values cannot be equated with arbitrary later saves.

Next decisive experiment: save in game immediately before and after changing exactly one observed value; record both hashes, displayed value, action and complete byte diff. Test gold independently and distinguish BE/LE with a value crossing a byte boundary.

## Older Ishar 1 Workbench archive — source triage, 2026-09-26

User supplied `Ishar-Workbench-v0.30.0-recon.zip` for local research. This is a separate Python/Tk editor and research snapshot, **not** the current canonical TypeScript app. Do not import its binaries, derived graphic/text dumps (`*.png`, `text-schema.json`, `tile-previews.json`, `inventory.json`) or original-game data into public Git without separate provenance review.

- `codec.py` provides an ALIS DOS A1 unpacker and a repacker that verifies its own decode. Its header-size branch (22 bytes for main module, 6 otherwise), dictionary of 8 bytes, bitstream and bounded backreferences merit independent cross-check against the current TypeScript packer. Python roundtrip alone does not prove DOS runtime compatibility. ALIS upstream is credited to `maestun/alis` at commit `19a95afdc07b45d997467806d4dd1bf83c5f8076`; review licensing before code reuse.
- `maps.py` asserts Ishar 1 `CONT1.FIC`–`CONT6.FIC` are 4,860-byte maps with dimensions 54 × 90 and file offset `x * 90 + y`, citing MAIN script `cdim/cfreadb` and ALIS `tabchar`. This is a **probable** Ishar 1 format hypothesis from a traced program and editor implementation; the original game files are absent here for an independent byte check. It must not be generalized to Ishar 2 (observed 10,800-byte CONT files).
- `CHARACTER-VALUES.md` maps Ishar 1 NPC templates in `EN1.FIC`, **not SAV**: 70-entry tables, big-endian vitality at `0x01a4 + 2 * id`, level at `0x0348 + id`, strength at `0x038e + id`, constitution `0x03d4 + id`, wisdom `0x041a + id`, intelligence `0x0460 + id`, agility `0x04a6 + id`. Aramir has ID 4. The notes claim a user-confirmed game test for the earlier 0.3 character changes, but this archive alone cannot independently reproduce it.
- `PROFILE-RESEARCH.md` additionally proposes `EN1.FIC` class `0x02bc + id`, race `0x0302 + id`, and recruitment inventory `0x0532 + 3 * id`. It warns that Aramir's starting class is hardcoded in `PARAM.IO` unless that script is also adapted. This is important for an eventual original-engine export path and separate from editing an existing save.
- `PREVIEW-QUEST-RESEARCH.md` links NPC 27 (Deloria), dialogue and several script state sites, explicitly leaves quest phases and reward semantics open. `PROJECT-AUDIT.md` is headed 0.18 despite archive name 0.30; it says object-spawn sources and phase semantics remain open and the writer is off. Treat versioned research notes individually, not as a blanket 0.30 validation.

Next: independently reproduce the bounded Ishar 1 map addressing and a small `EN1.FIC` field read against original files, if supplied; compare ALIS decoder edge behavior with the TypeScript implementation using synthetic legal and malformed streams. Keep save, template, script and runtime addresses in separate namespaces.

## 2026-09-26 — Red asset root cause reproduced and corrected

Local corpus: Ishar2.zip SHA-256
`ba90e28654e4532736e91b2070789be0f6f03fdbb1354d316a12a83a43461b54`.
Original files and rendered contact sheets remain outside the repository.

Confirmed implementation defect: the previous colorfulness ranking chose
MAIN.IO / #11 as the global scene palette. Its scene/actor banks contain solid
placeholder colors. The indexed graphics were intact. The second defect was
requiring local palettes to precede image resources; actor palette declarations
commonly follow their sprites. Resource-table order is not script execution order.

Static evidence (offsets are hexadecimal in the UNPACKED module, not SAV/file
addresses): ALIS cpalette is opcode 0x68; immediate-byte operand is 0x00.
Cross-checked against maestun/alis commit
19a95afdc07b45d997467806d4dd1bf83c5f8076, src/opcodes.c cpalette,
src/opernames.c oimmb, src/image.c topalette. No upstream code copied.

- FDJ1.IO +0x70: `68 00 02`, palette #2.
- FDJ2.IO +0x70: `68 00 01`, palette #1.
- FDJCAT.IO +0x96: `68 00 00`, palette #0.
- MAIN.IO around +0x1d60..0x1da8 loads DJCAT/FDJCAT, DJ1/FDJ1 and DJ2/FDJ2
  as corresponding module pairs. Combined with the palette calls and rendered
  indexed images, this supports the explicit scene mappings in palette-resolution.ts.
- FOND1.IO +0xee: palette #3; +0x102/#5 and +0x116/#4 are alternative states.
- FARBO.IO +0x12f: #1; FMONT.IO +0x151: #3; FVILLE.IO +0x14f: #0.
- MAIN.IO around +0x1689..0x1700 pairs FOND1/PLAINE1, FARBO/ARBO,
  FVILLE/VHOUSE2 and MONTAGNE/FMONT.
- GUARD3.IO has images before palette #22 (bank 160..175). Its script selects
  #22 at +0x1b7 and has alternatives #24/+0x1cb and #23/+0x1df.

Packed file SHA-256 identifiers:
- MAIN.IO: bfab5e9175931dbb1c2c51f0576092ef423e0bf950579340c8a1715e8cf8db95
- FDJ1.IO: 4316064fdc5c0a214de74c1c606c687316c8e4735825364b680f69a6abb82395
- FDJ2.IO: 32fb0eb7696c22f478f353789e07df8910958c2c7734042f63d0144b684c72a1
- FDJCAT.IO: ffd2e46e19bc2b9b6707359b079dcf218c3b7d9e8f7f5f8e7272b03389772049
- GUARD3.IO: 267b32ea639130a6e24e00f6a9a8bfeda048aea2e42ef1174909c47300189c4b

Measured against the same 2,244 decoded bitmaps and the same red-dominance
predicate: upstream HEAD resolver flagged 1,416; new resolver flags 18. The
remaining assets were inspected locally: fireballs, blood-like effects, small
warm-colored objects/UI fragments, and two tiny dungeon resources. Do not
force their original RGB values away from red. Red dominance is a diagnostic,
not proof of a palette error.

Visual verification: DJ1 #13, DJ2 #13, DJCAT #18 now retain detailed stone colors;
ARBO #69 is green; GUARD3 #2 shows colored armor rather than a red silhouette.
The actual browser Asset Lab completed the ZIP import with 141 A1 decodes,
2,244 bitmaps, 161 palettes, 866 local overlays, 1,378 external/base assignments,
500 composite previews and zero packed decode failures. DJ1 composite previews
including #59/#63 visibly retain their stone colors in the browser.

Evidence limits: first local palette and FOND1 #3 daylight fallback are explicit
preview policies. This is not emulation of every original time-of-day, animation,
scene or actor lighting state. Shared PCAVE assets are context-dependent. Their
exact active scene palette remains contextual, even though the placeholder-red
failure is removed. Ishar 1 logic and all save offsets are unchanged.

## User-supplied geometry/decor evidence — 2026-09-26

The user confirmed successful visual resolution of the red assets and supplied
77 scene composite IDs: DJ1.IO (58), DJ2.IO (19). Every ID exists in the local
ALIS composite tables. Exact IDs, copied preview dimensions and evidence limits
are recorded in [DUNGEON_ASSET_EVIDENCE.md](DUNGEON_ASSET_EVIDENCE.md).
This confirms the collective geometry/decor category, not individual placement,
perspective depth, wall/door semantics or tileability.

## 2026-09-26 — Automatic dungeon scene loading milestone

Implemented 24 runtime wall layers: DJ1 #47–50 (mirrored sides), #59–62 (fronts), DJ2 #35–38 and #47–50, four depths per role. These bypass the diagnostic gallery budget. DJ1 becomes the default when present; DJ2 is available as a separate tileset. Paired scene palettes remain active. Side openings suppress solid imported walls.

Evidence: resource-family expressions were inspected in local unpacked scripts: DJ1 cputnat at 0x19b5 uses 47+depth, cxputat at 0x1a2e mirrors it; front-family expression 59+depth at 0x196e. DJ2 equivalents at 0x124e / 0x12c7 and 0x1207. ALIS reference commit 19a95afdc07b45d997467806d4dd1bf83c5f8076, src/image.c sprite centering and src/render3d.c X/Z projection informed the reconstruction. Nested mirror transforms now negate child X. Runtime composites project centered X/Z; gallery previews retain their older diagnostic layout.

Evidence boundary: family indices and composite records are inspected facts. Assigning wall roles, interpreting the camera and fitting cropped images to CK perspective frames is a reconstruction, NOT pixel-perfect verified Ishar behavior. This milestone does not place every one of the user's 77 decor candidates. Floor/ceiling, door panels, extra wall variants and loose decor remain unresolved/fallback. Do not call a door-frame composite a closed door.

Local persistence: IndexedDB stores decoded PNG Blobs plus pack metadata, creates fresh object URLs on startup, preserves manual pack updates, and clears on unload. Revision guards prevent a stale restore overwriting a later selection; serialized writes prevent stale saves winning. Cache failures leave the current in-memory pack usable and expose a status message.

Optional local server boot source: set ISHAR_LOCAL_ZIP to a local ZIP path before running scripts/serve-build.mjs. Only the loopback 127.0.0.1 server serves the exact configured source at /__local/ishar-source; no path parameter, no CORS, cross-site requests rejected. Empty cache triggers automatic import on startup. Without this option, import once through Asset Lab. Pack unload clears the cache; with a configured boot source the next page load imports again. Browser storage is per origin/profile and can be evicted. Original assets and test screenshots stay outside Git.

Validation: npm run typecheck, test:a1, test:palettes, test:scenes and production build pass. Real Ishar2.zip loaded on page startup: 187 files, 3 tilesets, 284 layers, 24 dungeon walls, 2002 discovered previews, 0 missing entries. Direct navigation to /playtest restored the pack from browser cache and showed original ornamented side walls plus front wall. User-visible movement log reached Vorhalle; open side branches remained visible. Local preview runs on port 4175 with D:\Downloads\Ishar2.zip configured. Commit uses command-local Codex identity (repository has no user identity); no push.

Next: reconstruct original camera/screen parameters, scene variants and decor placement conditions before increasing automatic assignments. Add dedicated cache race/quota regression tests; current cache restore was checked in the real browser. Keep manual source overrides authoritative.

## 2026-09-26 — Wall transition correction and catalog clarification

User screenshots exposed gaps/stepped silhouettes: source side sprites have asymmetric transparency and empty padding columns (DJ1 #48 child1 has entirely transparent last column; #50 child3 has several). Mapping the full rectangle to a CK perspective band preserved that padding as a gap. Added wall-fitting.ts: exclude fully transparent columns, remap each visible vertical span to the shared near/far frame boundaries, nearest-neighbor sampling. This is explicitly a CK camera adaptation, not recovered original projection. Source pixel files and diagnostic gallery previews are unchanged; texture motifs between separately authored distance levels can still differ.

Cache sceneLayoutVersion 2 upgrades only auto-generated DJ1/DJ2 wall IDs, preserving user-authored rooms, overrides and other assets; upgraded pack goes through the serialized store writer. Fresh imports use the same fitter. No original game bytes committed.

Compared indexed child-image bytes for all eight DJ1/DJ2 pairs (47–50/35–38 and 59–62/47–50): all differ. Same dimensions do not imply duplicates. Runtime-assigned composites sort ahead of the other composite entries; these were not second copies added to the catalog. Gallery labels now distinguish active wall composites from component-based previews. Single bitmap resources remain separately catalogued for provenance.

Validation: typecheck, A1 fixtures, palette regressions, scene assignment and new mirrored near/far boundary tests, production build pass. Real cached pack migrated on /playtest; screenshot shows continuous fitted wall silhouettes without the former transparent strips. Exact original camera, doors, floor/ceiling and remaining decor stay open tasks.

## 2026-09-26 — FDJ surfaces and door surrounds

Added ALIS 0x01 opaque palette-index rectangles (bounded width/height+1). Evidence: ALIS reference image.c draw switch uses bitmap[1] as draw_rect color; local FDJ1 #1 header 01 01 ff 00 50 00 and FDJ2 #2 header 01 01 ff 00 5d 00. FDJ1 #3 references floor #0 and solid #1; FDJ2 #3 references floor #0 and solid #2. FDJ1 #0 is a 256x42 stone floor; FDJ2 #0 a 256x34 checkerboard floor. These are perspective strips, not repeatable tiles. Both floor and solid ceiling/background color are now explicit scene surface entries. Projection to the lower/upper CK viewport half remains a reconstruction.

Added DJ1 #63–66 / DJ2 #51–54 as open door surrounds at depths 0–3, using centered X/Z composites without wall silhouette fitting (which would destroy the aperture). Closed doors draw a procedural wooden placeholder leaf behind the original frame; this is NOT a verified original leaf. Open doors show the corridor through the aperture. Depth groups now render far to near so near doorframes occlude distant walls. Absolute floor/ceiling images are clipped to each depth polygon, preserving continuous perspective without overwriting foreground walls.

Cache sceneLayoutVersion 3: with the configured local ZIP, load new scene layers into the existing cached tilesets, retaining existing role/depth assignments, project edits and overrides. Revoke unused reimport URLs. Without a configured source, an older pack needs a ZIP reimport to acquire these additional assets; existing cached walls remain usable. The old pack is displayed while upgrading. Original asset bytes and local contact sheets remain outside Git.

Validation: typecheck; A1 fixtures; palette regressions; scene tests including solid rectangle pixels, opaque alpha semantics, truncated header rejection, open-frame role and perspective boundaries; production build. Browser verifies real cached-pack upgrade with stone floor and dark ceiling. Isolated fixture uses actual exported DungeonViewport plus cached pack, no user-project mutations: closed door stops at one segment, open door shows four segments and corridor through the original arch. The separate fixture was temporary. Original leaf animation and exact original camera remain open.

## 2026-09-26 — Native dungeon placement replaces silhouette fitting

User correctly reported a wavy frieze and wrong ceiling/door geometry. The previous per-column silhouette fitter only aligned outer edges, distorting internal art. It is now bypassed for fresh DJ1/DJ2 scene imports. Native images retain their pixel dimensions and transparent padding; no independent resizing/warping of distance sprites.

New evidence: DJ1 code 0x2270/0x2284/0x2297/0x22aa and DJ2 corresponding tail code set word var0x12 to signed -42, -25, -12, -7 for the first four distance tiers. Both modules have byte-identical tail sequences for this projection. ALIS centers against the stored width/height (actual decoded dimension minus one), so centering was also off by one for even dimensions. Apply parent Z before placement. Screen origin (127,65) is reconstructed from exact bitmap joins, not yet independently verified against a captured original frame. E.g. DJ1 front depth1 has upper center piece rows0..27, lower rows28..80, sides span x82..97 and158..173. Front frame bounds in source pixels: [32,0,224,102], [82,0,174,81], [98,0,158,75], [106,0,150,71]. FDJ1 floor stays at y71 with height42; FDJ2 at y79 with height34. A fabricated sloped ceiling band above the walls is no longer drawn. Solid scene background fills exposed areas behind native geometry.

Cache revision4 reimports configured local original source and replaces only generated layer IDs; authored overrides and project rooms remain. Legacy/non-native tilesets retain CK projection. Without configured source, old caches require reimport to receive native coordinates. Legacy fitter remains only for old cache migration fallback and is not used for revision4 scenes.

Validation: long isolated corridor shows four native wall distances without the previous downward frieze wave. Closed original arch+placeholder leaf renders one depth, open arch passes view to four depths. Fixture does not modify user project. Native seam/centering tests added; typecheck, A1, palette, scene tests and production build passed. Ceiling interpretation/source origin remain documented reconstruction; the procedural closed wooden leaf is still NOT original Ishar door artwork.

## 2026-09-26 — Side-passage graphics and door-leaf audit

Mapped DJ1 #73–76 as side-passage arch/column overlays for four corridor depths,
mirroring them for the opposite side. The passage role and projection are
reconstruction, whereas the bitmap contents are directly inspected. Removed
the duplicate aperture polygon and its bright synthetic outline when original
passage art is present. The cached pack migration now updates composite
previews and role labels along with layers, preserving existing preview URLs.

Rejected a tentative DJ1 #114–116 closed-door assignment after component
inspection and fixture rendering showed hanging chain lamps. DJ1 #117–119 are
related variants; DJ2 #77–80 are stained-glass panels. None is evidence of a
generic closed door leaf. Original open surrounds remain DJ1 #63–66 / DJ2
#51–54, and the closed leaf remains a procedural placeholder. No original
resource bytes were committed.

Typecheck, A1 fixtures, palette regressions, scene assignments and production
build passed. The real browser cache reimported successfully: all four DJ1
right-passage roles are loaded, the false closed-door layers are gone, and the
catalogue explicitly distinguishes reconstructed arches, hanging lamps and
stained glass. Visual corridor and closed-door fixtures show the corresponding
rendering without touching the user's authored project.

## 2026-09-27 — Library and world evidence boundary

`VHOUSE1.IO` and `VHOUSE2.IO` previews include perspective house facades and doors. The current outdoor picker exposes them as scenery but does not claim original camera positions or world placement. `FRISE.IO` contains HUD graphics; the party strip currently uses #36 as an action header and #1 as a life strip, inferred from their shapes and the supplied [part 31 gameplay view](https://www.youtube.com/watch?v=FOFb6Nt0mE8&t=10s). `MAIN.IO` #1–112 have glyph-like bitmap previews, but character mapping is unverified. `DJFONT.IO` previews show hanging lamps, so its filename is not evidence of a text font.

The filled side-branch recess is a CK rendering heuristic. It uses the next-depth front-wall sprite behind an inset aperture because the previous branch showed a large black void. Topology and original DJ1 arch assets are retained, but there is no claim that this backing matches the original ALIS draw sequence. The multi-cell room and wall-free outdoor projections are likewise authored toolkit behavior rather than verified original Ishar geometry.

## 2026-09-27 — Passage and HUD follow-up

The former synthetic black side-opening polygon and recess floor wedge were CK render constructs, and are now removed. Imported DJ1 passage art and original open-door surrounds are placed at eligible side/room boundaries, with a clipped backing wall. The resource identification is unchanged; placement in the CK room camera and the backing remain heuristic. The new level/portal model is authored CK functionality, not a recovered original Ishar world-file specification.

Original `FRISE.IO` action/life graphics are interactive buttons around CK command panels. Browser-tested actions include a portal trip, level-specific DJ2 scenery, an opened map panel and a two-character combat round with independent HP. The original HUD's remaining graphics, keyboard/mouse bindings and `MAIN.IO` glyph encoding have not been established. Do not label the current UI as a complete original reconstruction.

## 2026-09-28 — FORET1 distance families and Akeers grid-map evidence

Inspection of the locally decoded `FORET1.IO` composite sheet identifies two contiguous near-to-far tree series: #24–30 and #31–37. Their preview dimensions descend from 288×114 to 32×68 and from 208×114 to 16×48 respectively. The former CK renderer mixed members from both series for one tree and enlarged distant sprites after selection, obscuring the source's own size progression. The current four-band sampling uses #25/#26/#28/#30 for the first family and #32/#33/#35/#37 for the second at native source-to-viewport scale. Those groupings and dimensions are observed in decoded assets; the precise four distance thresholds and the choice of samples remain CK heuristics, not a recovered ALIS draw algorithm.

The [Ollivision Ishar 2 walkthrough](https://www.ollivision.de/kl/i/ishar2.htm) embeds a hand-drawn [Akeers Island grid map](https://www.ollivision.de/kl/i/gfx/pic7.gif). Its hatched wall areas visibly occupy whole graph-paper cells between paths and rooms. This supports modeling solid cells as an authored dungeon option and aligns with the user's earlier wall-cell hypothesis. It is a secondary map illustration, not a dump of the original map data or proof that every doorway and wall uses exactly one internal game cell. Do not automatically rewrite existing traversable CK room edges from this illustration alone.

## 2026-09-28 — Near-tree projection and cut-top evidence

The next three user screenshots exposed two CK placement faults, not a new resource identification. `Sumpf 1,1` south shows a near `FORET1 #32` root on the cell immediately ahead; after stepping onto that cell and facing north, the old same-cell rule placed the same 320-pixel-wide resource at X=610, leaving only 30 pixels inside the 640-pixel viewport. The fixed subcell point is actually slightly ahead and right from that second camera, so its image should remain substantially visible. The new near projection follows that offset with a larger close-range lateral factor. The factor is a CK camera approximation; the original game's near-cell projection is unknown.

The `FORET1` #25/#26/#32/#33 near and middle composites have a cut top by design: the trunk continues above the source bitmap. In the `Sumpf 4,2` west view, #26/#33 previously began 10–58 viewport pixels below the top border, exposing their straight top edge. `swampTreeDisplayHeight` extends only these cut-top near/middle variants vertically until their top lies eight pixels above the viewport; complete far variants retain native display height. This is a CK placement correction, not evidence that the original renderer stretched these pixels.

## 2026-09-28 — Swamp anchor continuity evidence boundary

The two user screenshots at `Sumpf 2,2` and `Sumpf 2,3`, both west-facing, support the requirement that the same nearby tree retain its identity as the camera crosses a grid boundary. Browser inspection identified one fixed tree in both views. The current CK projection gives it one shared vertex world point and the same `FORET1 #32` 320-pixel near asset at both camera positions; its image shifts from the left to the right edge. Regression checks also cover a tree centered in a cell from each cardinal neighbor and a vertex tree from all four adjoining cells. These are CK scene-graph invariants, not verified original Ishar coordinate or collision rules. The exact corner/center distribution, view-plane clipping and sprite occlusion remain inferred.

## 2026-09-28 — Limited tree families and same-cell camera rule

The latest user screenshots reveal that drawing a tree whose anchor equals the player's exact grid point produces the *same* frontal root in all four compass directions. The revised CK renderer suppresses that coincident billboard; the tree remains visible from neighboring cells. A side-neighbor tree is now placed mostly inside the frame. The decoded `FORET1` composite sheet still supports only two distinct near-to-far tree families (#24–30 and #31–37) for this swamp reconstruction. The 5×5 test now spaces seven trees and alternates those families across adjacent large-tree cells. This avoids obvious duplicate neighbors without claiming additional original tree models. The density and side position are CK heuristics pending original script placement evidence.
