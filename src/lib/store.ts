import { create } from "zustand";
import type { CharacterView, Endian, FileRecord, GameId, KitProject } from "./ishar/types";
import { emptyProject } from "./ishar/project";
import { createDemoSave, readParty } from "./ishar/save-codec";
import { ISHAR1_SAVE, ISHAR2_SAVE } from "./ishar/save-maps";

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
  setProject: (project) => set({ project }),
  setField: (selectedFieldId) => set({ selectedFieldId }),
  patchCharacter: (slot, patch) => {
    const party = get().party.map((c) => (c.slot === slot ? { ...c, ...patch } : c));
    const project = { ...get().project };
    if (patch.overlayName !== undefined) {
      project.nameOverlays = { ...project.nameOverlays, [String(slot)]: patch.overlayName };
    }
    set({ party, project });
  },
}));
