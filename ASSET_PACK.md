# Ishar Construction Kit — Local Asset Packs

The runtime can render external image layers without committing original game graphics to this repository.

## Safety and ownership boundary

- Keep original Ishar archives and extracted graphics local.
- Do not commit extracted copyrighted assets.
- The browser creates temporary Blob URLs for imported images.
- Project JSON stores only the expected `assetPackId` and optional location `tilesetId` values.
- After a browser reload, re-import the local pack in Asset Lab.

## Import methods

Asset Lab accepts:

1. one ZIP containing a manifest and images; or
2. a selected local folder containing the same structure.

Recognized manifest names:

- `manifest.json`
- `asset-pack.json`
- `ishar-assets.json`

Use the **Beispielmanifest** button in Asset Lab to download a starter schema.

## Manifest v1

```json
{
  "format": "ishar-ck-asset-pack",
  "version": 1,
  "id": "my-local-dungeon",
  "name": "My Local Dungeon",
  "viewport": { "width": 640, "height": 400 },
  "defaultTilesetId": "stone",
  "shared": [],
  "tilesets": [
    { "id": "stone", "name": "Stone", "entries": [] }
  ]
}
```

Each entry has:

- `id`: unique within the pack
- `role`: semantic render role
- `file`: path relative to the manifest
- optional `depth`: 0–3 for perspective layers
- optional `targetId`: authored encounter/item/portrait ID
- optional `x`, `y`, `width`, `height`: destination rectangle in manifest viewport coordinates
- optional `opacity`

Supported roles:

- `viewport.background`
- `surface.ceiling`
- `surface.floor`
- `wall.front`
- `wall.left`
- `wall.right`
- `opening.left`
- `opening.right`
- `door.front.closed`
- `door.front.open`
- `encounter`
- `item`
- `portrait`

## Runtime fallback

Asset packs are deliberately sparse-friendly. If a role/depth is absent or its file is missing, the existing SVG crawler geometry stays visible. This allows gradual conversion from placeholder geometry to extracted or newly authored art.

## Tilesets

A location may set `tilesetId`. If blank, the pack's `defaultTilesetId` is used. This lets one project mix areas such as crypt, forest, fortress or cave without changing the grid/runtime model.

## Ishar compatibility track

The generic asset system does not claim knowledge of proprietary Ishar graphics formats. The next compatibility step is to map verified extracted source graphics into this manifest vocabulary, then automate extraction only where the binary format is reproducibly understood.


## Ishar-specific source mapping

Asset Lab can reuse the File Lab inventory and present conservative source candidates. This is intentionally a **mapping queue**, not a decoder:

- known text/system IO files are excluded from the graphics candidate queue;
- packed IO resources are marked only as `possible`, because ALIS containers may contain code, graphics, text or music;
- FIC files remain world/map-data candidates unless direct evidence proves image content;
- unknown resources remain `unknown`;
- old-packer candidates can proceed to the existing decoder for inspection;
- A1/new-packer candidates remain blocked on reproducible decoding.

The eventual Ishar importer should produce the generic asset-pack manifest as its output. The crawler runtime therefore does not need Ishar-specific binary knowledge.
