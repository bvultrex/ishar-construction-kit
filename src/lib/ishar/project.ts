import type { AuthoredGame, AuthoredLocation, Direction, KitProject } from "./types";

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

const DIRECTIONS: Direction[] = ["north", "east", "south", "west"];

export function starterGame(): AuthoredGame {
  return {
    startLocationId: "gate",
    startFacing: "north",
    characters: [{ id: "hero", name: "Aramir", hp: 18, attack: 5 }],
    items: [
      { id: "sun-key", name: "Sonnenschlüssel", description: "Ein warmer Messingschlüssel mit einer Sonnenglyphe." },
      { id: "crypt-rune", name: "Runenstein", description: "Ein kalter Stein, in den ein längst vergessenes Zeichen geritzt wurde." },
    ],
    locations: [
      { id: "gate", name: "Verfallenes Tor", description: "Das Tor fällt hinter dir ins Schloss. Ein schmaler Gang führt nach Norden.", x: 0, y: 3, exits: ["vestibule"], itemIds: [] },
      { id: "vestibule", name: "Vorhalle", description: "Feuchte Quadersteine und eiserne Fackelhalter säumen die Vorhalle.", x: 0, y: 2, exits: ["gate", "crossing"], itemIds: [] },
      { id: "crossing", name: "Kreuzgang", description: "Der Gang verzweigt sich nach Westen und Osten. Geradeaus versperrt Mauerwerk den Weg.", x: 0, y: 1, exits: ["vestibule", "crypt", "guardhall"], itemIds: [] },
      { id: "crypt", name: "Alte Krypta", description: "Niedrige Sarkophage stehen im Staub. Auf einem Sockel liegt ein Runenstein.", x: -1, y: 1, exits: ["crossing"], itemIds: ["crypt-rune"] },
      { id: "guardhall", name: "Wächterhalle", description: "Zwischen zerbrochenen Säulen regt sich ein steinerner Wächter.", x: 1, y: 1, exits: ["crossing", "north-passage"], itemIds: [], encounterId: "guardian" },
      { id: "north-passage", name: "Nordgang", description: "Der enge Gang steigt leicht an. Kaltes Licht fällt von Norden herein.", x: 1, y: 0, exits: ["guardhall", "sanctum"], itemIds: [] },
      { id: "sanctum", name: "Sonnenheiligtum", description: "Goldenes Licht fällt auf einen uralten Steinsockel. Hier endet der Test-Dungeon.", x: 1, y: -1, exits: ["north-passage"], itemIds: ["sun-key"], ending: true },
    ],
    encounters: [{ id: "guardian", name: "Steinwächter", enemyHp: 12, enemyAttack: 3, victoryText: "Der Wächter zerfällt zu Geröll. Der Nordgang ist frei.", questId: "reach-sanctum" }],
    doors: [{ id: "sanctum-seal", fromLocationId: "north-passage", toLocationId: "sanctum", initiallyOpen: false, keyItemId: "crypt-rune" }],
    quests: [{ id: "reach-sanctum", title: "Das Sonnenheiligtum", objective: "Erkunde die Ruine, besiege den Steinwächter und erreiche das Heiligtum.", completedText: "Der Wächter ist besiegt. Finde nun das Sonnenheiligtum." }],
  };
}

function normalizedLocation(location: AuthoredLocation, index: number): AuthoredLocation {
  const legacyStarterPositions: Record<string, { x: number; y: number }> = {
    gate: { x: 0, y: 2 },
    courtyard: { x: 0, y: 1 },
    sanctum: { x: 0, y: 0 },
  };
  const legacy = legacyStarterPositions[location.id];
  return {
    ...location,
    x: Number.isFinite(location.x) ? location.x : (legacy?.x ?? 0),
    y: Number.isFinite(location.y) ? location.y : (legacy?.y ?? index),
  };
}

export function normalizeGame(raw: unknown): AuthoredGame {
  const fallback = starterGame();
  if (!raw || typeof raw !== "object") return fallback;
  const source = raw as Partial<AuthoredGame>;
  const locations = Array.isArray(source.locations)
    ? source.locations.map((location, index) => normalizedLocation(location, index))
    : fallback.locations;
  const facing = DIRECTIONS.includes(source.startFacing as Direction) ? source.startFacing as Direction : "north";
  return {
    ...fallback,
    ...source,
    startFacing: facing,
    characters: Array.isArray(source.characters) ? source.characters : fallback.characters,
    items: Array.isArray(source.items) ? source.items : fallback.items,
    encounters: Array.isArray(source.encounters) ? source.encounters : fallback.encounters,
    doors: Array.isArray(source.doors) ? source.doors : fallback.doors,
    quests: Array.isArray(source.quests) ? source.quests : fallback.quests,
    locations,
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
      item: { status: "partial", notes: "Projekt-Items im spielbaren Dungeon-Slice." },
      magic: { status: "audit", notes: "Spell-Bytes ab 7577 roh sichtbar." },
      world: { status: "partial", notes: "Kardinales X/Y-Dungeonraster, Türen und First-Person-Playtest." },
      npc: { status: "planned", notes: "" },
      quest: { status: "partial", notes: "Quest-Ziel und Kampfabschluss im Dungeon-Slice." },
      dialogue: { status: "partial", notes: "Raum-, Quest- und Encounter-Texte ergänzen die visuelle Ansicht." },
      asset: { status: "planned", notes: "Keine Original-Assets im Repo." },
      build: { status: "partial", notes: "Projekt-JSON plus Browser-Dungeon-Playtest." },
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
    game: normalizeGame(project.game),
  };
}

export function projectJson(project: KitProject): string {
  return JSON.stringify(project, null, 2);
}
