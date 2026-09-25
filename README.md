# Ishar Construction Kit

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
