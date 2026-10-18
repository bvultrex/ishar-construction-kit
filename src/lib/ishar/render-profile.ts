import type { DungeonAssetManifest, DungeonRenderProfileId, GameId } from "./types";

export interface DungeonRenderProfile {
  id: DungeonRenderProfileId;
  screenWidth: number;
  screenHeight: number;
  drawWidth: number;
  drawHeight: number;
  pixelAspectY: number;
  label: string;
}

export const DUNGEON_RENDER_PROFILES: Record<Exclude<DungeonRenderProfileId, "custom">, DungeonRenderProfile> = {
  construction: { id: "construction", screenWidth: 640, screenHeight: 400, drawWidth: 640, drawHeight: 400, pixelAspectY: 1, label: "Construction Kit" },
  "ishar1-dos": { id: "ishar1-dos", screenWidth: 320, screenHeight: 200, drawWidth: 256, drawHeight: 126, pixelAspectY: 1.2, label: "Ishar 1 DOS" },
  "ishar2-dos": { id: "ishar2-dos", screenWidth: 320, screenHeight: 200, drawWidth: 256, drawHeight: 113, pixelAspectY: 1.2, label: "Ishar 2 DOS" },
};

export function renderProfileForGame(game: GameId): DungeonRenderProfile {
  if (game === "ishar1") return DUNGEON_RENDER_PROFILES["ishar1-dos"];
  if (game === "ishar2") return DUNGEON_RENDER_PROFILES["ishar2-dos"];
  return DUNGEON_RENDER_PROFILES.construction;
}

export function renderProfileForManifest(manifest?: DungeonAssetManifest): DungeonRenderProfile {
  const id = manifest?.renderProfileId;
  if (id && id !== "custom" && id in DUNGEON_RENDER_PROFILES) {
    const known = DUNGEON_RENDER_PROFILES[id as Exclude<DungeonRenderProfileId, "custom">];
    return {
      ...known,
      drawWidth: manifest?.viewport.width ?? known.drawWidth,
      drawHeight: manifest?.viewport.height ?? known.drawHeight,
      pixelAspectY: manifest?.pixelAspectY ?? known.pixelAspectY,
    };
  }
  if (manifest) {
    return { id: "custom", screenWidth: manifest.viewport.width, screenHeight: manifest.viewport.height, drawWidth: manifest.viewport.width, drawHeight: manifest.viewport.height, pixelAspectY: manifest.pixelAspectY ?? 1, label: "Custom asset pack" };
  }
  return DUNGEON_RENDER_PROFILES.construction;
}

export function displayAspect(profile: DungeonRenderProfile) {
  return profile.drawWidth / (profile.drawHeight * profile.pixelAspectY);
}

export function sourceScale(profile: DungeonRenderProfile, normalizedWidth = 640, normalizedHeight = 400) {
  return { x: normalizedWidth / profile.drawWidth, y: normalizedHeight / profile.drawHeight };
}
