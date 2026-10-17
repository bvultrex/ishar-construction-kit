# Ishar Construction Kit

Current reconstruction scope (2026-10-17): both Ishar 1 and Ishar 2. Start with
[the reconstruction plan](docs/reconstruction/PLAN.md),
[original inventory](docs/reconstruction/INVENTORY.md),
[verified status](docs/reconstruction/STATUS.md) and
[format coverage](docs/reconstruction/FORMATS.md). The current hash-bound map
export workflow is described in [MOD_WORKFLOW.md](docs/reconstruction/MOD_WORKFLOW.md). The playable slice below is
a historical milestone, not completion of the reconstruction project.


An audit-first construction-kit workbench for researching and authoring new Ishar-style RPG content.

The project is intentionally **not** a distribution of Ishar game data. Original game files are used only as local user-supplied reverse-engineering fixtures and are excluded from Git.

## Recovery checkpoint

The source was recovered on 2026-09-25 from a Grok App Builder workspace export after the chat-side project state became unavailable.

The recovery checkpoint is now **standalone and buildable**:

- Ishar 1 / Ishar 2 candidate save maps restored
- surgical save patch/readback/diff core restored
- Silmarils file classification and old-packer groundwork restored
- Zustand project/store state restored
- Overview, Character Lab, File Lab, Knowledge and Project routes restored
- Character Lab loads local `.SAV` files and exports patched copies
- File Lab inventories local ZIPs/files without uploading original data
- `npm run typecheck` passes
- `npm run build` passes

Start here:

- [PROJECT_STATE.md](PROJECT_STATE.md)
- [HANDOFF.md](HANDOFF.md)
- [AUDIT.md](AUDIT.md)
- [NEXT_STEPS.md](NEXT_STEPS.md)


## First playable slice

The workbench/playable-slice branch / draft PR #1 contains the first end-to-end original project workflow: edit a tiny adventure in **Adventure Builder**, validate references, run it in **Playtest**, and export/reopen the project JSON. Original Ishar files are still used only by the research labs and are not required for this authored runtime path.

## Local development

Use a Git checkout of `workbench/playable-slice`, not the downloadable test-build
folder (which contains compiled output only). Run commands from the checkout root.
Use Node.js 22.18+ or Node.js 24 LTS; the decoder test imports TypeScript directly.

```powershell
npm ci
npm run typecheck
npm run test:a1
npm run build
node scripts/serve-build.mjs
```

Open http://127.0.0.1:4173 for the production build. For development with hot
reload, use `npm run dev` and the URL printed by Vite. Dependencies are pinned
in `package-lock.json`; commit intentional dependency updates together with it.

Original game archives stay local. The current manual regression gate is to import
Ishar 2, repeatedly open the Builder wall/floor/ceiling selectors, narrow results
by resource name, select a surface and check it in Playtest. Also inspect the
verified mushroom distance family #232/#233/#234 at near/mid/far distances.

### Local asset autoload

Imported asset packs are cached in IndexedDB and restored when the app loads, including direct visits to Playtest. Asset Lab shows cache status. Browser storage limits/clearing can require another import. Original files are not committed or sent to a remote service.

For the local production server, optionally set `ISHAR_LOCAL_ZIP` to the absolute path of an Ishar ZIP before running `node scripts/serve-build.mjs`. With an empty cache it imports that ZIP automatically. This source is available only with the loopback host `127.0.0.1`. Clearing a pack clears the browser cache; a configured ZIP will import again on the next page load.

Ishar 2 DJ1/DJ2 wall families are assigned automatically. Their placement uses native sizes and script depth offsets; the common screen origin remains reconstructed; FDJ floors, solid ceiling colors and original door surrounds are integrated. Closed door leaves and unresolved decor still use fallback graphics.

### Levels and playtest controls

Adventure Builder now keeps separate coordinate grids for Dungeon, House and Overworld levels. Use **Level anlegen** from a selected field to create a new level and a two-way transition; choose its asset set in the level panel. Existing project files migrate their original map to `level-1` when opened. Locations can still override a level's scene type or surface assets.

In Playtest, the party portraits open character status, action strips open usable commands, and the menu opens inventory, map and quest views. Additional party members can be added in Builder; the selected living member attacks and receives the counterattack. Level transitions appear beside the navigation controls. The current HUD uses a few original `FRISE.IO` pieces, while its full layout and the original bitmap-font character encoding remain research tasks.
