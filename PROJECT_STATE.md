# Ishar Construction Kit — Project State

Recovered: 2026-09-25  
Source: user-provided `GROK files.zip`  
Recovery status: **usable development snapshot, incomplete application shell**

## Product goal

Build a creative construction-kit workbench for authoring new Ishar-style RPG content while preserving the characteristic data-driven systems the project can verify from Ishar 1 and Ishar 2. This is an editor/workbench, not a game and not a simple save editor.

Long-term modules: characters, items/inventories, magic, world/maps, NPCs/enemies, quests/flags/dialogue, assets, and build/export.

The reverse-engineering policy is evidence-first: confirmed facts, probable interpretations and unknowns must remain distinguishable.

## Recovered domain code

The Grok workspace contains a substantial Ishar-specific TypeScript core under `src/lib/ishar/`:

- binary inspection, entropy, strings and DOS MZ hints
- file classification and ZIP/loose-file inventory
- evidence/knowledge ledger and phased RE plan
- versioned Construction Kit project model
- save decoding, controlled patching, byte diffing and identity tests
- Ishar 1 / Ishar 2 candidate save maps
- Silmarils packed-script detection and old-packer decode path
- domain types

`src/lib/store.ts` contains Zustand state for game/endian selection, save loading, party state, inventory, binary-lab state and Construction Kit project state.

Approximate recovered Ishar-domain size: **2,200+ lines of TypeScript**.

## Module readiness

| Module | Status | Notes |
| --- | --- | --- |
| Character | partial | Candidate Ishar 1/2 save maps + surgical patch architecture exist; real-save verification still required. |
| Item | audit | Inventory slots represented; complete item table not decoded. |
| Magic | audit | Candidate Ishar 2 spell-byte region exists; semantics remain open. |
| World | planned | `.FIC` hypothesis documented, no generalized codec/editor yet. |
| NPC | planned | No decoded schema yet. |
| Quest | planned | No verified flag schema yet. |
| Dialogue | planned | `TEXTIN*.IO` / `MESSAGE*.IO` targets identified. |
| Asset | planned | Inventory/classification groundwork exists. |
| Build | planned | Project format exists; no standalone new-game pipeline yet. |

## Local original-game corpus

The recovery upload contains user-provided local fixtures that must **not** be committed:

- `Ishar1.zip`: 122 files, SHA-256 `ddaac10886bc369b2aa12a396196268e89a92a74d9adb7fa964b2044de65459b`
- `Ishar2.zip`: 187 files, SHA-256 `ba90e28654e4532736e91b2070789be0f6f03fdbb1354d316a12a83a43461b54`

Observed corpus facts:

- Ishar 1 saves are commonly 5,216 bytes.
- Ishar 2 saves are commonly 8,359 bytes.
- Ishar 1 `CONT1.FIC`–`CONT6.FIC`: 4,860 bytes each.
- Ishar 2 `CONT1.FIC`–`CONT7.FIC`: 10,800 bytes each.
- Both corpora contain `MAIN.IO`, `PARAM.IO`, `OBJET.IO`, multilingual `MESSAGE*.IO`, `TEXTIN*.IO`, `START.STP` and `start.exe`.

## Brand state

Recovered: `public/favicon.svg`, a crisp keep/fortress mark using dark stone and copper with sage detail.

Not present in the recovered snapshot: `public/og.jpg` and `src/lib/og/site.json`.

No X game banner is required because this product is a website/tool, not a game.

## UI/application shell state

The recovery package does **not** contain `src/routes/`, `src/router.tsx`, or completed core pages. The critical continuation point is therefore **Store → UI shell → core workbench pages**.

## Type/build status at recovery

`tsc --noEmit` reports three known issues:

1. `knowledge.ts`: evidence kind uses `"probable"` although `EvidenceKind` allows `known | suspected | unknown`.
2. `save-codec.ts`: generated inventory data widens `kind` to `string`.
3. `utils.ts`: typed-array-to-`BlobPart` incompatibility under current DOM typings.

These are type-hardening issues, not proof that the binary model is wrong.

## Immediate target

1. Preserve recovery state and audit in GitHub.
2. Fix the three TypeScript errors without changing binary semantics.
3. Restore missing OG identity.
4. Restore TanStack app shell/routes.
5. Build Overview, Character Lab, File Lab, Knowledge and Project pages.
6. Validate the candidate maps against the local Ishar 1/2 corpus.
