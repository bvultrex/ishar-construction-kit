// Original-faithful first-person view for IsharGrid levels.
// Reimplementation (no original bytes) of the Ishar 2 DJ1.IO / DJ2.IO view scripts,
// read from the disassembly: view loop 0x00064, cell routine 0x00495, element
// dispatcher 0x00b40 (DJ2 0x0090e), placement table 0x0223f (DJ2 0x01a09).
// Evidence labels: "known" = read directly from the script; "suspected" = inferred.
import type { Direction, IsharGrid } from "./types";
import { cellA, cellB, decomposeCode, doorNumber, sceneTriggerAt } from "./cont-grid.ts";

export type GridScript = "DJ1" | "DJ2" | "DJCAT";
export type SpriteModule = "DJ1.IO" | "DJ2.IO" | "DJCAT.IO" | "PCAVE.IO" | "DJTRAP.IO" | "FDJ1.IO" | "FDJ2.IO" | "FDJCAT.IO";
export type ViewSprite = {
  module: SpriteModule;
  index: number;
  mirror: boolean;
  /** ALIS scene coordinates: x lateral, y vertical (screen y = 78 - y - h/2 in the 320x200 frame), z depth (sort key). */
  x: number; y: number; z: number;
  /** grid cell, depth/lateral of the emitting cell, element and routine — for tests/debugging. */
  r: number; c: number; d: number; lat: number; element: number; routine: string;
  door?: number;
};
/** An entity the view script starts with clive (PCAVE 0x43 door/switch, DJTRAP 0x6a trap); known fields. */
export type ViewSpawn = { entity: "PCAVE" | "DJTRAP"; x: number; y: number; z: number; r: number; c: number;
  b?: number; mode?: number; sw?: number; swKind?: number; trap?: number };

/** known: facing values main 0x2ab6. Movement (GERDEP) and the element dispatch agree that
 *  4->1->2->3 are right turns. Keys are the CK map directions (north = row-1, east = col-1);
 *  the in-game compass names them differently: 1 = N, 2 = E, 3 = S, 4 = W (ORIGINAL_COMPASS, r10). */
export const FACING_CODE: Record<Direction, 1 | 2 | 3 | 4> = { east: 1, south: 2, west: 3, north: 4 };

/** known (DJ1 0x0223f == DJ2 0x01a09): z=(d+1)*99, vertical offset and lateral step per depth. */
export const DEPTH_TABLE = [
  { z: 99, y: -42, step: 192 }, { z: 198, y: -25, step: 92 }, { z: 297, y: -12, step: 60 },
  { z: 396, y: -7, step: 44 }, { z: 495, y: -4, step: 34 }, { z: 594, y: -2, step: 28 }, { z: 693, y: -1, step: 24 },
] as const;
/** known (0x00078..): at most 5 rows (depth 0..4); lateral range at depth d is -(d+1)..d+1. */
export const VIEW_DEPTH = 5;
/** known screen origin of the 256x113 dungeon window, matching the CK native projection. */
export const VIEW_ORIGIN = { x: 127, y: 65 };
/** known (render-runtime.md §2/§4): screen 0x000E origin (127,78) and clip x 0..255, y 13..125 in the
 *  320x200 frame. The CK window starts at frame y=13, so origin y 78-13 = 65 and clip 0..112 locally. */
export const VIEW_FRAME = { originX: 127, originY: 78, clipX0: 0, clipX1: 255, clipY0: 13, clipY1: 125 } as const;
export const VIEW_CLIP = { x: 0, y: 0, width: 256, height: 113 } as const;

type Side = "north" | "east" | "south" | "west";
const ORDER: Side[] = ["north", "east", "south", "west"];
const FACING_SIDE: Record<number, Side> = { 4: "north", 1: "east", 2: "south", 3: "west" };
/** Where a world side appears for a facing. */
function relation(facing: number, side: Side): "front" | "right" | "back" | "left" {
  const k = (ORDER.indexOf(side) - ORDER.indexOf(FACING_SIDE[facing]!) + 4) % 4;
  return (["front", "right", "back", "left"] as const)[k]!;
}

// ------------------------------------------------------------- per-script tables
type SideFam = { base: number; far: number; fixed?: number };
type Script = {
  module: "DJ1.IO" | "DJ2.IO";
  background: number; // FDJn composite drawn as the farthest sprite (z 1500, Alderaan render tables)
  wallA: SideFam; wallB: SideFam; front: number;        // full-cell faces (elements 10..21)
  edgeSide: SideFam; frame: number;                       // thin edges 1..4 (side view / door frame at d=0)
  revealSide: { base: number; far?: number }; arch: number; // thin edges 5..8 (side reveal / arch with door)
  decorSide?: { base: number; far: number }; decorFront?: { base: number; maxD: number }; decorWithWall: boolean;
  niche?: { sideClosed: number; sideOpen: number; front: number; frontClosed: number; frontOpen: number };
  pillar: number; // element 65 (d==1, lat 0 only)
  doorMin: number; // B threshold for the PCAVE spawn (DJ1: 61..109, DJ2: >50)
};
/** known: resource numbers from the leaf routines (DJ1 0x01953.., DJ2 0x011ec..). */
export const SCRIPTS: Record<"DJ1" | "DJ2", Script> = {
  DJ1: { module: "DJ1.IO", background: 3, wallA: { base: 47, far: 55, fixed: 56 }, wallB: { base: 51, far: 57, fixed: 58 }, front: 59,
    edgeSide: { base: 47, far: 55 }, frame: 108, revealSide: { base: 67, far: 71 }, arch: 63,
    decorSide: { base: 73, far: 77 }, decorFront: { base: 79, maxD: 2 }, decorWithWall: true,
    niche: { sideClosed: 89, sideOpen: 92, front: 95, frontClosed: 103, frontOpen: 100 }, pillar: 110, doorMin: 61 },
  DJ2: { module: "DJ2.IO", background: 3, wallA: { base: 35, far: 43, fixed: 44 }, wallB: { base: 39, far: 45, fixed: 46 }, front: 47,
    edgeSide: { base: 35, far: 43 }, frame: 117, revealSide: { base: 55 }, arch: 51,
    decorSide: { base: 81, far: 85 }, decorFront: { base: 77, maxD: 4 }, decorWithWall: false,
    niche: { sideClosed: 99, sideOpen: 102, front: 105, frontClosed: 110, frontOpen: 107 }, pillar: 114, doorMin: 51 },
};

/** known: element -> world side and face kind (dispatcher order interleaves A/B per side). */
type Face = { side: Side; kind: "A" | "B" | "edge" | "reveal" | "decorA" | "decorB" | "decor" | "niche" };
export const ELEMENT_FACES: Record<number, Face[]> = {
  1: [{ side: "north", kind: "edge" }], 2: [{ side: "east", kind: "edge" }], 3: [{ side: "south", kind: "edge" }], 4: [{ side: "west", kind: "edge" }],
  5: [{ side: "north", kind: "reveal" }], 6: [{ side: "east", kind: "reveal" }], 7: [{ side: "south", kind: "reveal" }], 8: [{ side: "west", kind: "reveal" }],
  10: [{ side: "south", kind: "A" }, { side: "north", kind: "B" }], 11: [{ side: "north", kind: "A" }, { side: "south", kind: "B" }],
  12: [{ side: "west", kind: "A" }, { side: "east", kind: "B" }], 13: [{ side: "east", kind: "A" }, { side: "west", kind: "B" }],
  14: [{ side: "north", kind: "A" }], 15: [{ side: "north", kind: "B" }], 16: [{ side: "east", kind: "A" }], 17: [{ side: "east", kind: "B" }],
  18: [{ side: "south", kind: "A" }], 19: [{ side: "south", kind: "B" }], 20: [{ side: "west", kind: "A" }], 21: [{ side: "west", kind: "B" }],
  // DJ1 only: wall + decoration
  46: [{ side: "north", kind: "decorA" }], 47: [{ side: "north", kind: "decorB" }], 48: [{ side: "east", kind: "decorA" }], 49: [{ side: "east", kind: "decorB" }],
  50: [{ side: "south", kind: "decorA" }], 51: [{ side: "south", kind: "decorB" }], 52: [{ side: "west", kind: "decorA" }], 53: [{ side: "west", kind: "decorB" }],
  // DJ2 only: decoration face
  54: [{ side: "north", kind: "decor" }], 55: [{ side: "east", kind: "decor" }], 56: [{ side: "south", kind: "decor" }], 57: [{ side: "west", kind: "decor" }],
  58: [{ side: "north", kind: "niche" }], 60: [{ side: "east", kind: "niche" }], 62: [{ side: "south", kind: "niche" }], 64: [{ side: "west", kind: "niche" }],
};
/** known: elements the dispatcher of each script handles (others draw nothing). */
const HANDLED: Record<"DJ1" | "DJ2", (e: number) => boolean> = {
  DJ1: (e) => (e >= 1 && e <= 8) || (e >= 10 && e <= 21) || (e >= 46 && e <= 53) || [58, 60, 62, 64, 65, 78, 79].includes(e),
  DJ2: (e) => (e >= 1 && e <= 8) || (e >= 10 && e <= 21) || (e >= 54 && e <= 58) || [60, 62, 64, 65].includes(e),
};
/** r8: DJ1 78/79, DJTRAP spawns and negative-B PCAVE variants are reproduced. Left out (labelled):
 *  the side effects of element 79 on the door table (weight puzzle 0x0179e..0x0184c writes doors 24-27). */
export const UNHANDLED_ELEMENTS: number[] = [];

export type DoorState = (door: number) => boolean;
export type NicheState = (index: number) => boolean;

/** known (MAIN 0x01c96): scene type main 0x4ef2 -> script. 30/36/38/40/41/51/53 load DJCAT (not reproduced). */
export function scriptForSceneType(type: number | undefined): GridScript | "DJCAT" | undefined {
  if (type === undefined) return undefined;
  if ([31, 32, 33, 34, 37, 39, 42, 43, 44, 52, 58].includes(type)) return "DJ1";
  if ([35, 45, 46, 47, 48, 49, 50].includes(type)) return "DJ2";
  if ([30, 36, 38, 40, 41, 51, 53].includes(type)) return "DJCAT";
  return undefined;
}

/**
 * Scene type at a cell. The original keeps main 0x4ef2 as state, set when stepping on a
 * layer-B trigger (GERDEP 0x0162a..0x016c5, known). Without a walk history we use the
 * nearest trigger reachable through non-wall cells (suspected but deterministic).
 */
export function sceneTypeAt(grid: IsharGrid, r: number, c: number, current?: number): number | undefined {
  const here = sceneTriggerAt(grid, r, c);
  if (here !== undefined) return here;
  if (current !== undefined) return current;
  const seen = new Set<number>([r * grid.cols + c]);
  let queue = [[r, c]];
  while (queue.length) {
    const next: number[][] = [];
    for (const [qr, qc] of queue) for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = qr! + dr!, nc = qc! + dc!, k = nr * grid.cols + nc;
      if (nr < 0 || nc < 0 || nr >= grid.rows || nc >= grid.cols || seen.has(k) || cellA(grid, nr, nc) === -1) continue;
      seen.add(k);
      const t = sceneTriggerAt(grid, nr, nc);
      if (t !== undefined) return t;
      next.push([nr, nc]);
    }
    queue = next;
  }
  return undefined;
}

/** Script for a cell: explicit sceneRegions override, then scene type, then DJ1. */
export function scriptAt(grid: IsharGrid, r: number, c: number, current?: number): GridScript {
  const region = grid.sceneRegions?.find((x) => r >= x.r0 && r <= x.r1 && c >= x.c0 && c <= x.c1)?.scene as string | undefined;
  if (region === "DJ1" || region === "DJ2" || region === "DJCAT") return region as GridScript;
  return scriptForSceneType(sceneTypeAt(grid, r, c, current)) ?? "DJ1";
}

export type ViewOptions = {
  /** main 0x4ef2 (gates DJTRAP spawns, DJ1 0x00851; known). */
  sceneType?: number;
  /** main 0x4fce: flooded catacombs (FDJCAT water floor #5 + DJCAT alternative sprite set); default 0. */
  djcatAlt?: boolean;
  /** main 0x50b8[0..2]: DJ1 element 79 weights (default 0). */
  weights?: number[];
  /** Door leaf animation: door number -> vertical offset (PCAVE 0x0031b: +4 px/frame, 21 frames). */
  doorLift?: (door: number) => number;
  /** Floor/ceiling #3 is redrawn mirrored on every other frame (Alderaan, known); pass the parity. */
  backgroundMirror?: boolean;
};

/** known DJ1 0x00851: scene types for which DJ1 starts DJTRAP on layer-B trap codes. */
export const DJTRAP_SCENE_TYPES = [31, 32, 33, 35, 37, 44, 58, 45, 48, 49, 50];
/** known DJ1 0x00923..0x00abb: trap B code -> DJTRAP mode by facing (else mode 5). */
const TRAP_MODE: Record<number, Record<number, number>> = {
  [-61]: { 1: 2, 3: 3, 4: 4, 2: 5 }, [-62]: { 2: 2, 4: 3, 1: 4, 3: 5 },
  [-63]: { 3: 2, 1: 3, 2: 4, 4: 5 }, [-64]: { 4: 2, 2: 3, 3: 4, 1: 5 },
};
/** known PCAVE 0x0006b: negative B index -> leaf base (#base+d). */
export const PCAVE_NEGATIVE_BASE: Record<number, number> = {
  [-122]: 32, [-121]: 24, [-98]: 28, [-93]: 32, [-92]: 24, [-91]: 32, [-85]: 24, [-82]: 24, [-81]: 32, [-80]: 32,
  [-79]: 24, [-78]: 32, [-77]: 24, [-76]: 32, [-75]: 24, [-74]: 28, [-71]: 24, [-70]: 32,
};

/**
 * Emits the sprites the DJ1/DJ2/DJCAT view script would place for party cell (r,c) and facing,
 * plus the PCAVE/DJTRAP entities it starts, resolved to their own sprites.
 * Sorted far->near by depth (rangesprite 0x4278, known); ties keep script order (suspected).
 */
export function gridView(grid: IsharGrid, r: number, c: number, facing: Direction, script: GridScript,
  isOpen: DoorState = () => false, nicheOpen: NicheState = () => false, opts: ViewOptions = {}): { sprites: ViewSprite[]; spawns: ViewSpawn[] } {
  const res = script === "DJCAT" ? djcatView(grid, r, c, FACING_CODE[facing], isOpen, opts) : djView(grid, r, c, facing, script, isOpen, nicheOpen, opts);
  // known FDJCAT 0x00018..0x00132: #4 always, the water floor #5 only while main 0x4fce == 1;
  // both alternate cputnat/cxputat on every redraw like FDJ1/FDJ2 #3 (confirmed by K5T004 reference).
  const bg: ViewSprite[] = (script === "DJCAT" ? (opts.djcatAlt ? [4, 5] : [4]) : [SCRIPTS[script].background]).map((index) => ({
    module: script === "DJ1" ? "FDJ1.IO" : script === "DJ2" ? "FDJ2.IO" : "FDJCAT.IO", index, mirror: !!opts.backgroundMirror,
    x: 0, y: 0, z: 1500, r, c, d: -1, lat: 0, element: 0, routine: "background" }));
  const all = [...bg, ...res.sprites, ...res.spawns.flatMap((s) => spawnSprites(s, isOpen, nicheOpen, opts))];
  return { sprites: all.map((s, i) => ({ s, i })).sort((p, q) => q.s.z - p.s.z || p.i - q.i).map((p) => p.s), spawns: res.spawns };
}
export function gridViewSprites(grid: IsharGrid, r: number, c: number, facing: Direction, script: GridScript,
  isOpen: DoorState = () => false, nicheOpen: NicheState = () => false, opts: ViewOptions = {}): ViewSprite[] {
  return gridView(grid, r, c, facing, script, isOpen, nicheOpen, opts).sprites;
}

/** known PCAVE 0x0006b..0x001b9 / DJTRAP 0x0002f..: sprites an entity draws for itself. */
export function spawnSprites(s: ViewSpawn, isOpen: DoorState, nicheOpen: NicheState, opts: ViewOptions = {}): ViewSprite[] {
  const out: ViewSprite[] = [];
  const put = (module: SpriteModule, index: number, mirror = false, dz = 0, dy = 0) =>
    out.push({ module, index, mirror, x: s.x, y: s.y + dy, z: s.z + dz, r: s.r, c: s.c, d: -1, lat: 0, element: 0, routine: s.entity.toLowerCase(), door: s.b });
  if (s.entity === "DJTRAP") {
    const d = Math.trunc(s.z / 100); // DJTRAP 0x00034: z/100
    if (s.trap === 1) { if (d === 3) put("DJTRAP.IO", 4); else if (d === 0) put("DJTRAP.IO", 3, false, 0, 99); } // crusher (d0: raised block, end of anim)
    else if (s.trap === 2) { if (d === 1) put("DJTRAP.IO", 11); }
    else if (s.trap === 3) { if (d === 1) put("DJTRAP.IO", 11, true); }
    else if (s.trap === 4) { if (d === 1) put("DJTRAP.IO", 17); else if (d === 0) put("DJTRAP.IO", 13); }
    return out;
  }
  const d = Math.trunc(s.z / 110); // known PCAVE 0x0004d
  if (s.sw !== undefined) { // wall switch (niche), d==0 only
    if (d === 0) put("PCAVE.IO", s.swKind ? (nicheOpen(s.sw) ? 47 : 48) : (nicheOpen(s.sw) ? 37 : 38), false, -5);
    return out;
  }
  const b = s.b ?? 0;
  if (d >= 4 || b === 0) return out;
  if (b < 0) { const base = PCAVE_NEGATIVE_BASE[b]; if (base !== undefined) put("PCAVE.IO", base + d); return out; }
  if (s.mode === 1 || s.mode === 2) { if (d === 0) put("PCAVE.IO", s.mode === 1 ? 40 : 46); return out; }
  const lift = opts.doorLift?.(b) ?? 0;
  if (isOpen(b) && !lift) return out;
  if (b === 8 || b === 29) { put("PCAVE.IO", 41 + d, false, 0, lift); if (b === 29) put("PCAVE.IO", 50, false, 0, lift); }
  else if (b % 2 === 0) { put("PCAVE.IO", 8 + d, false, 0, lift); if (b === 30) put("PCAVE.IO", 55 + d, false, 0, lift); }
  else put("PCAVE.IO", 12 + d, false, 0, lift);
  return out;
}

function djView(grid: IsharGrid, r: number, c: number, facing: Direction, script: "DJ1" | "DJ2",
  isOpen: DoorState, nicheOpen: NicheState, opts: ViewOptions): { sprites: ViewSprite[]; spawns: ViewSpawn[] } {
  const S = SCRIPTS[script];
  const F = FACING_CODE[facing];
  const out: ViewSprite[] = [];
  const spawns: ViewSpawn[] = [];
  // known (0x0010f/0x0021c/0x00327/0x0042a): cell for (depth, lateral) per facing.
  const cellOf = (d: number, lat: number): [number, number] =>
    F === 1 ? [r + lat, c - d] : F === 2 ? [r + d, c + lat] : F === 3 ? [r - lat, c + d] : [r - d, c - lat];
  for (let d = VIEW_DEPTH - 1; d >= 0; d--) {
    for (let lat = -(d + 1); lat <= d + 1; lat++) {
      const [cr, cc] = cellOf(d, lat);
      if (cr < 0 || cc < 0 || cr >= grid.rows || cc >= grid.cols) continue;
      const a = cellA(grid, cr, cc), b = cellB(grid, cr, cc);
      // state shared by all elements of the cell (0x19 depth, 0x1b placement lateral)
      const st = { d, plat: lat, x: 0, y: 0, z: 0, dd: 0 };
      const place = () => { const t = DEPTH_TABLE[st.d]!; st.z = t.z; st.y = t.y; st.x = st.plat * t.step; st.dd = Math.floor(st.z / 100); };
      place();
      const put = (index: number, mirror: boolean, element: number, routine: string, dz = 0, dy = 0) =>
        out.push({ module: S.module, index, mirror, x: st.x, y: st.y + dy, z: st.z + dz, r: cr, c: cc, d: st.d, lat, element, routine });
      const spawn = (f: Omit<ViewSpawn, "x" | "y" | "z" | "r" | "c" | "entity">, entity: ViewSpawn["entity"] = "PCAVE", dz = 3) =>
        spawns.push({ entity, x: st.x, y: st.y, z: st.z + dz, r: cr, c: cc, ...f });
      // ---- leaf routines
      const side = (fam: SideFam, mirror: boolean, e: number, name: string) => {
        if (st.dd >= 4) return; const s = mirror ? -1 : 1;
        if (lat === 0) put(fam.base + st.dd, mirror, e, name);
        else if (lat === s && st.dd > 1) put(fam.far + st.dd - 2, mirror, e, name);
        else if (fam.fixed !== undefined && lat === 2 * s && st.dd > 2) put(fam.fixed, mirror, e, name);
      };
      // edge side view: also draws the neighbour's near edge at lateral 0/±1 (known 0x0203d/0x020f2, 0x01deb/0x01ea0)
      const sideNear = (fam: { base: number; far?: number }, mirror: boolean, e: number, name: string) => {
        if (st.dd >= 4) return; const s = mirror ? -1 : 1;
        if (lat === 0) put(fam.base + st.dd, mirror, e, name);
        else if (fam.far !== undefined && lat === s && st.dd > 1) put(fam.far + st.dd - 2, mirror, e, name);
        else if (lat === -s) { st.plat = 0; place(); put(fam.base + st.dd, !mirror, e, name); }
        else if (fam.far !== undefined && lat === -2 * s && st.dd > 1) { st.plat = -s; place(); put(fam.far + st.dd - 2, !mirror, e, name); }
      };
      const front = (e: number) => { if (st.dd < 4) put(S.front + st.dd, (a & 1) === 1, e, "front", 1); };
      const frame = (e: number) => {           // known DJ1 0x021a7 / DJ2 0x01979
        if (st.dd === 0) {
          put(S.frame + st.dd, false, e, "frame", 1);
          const ok = script === "DJ1" ? b > 60 && b < 110 : b > 50;
          if (ok && !isOpen(b - 60)) spawn({ b: b - 60, mode: script === "DJ1" ? 1 : 2 });
        } else front(e);
      };
      const arch = (e: number) => {            // known DJ1 0x01f55 / DJ2 0x0158c
        if (st.dd >= 4) return; put(S.arch + st.dd, false, e, "arch", 1);
        if (script === "DJ1" ? b > 60 && b < 110 : b > 50) {
          if (script === "DJ1" || !isOpen(b - 60)) spawn({ b: b - 60, mode: 0 });
        } else if ((script === "DJ1" ? (b < -60 && b > -100) || b === -121 : b < 0) && st.d === d) spawn({ b, mode: 0 });
      };
      const back = (fn: (e: number) => void, e: number) => { if (st.d > 0) { st.d -= 1; place(); fn(e); } };
      const nicheIndex = () => Math.abs(b) - 10;
      // DJ1 0x01941/0x0194a/0x0199d/0x01a16/0x01953 as used by 78/79 (known)
      const sideA = (mirror: boolean, e: number) => side(S.wallA, mirror, e, "side");
      const sideB = (mirror: boolean, e: number) => side(S.wallB, mirror, e, "side");
      const both = (e: number) => { sideA(false, e); sideB(true, e); };        // 0x01941
      const bothX = (e: number) => { sideA(true, e); sideB(false, e); };       // 0x0194a
      const lever = (e: number) => {                                          // #117/#114 at z-15 (d<3)
        if (st.dd >= 3) return;
        const i = nicheIndex();
        put((nicheOpen(i) ? 114 : 117) + st.dd, false, e, "lever", -15);
      };
      for (const e of [...decomposeCode(a), ...(grid.edgeExtras?.[cr * grid.cols + cc] ?? [])]) {
        if (!HANDLED[script](e)) continue;
        if (e === 65) { if (st.dd === 1 && lat === 0) put(S.pillar, false, e, "pillar"); continue; }
        if (e === 78) {                         // known DJ1 0x01583
          if (F === 1) both(e);
          else if (F === 3) { lever(e); bothX(e); front(e); }
          else if (F === 2) { sideA(false, e); front(e); }
          else { sideA(true, e); front(e); }
          continue;
        }
        if (e === 79) {                         // known DJ1 0x0163d (puzzle writes to 0x4aa4 omitted)
          if (F === 1) {
            if (st.dd < 3) {
              const i = nicheIndex();
              if (i >= 27 && i <= 29) {
                const w = Math.min(opts.weights?.[i - 27] ?? 0, 9);
                if (st.dd === 0) { put(117 + st.dd, false, e, "scale", -15, -w); if (w) put(122, false, e, "scale", -10); }
                else if (st.dd < 2) { put(117 + st.dd, false, e, "scale", -15, -Math.trunc(w / 2)); if (w) put(122 + st.dd, false, e, "scale", -12); }
              } else put((nicheOpen(i) ? 114 : 117) + st.dd, false, e, "lever", -15);
            }
            both(e); front(e);
          } else if (F === 3) bothX(e);
          else if (F === 2) { sideA(true, e); front(e); }
          else { sideA(false, e); front(e); }
          continue;
        }
        for (const f of ELEMENT_FACES[e] ?? []) {
          const rel = relation(F, f.side);
          const fam = f.kind === "B" || f.kind === "decorB" ? S.wallB : S.wallA;
          if (f.kind === "edge") {
            if (rel === "front") frame(e); else if (rel === "back") back(frame, e);
            else sideNear(S.edgeSide, rel === "left", e, "edge-side");
          } else if (f.kind === "reveal") {
            if (rel === "front") arch(e); else if (rel === "back") back(arch, e);
            else sideNear(S.revealSide, rel === "left", e, "reveal-side");
          } else if (rel === "back") {
            continue;
          } else if (rel === "front") {
            if (f.kind !== "decor") front(e);
            if (f.kind.startsWith("decor") && S.decorFront && st.dd < S.decorFront.maxD) put(S.decorFront.base + st.dd, false, e, "decor-front", 1);
            if (f.kind === "niche" && S.niche && st.dd < 4) {
              if (st.dd < 2) put(S.niche.front + st.dd, false, e, "niche-front");
              if (st.dd === 1) put((nicheOpen(nicheIndex()) ? S.niche.frontOpen : S.niche.frontClosed) + st.dd - 1, false, e, "niche-front", -1);
              if (st.dd === 0) spawn({ sw: Math.abs(b) - 10, swKind: script === "DJ1" ? 0 : 1 }, "PCAVE", 0);
            }
          } else {
            const mirror = rel === "left";
            if (f.kind !== "decor") side(fam, mirror, e, "side");
            if (f.kind.startsWith("decor") && S.decorSide && st.dd < 4) {
              const s = mirror ? -1 : 1;
              if (lat === 0) put(S.decorSide.base + st.dd, mirror, e, "decor-side");
              else if (lat === s && st.dd > 1) put(S.decorSide.far + st.dd - 2, mirror, e, "decor-side");
            }
            if (f.kind === "niche" && S.niche && st.dd > 0 && st.dd < 4 && lat === 0)
              put((nicheOpen(nicheIndex()) ? S.niche.sideOpen : S.niche.sideClosed) + st.dd - 1, mirror, e, "niche-side");
          }
        }
      }
      // known DJ1 0x00851..0x00abb / DJ2 0x00851 (crusher -9 only): DJTRAP on trap codes, after the elements
      if (opts.sceneType !== undefined && DJTRAP_SCENE_TYPES.includes(opts.sceneType)) {
        st.d = d; st.plat = lat; place();
        if (b === -9) { if (st.dd > 0 || lat === 0) spawn({ trap: 1 }, "DJTRAP", 0); }
        else if (script === "DJ1" && TRAP_MODE[b] && lat === 0) spawn({ trap: TRAP_MODE[b]![F] ?? 5 }, "DJTRAP", 0);
      }
    }
  }
  return { sprites: out, spawns };
}

// ------------------------------------------------------------------ DJCAT
/** known DJCAT 0x004a9: compound codes -> element pair (negative codes are signed layer-A bytes). */
export const DJCAT_SPLIT: Record<number, number[]> = {
  [-5]: [10, -12], [-6]: [12, -11], [-7]: [10, -10], [-8]: [12, -9],
  30: [10, -14], 32: [12, -15], 34: [10, -16], 36: [12, -17], 31: [11, -14], 33: [13, -15], 35: [11, -16], 37: [13, -17],
  38: [10, 8], 40: [12, 7], 42: [10, 6], 44: [12, 5], 39: [11, 8], 41: [13, 7], 43: [11, 6], 45: [13, 5],
  80: [10, -18], 81: [12, -19], 82: [10, -20], 83: [12, -21], 84: [10, -22], 85: [10, -23],
};
type CatRoutine = "fde" | "105c" | "110b" | "11ef" | "1243" | "1297" | "12eb" | "133f" | "13c4" | "1449" | "14de" | "1584" | "15f4" | "back15f4" | "10da" | "corner";
/** known DJCAT dispatcher 0x00760: element -> facing -> routines ("*" = any other facing). */
export const DJCAT_ELEMENTS: Record<number, Record<string, CatRoutine[]>> = {
  [-9]: { 4: ["corner"] }, [-10]: { 1: ["corner"] }, [-11]: { 2: ["corner"] }, [-12]: { 3: ["corner"] },
  [-14]: { 3: ["1449"] }, [-15]: { 2: ["1449"] }, [-16]: { 1: ["1449"] }, [-17]: { 4: ["1449"] },
  [-18]: { 3: ["14de"] }, [-19]: { 2: ["14de"] }, [-20]: { 1: ["14de"] }, [-21]: { 4: ["14de"] },
  [-22]: { 1: ["1584"] }, [-23]: { 3: ["1584"] },
  5: { 4: ["15f4"], 2: ["back15f4"] }, 6: { 1: ["15f4"], 3: ["back15f4"] }, 7: { 2: ["15f4"], 4: ["back15f4"] }, 8: { 3: ["15f4"], 1: ["back15f4"] },
  10: { 1: ["fde"], 3: ["105c"], "*": ["110b"] }, 11: { 1: ["105c"], 3: ["fde"], "*": ["110b"] },
  12: { 2: ["fde"], 4: ["105c"], "*": ["110b"] }, 13: { 2: ["105c"], 4: ["fde"], "*": ["110b"] },
  14: { 1: ["11ef"], 3: ["1243"], 4: ["110b"] }, 16: { 2: ["11ef"], 4: ["1243"], 1: ["110b"] },
  18: { 1: ["1243"], 3: ["11ef"], 2: ["110b"] }, 20: { 2: ["1243"], 4: ["11ef"], 3: ["110b"] },
  15: { 1: ["1297"], 3: ["12eb"], 4: ["110b"] }, 17: { 2: ["1297"], 4: ["12eb"], 1: ["110b"] },
  19: { 1: ["12eb"], 3: ["1297"], 2: ["110b"] }, 21: { 2: ["12eb"], 4: ["1297"], 3: ["110b"] },
  22: { 4: ["13c4", "11ef"], 3: ["133f", "1243"] }, 24: { 1: ["13c4", "11ef"], 4: ["133f", "1243"] },
  26: { 2: ["13c4", "11ef"], 1: ["133f", "1243"] }, 28: { 3: ["13c4", "11ef"], 2: ["133f", "1243"] },
  23: { 4: ["13c4", "1297"], 3: ["133f", "12eb"] }, 25: { 1: ["13c4", "1297"], 4: ["133f", "12eb"] },
  27: { 2: ["13c4", "1297"], 1: ["133f", "12eb"] }, 29: { 3: ["13c4", "1297"], 2: ["133f", "12eb"] },
  78: { 1: ["1243"], 3: ["11ef"], 2: ["10da"] },
};
/** known DJCAT 0x00078..: at most 4 rows (depth 0..3), lateral range -(d+1)..d+1. */
export const DJCAT_DEPTH = 4;

function djcatView(grid: IsharGrid, r: number, c: number, F: number, isOpen: DoorState, opts: ViewOptions): { sprites: ViewSprite[]; spawns: ViewSpawn[] } {
  const out: ViewSprite[] = [];
  const spawns: ViewSpawn[] = [];
  const alt = !!opts.djcatAlt;
  const cellOf = (d: number, lat: number): [number, number] =>
    F === 1 ? [r + lat, c - d] : F === 2 ? [r + d, c + lat] : F === 3 ? [r - lat, c + d] : [r - d, c - lat];
  for (let d = DJCAT_DEPTH - 1; d >= 0; d--) {
    for (let lat = -(d + 1); lat <= d + 1; lat++) {
      const [cr, cc] = cellOf(d, lat);
      if (cr < 0 || cc < 0 || cr >= grid.rows || cc >= grid.cols) continue;
      const a = cellA(grid, cr, cc), b = cellB(grid, cr, cc);
      const st = { d, x: 0, y: 0, z: 0, dd: 0 };
      const place = () => { const t = DEPTH_TABLE[st.d]!; st.z = t.z; st.y = t.y; st.x = lat * t.step; st.dd = Math.floor(st.z / 100); };
      place();
      const put = (index: number, mirror: boolean, e: number, routine: string, dz = 0) =>
        out.push({ module: "DJCAT.IO", index, mirror, x: st.x, y: st.y, z: st.z + dz, r: cr, c: cc, d: st.d, lat, element: e, routine });
      const c0 = () => lat === 0;
      const end1177 = (e: number) => { const even = ((a % 2) + 2) % 2 === 0; put((alt ? 96 : 37) + st.dd, !even, e, "1177"); };
      const leaf: Record<CatRoutine, (e: number) => void> = {
        fde: (e) => { if (st.dd > 0 && c0()) { put((alt ? 47 : 31) + st.dd - 1, false, e, "fde"); put((alt ? 50 : 34) + st.dd - 1, true, e, "fde"); } },
        "105c": (e) => { if (st.dd > 0 && c0()) { put((alt ? 47 : 31) + st.dd - 1, true, e, "105c"); put((alt ? 50 : 34) + st.dd - 1, false, e, "105c"); } },
        "110b": (e) => { if (st.dd === 0 && c0()) end1177(e); else if (st.dd > 0 && c0()) put((alt ? 59 : 44) + st.dd - 1, false, e, "110b"); },
        "11ef": (e) => { if (st.dd > 0 && c0()) put((alt ? 47 : 31) + st.dd - 1, false, e, "11ef"); },
        "1243": (e) => { if (st.dd > 0 && c0()) put((alt ? 47 : 31) + st.dd - 1, true, e, "1243"); },
        "1297": (e) => { if (st.dd > 0 && c0()) put((alt ? 50 : 34) + st.dd - 1, false, e, "1297"); },
        "12eb": (e) => { if (st.dd > 0 && c0()) put((alt ? 50 : 34) + st.dd - 1, true, e, "12eb"); },
        "133f": (e) => { if (st.dd === 0 && c0()) { end1177(e); put(109, false, e, "133f", -4); } else if (st.dd > 0 && c0()) put((alt ? 53 : 38) + st.dd - 1, false, e, "133f", -4); },
        "13c4": (e) => { if (st.dd === 0 && c0()) { end1177(e); put(109, true, e, "13c4", -4); } else if (st.dd > 0 && c0()) put((alt ? 53 : 38) + st.dd - 1, true, e, "13c4", -4); },
        "1449": (e) => { if (st.dd === 0 && c0()) { end1177(e); put(109, false, e, "1449", -4); put(109, true, e, "1449", -4); } else if (st.dd > 0 && c0()) put((alt ? 56 : 41) + st.dd - 1, false, e, "1449", -4); },
        "14de": (e) => {
          if (!(st.dd < 4 && c0())) return;
          put((alt ? 101 : 92) + st.dd, false, e, "14de", -2);
          if (b > 60 && b < 110 && !isOpen(b - 60) && st.dd < 2) put(99 + st.dd, false, e, "door", -4); // DJCAT draws its own door (known 0x0153a)
        },
        "1584": (e) => { if (st.dd < 4 && c0()) { if (alt) leaf["1449"](e); else put(105 + st.dd, false, e, "1584", -4); } },
        "15f4": (e) => {
          if (!(st.dd < 4 && c0())) return;
          if (st.dd === 0) { put(109, false, e, "15f4", -4); put(109, true, e, "15f4", -4); }
          put(67 + st.dd, false, e, "15f4", 1);
          if (b > 60 && b < 110) { if (!isOpen(b - 60)) spawns.push({ entity: "PCAVE", x: st.x, y: st.y, z: st.z + 3, r: cr, c: cc, b: b - 60, mode: 0 }); }
          else if (((b < -60 && b > -110) || b === -122) && st.d === d) spawns.push({ entity: "PCAVE", x: st.x, y: st.y, z: st.z + 3, r: cr, c: cc, b, mode: 0 });
        },
        back15f4: (e) => { if (st.d > 0) { st.d -= 1; place(); leaf["15f4"](e); } },
        "10da": (e) => { if (c0()) put(75 + st.dd, false, e, "10da", 1); },
        corner: (e) => { if (st.dd > 0 && c0()) put(82 + st.dd - 1, false, e, "corner"); },
      };
      for (const e of [...(DJCAT_SPLIT[a] ?? [a]), ...(grid.edgeExtras?.[cr * grid.cols + cc] ?? [])]) {
        const m = DJCAT_ELEMENTS[e]; if (!m) continue;
        for (const name of m[F] ?? m["*"] ?? []) leaf[name](e);
      }
    }
  }
  return { sprites: out, spawns };
}

/** Kept for callers of r7: PCAVE sprites are now resolved inside gridView (spawnSprites). */
export function pcaveSprite(sprite: ViewSprite): number | undefined { return sprite.index; }

/** CK pack target id of a baked script sprite. */
export const spriteTargetId = (module: string, index: number, mirror: boolean) => `${module}#${index}${mirror ? "m" : ""}`;
export { doorNumber };
