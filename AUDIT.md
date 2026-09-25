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
