import { create } from "zustand";
import type { AuthoredGame, CharacterView, Endian, FileRecord, GameId, KitProject } from "./ishar/types";
import { emptyProject, normalizeProject } from "./ishar/project";
import { createDemoSave, readParty } from "./ishar/save-codec";
import { ISHAR1_SAVE, ISHAR2_SAVE } from "./ishar/save-maps";

const PROJECT_STORAGE_KEY = "ishar-ck-project-v1";

interface KitState {
  game: GameId;
  endian: Endian;
  saveName: string;
  saveBytes: Uint8Array | null;
  originalBytes: Uint8Array | null;
  isDemo: boolean;
  party: CharacterView[];
  selectedSlot: number;
  inventory: FileRecord[];
  inventorySource: string;
  labBytes: Uint8Array | null;
  labName: string;
  project: KitProject;
  builderLevelId: string | null;
  builderPast: AuthoredGame[];
  builderFuture: AuthoredGame[];
  selectBuilderLevel: (id: string) => void;
  editBuilderGame: (game: AuthoredGame) => void;
  undoBuilder: () => void;
  redoBuilder: () => void;
  selectedFieldId: string | null;
  setGame: (game: GameId) => void;
  setEndian: (endian: Endian) => void;
  loadSave: (name: string, bytes: Uint8Array, demo?: boolean) => void;
  loadDemo: () => void;
  setParty: (party: CharacterView[]) => void;
  setSlot: (slot: number) => void;
  setInventory: (records: FileRecord[], source: string) => void;
  setLab: (name: string, bytes: Uint8Array) => void;
  setProject: (project: KitProject) => void;
  hydrateProject: () => void;
  resetProject: (name?: string) => void;
  setField: (id: string | null) => void;
  patchCharacter: (slot: number, patch: Partial<CharacterView>) => void;
}

function parseParty(
  bytes: Uint8Array,
  game: GameId,
  endian: Endian,
  overlays: Record<string, string>,
): CharacterView[] {
  const map = game === "ishar1" ? ISHAR1_SAVE : ISHAR2_SAVE;
  const o: Record<number, string> = {};
  Object.entries(overlays).forEach(([k, v]) => {
    o[Number(k)] = v;
  });
  return readParty(bytes, map, endian, o);
}

function persistProject(project: KitProject) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project));
}

const builderKey=(project:KitProject)=>`${PROJECT_STORAGE_KEY}:builder:${project.createdAt}`;
function restoredLevel(project:KitProject){
  if(typeof window==="undefined") return null;
  const id=window.localStorage.getItem(builderKey(project));
  return project.game.levels.some((l)=>l.id===id) ? id : null;
}

export const useKit = create<KitState>((set, get) => ({
  game: "ishar2",
  endian: "be",
  saveName: "",
  saveBytes: null,
  originalBytes: null,
  isDemo: false,
  party: [],
  selectedSlot: 0,
  inventory: [],
  inventorySource: "",
  labBytes: null,
  labName: "",
  project: emptyProject(),
  builderLevelId: null,
  builderPast: [],
  builderFuture: [],
  selectBuilderLevel: (id) => {
    if(typeof window!=="undefined") window.localStorage.setItem(builderKey(get().project),id);
    set({builderLevelId:id});
  },
  editBuilderGame: (game) => {
    const current=get();
    if(game===current.project.game) return;
    const project={...current.project,game};
    persistProject(project);
    set({project,builderPast:[...current.builderPast.slice(-99),current.project.game],builderFuture:[]});
  },
  undoBuilder: () => {
    const current=get(), game=current.builderPast.at(-1);
    if(!game) return;
    const project={...current.project,game}; persistProject(project);
    set({project,builderPast:current.builderPast.slice(0,-1),builderFuture:[...current.builderFuture,current.project.game]});
  },
  redoBuilder: () => {
    const current=get(), game=current.builderFuture.at(-1);
    if(!game) return;
    const project={...current.project,game}; persistProject(project);
    set({project,builderFuture:current.builderFuture.slice(0,-1),builderPast:[...current.builderPast,current.project.game]});
  },
  selectedFieldId: null,
  setGame: (game) => {
    const { saveBytes, endian, project } = get();
    if (!saveBytes) {
      set({ game });
      return;
    }
    set({ game, party: parseParty(saveBytes, game, endian, project.nameOverlays) });
  },
  setEndian: (endian) => {
    const { saveBytes, game, project } = get();
    if (!saveBytes) {
      set({ endian });
      return;
    }
    set({ endian, party: parseParty(saveBytes, game, endian, project.nameOverlays) });
  },
  loadSave: (name, bytes, demo = false) => {
    const { game, endian, project } = get();
    const copy = new Uint8Array(bytes);
    set({
      saveName: name,
      saveBytes: copy,
      originalBytes: new Uint8Array(copy),
      isDemo: demo,
      party: parseParty(copy, game, endian, project.nameOverlays),
      selectedSlot: 0,
      labBytes: copy,
      labName: name,
    });
  },
  loadDemo: () => {
    const demo = createDemoSave();
    const overlays: Record<string, string> = {};
    Object.entries(demo.overlays).forEach(([k, v]) => {
      overlays[k] = v;
    });
    const project = { ...get().project, nameOverlays: overlays };
    persistProject(project);
    set({
      game: "ishar2",
      endian: "be",
      project,
      saveName: "DEMO.SAV",
      saveBytes: demo.bytes,
      originalBytes: new Uint8Array(demo.bytes),
      isDemo: true,
      party: readParty(demo.bytes, ISHAR2_SAVE, "be", demo.overlays),
      selectedSlot: 0,
      labBytes: demo.bytes,
      labName: "DEMO.SAV",
    });
  },
  setParty: (party) => set({ party }),
  setSlot: (selectedSlot) => set({ selectedSlot }),
  setInventory: (inventory, inventorySource) => set({ inventory, inventorySource }),
  setLab: (labName, labBytes) => set({ labName, labBytes }),
  setProject: (project) => {
    persistProject(project);
    set({ project, builderLevelId:restoredLevel(project), builderPast:[], builderFuture:[] });
  },
  hydrateProject: () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) return;
    try {
      const project=normalizeProject(JSON.parse(raw));
      set({ project, builderLevelId:restoredLevel(project), builderPast:[], builderFuture:[] });
    } catch {
      window.localStorage.removeItem(PROJECT_STORAGE_KEY);
    }
  },
  resetProject: (name) => {
    const project = emptyProject(name);
    persistProject(project);
    set({ project, builderLevelId:null, builderPast:[], builderFuture:[] });
  },
  setField: (selectedFieldId) => set({ selectedFieldId }),
  patchCharacter: (slot, patch) => {
    const party = get().party.map((c) => (c.slot === slot ? { ...c, ...patch } : c));
    const project = { ...get().project };
    if (patch.overlayName !== undefined) {
      project.nameOverlays = { ...project.nameOverlays, [String(slot)]: patch.overlayName };
      persistProject(project);
    }
    set({ party, project });
  },
}));
