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
