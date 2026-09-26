import { create } from "zustand";
import type { LoadedAssetPack } from "./ishar/asset-pack";
import { revokeAssetPack } from "./ishar/asset-pack";

interface AssetPackState {
  pack: LoadedAssetPack | null;
  setPack: (pack: LoadedAssetPack) => void;
  updatePack: (pack: LoadedAssetPack) => void;
  clearPack: () => void;
}

export const useAssetPack = create<AssetPackState>((set, get) => ({
  pack: null,
  setPack: (pack) => {
    revokeAssetPack(get().pack);
    set({ pack });
  },
  updatePack: (pack) => set({ pack }),
  clearPack: () => {
    revokeAssetPack(get().pack);
    set({ pack: null });
  },
}));
