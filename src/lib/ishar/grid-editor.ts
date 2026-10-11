/**
 * r13: pure editing operations on an IsharGrid (Builder). Every operation writes only layer A/B bytes
 * (plus the CK door-key/open tables) with original codes; nothing outside the CONT format is invented.
 * Shapes: open-side pattern -> code (SHAPE_BY_OPEN, r7). Thin edges: SPLIT codes floor 10..13 + element
 * (5-8 side view = door frame/reveal, 1-4 frontal thin wall; known). Doors: B = 60 + number on a straight
 * corridor cell (known for CONT5/6). Wall rule (Hoth, decompile/wall-rule.md, suspected S27): in dungeon and
 * town maps no thin edge separates two rooms; outdoor maps 1/2/4 are exempt.
 */
import { cellA, cellB, cellWalkable, CK_TO_COMPASS, decomposeCode, doorNumber, EDGE_ELEMENT_SIDE, gridStep, setGridCell, SHAPE_BY_OPEN } from "./cont-grid.ts";
import type { Direction, IsharGrid } from "./types.ts";

export const DIRS: Direction[] = ["north", "east", "south", "west"];
const LETTER = "NESW";
const inside = (g: IsharGrid, r: number, c: number) => r >= 0 && c >= 0 && r < g.rows && c < g.cols;
export const isOpenCell = cellWalkable;
const nb = (r: number, c: number, d: Direction) => { const s = gridStep(d); return { r: r + s.dr, c: c + s.dc }; };
export const OPPOSITE: Record<Direction, Direction> = { north: "south", south: "north", east: "west", west: "east" };

/** SPLIT table (floor base, element) -> code; same numbers as cont-grid SPLIT (known). */
const COMPOSE = new Map<string, number>();
for (let k = 0; k < 128; k++) { const d = decomposeCode(k); if (d.length === 2) COMPOSE.set(`${d[0]},${d[1]}`, k); }
const PATTERN_OF_SHAPE = new Map(Object.entries(SHAPE_BY_OPEN).map(([p, v]) => [v, p]));

export const openPattern = (g: IsharGrid, r: number, c: number) => DIRS.map((d, i) => { const n = nb(r, c, d); return isOpenCell(g, n.r, n.c) ? LETTER[i] : "-"; }).join("");
/** Base shape of a code (floor/wall part without thin edge element) and its variant parity. */
function baseOf(a: number) {
  const parts = decomposeCode(a);
  const elem = parts.find((e) => e >= 1 && e <= 8);
  let base = parts.length === 2 && elem !== undefined ? parts[0]! : a;
  let odd = false;
  if (!PATTERN_OF_SHAPE.has(base) && PATTERN_OF_SHAPE.has(base - 1) && base >= 10) { base -= 1; odd = true; }
  return { base, odd, elem };
}
/** Straight corridor base (10/11 E-W in CK names, 12/13 N-S) or undefined. */
export const straightBase = (a: number) => { const p = decomposeCode(a), b = p[0]!; return b >= 10 && b <= 13 && (p.length === 1 || (p[1]! >= 1 && p[1]! <= 8)) ? b : undefined; };
/** Sides a straight base can carry a thin edge on (from the SPLIT table). */
export function edgeChoices(base: number) {
  const out: { side: Direction; element: number; code: number }[] = [];
  for (let e = 1; e <= 8; e++) { const code = COMPOSE.get(`${base},${e}`); if (code !== undefined) out.push({ side: EDGE_ELEMENT_SIDE[e]!, element: e, code }); }
  return out;
}

/** Re-derive the shape code of an open cell from its open neighbours; keeps special codes (decor,
 *  niches, DJCAT sets ...) and only rewrites cells whose code is a plain shape (or 0) and whose pattern changed. */
function reshape(g: IsharGrid, r: number, c: number): IsharGrid {
  if (!isOpenCell(g, r, c)) return g;
  const a = cellA(g, r, c), { base, odd, elem } = baseOf(a);
  const known = base === 0 || PATTERN_OF_SHAPE.has(base);
  if (!known) return g;
  const pat = openPattern(g, r, c);
  const target = SHAPE_BY_OPEN[pat] ?? 0;
  if (target === base) return g;
  let code = target ? target + (odd && PATTERN_OF_SHAPE.get(target) && !PATTERN_OF_SHAPE.has(target + 1) ? 1 : 0) : 0;
  if (elem !== undefined) { const keep = COMPOSE.get(`${code},${elem}`); if (keep !== undefined) code = keep; }
  return setGridCell(g, "A", r, c, code);
}
const reshapeAround = (g: IsharGrid, r: number, c: number) => DIRS.reduce((acc, d) => { const n = nb(r, c, d); return reshape(acc, n.r, n.c); }, reshape(g, r, c));

export type EditResult = { grid: IsharGrid; message?: string; ok: boolean };
const ok = (grid: IsharGrid, message?: string): EditResult => ({ grid, ok: true, message });
const fail = (grid: IsharGrid, message: string): EditResult => ({ grid, ok: false, message });

export function paintFloor(g: IsharGrid, r: number, c: number): EditResult {
  if (!inside(g, r, c)) return fail(g, "Außerhalb des Rasters.");
  if (isOpenCell(g, r, c)) return ok(g);
  return ok(reshapeAround(setGridCell(g, "A", r, c, 0), r, c));
}
export function paintWall(g: IsharGrid, r: number, c: number): EditResult {
  if (!inside(g, r, c)) return fail(g, "Außerhalb des Rasters.");
  let next = setGridCell(setGridCell(g, "A", r, c, 0xff), "B", r, c, 0);
  return ok(reshapeAround(next, r, c));
}
/** Thin edge on the `side` of a straight corridor cell; elements 5-8 by default (frame/reveal). */
export function setEdge(g: IsharGrid, r: number, c: number, side: Direction, on: boolean, frontal = false): EditResult {
  const a = cellA(g, r, c), base = straightBase(a);
  if (base === undefined) return fail(g, "Dünne Kanten nur an geraden Gangzellen (Wandregel: kantenseitig immer ein Gang).");
  if (!on) return ok(setGridCell(g, "A", r, c, base));
  const choice = edgeChoices(base).find((x) => x.side === side && (frontal ? x.element <= 4 : x.element >= 5));
  if (!choice) return fail(g, "Diese Seite kann an diesem Gang keine Kante tragen (nur quer zum Gang).");
  return ok(setGridCell(g, "A", r, c, choice.code));
}
/** Door number n on the edge `side` of (r,c); falls back to the neighbour across the edge if that one is the straight corridor. */
export function setDoor(g: IsharGrid, r: number, c: number, side: Direction, n: number): EditResult {
  if (n < 1 || n > 49) return fail(g, "Türnummer 1..49.");
  let res = setEdge(g, r, c, side, true);
  let at = { r, c };
  if (!res.ok) { const o = nb(r, c, side); res = setEdge(g, o.r, o.c, OPPOSITE[side], true); at = o; }
  if (!res.ok) return fail(g, "Tür braucht eine gerade Gangzelle an der Kante (Original: alle Türen gangseitig).");
  return ok(setGridCell(res.grid, "B", at.r, at.c, 60 + n), at.r !== r || at.c !== c ? `Tür an Nachbarzelle ${at.r}/${at.c} gesetzt.` : undefined);
}
export const TRAPS = { crusher: -9, wall0: -64, wall1: -63, wall2: -62, wall3: -61 } as const;
export function setTrap(g: IsharGrid, r: number, c: number, kind: keyof typeof TRAPS | "none"): EditResult {
  if (!isOpenCell(g, r, c)) return fail(g, "Fallen nur auf begehbaren Zellen.");
  return ok(setGridCell(g, "B", r, c, kind === "none" ? 0 : TRAPS[kind]));
}
/** Niche (A 78) with switch index i (B = -(10+i), 11..49 -> B -21..-59 range known for 0x4ad8). */
export function setNiche(g: IsharGrid, r: number, c: number, i: number | undefined): EditResult {
  if (!isOpenCell(g, r, c)) return fail(g, "Nischen nur auf begehbaren Zellen.");
  if (i === undefined) return ok(reshapeAround(setGridCell(setGridCell(g, "A", r, c, 0), "B", r, c, 0), r, c));
  if (i < 1 || i > 49) return fail(g, "Schalter 1..49.");
  return ok(setGridCell(setGridCell(g, "A", r, c, 78), "B", r, c, -(10 + i)));
}
/** Scene trigger: B = -(type+40) in the map's known range (GERDEP 0x01650..; maps 2/5/6/7: 29..60, map 3: 9..60). */
export function setSceneTrigger(g: IsharGrid, r: number, c: number, type: number | undefined): EditResult {
  if (!isOpenCell(g, r, c)) return fail(g, "Szenenauslöser nur auf begehbaren Zellen.");
  if (type === undefined) return ok(setGridCell(g, "B", r, c, 0));
  const m = g.mapNumber ?? 5, lo = m === 3 ? 9 : [2, 5, 6, 7].includes(m) ? 29 : undefined;
  if (lo === undefined) return fail(g, `Karte ${m}: Szenentyp über Rechtecke (Karten 1/4), nicht über Ebene B.`);
  if (type < lo || type > 60) return fail(g, `Szenentyp ${lo}..60 auf Karte ${m}.`);
  return ok(setGridCell(g, "B", r, c, -(type + 40)));
}

// ------------------------------------------------------------- validation
export type GridIssue = { r: number; c: number; level: "warn" | "hint"; message: string; fix?: (g: IsharGrid) => IsharGrid; fixLabel?: string };
/** Wall rule + door hints use DJ1/DJ2 layer-A semantics (SPLIT codes), i.e. maps 5..7. Maps 1/2/4 (outdoor)
 *  are exempt by the rule; map 3 (Zach, town) uses town-script element codes, which are not SPLIT codes, so
 *  the edge check cannot be evaluated there yet (unverified; original CONT3 would otherwise raise 57 false hits). */
export const wallRuleApplies = (g: IsharGrid) => (g.mapNumber ?? 5) >= 5;
/** Room cell = open cell in a 2x2 block of open cells (Hoth's definition). */
export function isRoomCell(g: IsharGrid, r: number, c: number) {
  if (!isOpenCell(g, r, c)) return false;
  for (const [dr, dc] of [[0, 0], [-1, 0], [0, -1], [-1, -1]] as const) {
    const rr = r + dr, cc = c + dc;
    if ([[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, b]) => isOpenCell(g, rr + a!, cc + b!))) return true;
  }
  return false;
}
const sidesOf = (g: IsharGrid, r: number, c: number) => decomposeCode(cellA(g, r, c)).filter((e) => e >= 1 && e <= 8).map((e) => EDGE_ELEMENT_SIDE[e]!);
export function validateGrid(g: IsharGrid): GridIssue[] {
  const out: GridIssue[] = [];
  if (!wallRuleApplies(g)) return out;
  for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
    if (!isOpenCell(g, r, c)) continue;
    const door = doorNumber(cellB(g, r, c));
    for (const side of sidesOf(g, r, c)) {
      const n = nb(r, c, side);
      if (!isOpenCell(g, n.r, n.c)) continue;
      if (wallRuleApplies(g) && door === undefined && isRoomCell(g, r, c) && isRoomCell(g, n.r, n.c))
        out.push({ r, c, level: "warn", message: `Raum grenzt an Raum über dünne Kante ohne Tür (${r}/${c} ↔ ${n.r}/${n.c}); im Original immer 0xFF-Zelle oder Gang dazwischen.`,
          fix: (x) => setEdge(x, r, c, side, false).grid, fixLabel: "Kante entfernen" });
    }
    // Doors on plain shape cells need a thin edge to be drawn; special codes (DJCAT 80+, niches, scales)
    // draw their own door elements (known, CONT5), so they are not flagged.
    const plain = baseOf(cellA(g, r, c)).base === 0 || PATTERN_OF_SHAPE.has(baseOf(cellA(g, r, c)).base);
    if (door !== undefined && plain && !sidesOf(g, r, c).length && !g.edgeExtras?.[r * g.cols + c])
      out.push({ r, c, level: "hint", message: `Tür ${door} an ${r}/${c} ohne Kante – wird nicht gezeichnet (Original: Türen hängen an einer Gangkante).` });
  }
  return out;
}

/** Builder map orientation (r13): screen x = row (O/E = row+1 right), screen y = col (N = col-1 up),
 *  i.e. the original in-game compass (main 0x2ab6). Screen side -> CK direction. */
export const SCREEN_SIDE: Record<"left" | "right" | "up" | "down", Direction> = { right: "south", left: "north", up: "east", down: "west" };
/** German compass letter (O = Ost) of a CK direction per the original compass. */
export const compassOf = (d: Direction) => ({ N: "N", E: "O", S: "S", W: "W" } as const)[CK_TO_COMPASS[d]];
