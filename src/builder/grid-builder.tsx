/** r13 Builder: grid map (centerpiece), inspector, live preview (same DungeonViewport as the playtest). */
import { useMemo } from "react";
import { cellA, cellB, cellWalkable, decomposeCode, doorNumber, EDGE_ELEMENT_SIDE, gridStep, isFullWall, sceneTriggerAt, trapAt } from "@/lib/ishar/cont-grid";
import { nicheSwitch } from "@/lib/ishar/door-mechanics";
import type { Direction, IsharGrid } from "@/lib/ishar/types";

export type BuilderTool = "select" | "floor" | "wall" | "edge" | "door" | "trap" | "niche" | "scene" | "start";
export const TOOLS: { id: BuilderTool; key: string; label: string; hint: string }[] = [
  { id: "select", key: "V", label: "Auswahl", hint: "Zelle wählen (Inspektor)" },
  { id: "floor", key: "B", label: "Boden", hint: "Begehbare Zelle; Form ergibt sich aus den Nachbarn" },
  { id: "wall", key: "M", label: "Mauer 0xFF", hint: "Ganzfeld-Mauer" },
  { id: "edge", key: "K", label: "Kante", hint: "Dünne Kante quer zu einem geraden Gang (Seite = Klickposition)" },
  { id: "door", key: "T", label: "Tür", hint: "Tür (Originalnummer) auf einer Gangkante" },
  { id: "trap", key: "F", label: "Falle", hint: "DJTRAP: Fallblock B −9" },
  { id: "niche", key: "N", label: "Nische/Schalter", hint: "Nische A 78 mit Schalter (0x4ad8)" },
  { id: "scene", key: "R", label: "Szenenregion", hint: "Szenenauslöser B = −(Typ+40)" },
  { id: "start", key: "S", label: "Start/Blick", hint: "Startfeld und Blickrichtung" },
];
export type Layers = { shape: boolean; logic: boolean; scene: boolean; traps: boolean; hex: boolean };
export { SCREEN_SIDE, compassOf } from "@/lib/ishar/grid-editor";
import { compassOf, SCREEN_SIDE, wallRuleApplies } from "@/lib/ishar/grid-editor";
const SIDE_LINE: Record<Direction, [number, number, number, number]> = { south: [1, 0, 1, 1], north: [0, 0, 0, 1], east: [0, 0, 1, 0], west: [0, 1, 1, 1] };

export function gridBounds(grid: IsharGrid, pad = 3) {
  let r0 = grid.rows, r1 = -1, c0 = grid.cols, c1 = -1;
  for (let r = 0; r < grid.rows; r++) for (let c = 0; c < grid.cols; c++) if (!isFullWall(cellA(grid, r, c)) && cellA(grid, r, c) !== 0 || (cellA(grid, r, c) === 0 && neighbourOpen(grid, r, c))) { r0 = Math.min(r0, r); r1 = Math.max(r1, r); c0 = Math.min(c0, c); c1 = Math.max(c1, c); }
  if (r1 < 0) return { r0: 0, r1: grid.rows - 1, c0: 0, c1: grid.cols - 1 };
  return { r0: Math.max(0, r0 - pad), r1: Math.min(grid.rows - 1, r1 + pad), c0: Math.max(0, c0 - pad), c1: Math.min(grid.cols - 1, c1 + pad) };
}
function neighbourOpen(g: IsharGrid, r: number, c: number) {
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const v = cellA(g, r + a!, c + b!); return v !== -1 && v !== 0; });
}

export function GridMap({ grid, selected, party, tool, layers, size, onCell, editable }: {
  grid: IsharGrid; selected?: { r: number; c: number }; party?: { r: number; c: number; facing: Direction };
  tool: BuilderTool; layers: Layers; size: number; editable: boolean; onCell: (r: number, c: number, side: Direction) => void;
}) {
  const b = useMemo(() => gridBounds(grid), [grid]);
  const dungeon=wallRuleApplies(grid);
  const S = Math.max(size, Math.min(36, Math.floor(820 / (b.r1 - b.r0 + 1)), Math.floor(560 / (b.c1 - b.c0 + 1)))), W = (b.r1 - b.r0 + 1) * S, H = (b.c1 - b.c0 + 1) * S;
  const cells: React.ReactNode[] = [];
  for (let r = b.r0; r <= b.r1; r++) for (let c = b.c0; c <= b.c1; c++) {
    const a = cellA(grid, r, c), bb = cellB(grid, r, c), x = (r - b.r0) * S, y = (c - b.c0) * S;
    const wall = !cellWalkable(grid,r,c), door = dungeon ? doorNumber(bb) : undefined, trap = dungeon ? trapAt(grid, r, c) : undefined, niche = dungeon ? nicheSwitch(grid, r, c) : undefined, scene = sceneTriggerAt(grid, r, c);
    const cls = wall ? "gb-wall" : a === 0 && !neighbourOpen(grid, r, c) && !door ? "gb-void" : "gb-floor";
    cells.push(<rect key={`c${r}-${c}`} x={x} y={y} width={S} height={S} className={`gb-cell ${cls}`} data-cell={`${r}/${c}`} data-a={a} data-b={bb}/>);
    if (wall) continue;
    if (dungeon && layers.shape) for (const e of decomposeCode(a).filter((e) => e >= 1 && e <= 8)) {
      const [x1, y1, x2, y2] = SIDE_LINE[EDGE_ELEMENT_SIDE[e]!];
      cells.push(<line key={`e${r}-${c}-${e}`} x1={x + x1 * S} y1={y + y1 * S} x2={x + x2 * S} y2={y + y2 * S} className={e <= 4 ? "gb-edge frontal" : "gb-edge"}/>);
    }
    for (const e of dungeon ? grid.edgeExtras?.[r * grid.cols + c] ?? [] : []) { const [x1, y1, x2, y2] = SIDE_LINE[EDGE_ELEMENT_SIDE[e]!]; cells.push(<line key={`x${r}-${c}-${e}`} x1={x + x1 * S} y1={y + y1 * S} x2={x + x2 * S} y2={y + y2 * S} className="gb-edge extra"/>); }
    if (layers.logic && door !== undefined) cells.push(<g key={`d${r}-${c}`} className="gb-door"><rect x={x + 1.5} y={y + 1.5} width={S - 3} height={S - 3}/>{S >= 12 && <text x={x + S / 2} y={y + S / 2 + S * 0.18} fontSize={S * 0.5}>{door}</text>}</g>);
    if (layers.logic && niche !== undefined) cells.push(<circle key={`n${r}-${c}`} cx={x + S / 2} cy={y + S / 2} r={S * 0.22} className="gb-niche"/>);
    if (layers.traps && trap) cells.push(<rect key={`t${r}-${c}`} x={x + S * 0.28} y={y + S * 0.28} width={S * 0.44} height={S * 0.44} className="gb-trap"/>);
    if (dungeon && layers.logic && bb <= -100 && bb >= -119) cells.push(<rect key={`p${r}-${c}`} x={x + S * 0.3} y={y + S * 0.3} width={S * 0.4} height={S * 0.4} className="gb-plate"/>);
    if (layers.scene && scene !== undefined) cells.push(<text key={`s${r}-${c}`} x={x + 2} y={y + S - 2} fontSize={S * 0.38} className="gb-scene">{scene}</text>);
    if (layers.hex && S >= 18) cells.push(<text key={`h${r}-${c}`} x={x + 1} y={y + S * 0.35} fontSize={S * 0.28} className="gb-hex">{(a & 0xff).toString(16).padStart(2, "0")}{bb ? "/" + (bb & 0xff).toString(16).padStart(2, "0") : ""}</text>);
  }
  const arrow = party && <polygon className="gb-party" transform={`translate(${(party.r - b.r0) * S + S / 2},${(party.c - b.c0) * S + S / 2}) rotate(${{ east: 0, south: 90, west: 180, north: 270 }[party.facing]})`} points={`0,${-S * 0.38} ${S * 0.3},${S * 0.3} ${-S * 0.3},${S * 0.3}`}/>;
  const sel = selected && selected.r >= b.r0 && selected.r <= b.r1 && selected.c >= b.c0 && selected.c <= b.c1
    ? <rect className="gb-selected" x={(selected.r - b.r0) * S} y={(selected.c - b.c0) * S} width={S} height={S}/> : null;
  return <div className="gb-scroll"><svg className={`gb-map tool-${tool} ${editable ? "" : "readonly"}`} width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="grid" aria-label="Rasterkarte"
    onClick={(ev) => {
      const box = (ev.currentTarget as SVGSVGElement).getBoundingClientRect();
      const px = (ev.clientX - box.left) * (W / box.width), py = (ev.clientY - box.top) * (H / box.height);
      const r = b.r0 + Math.floor(px / S), c = b.c0 + Math.floor(py / S);
      const fx = px / S - Math.floor(px / S) - 0.5, fy = py / S - Math.floor(py / S) - 0.5;
      const side = Math.abs(fx) > Math.abs(fy) ? (fx > 0 ? SCREEN_SIDE.right : SCREEN_SIDE.left) : (fy > 0 ? SCREEN_SIDE.down : SCREEN_SIDE.up);
      onCell(r, c, side);
    }}>
    {cells}{sel}{arrow}
    <text x={4} y={12} className="gb-compass">N ↑ · O →</text>
  </svg></div>;
}

/** Plain description of a cell for the inspector. */
export function describeCell(grid: IsharGrid, r: number, c: number) {
  const a = cellA(grid, r, c), b = cellB(grid, r, c);
  if(!wallRuleApplies(grid)){
    const scene=sceneTriggerAt(grid,r,c);
    return {a,b,aText:`${a} · ${cellWalkable(grid,r,c) ? "begehbar" : "gesperrt"} (Gebietscode)`,
      bText:grid.mapNumber===4 ? `${b} · Geländehöhe` : scene!==undefined ? `${b} → Szenentyp ${scene}` : String(b),
      edges:[],door:undefined,trap:undefined,niche:undefined,scene};
  }
  const parts = decomposeCode(a);
  const edges = parts.filter((e) => e >= 1 && e <= 8).map((e) => `${e <= 4 ? "frontal" : "Seite"} ${compassOf(EDGE_ELEMENT_SIDE[e]!)} (Element ${e})`);
  const aText = isFullWall(a) ? "0xFF Ganzfeld-Mauer" : a === 0 ? "0 Boden/Raum" : parts.length === 2 ? `${a} = ${parts[0]} + ${parts[1]}` : String(a);
  const door = doorNumber(b), trap = trapAt(grid, r, c), niche = nicheSwitch(grid, r, c), scene = sceneTriggerAt(grid, r, c);
  const bText = b === 0 ? "0" : door !== undefined ? `${b} → Tür ${door}` : trap ? `${b} → Falle (${trap.kind === "crusher" ? "Fallblock" : "Wandfalle " + trap.variant})` : niche !== undefined ? `${b} → Schalter ${niche}` : scene !== undefined ? `${b} → Szenentyp ${scene}` : b <= -100 && b >= -119 ? `${b} → Druckplatte ${-b - 100}` : String(b);
  return { a, b, aText, bText, edges, door, trap, niche, scene };
}
export const stepOf = gridStep;
