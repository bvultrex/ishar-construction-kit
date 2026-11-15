import type { AlisIndexedImage, AlisPaletteResource } from './alis-assets';

const name = (path: string) => path.replace(/\\/g, '/').split('/').pop()!.toUpperCase();

// DOS Ishar 2: MAIN loads these scene/background pairs. The background scripts
// select the listed palettes via cpalette (0x68). See AUDIT.md for corpus offsets.
const scenePalettes: Record<string, [string, number]> = {
  'DJ1.IO': ['FDJ1.IO', 2], 'FDJ1.IO': ['FDJ1.IO', 2],
  'DJ2.IO': ['FDJ2.IO', 1],
  // PCAVE.IO has no own palette; it is spawned inside DJ scenes. DJ1 palette used (DJ2 unverified).
  'PCAVE.IO': ['FDJ1.IO', 2], 'FDJ2.IO': ['FDJ2.IO', 1],
  'DJCAT.IO': ['FDJCAT.IO', 0], 'FDJCAT.IO': ['FDJCAT.IO', 0],
  'ARBO.IO': ['FARBO.IO', 1], 'PLAINE1.IO': ['FOND1.IO', 3],
  'MONTAGNE.IO': ['FMONT.IO', 3], 'VHOUSE2.IO': ['FVILLE.IO', 0],
};

export function overlayAlisPalette(base: Uint8Array, local: AlisPaletteResource) {
  const result = base.slice();
  const start = local.firstColor * 3;
  const end = (local.firstColor + local.colorCount) * 3;
  result.set(local.palette.subarray(start, end), start);
  return result;
}

export function resolveIshar2Palettes(images: AlisIndexedImage[], palettes: AlisPaletteResource[]) {
  const find = (source: string, index: number) => palettes.find(p => name(p.sourcePath) === source && p.entryIndex === index);
  // A daylight scene is a documented preview context, not a claim that every
  // original scene/time of day used this palette. MAIN #11 is NOT a scene base.
  const base = find('FOND1.IO', 3);
  let localCount = 0, globalCount = 0;
  for (const image of images) {
    const pair = scenePalettes[name(image.sourcePath)];
    const scene = pair && find(...pair);
    const local = palettes.filter(p => p.sourcePath === image.sourcePath && (p.colorCount > 16 || p.firstColor > 0))
      .sort((a,b) => a.entryIndex - b.entryIndex)[0];
    // Palette resources are declarations, not an execution timeline. In actors
    // the normal palette follows the sprites; later variants are lighting states.
    const selected = scene || local;
    if (!selected && !base) continue;
    const foundation = base?.palette ?? selected!.palette;
    image.palette = selected ? overlayAlisPalette(foundation, selected) : foundation.slice();
    image.paletteSource = selected?.sourcePath === image.sourcePath ? 'embedded' : 'global';
    image.paletteEntryIndex = (selected ?? base)!.entryIndex;
    image.paletteLabel = `${(selected ?? base)!.sourcePath} / #${image.paletteEntryIndex}` +
      (scene ? ' · Szenenzuordnung' : local ? ' · erste Modulpalette (Vorschau)' : ' · Tageslicht-Vorschau; Szenenkontext offen');
    if (image.paletteSource === 'embedded') localCount++; else globalCount++;
  }
  return { localCount, globalCount, base };
}
