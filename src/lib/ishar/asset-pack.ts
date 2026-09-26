import JSZip from "jszip";
import type { DungeonAssetEntry, DungeonAssetManifest, DungeonAssetRole, DungeonAssetDepth } from "./types";

export interface LoadedAssetPack {
  manifest: DungeonAssetManifest;
  urls: Record<string, string>;
  paths: Record<string, string>;
  missingEntryIds: string[];
  sourceLabel: string;
  fileCount: number;
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
  return assemblePack(manifestPath, manifest, files.length + "", files.length, async (path) => byPath.get(path));
}

export async function loadAssetPack(files: File[]): Promise<LoadedAssetPack> {
  if (!files.length) throw new Error("Keine Asset-Dateien ausgewählt.");
  if (files.length === 1 && files[0]!.name.toLowerCase().endsWith(".zip")) return fromZip(files[0]!);
  return fromLooseFiles(files);
}

export function revokeAssetPack(pack: LoadedAssetPack | null) {
  if (!pack) return;
  for (const url of Object.values(pack.urls)) URL.revokeObjectURL(url);
}

export function assetFor(
  pack: LoadedAssetPack | null,
  role: DungeonAssetRole,
  depth?: DungeonAssetDepth,
  tilesetId?: string,
) {
  if (!pack) return undefined;
  const tileset = pack.manifest.tilesets.find((candidate) => candidate.id === tilesetId)
    ?? pack.manifest.tilesets.find((candidate) => candidate.id === pack.manifest.defaultTilesetId)
    ?? pack.manifest.tilesets[0];
  const pools = [tileset?.entries ?? [], pack.manifest.shared];
  for (const entries of pools) {
    const exact = entries.find((entry) => entry.role === role && entry.depth === depth && pack.urls[entry.id]);
    if (exact) return { entry: exact, url: pack.urls[exact.id]! };
    const generic = entries.find((entry) => entry.role === role && entry.depth === undefined && pack.urls[entry.id]);
    if (generic) return { entry: generic, url: pack.urls[generic.id]! };
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
      { id: "guardian", role: "encounter", file: "monsters/guardian.png", x: 230, y: 105, width: 180, height: 230 },
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
