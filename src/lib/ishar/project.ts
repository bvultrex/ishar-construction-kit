import type { AuthoredGame, KitProject } from "./types";

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

export function starterGame(): AuthoredGame {
  return {
    startLocationId: "gate",
    characters: [{ id: "hero", name: "Aramir", hp: 18, attack: 5 }],
    items: [{ id: "sun-key", name: "Sonnenschlüssel", description: "Ein warmer Messingschlüssel mit einer Sonnenglyphe." }],
    locations: [
      { id: "gate", name: "Verfallenes Tor", description: "Ein moosiges Tor führt in die Ruinen. Im Osten flackert Licht.", exits: ["courtyard"], itemIds: [] },
      { id: "courtyard", name: "Innenhof", description: "Zwischen zerbrochenen Säulen lauert ein Wächter.", exits: ["gate", "sanctum"], itemIds: [], encounterId: "guardian" },
      { id: "sanctum", name: "Sonnenheiligtum", description: "Goldenes Licht fällt auf einen uralten Steinsockel.", exits: ["courtyard"], itemIds: ["sun-key"], ending: true },
    ],
    encounters: [{ id: "guardian", name: "Steinwächter", enemyHp: 12, enemyAttack: 3, victoryText: "Der Wächter zerfällt. Der Weg zum Heiligtum ist frei.", questId: "reach-sanctum" }],
    quests: [{ id: "reach-sanctum", title: "Das Sonnenheiligtum", objective: "Besiege den Wächter und erreiche das Heiligtum.", completedText: "Das Heiligtum ist erreicht. Die kleine Testquest ist abgeschlossen." }],
  };
}

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
      character: { status: "partial", notes: "Save-Round-Trip und originales Authoring-Modell." },
      item: { status: "partial", notes: "Originale Projekt-Items im Vertical Slice." },
      magic: { status: "audit", notes: "Spell-Bytes ab 7577 roh sichtbar." },
      world: { status: "partial", notes: "Originale Locations und Verbindungen im Vertical Slice." },
      npc: { status: "planned", notes: "" },
      quest: { status: "partial", notes: "Quest-Ziel und Abschluss im Vertical Slice." },
      dialogue: { status: "partial", notes: "Location-, Quest- und Encounter-Texte." },
      asset: { status: "planned", notes: "Keine Original-Assets im Repo." },
      build: { status: "partial", notes: "Projekt-JSON plus Browser-Playtest." },
    },
    game: starterGame(),
  };
}

export function normalizeProject(input: unknown): KitProject {
  if (!input || typeof input !== "object") throw new Error("Ungültige Projektdatei.");
  const project = input as Partial<KitProject>;
  if (project.format !== "ishar-ck-project" || project.version !== 1) throw new Error("Nicht unterstütztes Projektformat.");
  const fallback = emptyProject(typeof project.name === "string" ? project.name : "Imported Ishar Project");
  return {
    ...fallback,
    ...project,
    modules: { ...fallback.modules, ...(project.modules ?? {}) },
    nameOverlays: project.nameOverlays ?? {},
    game: project.game ?? fallback.game,
  };
}

export function projectJson(project: KitProject): string {
  return JSON.stringify(project, null, 2);
}
