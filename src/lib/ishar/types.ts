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
  | "wall.reveal.left"
  | "scene.sprite"
  | "wall.reveal.right"
  | "door.front.closed"
  | "door.leaf.closed.wood"
  | "door.leaf.closed.grate"
  | "door.leaf.open.wood"
  | "door.leaf.open.grate"
  | "door.front.open"
  | "encounter"
  | "item"
  | "portrait";

export type DungeonAssetDepth = 0 | 1 | 2 | 3;
export type DungeonAssetRenderMode = "layer" | "texture";
export type DungeonRenderProfileId = "construction" | "ishar1-dos" | "ishar2-dos" | "custom";

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
  renderMode?: DungeonAssetRenderMode;
  tileWidth?: number;
  tileHeight?: number;
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
  renderProfileId?: DungeonRenderProfileId;
  pixelAspectY?: number;
  defaultTilesetId: string;
  shared: DungeonAssetEntry[];
  tilesets: DungeonTileset[];
}

export interface AuthoredCharacter {
  id: string;
  name: string;
  hp: number;
  attack: number;
  /** Optional character-sheet details authored by the kit user. */
  race?: string;
  profession?: string;
  level?: number;
  experience?: number;
  physical?: number;
  psychic?: number;
  alignment?: number;
}

export interface AuthoredItem {
  /** Original OBJET positive ground code; only verified resource families are enabled. */
  originalObjectCode?: number;
  /** Runtime placement instance: original definition for key/asset lookup. */
  definitionId?: string;
  id: string;
  name: string;
  description: string;
  /** Legacy/single-sprite override. Used as near sprite when no distance set exists. */
  assetId?: string;
  assetNearId?: string;
  assetMidId?: string;
  assetFarId?: string;
}

export type Direction = "north" | "east" | "south" | "west";

export interface AuthoredLocation {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  levelId?: string;
  exits: string[];
  itemIds: string[];
  /** Persistent identities of ground copies, parallel to itemIds. */
  itemPlacementIds?: string[];
  npcIds?: string[];
  encounterId?: string;
  tilesetId?: string;
  sceneKind?: "corridor" | "room" | "outdoor";
  /** Outdoor ground; water blocks movement and is rendered separately from grass. */
  outdoorSurface?: "grass" | "water";
  roomGroupId?: string;
  sceneryAssetId?: string;
  wallAssetId?: string;
  floorAssetId?: string;
  ceilingAssetId?: string;
  ending?: boolean;
}

export interface AuthoredLevel {
  id: string;
  name: string;
  kind: "dungeon" | "house" | "outdoor";
  /** Toolkit scene preset; it does not encode an original Ishar area ID. */
  biome?: "swamp";
  tilesetId?: string;
  /** Optional original-format grid (plan v3). Absent = legacy CK edge model. */
  grid?: IsharGrid;
}

export type IsharGridScene = "DJ1" | "DJ2" | "DJCAT" | "PLAINE1" | "FORET1" | "MONTAGNE" | "VILLE" | (string & {});

/**
 * Mirror of an Ishar CONTn.FIC map (decompile/alis/CONT-FIC.md §1, known):
 * Ishar 2 = two signed byte layers of 90 rows x 60 cols (A at r*60+c, B at 5400+r*60+c);
 * Ishar 1 = one layer 54 x 90. Bytes are stored raw (base64) for byte-exact export.
 * Grid levels may contain original data: never publish/commit such projects.
 */
export interface IsharGrid {
  game: "ishar1" | "ishar2";
  rows: number;
  cols: number;
  /** Layer A (geometry), base64 of raw signed bytes. */
  layerA: string;
  /** Layer B (doors 61..109 = door+60, traps, scene triggers), Ishar 2 only. */
  layerB?: string;
  /** Door-open table like main 0x4aa4, index = B-60. Missing = closed (0). */
  doorsInitiallyOpen?: Record<string, boolean>;
  /** main 0x4ef2 at the start position (e.g. from a savegame); the scene type is walk state in the original. */
  startSceneType?: number;
  /** r11b, converted edge levels only: extra edge elements (5-8) per cell index r*cols+c for doors on
   *  cells that are not straight corridors. Not part of the CONT bytes; the exporter ignores it. */
  edgeExtras?: Record<number, number[]>;
  /** CK extension: key item per original door number. */
  doorKeys?: Record<string, string>;
  /** Scene-type rectangles like main 0x4ef2 (values per map not decoded yet: unknown). */
  sceneRegions?: { r0: number; c0: number; r1: number; c1: number; scene: IsharGridScene }[];
  /** CONTn number (1..7); drives map-dependent GERDEP rules (edge checks only map>4). */
  mapNumber?: number;
  source?: { file: string; sha256: string; evidence: EvidenceKind };
}

export interface AuthoredPortal {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  label: string;
}

export interface AuthoredDoor {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  initiallyOpen: boolean;
  keyItemId?: string;
  /** Original door number (layer B − 60). Even = wooden leaf, odd = grate (PCAVE.IO). */
  originalIndex?: number;
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

export interface AuthoredNpc {
  id: string;
  name: string;
  dialogue: string;
  assetId?: string;
  /** Optional shop opens on interaction; empty stock is a dialogue-only NPC. */
  stock?: { itemId: string; price: number; quantity: number }[];
}

export interface AuthoredGame {
  /** Locally imported decompiled stock; no original table is shipped with the kit. */
  originalMerchants?: import('./original-merchants').OriginalMerchant[];
  assetPackId?: string;
  startLocationId: string;
  startFacing: Direction;
  characters: AuthoredCharacter[];
  items: AuthoredItem[];
  npcs?: AuthoredNpc[];
  startingGold?: number;
  locations: AuthoredLocation[];
  levels: AuthoredLevel[];
  portals: AuthoredPortal[];
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
