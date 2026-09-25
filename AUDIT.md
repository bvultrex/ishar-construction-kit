# Ishar Construction Kit — Audit Ledger

Recovered 2026-09-25 from the user-provided Grok workspace export.

This file records what is actually present and which claims still need evidence.

## Recovery provenance

The user upload contains multiple Grok workspace fragments that combine into one App Builder workspace. The public GitHub repository did not contain the implementation before recovery.

## Confirmed present in code

- byte-level u16 read/write with selectable endian
- field-level reads/writes driven by `SaveMap`
- five-member party decoding architecture
- controlled party patching from original byte buffers
- byte diff utility
- lossless identity test helper
- demo save generator and internal self-test routine
- Ishar 1 and Ishar 2 save-map definitions
- inventory-slot representation
- ZIP/loose-file inventory pipeline
- DOS MZ detection and string extraction
- Shannon entropy helper
- Silmarils packed-file header detection
- old Silmarils RLE unpack routine
- versioned `.ishar-ck-project` conceptual project model
- evidence ledger and phased RE roadmap

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
- standalone runtime/export format

## Corpus audit

### Ishar 1

SHA-256: `ddaac10886bc369b2aa12a396196268e89a92a74d9adb7fa964b2044de65459b`

Observed: 5,216-byte saves, 4,860-byte `CONT*.FIC`, 3,640-byte `EN1.FIC`, 361-byte `TAB1.FIC`, multilingual message/text files and multiple saves suitable for differential analysis.

### Ishar 2

SHA-256: `ba90e28654e4532736e91b2070789be0f6f03fdbb1354d316a12a83a43461b54`

Observed: usually 8,359-byte saves, a 5,216-byte `IMP2.SAV` useful for I→II import investigation, 10,800-byte `CONT*.FIC`, 6,050-byte `EN1.FIC`, multilingual message/text files and several staged saves.

### Recovery insight

A prior note cites a public claim that `Cont1.fic` can be a 60-byte island map. The supplied DOS corpora contain much larger `CONT*.FIC` files. Therefore that claim is not globally applicable and must remain contextual/suspected until platform/version/sectioning is understood.

## Type/build audit

`tsc --noEmit` currently reports:

- `src/lib/ishar/knowledge.ts`: invalid `EvidenceKind` literal `probable`
- `src/lib/ishar/save-codec.ts`: widened inventory slot `kind` type
- `src/lib/utils.ts`: typed-array-to-`BlobPart` incompatibility

Front-end route/entry files are absent from the recovery snapshot. The project is therefore recovered **core + scaffold**, not yet a complete app.

## Brand audit

Present: `public/favicon.svg` keep/fortress mark.

Missing: `public/og.jpg`, `src/lib/og/site.json`.

Do not create `x-banner.jpg`; this product is not a game.

## Repository hygiene

Never commit original Ishar archives, extracted game files, manuals, music, maps, icons or character art, nor `node_modules/`.

Allowed: original Construction Kit source, RE notes/schemas, synthetic fixtures, local-fixture hashes/metadata, and original Construction Kit brand assets.

## Audit update rule

Whenever a suspected field is verified:

1. record fixture hash/name
2. record before/after user action
3. record exact changed offsets
4. record endian/width interpretation
5. update `knowledge.ts`
6. update save-map confidence
7. add regression coverage
8. update this audit
