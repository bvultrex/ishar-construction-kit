/**
 * r12: original outdoor/town renderers for IsharGrid levels (Ishar 2 maps 1-4), table-driven.
 * Tables (outdoor-tables.json) were produced by EXECUTING the original cell routines (Alderaan,
 * decompile/alis/render-tables, gen_generic.py; validated 0 mismatches against DJ1) — known.
 * Base renderer per map (MAIN 0x0166d, known): 1 FOND1+PLAINE1, 2 FARBO+ARBO, 3 FVILLE+VHOUSE2,
 * 4 FMONT+MONTAGNE. Overlays per scene type main 0x4ef2 (MAIN 0x018c4/0x01c96, known):
 * generated from scenes.json into outdoor-tables.json "overlays" (decor scripts with a cell table only,
 * e.g. 1 VILLAGE1, 5/9 FORET1, 10 VARCHE+VARCADE+VDEC1 ...). NPC/creature modules are entities, not drawn here.
 */
import tables from "./outdoor-tables.json" with { type: "json" };
import { cellA, cellB } from "./cont-grid.ts";
import type { IsharGrid } from "./types.ts";

export type OutdoorScript = string;
export type OutdoorSprite = { module: string; index: number; mirror: boolean; x: number; y: number; z: number; r: number; c: number; script: string };
type Table = { layer: "A" | "B"; trav: Record<string, [number, number][]>; codes: Record<string, Record<string, [number, number, number, number, number][]>> };
const T = tables as unknown as { scripts: Record<OutdoorScript, Table>; overlays: Record<string, OutdoorScript[]>; montagneHeight: Record<string, Record<string, number>> };

export const OUTDOOR_BASE: Record<number, { script: OutdoorScript; background: string }> = {
  1: { script: "PLAINE1", background: "FOND1.IO" }, 2: { script: "ARBO", background: "FARBO.IO" },
  3: { script: "VHOUSE2", background: "FVILLE.IO" }, 4: { script: "MONTAGNE", background: "FMONT.IO" },
};
/** Overlay scripts per scene type (main 0x4ef2), from scenes.json; known. */
export const OUTDOOR_OVERLAYS: Record<string, OutdoorScript[]> = T.overlays;
/** Sprite indices per module an outdoor scene can draw (asset baking bakes only these). */
export const OUTDOOR_USED: Record<string, Set<number>> = (() => {
  const u: Record<string, Set<number>> = { "FOND1.IO": new Set([2]), "FARBO.IO": new Set([2]), "FVILLE.IO": new Set([5, 6]), "FMONT.IO": new Set([2]) };
  for (const [n, t] of Object.entries(T.scripts)) for (const v of Object.values(t.codes)) for (const d of Object.values(v)) for (const x of d) (u[`${n}.IO`] ??= new Set()).add(x[3]);
  return u;
})();
/** All modules an outdoor scene may draw (for asset baking). */
export const OUTDOOR_MODULES = [...new Set([...Object.keys(T.scripts)])].map((n) => `${n}.IO`);
/** Palette per map scene (scene background module + palette entry, palette-resolution.ts). */
export const OUTDOOR_PALETTE: Record<number, [string, number]> = { 1: ["FOND1.IO", 3], 2: ["FARBO.IO", 1], 3: ["FVILLE.IO", 0], 4: ["FMONT.IO", 3] };
export const isOutdoorMap = (map?: number) => map !== undefined && map >= 1 && map <= 4;

export type OutdoorOptions = {
  sceneType?: number;
  /** redraw counter since the scene loaded (0 = first frame). */
  redraw?: number;
  /** number of facing changes since load (FVILLE/FMONT x = 32*s, s flips per change; known). */
  facingFlips?: number;
  /** FMONT accumulator (+1 when the party cell's B went down, -1 when up; known FMONT 0x00084..). */
  montAcc?: number;
};

const FACING: Record<string, number> = { east: 1, south: 2, west: 3, north: 4 };

/** Backdrop scripts (known: FOND1 0x00049.., FARBO 0x00049.., FVILLE 0x0005f.., FMONT 0x0005f..). */
function background(map: number, o: OutdoorOptions): OutdoorSprite[] {
  const n = o.redraw ?? 0, s = (o.facingFlips ?? 0) % 2 ? -1 : 1;
  const b = (module: string, index: number, mirror: boolean, x = 0, y = 0): OutdoorSprite => ({ module, index, mirror, x, y, z: 1500, r: -1, c: -1, script: module });
  if (map === 1) return [b("FOND1.IO", 2, n > 0 && n % 2 === 0)];          // U, U, M, U, M ... (dirb 0x13 starts at 1)
  if (map === 2) return [b("FARBO.IO", 2, n % 2 === 1)];                   // U, M, U ...
  if (map === 3) return [b("FVILLE.IO", 6, false, 32 * s), b("FVILLE.IO", 5, n % 2 === 1)];
  if (map === 4) return [b("FMONT.IO", 2, false, 32 * s, (o.montAcc ?? 0) - 15)];
  return [];
}

function runTable(name: OutdoorScript, grid: IsharGrid, r: number, c: number, F: number, heights: boolean): OutdoorSprite[] {
  const t = T.scripts[name], out: OutdoorSprite[] = [];
  const party = cellB(grid, r, c);
  (t.trav[String(F)] ?? []).forEach(([dr, dc], i) => {
    const cr = r + dr, cc = c + dc;
    if (cr < 0 || cc < 0 || cr >= grid.rows || cc >= grid.cols) return;
    const code = t.layer === "B" ? cellB(grid, cr, cc) : cellA(grid, cr, cc);
    const draws = t.codes[String(code)]?.[`F${F}_i${i}`];
    if (!draws) return;
    const delta = heights ? cellB(grid, cr, cc) - party : 0;
    for (const [x, z, y, sprite, m] of draws) {
      // The map-1 near-row artefacts must not hide intentional foreground draws
      // in town/mountains: VARCHE uses 99-5, VPONT 99-5/-1, decorations 99-10.
      // Keep the older map-1/2 exclusion until their near-row state is verified.
      const foreground=(grid.mapNumber===3 || grid.mapNumber===4) && z>=89;
      if (z < 99 && !foreground) continue;
      const hy = delta ? T.montagneHeight[String(delta)]?.[String(z)] : undefined;  // known: replaces the y field
      out.push({ module: `${name}.IO`, index: sprite, mirror: m === 1, x, y: hy ?? y, z, r: cr, c: cc, script: name });
    }
  });
  return out;
}

/** Sprites of one outdoor/town view, far to near by z (stable, like the engine). */
export function outdoorView(grid: IsharGrid, r: number, c: number, facing: string, o: OutdoorOptions = {}): OutdoorSprite[] {
  // CONT filenames are shared by both games; their formats and scripts are not.
  if (grid.game !== "ishar2") return [];
  const map = grid.mapNumber ?? 0, base = OUTDOOR_BASE[map];
  if (!base) return [];
  const F = FACING[facing] ?? 1, st = o.sceneType ?? -1;
  const sprites = [...background(map, o), ...runTable(base.script, grid, r, c, F, map === 4)];
  for (const name of OUTDOOR_OVERLAYS[String(st)] ?? []) if (T.scripts[name]) sprites.push(...runTable(name, grid, r, c, F, false));
  return sprites.map((s, i) => ({ s, i })).sort((a, b) => b.s.z - a.s.z || a.i - b.i).map((x) => x.s);
}
