/**
 * r12: door/switch mechanics of the original (Ishar 2), pure and table-driven.
 * Source: decompile/alis/render-tables/door_mechanics.json + DOORS.md (Alderaan); every rule below is
 * "known" from the script offsets cited, meanings stay "suspected". Item names are not known: items are
 * referred to by their original numbers (-17, -21, -22, objects 17..22) only.
 */
import { cellA, cellB } from "./cont-grid.ts";
import type { IsharGrid } from "./types.ts";

export type Pan = { count: number; minor: number };
export type MechState = {
  /** main 0x4aa4, door-open flag per door number 0..49 (not reset on map change). */
  doors: number[];
  /** main 0x4ad8, switch flags 0..49 (save offset 7431). */
  switches: number[];
  /** scale pans 0x50b8 (count) / 0x50c0 (minor 0..999); new game: pan 2 = 3/550 (PARAM). */
  pans: Pan[];
  /** main 0x50ab (precondition for door 30). */
  flag50ab?: number;
  /** last hour seen (main 0x4fc6) for the time door 28. */
  hour?: number;
};

export const newMechState = (): MechState => ({ doors: Array(50).fill(0), switches: Array(50).fill(0),
  pans: [{ count: 0, minor: 0 }, { count: 0, minor: 0 }, { count: 3, minor: 550 }] });
const clone = (s: MechState): MechState => ({ ...s, doors: [...s.doors], switches: [...s.switches], pans: s.pans.map((p) => ({ ...p })) });
const dungeon = (g: IsharGrid) => (g.mapNumber ?? 5) >= 5;

/** Doors 5, 9, 17 fall shut after every step (GERDEP L_013af, 0x013f3..0x01407). */
export const STEP_RESET_DOORS = [5, 9, 17];
/** Pressure plates (GERDEP 0x01515..0x015e8): known plate index -> door effects. The rest of table
 *  0x507c[1] is not decoded; such plates only report their index (data-level hook). */
export const PLATE_EFFECTS: Record<number, [door: number, open: number][]> = { 2: [[13, 1]], 3: [[13, 0]], 4: [[12, 1]] };

export type MechEvent = { kind: "door"; door: number; open: boolean; why: string } | { kind: "switch"; index: number; on: boolean; why: string } | { kind: "plate"; index: number };

function setDoor(s: MechState, ev: MechEvent[], door: number, open: boolean, why: string) {
  if (!!s.doors[door] === open) return;
  s.doors[door] = open ? 1 : 0; ev.push({ kind: "door", door, open, why });
}
function setSwitch(s: MechState, ev: MechEvent[], index: number, on: boolean, why: string) {
  if (!!s.switches[index] === on) return;
  s.switches[index] = on ? 1 : 0; ev.push({ kind: "switch", index, on, why });
}

/** Everything GERDEP does when the party has entered (r,c). */
export function afterStep(grid: IsharGrid, r: number, c: number, state: MechState) {
  const s = clone(state), ev: MechEvent[] = [];
  for (const d of STEP_RESET_DOORS) setDoor(s, ev, d, false, "GERDEP L_013af");
  if (dungeon(grid)) {
    const b = cellB(grid, r, c);
    if (b <= -100 && b >= -119) {
      const idx = -b - 100; ev.push({ kind: "plate", index: idx });
      for (const [d, o] of PLATE_EFFECTS[idx] ?? []) setDoor(s, ev, d, !!o, `Druckplatte ${idx}`);
    }
    const all = [21, 22, 23, 24, 25, 26].every((i) => s.switches[i]);
    setDoor(s, ev, 48, all, "GERDEP 0x015f2 (Schalter 21-26)");
  }
  return { state: s, events: ev };
}

/** Niche cell (A 78/79, B -11..-59): switch index |B|-10, or undefined. */
export function nicheSwitch(grid: IsharGrid, r: number, c: number) {
  const a = cellA(grid, r, c), b = cellB(grid, r, c);
  return (a === 78 || a === 79) && b <= -11 && b >= -59 ? -b - 10 : undefined;
}
/** Put (true) / take back (false) an object 17..22 in the niche under the party (SOURIS 0x009a0 / 0x0060c). */
export function nicheObject(grid: IsharGrid, r: number, c: number, object: number, put: boolean, state: MechState) {
  const s = clone(state), ev: MechEvent[] = [];
  const i = nicheSwitch(grid, r, c);
  if (i !== undefined && object >= 17 && object <= 22) setSwitch(s, ev, i, put, put ? "Objekt in Nische" : "Objekt entnommen");
  return { state: s, events: ev };
}

/** Lever entity (PCAVE 0x003de..0x00485): toggles switch i and door i. */
export function pullLever(i: number, state: MechState) {
  const s = clone(state), ev: MechEvent[] = [];
  setSwitch(s, ev, i, !s.switches[i], "Hebel"); setDoor(s, ev, i, !s.doors[i], "Hebel");
  return { state: s, events: ev };
}

/** Time door 28 (GERDEP 0x00500/0x0052f): on an hour change, hour 1 opens, hour 4 closes (all maps). */
export function hourTick(hour: number, state: MechState) {
  const s = clone(state), ev: MechEvent[] = [];
  if (s.hour !== hour) { if (hour === 1) setDoor(s, ev, 28, true, "Uhrzeit"); if (hour === 4) setDoor(s, ev, 28, false, "Uhrzeit"); }
  s.hour = hour;
  return { state: s, events: ev };
}

/** Item use on a door form (SOURIS 0x00a5d/0x00a9d/0x00af8): -17 form 66 -> door 8, -21 form 67 -> door 29,
 *  -22 form 68 -> door 30 only when main 0x50ab == 1. Spell 18 (GESORT 0x01442/0x01468): form 66 -> 8, 67 -> 29. */
export function useOnDoorForm(what: { item: number } | { spell: number }, form: number, state: MechState) {
  const s = clone(state), ev: MechEvent[] = [];
  if ("item" in what) {
    if (what.item === -17 && form === 66) setDoor(s, ev, 8, true, "Gegenstand -17");
    if (what.item === -21 && form === 67) setDoor(s, ev, 29, true, "Gegenstand -21");
    if (what.item === -22 && form === 68 && s.flag50ab === 1) setDoor(s, ev, 30, true, "Gegenstand -22");
  } else if (what.spell === 18) {
    if (form === 66) setDoor(s, ev, 8, true, "Zauber 18");
    if (form === 67) setDoor(s, ev, 29, true, "Zauber 18");
  }
  return { state: s, events: ev };
}

/** Scale pans at CONT5 B -37/-38/-39 (A 79): pan = |B|-37. */
export const panAt = (grid: IsharGrid, r: number, c: number) => { const b = cellB(grid, r, c); return cellA(grid, r, c) === 79 && b <= -37 && b >= -39 ? -b - 37 : undefined; };

/** Load (amount) or clear (undefined) a pan, then evaluate the scale (DJ1 0x016ed/0x0175a/0x017f5). */
export function loadPan(pan: number, amount: Pan | undefined, state: MechState) {
  const s = clone(state), ev: MechEvent[] = [];
  s.pans[pan] = amount ? { count: amount.count + Math.floor(amount.minor / 1000), minor: amount.minor % 1000 } : { count: 0, minor: 0 };
  const ok = (p: Pan) => p.count === 3 && p.minor > 540 && p.minor < 560;
  const p = s.pans;
  if (p.every(ok) && p.every((x) => x.count === p[0]!.count && x.minor === p[0]!.minor)) {
    setDoor(s, ev, 24, true, "Waage gelöst"); for (const d of [25, 26, 27]) setDoor(s, ev, d, false, "Waage gelöst");
    for (const i of [27, 28, 29]) setSwitch(s, ev, i, true, "Waage gelöst");
  } else p.forEach((x, i) => {
    const wrong = ((x.minor > 560 || x.minor < 540) && x.minor > 0) || (x.count !== 3 && x.count > 0);
    if (wrong) { setDoor(s, ev, 27 + i, false, "Waage falsch"); setDoor(s, ev, 25 + i, true, "Waage falsch"); setDoor(s, ev, 24, false, "Waage falsch"); }
  });
  return { state: s, events: ev };
}

/** Animation timing (hud-anim.md, Quesh; known): ~23.5 fps (70 Hz tick, ctiming 3). */
export const FRAME_MS = 1000 / 23.5;
/** PCAVE door lift: 4 units per frame over 21 frames. */
export const DOOR_LIFT = { frames: 21, step: 4 };
/** DJTRAP animations (known, data level; the playtest shows the trap result, not the motion yet):
 *  falling block res 3 at z 99: y -50 per frame x2, then +25 per frame x4; blades res 12 move +-40 per frame,
 *  3 frames in, 4 out; press cycles res 13 -> 14 -> 15 -> 14 -> 13. */
export const TRAP_ANIM = {
  block: { res: 3, z: 99, dy: [-50, -50, 25, 25, 25, 25] },
  blades: { res: 12, dx: 40, framesIn: 3, framesOut: 4 },
  press: { res: [13, 14, 15, 14, 13] },
} as const;
