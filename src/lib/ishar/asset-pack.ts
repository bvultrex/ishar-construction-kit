import JSZip from "jszip";
import type { DungeonAssetEntry, DungeonAssetManifest, DungeonAssetRole, DungeonAssetDepth } from "./types";

export interface DiscoveredAssetPreview {
  id: string;
  path: string;
  url: string;
  source: "standard" | "alis";
  assetKind?: "sprite" | "terrain" | "composite";
  paletteStatus?: "embedded" | "global" | "default";
  visualStatus?: "normal" | "flat-color";
  width?: number;
  height?: number;
  suggestedRole?: DungeonAssetRole;
  runtimeAssigned: boolean;
}

export interface LoadedAssetPack {
  manifest: DungeonAssetManifest;
  urls: Record<string, string>;
  paths: Record<string, string>;
  missingEntryIds: string[];
  sourceLabel: string;
  fileCount: number;
  discoveredAssets?: DiscoveredAssetPreview[];
}

const MANIFEST_BASENAMES = new Set(["manifest.json", "asset-pack.json", "ishar-assets.json"]);
const ROLES = new Set<DungeonAssetRole>([
  "viewport.background", "surface.ceiling", "surface.floor", "wall.front", "wall.left", "wall.right",
  "opening.left", "opening.right", "door.front.closed", "door.front.open", "encounter", "item", "portrait",
]);

function normalizePath(path: string) {
  return path.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+/g, "/");
}

function basename(path: string) {
  const parts = normalizePath(path).split("/");
  return parts[parts.length - 1] ?? "";
}

function dirname(path: string) {
  const normalized = normalizePath(path);
  const index = normalized.lastIndexOf("/");
  return index < 0 ? "" : normalized.slice(0, index);
}

function join(base: string, child: string) {
  const clean = normalizePath(child);
  if (!base || clean.startsWith("/")) return clean.replace(/^\//, "");
  return normalizePath(base + "/" + clean);
}

function isManifestPath(path: string) {
  return MANIFEST_BASENAMES.has(basename(path).toLowerCase());
}

function numberOrUndefined(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function validateEntry(raw: unknown, path: string): DungeonAssetEntry {
  if (!raw || typeof raw !== "object") throw new Error(path + " ist kein gültiger Asset-Eintrag.");
  const value = raw as Partial<DungeonAssetEntry>;
  if (!value.id || typeof value.id !== "string") throw new Error(path + ".id fehlt.");
  if (!value.file || typeof value.file !== "string") throw new Error(path + ".file fehlt.");
  if (!value.role || !ROLES.has(value.role)) throw new Error(path + ".role ist unbekannt.");
  const depth = value.depth;
  if (depth !== undefined && ![0, 1, 2, 3].includes(depth)) throw new Error(path + ".depth muss 0–3 sein.");
  return {
    id: value.id,
    role: value.role,
    file: normalizePath(value.file),
    depth,
    x: numberOrUndefined(value.x),
    y: numberOrUndefined(value.y),
    width: numberOrUndefined(value.width),
    height: numberOrUndefined(value.height),
    opacity: numberOrUndefined(value.opacity),
    targetId: typeof value.targetId === "string" && value.targetId.trim() ? value.targetId : undefined,
    renderMode: value.renderMode === "texture" ? "texture" : "layer",
    tileWidth: numberOrUndefined(value.tileWidth),
    tileHeight: numberOrUndefined(value.tileHeight),
  };
}

export function parseAssetManifest(raw: unknown): DungeonAssetManifest {
  if (!raw || typeof raw !== "object") throw new Error("Asset-Manifest ist kein Objekt.");
  const value = raw as Partial<DungeonAssetManifest>;
  if (value.format !== "ishar-ck-asset-pack" || value.version !== 1) throw new Error("Nicht unterstütztes Asset-Pack-Format.");
  if (!value.id || typeof value.id !== "string") throw new Error("Asset-Pack-ID fehlt.");
  if (!value.name || typeof value.name !== "string") throw new Error("Asset-Pack-Name fehlt.");
  if (!value.viewport || !Number.isFinite(value.viewport.width) || !Number.isFinite(value.viewport.height) || value.viewport.width <= 0 || value.viewport.height <= 0) {
    throw new Error("Viewport-Größe im Asset-Manifest ist ungültig.");
  }
  if (!Array.isArray(value.tilesets) || value.tilesets.length === 0) throw new Error("Mindestens ein Tileset wird benötigt.");
  const tilesets = value.tilesets.map((tileset, index) => {
    if (!tileset || typeof tileset !== "object" || !tileset.id || !tileset.name || !Array.isArray(tileset.entries)) {
      throw new Error("tilesets[" + index + "] ist ungültig.");
    }
    return {
      id: String(tileset.id),
      name: String(tileset.name),
      entries: tileset.entries.map((entry, entryIndex) => validateEntry(entry, "tilesets[" + index + "].entries[" + entryIndex + "]")),
    };
  });
  const defaultTilesetId = typeof value.defaultTilesetId === "string" ? value.defaultTilesetId : tilesets[0]!.id;
  if (!tilesets.some((tileset) => tileset.id === defaultTilesetId)) throw new Error("defaultTilesetId verweist auf kein Tileset.");
  const shared = Array.isArray(value.shared) ? value.shared.map((entry, index) => validateEntry(entry, "shared[" + index + "]")) : [];
  const ids = new Set<string>();
  for (const entry of [...shared, ...tilesets.flatMap((tileset) => tileset.entries)]) {
    if (ids.has(entry.id)) throw new Error('Asset-ID "' + entry.id + '" ist doppelt.');
    ids.add(entry.id);
  }
  return {
    format: "ishar-ck-asset-pack",
    version: 1,
    id: value.id,
    name: value.name,
    viewport: { width: value.viewport.width, height: value.viewport.height },
    renderProfileId: ["construction", "ishar1-dos", "ishar2-dos", "custom"].includes(value.renderProfileId ?? "") ? value.renderProfileId : undefined,
    pixelAspectY: typeof value.pixelAspectY === "number" && Number.isFinite(value.pixelAspectY) && value.pixelAspectY > 0 ? value.pixelAspectY : undefined,
    defaultTilesetId,
    shared,
    tilesets,
  };
}

function manifestEntries(manifest: DungeonAssetManifest) {
  return [...manifest.shared, ...manifest.tilesets.flatMap((tileset) => tileset.entries)];
}

async function assemblePack(
  manifestPath: string,
  manifest: DungeonAssetManifest,
  sourceLabel: string,
  fileCount: number,
  loadBlob: (path: string) => Promise<Blob | undefined>,
): Promise<LoadedAssetPack> {
  const base = dirname(manifestPath);
  const urls: Record<string, string> = {};
  const paths: Record<string, string> = {};
  const missingEntryIds: string[] = [];
  for (const entry of manifestEntries(manifest)) {
    const path = join(base, entry.file);
    const blob = await loadBlob(path);
    if (!blob) {
      missingEntryIds.push(entry.id);
      continue;
    }
    urls[entry.id] = URL.createObjectURL(blob);
    paths[entry.id] = path;
  }
  return { manifest, urls, paths, missingEntryIds, sourceLabel, fileCount };
}

async function fromZip(file: File): Promise<LoadedAssetPack> {
  const zip = await JSZip.loadAsync(file);
  const paths = Object.keys(zip.files).filter((path) => !zip.files[path]!.dir).map(normalizePath);
  const manifestPath = paths.find(isManifestPath);
  if (!manifestPath) throw new Error("ZIP enthält kein manifest.json, asset-pack.json oder ishar-assets.json.");
  const manifestFile = zip.files[manifestPath];
  if (!manifestFile) throw new Error("Manifest konnte im ZIP nicht gelesen werden.");
  const manifest = parseAssetManifest(JSON.parse(await manifestFile.async("text")));
  return assemblePack(manifestPath, manifest, file.name, paths.length, async (path) => {
    const entry = zip.files[path];
    return entry ? entry.async("blob") : undefined;
  });
}

async function fromLooseFiles(files: File[]): Promise<LoadedAssetPack> {
  const byPath = new Map<string, File>();
  for (const file of files) {
    const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
    byPath.set(normalizePath(relative || file.name), file);
  }
  const manifestPath = [...byPath.keys()].find(isManifestPath);
  if (!manifestPath) throw new Error("Auswahl enthält kein manifest.json, asset-pack.json oder ishar-assets.json.");
  const manifestFile = byPath.get(manifestPath)!;
  const manifest = parseAssetManifest(JSON.parse(await manifestFile.text()));
  const rootName = normalizePath((files[0] as File & { webkitRelativePath?: string } | undefined)?.webkitRelativePath || "").split("/")[0];
  return assemblePack(manifestPath, manifest, rootName || files.length + " lokale Datei(en)", files.length, async (path) => byPath.get(path));
}

export async function loadAssetPack(files: File[]): Promise<LoadedAssetPack> {
  if (!files.length) throw new Error("Keine Asset-Dateien ausgewählt.");
  if (files.length === 1 && files[0]!.name.toLowerCase().endsWith(".zip")) return fromZip(files[0]!);
  return fromLooseFiles(files);
}

export function revokeAssetPack(pack: LoadedAssetPack | null) {
  if (!pack) return;
  const urls = new Set([
    ...Object.values(pack.urls),
    ...(pack.discoveredAssets ?? []).map((asset) => asset.url),
  ]);
  for (const url of urls) URL.revokeObjectURL(url);
}

export function assetFor(
  pack: LoadedAssetPack | null,
  role: DungeonAssetRole,
  depth?: DungeonAssetDepth,
  tilesetId?: string,
  targetId?: string,
) {
  if (!pack) return undefined;
  const tileset = pack.manifest.tilesets.find((candidate) => candidate.id === tilesetId)
    ?? pack.manifest.tilesets.find((candidate) => candidate.id === pack.manifest.defaultTilesetId)
    ?? pack.manifest.tilesets[0];
  const pools = [tileset?.entries ?? [], pack.manifest.shared];
  for (const entries of pools) {
    const candidates = [
      entries.find((entry) => entry.role === role && entry.depth === depth && entry.targetId === targetId && pack.urls[entry.id]),
      entries.find((entry) => entry.role === role && entry.depth === depth && entry.targetId === undefined && pack.urls[entry.id]),
      entries.find((entry) => entry.role === role && entry.depth === undefined && entry.targetId === targetId && pack.urls[entry.id]),
      entries.find((entry) => entry.role === role && entry.depth === undefined && entry.targetId === undefined && pack.urls[entry.id]),
    ];
    const match = candidates.find(Boolean);
    if (match) return { entry: match, url: pack.urls[match.id]! };
  }
  return undefined;
}

export function exampleAssetManifest(): DungeonAssetManifest {
  return {
    format: "ishar-ck-asset-pack",
    version: 1,
    id: "my-local-dungeon",
    name: "My Local Dungeon",
    viewport: { width: 640, height: 400 },
    defaultTilesetId: "stone",
    shared: [
      { id: "guardian", role: "encounter", targetId: "guardian", file: "monsters/guardian.png", x: 230, y: 105, width: 180, height: 230 },
      { id: "pickup", role: "item", file: "items/pickup.png", x: 455, y: 245, width: 90, height: 110 },
    ],
    tilesets: [
      {
        id: "stone",
        name: "Stone",
        entries: [
          { id: "stone-bg", role: "viewport.background", file: "stone/background.png" },
          { id: "stone-front-0", role: "wall.front", depth: 0, file: "stone/front-0.png" },
          { id: "stone-left-0", role: "wall.left", depth: 0, file: "stone/left-0.png" },
          { id: "stone-right-0", role: "wall.right", depth: 0, file: "stone/right-0.png" },
          { id: "stone-open-left-0", role: "opening.left", depth: 0, file: "stone/open-left-0.png" },
          { id: "stone-open-right-0", role: "opening.right", depth: 0, file: "stone/open-right-0.png" },
        ],
      },
    ],
  };
}


function demoSvg(label: string, depth: number, kind: "background" | "front" | "left" | "right" | "door" | "enemy" | "item") {
  const palettes = {
    background: ["#0b0a08", "#211a14"],
    front: ["#33291f", "#6f5741"],
    left: ["#241d17", "#574432"],
    right: ["#1f1914", "#4a392c"],
    door: ["#3a281b", "#9c7349"],
    enemy: ["#2d342b", "#a3ad91"],
    item: ["#8c7137", "#f2df8f"],
  } as const;
  const [dark, light] = palettes[kind];
  const opacity = Math.max(0.35, 1 - depth * 0.15);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
    <defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="${dark}"/><stop offset=".5" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient></defs>
    <rect width="640" height="400" fill="none"/>
    <g opacity="${opacity}">
      <rect x="${kind === "enemy" ? 260 : kind === "item" ? 475 : 20 + depth * 54}" y="${kind === "enemy" ? 115 : kind === "item" ? 265 : 28 + depth * 34}" width="${kind === "enemy" ? 120 : kind === "item" ? 75 : 600 - depth * 108}" height="${kind === "enemy" ? 210 : kind === "item" ? 85 : 344 - depth * 68}" rx="${kind === "enemy" ? 28 : 3}" fill="url(#g)" stroke="${light}" stroke-width="3"/>
      <text x="320" y="205" text-anchor="middle" font-family="serif" font-size="${kind === "enemy" ? 24 : 18}" fill="#efe3cc">${label}</text>
    </g>
  </svg>`;
}

export function createDemoAssetPack(): LoadedAssetPack {
  const manifest: DungeonAssetManifest = {
    format: "ishar-ck-asset-pack",
    version: 1,
    id: "ck-demo-assets",
    name: "CK Demo Layers",
    viewport: { width: 640, height: 400 },
    defaultTilesetId: "demo-stone",
    shared: [
      { id: "demo-guardian", role: "encounter", targetId: "guardian", file: "generated/guardian.svg", x: 0, y: 0, width: 640, height: 400 },
      { id: "demo-item", role: "item", file: "generated/item.svg", x: 0, y: 0, width: 640, height: 400 },
    ],
    tilesets: [{
      id: "demo-stone",
      name: "Demo Stone",
      entries: [
        { id: "demo-bg", role: "viewport.background", file: "generated/background.svg" },
        ...([0,1,2,3] as DungeonAssetDepth[]).flatMap((depth) => [
          { id: `demo-front-${depth}`, role: "wall.front" as const, depth, file: `generated/front-${depth}.svg` },
          { id: `demo-left-${depth}`, role: "wall.left" as const, depth, file: `generated/left-${depth}.svg` },
          { id: `demo-right-${depth}`, role: "wall.right" as const, depth, file: `generated/right-${depth}.svg` },
          { id: `demo-door-${depth}`, role: "door.front.closed" as const, depth, file: `generated/door-${depth}.svg` },
        ]),
      ],
    }],
  };
  const urls: Record<string, string> = {};
  const paths: Record<string, string> = {};
  for (const entry of manifestEntries(manifest)) {
    const depth = entry.depth ?? 0;
    const kind =
      entry.role === "viewport.background" ? "background"
      : entry.role === "wall.front" ? "front"
      : entry.role === "wall.left" ? "left"
      : entry.role === "wall.right" ? "right"
      : entry.role === "door.front.closed" ? "door"
      : entry.role === "encounter" ? "enemy"
      : "item";
    const svg = demoSvg(entry.id, depth, kind);
    urls[entry.id] = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    paths[entry.id] = entry.file;
  }
  return { manifest, urls, paths, missingEntryIds: [], sourceLabel: "eingebauter synthetischer Demo-Pack", fileCount: Object.keys(urls).length + 1 };
}
