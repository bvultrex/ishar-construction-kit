import type { GameId } from "./types";
import type { AlisIndexedImage } from "./alis-assets";

export type DistanceSpriteRole = "near" | "mid" | "far";
export type DistanceSetConfidence = "verified" | "heuristic";

export interface DistanceSetMembership {
  setId: string;
  label: string;
  role: DistanceSpriteRole;
  index: 0 | 1 | 2;
  confidence: DistanceSetConfidence;
  semantic?: "key" | "mushroom";
}

export interface DistanceSetSummary {
  id: string;
  label: string;
  sourcePath: string;
  entryIndices: [number, number, number];
  confidence: DistanceSetConfidence;
  semantic?: DistanceSetMembership["semantic"];
}

export interface DistanceSetDetection {
  byImageKey: Map<string, DistanceSetMembership>;
  sets: DistanceSetSummary[];
}

const ROLES: DistanceSpriteRole[] = ["near", "mid", "far"];

const VERIFIED_ISHAR2_OBJET_SETS: Array<{
  entries: [number, number, number];
  label: string;
  semantic?: DistanceSetMembership["semantic"];
}> = [
  { entries: [69, 70, 71], label: "Schlüssel-Serie 1", semantic: "key" },
  { entries: [72, 73, 74], label: "Schlüssel-Serie 2", semantic: "key" },
  { entries: [232, 233, 234], label: "Pilz-Serie", semantic: "mushroom" },
];

function baseName(path: string) {
  return path.split(/[/\\]/).pop()?.toUpperCase() ?? path.toUpperCase();
}

function imageKey(image: Pick<AlisIndexedImage, "sourcePath" | "entryIndex">) {
  return image.sourcePath + "#" + image.entryIndex;
}

function visibleFootprint(image: AlisIndexedImage) {
  const transparent = image.transparentIndex;
  if (transparent === undefined) return image.width * image.height;

  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const pixel = image.pixels[y * image.width + x];
      if (pixel === transparent) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) return 0;
  return (maxX - minX + 1) * (maxY - minY + 1);
}

function plausibleShrinkingTriple(a: AlisIndexedImage, b: AlisIndexedImage, c: AlisIndexedImage) {
  if (a.assetKind !== "sprite" || b.assetKind !== "sprite" || c.assetKind !== "sprite") return false;
  if (Math.max(a.width, a.height, b.width, b.height, c.width, c.height) > 192) return false;

  const areaA = visibleFootprint(a);
  const areaB = visibleFootprint(b);
  const areaC = visibleFootprint(c);
  if (!areaA || !areaB || !areaC) return false;

  // Keep this conservative: a distance family must visibly shrink at both
  // transitions. This is evidence for grouping, not proof of item semantics.
  return areaB <= areaA * 0.94
    && areaC <= areaB * 0.94
    && areaC <= areaA * 0.82
    && areaB >= areaA * 0.18
    && areaC >= areaB * 0.18;
}

export function detectAlisDistanceSets(images: AlisIndexedImage[], game: GameId): DistanceSetDetection {
  const byImageKey = new Map<string, DistanceSetMembership>();
  const sets: DistanceSetSummary[] = [];

  const register = (
    sourcePath: string,
    entryIndices: [number, number, number],
    label: string,
    confidence: DistanceSetConfidence,
    semantic?: DistanceSetMembership["semantic"],
  ) => {
    const id = [game, baseName(sourcePath).replace(/[^A-Z0-9]+/g, "-").toLowerCase(), ...entryIndices].join("-");
    const summary: DistanceSetSummary = { id, label, sourcePath, entryIndices, confidence, semantic };
    sets.push(summary);
    entryIndices.forEach((entryIndex, index) => {
      byImageKey.set(sourcePath + "#" + entryIndex, {
        setId: id,
        label,
        role: ROLES[index]!,
        index: index as 0 | 1 | 2,
        confidence,
        semantic,
      });
    });
  };

  if (game === "ishar2") {
    const objetSources = [...new Set(images.filter((image) => baseName(image.sourcePath) === "OBJET.IO").map((image) => image.sourcePath))];
    for (const sourcePath of objetSources) {
      const entries = new Set(images.filter((image) => image.sourcePath === sourcePath).map((image) => image.entryIndex));
      for (const known of VERIFIED_ISHAR2_OBJET_SETS) {
        if (known.entries.every((entry) => entries.has(entry))) {
          register(sourcePath, known.entries, known.label, "verified", known.semantic);
        }
      }
    }
  }

  // Current heuristic scope is intentionally narrow. User-verified Ishar 2
  // OBJET.IO families established the rule: consecutive ALIS IDs represent
  // near -> mid -> far when the visible sprite footprint shrinks in order.
  // Do not apply this blindly to scene/composite resources.
  const candidateSources = [...new Set(
    images
      .filter((image) => baseName(image.sourcePath) === "OBJET.IO")
      .map((image) => image.sourcePath),
  )];

  for (const sourcePath of candidateSources) {
    const ordered = images
      .filter((image) => image.sourcePath === sourcePath && image.assetKind === "sprite")
      .sort((a, b) => a.entryIndex - b.entryIndex);
    const byEntry = new Map(ordered.map((image) => [image.entryIndex, image]));

    for (const first of ordered) {
      const second = byEntry.get(first.entryIndex + 1);
      const third = byEntry.get(first.entryIndex + 2);
      if (!second || !third) continue;
      const keys = [imageKey(first), imageKey(second), imageKey(third)];
      if (keys.some((key) => byImageKey.has(key))) continue;
      if (!plausibleShrinkingTriple(first, second, third)) continue;

      register(
        sourcePath,
        [first.entryIndex, second.entryIndex, third.entryIndex],
        `Distanzset #${first.entryIndex}–#${third.entryIndex}`,
        "heuristic",
      );
    }
  }

  return { byImageKey, sets };
}
