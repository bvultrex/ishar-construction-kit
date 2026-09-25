import type { KitProject } from "./types";

export const MODULE_IDS = [
  "character",
  "item",
  "magic",
  "world",
  "npc",
  "quest",
  "dialogue",
  "asset",
  "build",
] as const;

export function emptyProject(name = "My Ishar Adventure"): KitProject {
  return {
    format: "ishar-ck-project",
    version: 1,
    name,
    createdAt: new Date().toISOString(),
    notes: "",
    sourceGames: [],
    nameOverlays: {},
    modules: {
      character: { status: "partial", notes: "Save-Round-Trip auf öffentlicher Ishar-2-Map." },
      item: { status: "audit", notes: "Wartet auf Item-ID-Tabelle." },
      magic: { status: "audit", notes: "Spell-Bytes ab 7577 roh sichtbar." },
      world: { status: "planned", notes: "Kartenformat unbestätigt (.FIC-Hypothese)." },
      npc: { status: "planned", notes: "" },
      quest: { status: "planned", notes: "" },
      dialogue: { status: "planned", notes: "TEXTIN*.IO nach Import." },
      asset: { status: "planned", notes: "Keine Original-Assets im Repo." },
      build: { status: "planned", notes: "Export erst nach Datenmodell." },
    },
  };
}

export function projectJson(project: KitProject): string {
  return JSON.stringify(project, null, 2);
}
