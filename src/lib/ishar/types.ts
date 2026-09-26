export type Confidence = "confirmed" | "probable" | "possible" | "unknown";

export type GameId = "ishar1" | "ishar2" | "unknown";

export type Endian = "le" | "be";

export type EvidenceKind = "known" | "suspected" | "unknown";

export interface Evidence {
  kind: EvidenceKind;
  summary: string;
  source: string;
  nextTest?: string;
}

export interface FieldSpec {
  id: string;
  label: string;
  labelEn: string;
  /** Decimal byte offset of the first party member. */
  offset: number;
  size: 1 | 2;
  stride: number;
  unit: "u8" | "u16";
  min?: number;
  max?: number;
  confidence: Confidence;
  evidence: Evidence;
  tooltip: string;
}

export interface SaveMap {
  id: string;
  game: GameId;
  title: string;
  partySize: number;
  minLength: number;
  defaultEndian: Endian;
  confidence: Confidence;
  notes: string;
  fields: Record<string, FieldSpec>;
  inventory?: {
    base: number;
    stride: number;
    slotBytes: 2;
    backpack: number;
    hands: number;
    armor: number;
    helm: number;
    layout: number[];
    confidence: Confidence;
    evidence: Evidence;
  };
  classes: { id: number; name: string; nameEn: string }[];
  races: { id: number; name: string; nameEn: string }[];
}

export interface InventorySlot {
  index: number;
  kind: "backpack" | "hand" | "armor" | "helm";
  itemId: number;
  raw: [number, number];
}

export interface CharacterView {
  slot: number;
  present: boolean;
  overlayName: string;
  classId: number;
  raceId: number;
  level: number;
  xp: number;
  hp: number;
  hpMax: number;
  gold: number;
  strength: number;
  constitution: number;
  wisdom: number;
  intelligence: number;
  agility: number;
  psychic: number;
  physical: number;
  armorClass: number;
  skillOneHand: number;
  skillTwoHand: number;
  skillThrow: number;
  skillShoot: number;
  skillLock: number;
  skillFirstAid: number;
  skillPerception: number;
  inventory: InventorySlot[];
  spellBytes: number[];
}

export interface PatchResult {
  bytes: Uint8Array;
  changedOffsets: number[];
  untouched: boolean;
  readbackOk: boolean;
  mismatches: string[];
}

export interface FileRecord {
  path: string;
  size: number;
  ext: string;
  entropy: number;
  magic: string;
  classification: FileClass;
  confidence: Confidence;
  reason: string;
  silm?: SilmHeader | null;
  mz?: boolean;
  stringsPreview: string[];
}

export interface FileClass {
  role: string;
  gameHint: GameId | "shared" | "unknown";
}

export interface SilmHeader {
  packerKind: number;
  packerName: string;
  unpackedSize: number;
  endian: Endian;
  isMain: boolean;
}

export interface DiffHunk {
  offset: number;
  a: number;
  b: number;
}

export type DungeonAssetRole =
  | "viewport.background"
  | "surface.ceiling"
  | "surface.floor"
  | "wall.front"
  | "wall.left"
  | "wall.right"
  | "opening.left"
  | "opening.right"
  | "door.front.closed"
  | "door.front.open"
  | "encounter"
  | "item"
  | "portrait";

export type DungeonAssetDepth = 0 | 1 | 2 | 3;

export interface DungeonAssetEntry {
  id: string;
  role: DungeonAssetRole;
  file: string;
  depth?: DungeonAssetDepth;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
  targetId?: string;
}

export interface DungeonTileset {
  id: string;
  name: string;
  entries: DungeonAssetEntry[];
}

export interface DungeonAssetManifest {
  format: "ishar-ck-asset-pack";
  version: 1;
  id: string;
  name: string;
  viewport: { width: number; height: number };
  defaultTilesetId: string;
  shared: DungeonAssetEntry[];
  tilesets: DungeonTileset[];
}

export interface AuthoredCharacter {
  id: string;
  name: string;
  hp: number;
  attack: number;
}

export interface AuthoredItem {
  id: string;
  name: string;
  description: string;
}

export type Direction = "north" | "east" | "south" | "west";

export interface AuthoredLocation {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  exits: string[];
  itemIds: string[];
  encounterId?: string;
  tilesetId?: string;
  ending?: boolean;
}

export interface AuthoredDoor {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  initiallyOpen: boolean;
  keyItemId?: string;
}

export interface AuthoredEncounter {
  id: string;
  name: string;
  enemyHp: number;
  enemyAttack: number;
  victoryText: string;
  questId?: string;
}

export interface AuthoredQuest {
  id: string;
  title: string;
  objective: string;
  completedText: string;
}

export interface AuthoredGame {
  assetPackId?: string;
  startLocationId: string;
  startFacing: Direction;
  characters: AuthoredCharacter[];
  items: AuthoredItem[];
  locations: AuthoredLocation[];
  encounters: AuthoredEncounter[];
  doors: AuthoredDoor[];
  quests: AuthoredQuest[];
}

export interface KitProject {
  format: "ishar-ck-project";
  version: 1;
  name: string;
  createdAt: string;
  notes: string;
  sourceGames: GameId[];
  nameOverlays: Record<string, string>;
  modules: Record<string, { status: "planned" | "audit" | "partial" | "ready"; notes: string }>;
  game: AuthoredGame;
}
