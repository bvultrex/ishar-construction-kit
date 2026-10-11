// Ishar CONTn.FIC grid model (plan v3). Evidence labels refer to
// decompile/alis/CONT-FIC.md and decompile/register.md:
//   known     = read directly from MAIN/DJ1/GERDEP/PCAVE/DJTRAP bytecode
//   suspected = interpretation of known bytecode, not cross-checked
//   unknown   = not settled; never guessed silently here
import { DIRECTION_VECTORS, DIRECTIONS, turnBack } from "./dungeon.ts";
import type { AuthoredDoor, AuthoredGame, AuthoredLevel, AuthoredLocation, Direction, IsharGrid, IsharGridScene } from "./types";

export const ISHAR2_ROWS = 90, ISHAR2_COLS = 60, ISHAR2_LAYER = 5400, ISHAR2_FILE = 10800; // known (MAIN cdim/cfreadb)
export const ISHAR1_ROWS = 54, ISHAR1_COLS = 90, ISHAR1_FILE = 4860; // known (Ishar 1 MAIN stride 90)

// ---------------------------------------------------------------- bytes
export function bytesToBase64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
export function base64ToBytes(text: string) {
  const s = atob(text);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
const s8 = (v: number) => (v << 24) >> 24;

/** Decoded view; cache per grid object to avoid re-decoding base64 per call. */
const decoded = new WeakMap<IsharGrid, { a: Uint8Array; b?: Uint8Array }>();
function layers(grid: IsharGrid) {
  let d = decoded.get(grid);
  if (!d) { d = { a: base64ToBytes(grid.layerA), b: grid.layerB ? base64ToBytes(grid.layerB) : undefined }; decoded.set(grid, d); }
  return d;
}
const inside = (g: IsharGrid, r: number, c: number) => r >= 0 && c >= 0 && r < g.rows && c < g.cols;
/** Layer A, signed. Outside the map counts as wall (-1). */
export function cellA(grid: IsharGrid, r: number, c: number) { return inside(grid, r, c) ? s8(layers(grid).a[r * grid.cols + c]!) : -1; }
/** Layer B, signed (0 when absent). */
export function cellB(grid: IsharGrid, r: number, c: number) { const b = layers(grid).b; return b && inside(grid, r, c) ? s8(b[r * grid.cols + c]!) : 0; }

// ------------------------------------------------------------ import/export
export type ContImport = { ok: true; grid: IsharGrid } | { ok: false; error: string };
/** Byte-exact import of an original CONTn.FIC (local only; the bytes must never enter Git). */
export function importCont(bytes: Uint8Array, fileName: string, sha256: string): ContImport {
  const mapNumber = Number(/CONT(\d)/i.exec(fileName)?.[1]) || undefined;
  const source = { file: fileName.split(/[\\/]/).pop()!, sha256, evidence: "known" as const };
  if (bytes.length === ISHAR2_FILE) return { ok: true, grid: { game: "ishar2", rows: ISHAR2_ROWS, cols: ISHAR2_COLS, mapNumber, source,
    layerA: bytesToBase64(bytes.subarray(0, ISHAR2_LAYER)), layerB: bytesToBase64(bytes.subarray(ISHAR2_LAYER)) } };
  if (bytes.length === ISHAR1_FILE) return { ok: true, grid: { game: "ishar1", rows: ISHAR1_ROWS, cols: ISHAR1_COLS, mapNumber, source,
    layerA: bytesToBase64(bytes) } };
  return { ok: false, error: `Unerwartete CONT-Größe ${bytes.length} (Ishar 2: ${ISHAR2_FILE}, Ishar 1: ${ISHAR1_FILE}).` };
}
/** Raw A‖B; byte-identical to the imported file when unedited. */
export function exportCont(grid: IsharGrid) {
  const { a, b } = layers(grid);
  const out = new Uint8Array(a.length + (b?.length ?? 0));
  out.set(a, 0); if (b) out.set(b, a.length);
  return out;
}
/** Returns a new grid with one cell byte changed (raw value 0..255 or signed). */
export function setGridCell(grid: IsharGrid, layer: "A" | "B", r: number, c: number, value: number): IsharGrid {
  const { a, b } = layers(grid);
  const src = layer === "A" ? a : b;
  if (!src || !inside(grid, r, c)) return grid;
  const next = src.slice(); next[r * grid.cols + c] = value & 0xff;
  return layer === "A" ? { ...grid, layerA: bytesToBase64(next) } : { ...grid, layerB: bytesToBase64(next) };
}

// --------------------------------------------------- layer A interpretation
/** known (DJ1 0x004b8 / 0x0084a): codes 22..45 and 66..77 split into floor element 10..13 + second element. */
const SPLIT: Record<number, [number, number]> = {
  22:[14,20],23:[15,21],24:[14,16],25:[15,17],26:[16,18],27:[17,19],28:[18,20],29:[19,21],
  30:[10,20],31:[11,21],32:[12,18],33:[13,19],34:[10,16],35:[11,17],36:[12,14],37:[13,15],
  38:[10,8],39:[11,8],40:[12,7],41:[13,7],42:[10,6],43:[11,6],44:[12,5],45:[13,5],
  66:[10,65],67:[11,65],68:[12,65],69:[13,65],
  70:[10,4],71:[11,4],72:[12,3],73:[13,3],74:[10,2],75:[11,2],76:[12,1],77:[13,1],
};
/** Elements of a DJ-scene layer-A code. Codes outside the table are the element itself (known). */
export function decomposeCode(a: number): number[] { return SPLIT[a] ? [...SPLIT[a]!] : [a]; }

/**
 * THE ONE TABLE for edge element -> world side. Elements 1-8 are thin edge pieces
 * (1-4 front view incl. door frame, 5-8 side view/reveal) — known.
 * Side mapping (known from the DJ1/DJ2 dispatchers 0x00b40/0x0090e): element 1/5 is drawn
 * frontally for facing 4, 2/6 for facing 1, 3/7 for facing 2, 4/8 for facing 3.
 * Facing/world (r7): GERDEP moves facing 1 col-1, 2 row+1, 3 col+1, 4 row-1, and the view
 * scripts make 4->1->2->3 right turns (known, step tests).
 * NAMING (r10, in-game compass, known from the original EXE): facing 1 = N (col-1), 2 = E (row+1),
 * 3 = S (col+1), 4 = W (row-1). The CK Direction names below are the kit's own map axes
 * (CK north = row-1 = original W, CK east = col-1 = original N); they are NOT the game's compass.
 * Use ORIGINAL_COMPASS / EDGE_ELEMENT_COMPASS for labels. Elements: 1/5 = row-1 edge = W,
 * 2/6 = col-1 edge = N, 3/7 = row+1 edge = E, 4/8 = col+1 edge = S.
 * Cross-check: in CONT1..7, cells with single-wall elements 16/17 border 0xFF at col-1
 * (64%/75%), 20/21 at col+1 (80%/67%). The CK therefore shows column c at x = cols-1-c.
 */
export const EDGE_ELEMENT_SIDE: Record<number, Direction> = {
  1: "north", 2: "east", 3: "south", 4: "west",
  5: "north", 6: "east", 7: "south", 8: "west",
};
/** Original in-game compass per facing code (main 0x2ab6), known (r10). */
export const ORIGINAL_COMPASS = { 1: "N", 2: "E", 3: "S", 4: "W" } as const;
export type OriginalCompass = (typeof ORIGINAL_COMPASS)[keyof typeof ORIGINAL_COMPASS];
/** CK map direction -> original compass label (same axis, other name). */
export const CK_TO_COMPASS: Record<Direction, OriginalCompass> = { east: "N", south: "E", west: "S", north: "W" };
/** Edge element -> original compass side (labels only; logic uses EDGE_ELEMENT_SIDE). */
export const EDGE_ELEMENT_COMPASS: Record<number, OriginalCompass> = {
  1: "W", 2: "N", 3: "E", 4: "S",
  5: "W", 6: "N", 7: "E", 8: "S",
};
/** Grid step for a CK direction (north row-1, east col-1, see above). */
export const gridStep = (d: Direction) => ({ dr: DIRECTION_VECTORS[d].y, dc: 0 - DIRECTION_VECTORS[d].x || 0 });
/** CK location <-> grid cell (x mirrored, see EDGE_ELEMENT_SIDE). */
export const gridCellOf = (grid: { cols: number }, l: { x: number; y: number }) => ({ r: l.y, c: grid.cols - 1 - l.x });
export const ckXOf = (grid: { cols: number }, c: number) => grid.cols - 1 - c;
/** Thin edge sides of a cell (from elements 1..8). */
export function edgeSides(a: number): Direction[] {
  return [...new Set(decomposeCode(a).filter((e) => e >= 1 && e <= 8).map((e) => EDGE_ELEMENT_SIDE[e]!))];
}
/** known: -1 (0xFF) = full wall cell. Every other value is enterable as far as GERDEP's wall test goes. */
export const isFullWall = (a: number) => a === -1;
/**
 * r14, known (GERDEP move routine, collision_maps1-4.json): the target cell blocks when layer A < 0 on
 * EVERY map (0x00f14; CONT2 walls are -10/-5/-3/-2, not only 0xFF). Event codes -21..-18/-5 are negative
 * as well (maps 1-3 send message 17 and refuse the step). Map 4 (Jon) additionally blocks A == 0
 * (0x00ebf -> L_012ce, A := -1; walkable = A > 0). Target B = -125 blocks a forward move (msg 25, 0x00ef0).
 * Not modelled: actors on the target cell (0x3412/0x34f0), map 4 B > 87 with member flag 0x4c7e == 0
 * (flag meaning unknown), the party-able check L_00b72.
 */
export function cellWalkable(grid: IsharGrid, r: number, c: number) {
  if (r < 0 || c < 0 || r >= grid.rows || c >= grid.cols) return false;
  const a = cellA(grid, r, c);
  if (a < 0) return false;
  if (grid.mapNumber === 4 && a === 0) return false;
  if (cellB(grid, r, c) === -125) return false;
  return true;
}

// --------------------------------------------------- layer B interpretation
/** known: 61..109 = door number + 60; door-open flag table main 0x4aa4[B-60]. */
export function doorNumber(b: number) { return b > 60 && b < 110 ? b - 60 : undefined; }

export type GridTrap =
  | { kind: "crusher"; code: number }            // 0xF7: DJTRAP mode 1, ceiling crusher on cell entry (known)
  | { kind: "wall"; code: number; variant: number }; // 0xC0..0xC3: wall/front trap, side rotates with variant (known); exact side mapping unknown
/** DJTRAP.IO trap data (CONT-FIC §4). */
export function trapAt(grid: IsharGrid, r: number, c: number): GridTrap | undefined {
  const b = cellB(grid, r, c);
  if (b === -9) return { kind: "crusher", code: 0xf7 };
  if (b >= -64 && b <= -61) return { kind: "wall", code: b & 0xff, variant: b + 64 };
  return undefined;
}
/** known (DJTRAP 0x002e9-0x00311): damage = (rnd5+8)*(map-4) - armour when positive. */
export function trapDamage(mapNumber: number, rnd5: number, armour = 0) {
  return Math.max(0, (rnd5 + 8) * (mapNumber - 4) - armour);
}
/** known (GERDEP 0x01650-0x016c5): B in a map-dependent range sets scene type |B|-40 when stepped on. Precedence vs traps on map 3: unknown. */
export function sceneTriggerAt(grid: IsharGrid, r: number, c: number) {
  const b = cellB(grid, r, c), m = grid.mapNumber ?? 0;
  if (m === 3 && b >= -100 && b <= -49) return Math.abs(b) - 40;
  if ([2, 5, 6, 7].includes(m) && b >= -100 && b <= -69) return Math.abs(b) - 40;
  return undefined;
}
export function sceneAt(grid: IsharGrid, r: number, c: number): IsharGridScene {
  return grid.sceneRegions?.find((x) => r >= x.r0 && r <= x.r1 && c >= x.c0 && c <= x.c1)?.scene ?? "DJ1";
}
const SCENE_TILESET: Record<string, string> = { DJ1: "ishar2-dj1", DJ2: "ishar2-dj2" };

// ------------------------------------------------------------- collision
export type StepResult = { kind: "open" } | { kind: "wall" } | { kind: "door"; door: number; closed: boolean };
const vec = (d: Direction) => { const g = gridStep(d); return { x: g.dc, y: g.dr }; }; // grid-space (x=dc, y=dr)
/** Door number on the edge between (r,c) and its neighbour in `dir` (either side may carry it). */
export function edgeDoor(grid: IsharGrid, r: number, c: number, dir: Direction) {
  const own = doorNumber(cellB(grid, r, c));
  const sides = (rr: number, cc: number) => [...edgeSides(cellA(grid, rr, cc)), ...(grid.edgeExtras?.[rr * grid.cols + cc] ?? []).map((e) => EDGE_ELEMENT_SIDE[e]!)];
  if (own !== undefined && sides(r, c).includes(dir)) return own;
  const v = vec(dir), tr = r + v.y, tc = c + v.x;
  const other = doorNumber(cellB(grid, tr, tc));
  if (other !== undefined && sides(tr, tc).includes(turnBack(dir))) return other;
  return undefined;
}
/**
 * GERDEP-style movement: target -1 blocks (known); edge door test L_0129b only on
 * dungeon maps (map>4, GERDEP 0x00f26; known) and only when the door is closed.
 * Thin edges without a door index do not block in this code path (known).
 * The override main 0x4ef3==1 (skips the door test) is not modelled (unknown meaning).
 */
export function canStep(grid: IsharGrid, r: number, c: number, dir: Direction, isOpen: (door: number) => boolean): StepResult {
  const v = vec(dir);
  if (!cellWalkable(grid, r + v.y, c + v.x)) return { kind: "wall" };
  if ((grid.mapNumber ?? 5) > 4) {
    const door = edgeDoor(grid, r, c, dir);
    if (door !== undefined) return { kind: "door", door, closed: !isOpen(door) };
  }
  return { kind: "open" };
}

// ------------------------------------------- bridge into the CK runtime model
export const gridLocationId = (levelId: string, r: number, c: number) => `grid:${levelId}:${r}:${c}`;
export const gridDoorId = (levelId: string, door: number) => `grid-door:${levelId}:${door}`;
export function gridDoorNumber(doorId: string) { const m = /^grid-door:.*:(\d+)$/.exec(doorId); return m ? Number(m[1]) : undefined; }

/**
 * Expands grid levels into runtime locations/doors so the existing playtest renderer,
 * minimap and collision work unchanged. Pure; never stored back into the project.
 * Authored locations on a grid level keep their content; their exits are re-derived.
 * One runtime door per original door number (shared open state, like 0x4aa4).
 */
export function expandGridLevels(game: AuthoredGame): AuthoredGame {
  const gridLevels = game.levels.filter((level) => level.grid);
  if (!gridLevels.length) return game;
  let locations = game.locations;
  const doors: AuthoredDoor[] = [...game.doors];
  for (const level of gridLevels) {
    const grid = level.grid!;
    const authored = new Map(locations.filter((l) => (l.levelId || "level-1") === level.id).map((l) => { const g = gridCellOf(grid, l); return [`${g.r},${g.c}`, l]; }));
    const idAt = (r: number, c: number) => authored.get(`${r},${c}`)?.id ?? gridLocationId(level.id, r, c);
    const cells: AuthoredLocation[] = [];
    const doorPairs = new Set<string>();
    for (let r = 0; r < grid.rows; r++) for (let c = 0; c < grid.cols; c++) {
      const a = cellA(grid, r, c);
      if (!cellWalkable(grid, r, c)) continue;
      const exits: string[] = [];
      for (const dir of DIRECTIONS) {
        const v = vec(dir);
        if (!cellWalkable(grid, r + v.y, c + v.x)) continue;
        exits.push(idAt(r + v.y, c + v.x));
        const door = (grid.mapNumber ?? 5) > 4 ? edgeDoor(grid, r, c, dir) : undefined;
        const key = [`${r},${c}`, `${r + v.y},${c + v.x}`].sort().join("|");
        if (door !== undefined && !doorPairs.has(key)) {
          doorPairs.add(key);
          doors.push({ id: gridDoorId(level.id, door), fromLocationId: idAt(r, c), toLocationId: idAt(r + v.y, c + v.x),
            initiallyOpen: !!grid.doorsInitiallyOpen?.[door], keyItemId: grid.doorKeys?.[door], originalIndex: door });
        }
      }
      const base = authored.get(`${r},${c}`);
      const tilesetId = SCENE_TILESET[sceneAt(grid, r, c)] ?? level.tilesetId;
      cells.push(base ? { ...base, exits, tilesetId: base.tilesetId ?? tilesetId }
        : { id: gridLocationId(level.id, r, c), name: `${level.name} ${r}/${c}`, description: "", x: ckXOf(grid, c), y: r, levelId: level.id,
            exits, itemIds: [], sceneKind: a === 0 ? "room" : "corridor", tilesetId });
    }
    const placed = new Set(cells.map((cell) => cell.id));
    locations = [...locations.filter((l) => (l.levelId || "level-1") !== level.id || !placed.has(l.id)), ...cells];
  }
  return { ...game, locations, doors };
}

/** Grid-level problems (wired into validateGame). */
export function validateGridLevel(level: AuthoredLevel, game: AuthoredGame) {
  const grid = level.grid!;
  const problems: { path: string; message: string }[] = [];
  const expectA = grid.rows * grid.cols;
  if (base64ToBytes(grid.layerA).length !== expectA) problems.push({ path: `level.${level.id}.grid`, message: "Layer A passt nicht zu Zeilen × Spalten." });
  if (grid.layerB && base64ToBytes(grid.layerB).length !== expectA) problems.push({ path: `level.${level.id}.grid`, message: "Layer B passt nicht zu Zeilen × Spalten." });
  for (const location of game.locations.filter((l) => (l.levelId || "level-1") === level.id)) {
    const g = gridCellOf(grid, location);
    if (!cellWalkable(grid, g.r, g.c)) problems.push({ path: `location.${location.id}`, message: `Ort liegt auf einer nicht begehbaren Zelle (${g.r}/${g.c}).` });
  }
  return problems;
}

// --------------------------------------------- legacy edge level -> grid copy
/** known (r7, from the element faces in grid-view.ts): open-side pattern -> layer-A code (A variant). */
export const SHAPE_BY_OPEN: Record<string, number> = {
  "-E-W": 10, "N-S-": 12, "-ESW": 14, "N-SW": 16, "NE-W": 18, "NES-": 20,
  "-ES-": 22, "--SW": 24, "N--W": 26, "NE--": 28,
  "-E--": 30, "N---": 32, "---W": 34, "--S-": 36,
};
/** Doors hang on SIDE-VIEW edge elements 5-8 of a straight corridor cell (known, CONT5/6: A44=12+5,
 *  A40=12+7, A42=10+6, A38=10+8 carry doors #48/#3/#8/#8). Elements 1-4 are frontal thin walls; at d0 they
 *  only draw the frame #108 (r11 fix: the old 76/72/74/70 codes rendered a solid front wall from d1 on). */
const DOOR_EDGE_CODE: Partial<Record<string, number>> = { "N-S-:north": 44, "N-S-:south": 40, "-E-W:east": 42, "-E-W:west": 38 };
const OPPOSITE: Record<Direction, Direction> = { north: "south", south: "north", east: "west", west: "east" };

/**
 * Opt-in conversion of a legacy edge level into a NEW grid level (original stays untouched).
 * Missing links between adjacent CK cells cannot be expressed (the original has no
 * blocking thin wall without a door) and are reported. Dead ends/crossings use code 0 (room floor)
 * because their exact shape codes are unknown.
 */
/** Core of the edge->grid conversion (pure, never touches the project). Door numbers per CK door id. */
export function buildEdgeGrid(game: AuthoredGame, levelId: string) {
  const source = game.levels.find((l) => l.id === levelId);
  const cells = game.locations.filter((l) => (l.levelId || "level-1") === levelId);
  if (!source || !cells.length || source.grid) return { ok: false as const, error: "Level fehlt, ist leer oder bereits ein Raster." };
  const minX = Math.min(...cells.map((l) => l.x)) - 1, minY = Math.min(...cells.map((l) => l.y)) - 1;
  const rows = ISHAR2_ROWS, cols = ISHAR2_COLS;
  if (Math.max(...cells.map((l) => l.y)) - minY + 2 > rows || Math.max(...cells.map((l) => l.x)) - minX + 2 > cols)
    return { ok: false as const, error: "Level ist größer als 60 × 90 Felder." };
  const a = new Uint8Array(rows * cols).fill(0xff), b = new Uint8Array(rows * cols);
  const at = new Map(cells.map((l) => [`${l.x},${l.y}`, l]));
  const warnings: string[] = [];
  let nextDoor = 1;
  const doorKeys: Record<string, string> = {}, open: Record<string, boolean> = {};
  const doorNumbers: Record<string, number> = {};
  const ck = (d: Direction) => DIRECTION_VECTORS[d];
  const patternOf = (l: AuthoredLocation) => ["N", "E", "S", "W"].map((ch, i) => { const v = ck(DIRECTIONS[i]!); return at.has(`${l.x + v.x},${l.y + v.y}`) ? ch : "-"; }).join("");
  // Door placement: on the from-cell if it is a straight corridor, else on the to-cell's opposite edge
  // (the original only hangs doors on straight cells; the edge is shared, so both are the same door).
  const placed = new Map<string, { edge: number; door: (typeof game.doors)[number]; side?: Direction }>();
  // r11b: no straight cell on either side -> keep the cell's own shape and add the side-view edge
  // element 5-8 for that face as a runtime-only extra (never in layer A, so no original code is invented).
  const edgeExtras: Record<number, number[]> = {};
  const doneDoors = new Set<string>();
  for (const door of game.doors) {
    const from = cells.find((c) => c.id === door.fromLocationId), to = cells.find((c) => c.id === door.toLocationId);
    const pair = [door.fromLocationId, door.toLocationId].sort().join("|");
    if (!from || !to || doneDoors.has(pair)) continue;
    doneDoors.add(pair);
    const dir = DIRECTIONS.find((d) => ck(d).x === to.x - from.x && ck(d).y === to.y - from.y);
    const e1 = dir ? DOOR_EDGE_CODE[`${patternOf(from)}:${dir}`] : undefined;
    const e2 = dir ? DOOR_EDGE_CODE[`${patternOf(to)}:${OPPOSITE[dir]}`] : undefined;
    if (e1 !== undefined && !placed.has(from.id)) placed.set(from.id, { edge: e1, door });
    else if (e2 !== undefined && !placed.has(to.id)) placed.set(to.id, { edge: e2, door });
    else if (dir && !placed.has(from.id)) placed.set(from.id, { edge: -1, door, side: dir });
    else warnings.push(`Tür ${door.id}: zweite Tür an derselben Zelle ${from.name}; nicht abbildbar.`);
  }
  for (const l of cells) {
    const sides = DIRECTIONS.map((d) => { const v = ck(d); return at.has(`${l.x + v.x},${l.y + v.y}`); });
    const pattern = ["N", "E", "S", "W"].map((ch, i) => sides[i] ? ch : "-").join("");
    for (const d of DIRECTIONS) {
      const v = ck(d), n = at.get(`${l.x + v.x},${l.y + v.y}`);
      if (n && !l.exits.includes(n.id) && l.id < n.id) warnings.push(`Kante ${l.name} ↔ ${n.name} ist im CK gesperrt; im Original nicht ohne Tür abbildbar (bleibt offen).`);
    }
    let code = SHAPE_BY_OPEN[pattern] ?? 0; // rooms too: DJ scripts draw walls only from the open cell's faces
    const place = placed.get(l.id);
    if (place) {
      const { edge, door } = place;
      {
        const idx = (l.y - minY) * cols + (cols - 1 - (l.x - minX));
        if (edge < 0) edgeExtras[idx] = [{ north: 5, east: 6, south: 7, west: 8 }[place.side!]];
        const n = door.originalIndex ?? nextDoor++;
        if (edge >= 0) code = edge;
        b[idx] = 60 + n;
        for (const x of game.doors) if ((x.fromLocationId === door.fromLocationId && x.toLocationId === door.toLocationId) || (x.fromLocationId === door.toLocationId && x.toLocationId === door.fromLocationId)) doorNumbers[x.id] = n;
        if (door.keyItemId) doorKeys[n] = door.keyItemId;
        if (door.initiallyOpen) open[n] = true;
      }
    }
    a[(l.y - minY) * cols + (cols - 1 - (l.x - minX))] = code;
  }
  const grid: IsharGrid = { game: "ishar2", rows, cols, mapNumber: 5, layerA: bytesToBase64(a), layerB: bytesToBase64(b),
    ...(Object.keys(edgeExtras).length ? { edgeExtras } : {}),
    doorsInitiallyOpen: open, doorKeys, source: { file: `copy-of-${levelId}`, sha256: "", evidence: "suspected" } };
  return { ok: true as const, grid, minX, minY, doorNumbers, warnings, cells, source };
}

/** r11: runtime view grid for an EDGE-model level (read-only, cached per game object). The CK cell
 *  (x, y) lies at grid row y-minY, col cols-1-(x-minX). */
const edgeGridCache = new WeakMap<AuthoredGame, Map<string, ReturnType<typeof buildEdgeGrid>>>();
export function edgeViewGrid(game: AuthoredGame, levelId: string) {
  let m = edgeGridCache.get(game); if (!m) edgeGridCache.set(game, m = new Map());
  if (!m.has(levelId)) m.set(levelId, buildEdgeGrid(game, levelId));
  return m.get(levelId)!;
}

export function convertLevelToGrid(game: AuthoredGame, levelId: string) {
  const built = buildEdgeGrid(game, levelId);
  if (!built.ok) return built;
  const { grid, minX, minY, warnings, cells, source } = built;
  const newLevelId = `${levelId}-grid`;
  const copies: AuthoredLocation[] = cells.filter((l) => l.itemIds.length || l.encounterId || l.ending || l.id === game.startLocationId || game.portals.some((p) => p.fromLocationId === l.id || p.toLocationId === l.id))
    .map((l) => ({ ...l, id: `${newLevelId}:${l.id}`, levelId: newLevelId, x: l.x - minX, y: l.y - minY, exits: [] }));
  const entry = copies[0] ?? { ...cells[0]!, id: `${newLevelId}:${cells[0]!.id}`, levelId: newLevelId, x: cells[0]!.x - minX, y: cells[0]!.y - minY, exits: [], itemIds: [], encounterId: undefined, ending: undefined };
  if (!copies.length) copies.push(entry);
  const level: AuthoredLevel = { id: newLevelId, name: `${source.name} (Raster-Kopie)`, kind: "dungeon", tilesetId: source.tilesetId ?? "ishar2-dj1", grid };
  return { ok: true as const, levelId: newLevelId, entryId: entry.id, warnings,
    game: { ...game, levels: [...game.levels, level], locations: [...game.locations, ...copies],
      portals: [...game.portals, { id: `portal-${newLevelId}`, fromLocationId: cells[0]!.id, toLocationId: entry.id, label: "Zur Raster-Kopie" }] } };
}

/** Adds an imported CONT grid as a NEW level with an entrance and a portal from `portalFromId`. */
export function addGridLevel(game: AuthoredGame, grid: IsharGrid, portalFromId: string, start?: { r: number; c: number }) {
  const from = game.locations.find((l) => l.id === portalFromId);
  if (!from) return { ok: false as const, error: "Ausgangsort für den Übergang fehlt." };
  let cell = start && cellWalkable(grid, start.r, start.c) ? start : undefined;
  for (let r = 0; !cell && r < grid.rows; r++) for (let c = 0; !cell && c < grid.cols; c++) {
    const a = cellA(grid, r, c);
    if (a >= 0x0a && a <= 0x0d && cellWalkable(grid, r, c) && DIRECTIONS.filter((d) => cellWalkable(grid, r + vec(d).y, c + vec(d).x)).length >= 1) cell = { r, c };
  }
  if (!cell) return { ok: false as const, error: "Keine begehbare Startzelle gefunden." };
  let n = game.levels.length + 1; while (game.levels.some((l) => l.id === `level-${n}`)) n++;
  const levelId = `level-${n}`;
  const name = grid.source?.file ? grid.source.file.replace(/\.FIC$/i, "") : `Raster ${n}`;
  const entry: AuthoredLocation = { id: `${levelId}-entry`, name: `${name} Eingang`, description: "", x: ckXOf(grid, cell.c), y: cell.r, levelId, exits: [], itemIds: [], sceneKind: "corridor" };
  return { ok: true as const, levelId, entryId: entry.id, game: { ...game,
    levels: [...game.levels, { id: levelId, name, kind: "dungeon" as const, tilesetId: "ishar2-dj1", grid }],
    locations: [...game.locations, entry],
    portals: [...game.portals, { id: `portal-${levelId}`, fromLocationId: from.id, toLocationId: entry.id, label: `Nach ${name}` }] } };
}

/** Synthetic test grid (no original bytes): corridor, full walls, pillar room, wood+grate edge doors, traps. */
export function syntheticTestGrid(): IsharGrid {
  const rows = 12, cols = 16;
  const a = new Uint8Array(rows * cols).fill(0xff), b = new Uint8Array(rows * cols);
  const set = (r: number, c: number, v: number, bv = 0) => { a[r * cols + c] = v & 0xff; b[r * cols + c] = bv & 0xff; };
  for (let r = 2; r <= 9; r++) set(r, 2, r % 2 ? 0x0c : 0x0d);          // N-S corridor, col 2
  set(1, 2, 76, 60 + 2);                                                  // door #2 (wood) on north edge
  set(0, 2, 0x0c);                                                        // beyond the wooden door
  for (let c = 3; c <= 7; c++) set(6, c, c % 2 ? 0x0a : 0x0b);           // E-W branch, row 6 (col+1 = west)
  set(6, 8, 70, 60 + 3);                                                  // door #3 (grate) on the west edge (element 4)
  for (let r = 4; r <= 8; r++) for (let c = 9; c <= 13; c++) set(r, c, 0);// room 5x5
  set(6, 11, 0xff);                                                       // pillar
  set(8, 2, 0x0c, -9);                                                    // crusher trap 0xF7
  set(4, 2, 0x0c, -62);                                                   // wall trap 0xC2
  return { game: "ishar2", rows, cols, mapNumber: 5, layerA: bytesToBase64(a), layerB: bytesToBase64(b),
    source: { file: "synthetic", sha256: "", evidence: "suspected" } };
}

/**
 * Ishar 2 savegame (.SAV, 8359 bytes), local-only reader. Layout KNOWN from the IO.IO writer
 * 0x00a95 (cfwritev = 16-bit big-endian word each) and its reader 0x00ded (the sizes add up to 8359):
 * words 0 marker (0x4ef7), 1 row (0x2ab4), 2 col (0x2ab5), 3 facing (0x2ab6), 4 map (0x2d18),
 * 5-8 (0x4c38/3a/94/96), 9 = scene type main 0x4ef2 (offset 18), 10 0x4f13, 11 0x4f15, 12 0x4fbc (offset 24),
 * ... 25 = 0x4fce (offset 50, flooded catacombs), 0x50b8 weights at 94 (3 words);
 * door table main 0x4aa4 at 7381 (50 bytes), switch table 0x4ad8 at 7431 (50 bytes).
 * (The other reader 0x006bb lists 0x4d1a before 0x4ef2; it does not match the written layout.)
 */
export function parseSaveHeader(bytes: Uint8Array) {
  const w = (i: number) => ((bytes[i * 2] ?? 0) << 8) | (bytes[i * 2 + 1] ?? 0);
  const facing = ({ 1: "east", 2: "south", 3: "west", 4: "north" } as const)[w(3) as 1 | 2 | 3 | 4];
  const compass = ORIGINAL_COMPASS[w(3) as 1 | 2 | 3 | 4];
  const table = (at: number) => (bytes.length >= at + 50 ? Array.from(bytes.subarray(at, at + 50)) : undefined);
  return { marker: w(0), row: w(1), col: w(2), facingCode: w(3), facing, compass, map: w(4), sceneType: w(9),
    flooded: bytes.length > 51 ? w(25) === 1 : undefined, weights: bytes.length > 99 ? [w(47), w(48), w(49)] : undefined,
    doors: table(7381), switches: table(7431) };
}
