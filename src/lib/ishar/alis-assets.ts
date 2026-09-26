/**
 * Conservative DOS ALIS graphics-resource reader.
 *
 * Resource-table, palette, indexed bitmap and composite layouts are based on
 * the public MIT-licensed ALIS/silm-extract work and cross-checked against the
 * ALIS interpreter. This module keeps indexed pixels intact and attaches the
 * best statically recoverable palette snapshot.
 */

export type AlisPaletteSource = "embedded" | "global" | "default";

export interface AlisPaletteResource {
  sourcePath: string;
  entryIndex: number;
  firstColor: number;
  colorCount: number;
  palette: Uint8Array;
}

export interface AlisCompositeChild {
  entryIndex: number;
  x: number;
  y: number;
  z: number;
  flipX: boolean;
}

export interface AlisCompositeResource {
  sourcePath: string;
  entryIndex: number;
  children: AlisCompositeChild[];
}

export interface AlisIndexedImage {
  id: string;
  sourcePath: string;
  entryIndex: number;
  width: number;
  height: number;
  pixels: Uint8Array;
  palette: Uint8Array;
  paletteSource: AlisPaletteSource;
  paletteEntryIndex?: number;
  transparentIndex?: number;
  encoding: "4bit" | "4bit-offset" | "8bit";
}

export interface AlisImageExtraction {
  tableFound: boolean;
  tableEntries: number;
  images: AlisIndexedImage[];
  palettes: AlisPaletteResource[];
  composites: AlisCompositeResource[];
  rejectedImages: number;
}

const MAX_TABLE_ENTRIES = 4096;
const MAX_DIMENSION = 1024;
const MAX_PIXELS_PER_IMAGE = 1024 * 1024;

function readU16LE(bytes: Uint8Array, offset: number) {
  if (offset < 0 || offset + 2 > bytes.length) return undefined;
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8);
}

function readS16LE(bytes: Uint8Array, offset: number) {
  const value = readU16LE(bytes, offset);
  if (value === undefined) return undefined;
  return value & 0x8000 ? value - 0x10000 : value;
}

function readU32LE(bytes: Uint8Array, offset: number) {
  if (offset < 0 || offset + 4 > bytes.length) return undefined;
  return (
    (bytes[offset] ?? 0)
    | ((bytes[offset + 1] ?? 0) << 8)
    | ((bytes[offset + 2] ?? 0) << 16)
    | ((bytes[offset + 3] ?? 0) << 24)
  ) >>> 0;
}

export function defaultAlisPalette() {
  const palette = new Uint8Array(256 * 3);
  for (let bank = 0; bank < 16; bank++) {
    for (let index = 0; index < 16; index++) {
      const at = (bank * 16 + index) * 3;
      const value = index * 16;
      palette[at] = value;
      palette[at + 1] = value;
      palette[at + 2] = value;
    }
  }
  return palette;
}

function findGraphicsTable(bytes: Uint8Array, packed: boolean) {
  const add = packed ? 0 : 6;
  const rootPointer = readU32LE(bytes, 0x0e + add);
  if (rootPointer === undefined) return undefined;
  const location = rootPointer + add;
  if (location < 0 || location + 6 > bytes.length) return undefined;

  const relativeAddress = readU32LE(bytes, location);
  const entries = readU16LE(bytes, location + 4);
  if (relativeAddress === undefined || entries === undefined || entries < 1 || entries > MAX_TABLE_ENTRIES) return undefined;

  const address = location + relativeAddress;
  if (address < 0 || address + entries * 4 > bytes.length) return undefined;
  return { address, entries };
}

function entryLocation(bytes: Uint8Array, address: number, index: number) {
  const position = address + index * 4;
  const value = readU32LE(bytes, position);
  if (value === undefined || value === 0) return undefined;
  const location = position + 2 + value;
  if (location < 2 || location >= bytes.length) return undefined;
  return location;
}

function validDimensions(width: number, height: number) {
  return width > 0
    && height > 0
    && width <= MAX_DIMENSION
    && height <= MAX_DIMENSION
    && width * height <= MAX_PIXELS_PER_IMAGE;
}

function applyPaletteResource(
  bytes: Uint8Array,
  location: number,
  h1: number,
  palette: Uint8Array,
): { firstColor: number; colorCount: number } | undefined {
  // 4-bit DOS palette: 16 RGB values encoded as two bytes each.
  if (h1 === 0) {
    if (location + 32 > bytes.length) return undefined;
    for (let color = 0; color < 16; color++) {
      const first = bytes[location + color * 2] ?? 0;
      const second = bytes[location + color * 2 + 1] ?? 0;
      const at = color * 3;
      // DOS ALIS uses 3-bit R/B and 4-bit G nibbles here. The interpreter
      // masks R/B with 0x07, not 0x0f.
      palette[at] = (first & 0x07) << 5;
      palette[at + 1] = (second >> 4) << 4;
      palette[at + 2] = (second & 0x07) << 5;
    }
    return { firstColor: 0, colorCount: 16 };
  }

  // 8-bit/partial palette. ALIS stores the first palette index at location,
  // one control byte at location+1, then (h1+1) RGB triples.
  const firstColor = bytes[location] ?? 0;
  const colorCount = h1 + 1;
  const start = location + 2;
  if (firstColor + colorCount > 256 || start + colorCount * 3 > bytes.length) return undefined;

  for (let color = 0; color < colorCount; color++) {
    const source = start + color * 3;
    const target = (firstColor + color) * 3;
    palette[target] = bytes[source] ?? 0;
    palette[target + 1] = bytes[source + 1] ?? 0;
    palette[target + 2] = bytes[source + 2] ?? 0;
  }
  return { firstColor, colorCount };
}

function readPaletteTimeline(
  bytes: Uint8Array,
  sourcePath: string,
  address: number,
  entries: number,
) {
  const running = defaultAlisPalette();
  const palettes: AlisPaletteResource[] = [];

  for (let index = 0; index < entries; index++) {
    const location = entryLocation(bytes, address, index);
    if (location === undefined) continue;
    const h0 = bytes[location - 2];
    const h1 = bytes[location - 1] ?? 0;
    if (h0 !== 0xfe) continue;

    const applied = applyPaletteResource(bytes, location, h1, running);
    if (!applied) continue;
    palettes.push({
      sourcePath,
      entryIndex: index,
      firstColor: applied.firstColor,
      colorCount: applied.colorCount,
      palette: running.slice(),
    });
  }

  return palettes;
}

function paletteForEntry(entryIndex: number, palettes: AlisPaletteResource[]) {
  if (!palettes.length) return undefined;
  let selected = palettes[0]!;
  for (const palette of palettes) {
    if (palette.entryIndex > entryIndex) break;
    selected = palette;
  }
  return selected;
}

function readComposites(
  bytes: Uint8Array,
  sourcePath: string,
  address: number,
  entries: number,
) {
  const composites: AlisCompositeResource[] = [];
  for (let index = 0; index < entries; index++) {
    const location = entryLocation(bytes, address, index);
    if (location === undefined) continue;
    const h0 = bytes[location - 2];
    const count = bytes[location - 1] ?? 0;
    if (h0 !== 0xff || count === 0 || location + count * 8 > bytes.length) continue;

    const children: AlisCompositeChild[] = [];
    for (let child = 0; child < count; child++) {
      const at = location + child * 8;
      const rawEntry = readS16LE(bytes, at);
      const x = readS16LE(bytes, at + 2);
      const y = readS16LE(bytes, at + 4);
      const z = readS16LE(bytes, at + 6);
      if (rawEntry === undefined || x === undefined || y === undefined || z === undefined) continue;
      children.push({
        entryIndex: rawEntry < 0 ? rawEntry & 0x7fff : rawEntry,
        x,
        y,
        z,
        flipX: rawEntry < 0,
      });
    }
    if (children.length) composites.push({ sourcePath, entryIndex: index, children });
  }
  return composites;
}

export function extractAlisIndexedImages(
  bytes: Uint8Array,
  sourcePath: string,
  packed = true,
): AlisImageExtraction {
  const table = findGraphicsTable(bytes, packed);
  if (!table) {
    return {
      tableFound: false,
      tableEntries: 0,
      images: [],
      palettes: [],
      composites: [],
      rejectedImages: 0,
    };
  }

  const palettes = readPaletteTimeline(bytes, sourcePath, table.address, table.entries);
  const composites = readComposites(bytes, sourcePath, table.address, table.entries);
  const images: AlisIndexedImage[] = [];
  let rejectedImages = 0;

  for (let index = 0; index < table.entries; index++) {
    const location = entryLocation(bytes, table.address, index);
    if (location === undefined) continue;
    const h0 = bytes[location - 2];

    if (![0x00, 0x02, 0x10, 0x12, 0x14, 0x16].includes(h0 ?? -1)) continue;

    const widthRaw = readU16LE(bytes, location);
    const heightRaw = readU16LE(bytes, location + 2);
    if (widthRaw === undefined || heightRaw === undefined) {
      rejectedImages++;
      continue;
    }
    const width = widthRaw + 1;
    const height = heightRaw + 1;
    if (!validDimensions(width, height)) {
      rejectedImages++;
      continue;
    }

    const pixels = new Uint8Array(width * height);
    let transparentIndex: number | undefined;
    let encoding: AlisIndexedImage["encoding"];

    if (h0 === 0x00 || h0 === 0x02) {
      encoding = "4bit";
      const bytesPerRow = Math.ceil(width / 2);
      const start = location + 4;
      const needed = bytesPerRow * height;
      if (start + needed > bytes.length) {
        rejectedImages++;
        continue;
      }
      let to = 0;
      for (let y = 0; y < height; y++) {
        const row = start + y * bytesPerRow;
        for (let x = 0; x < width; x++) {
          const packedByte = bytes[row + (x >> 1)] ?? 0;
          pixels[to++] = (x & 1) === 0 ? (packedByte >> 4) & 0x0f : packedByte & 0x0f;
        }
      }
    } else if (h0 === 0x10 || h0 === 0x12) {
      encoding = "4bit-offset";
      const paletteBase = bytes[location + 4] ?? 0;
      const clear = bytes[location + 5] ?? 0;
      transparentIndex = (paletteBase + clear) & 0xff;
      const bytesPerRow = Math.ceil(width / 2);
      const start = location + 6;
      const needed = bytesPerRow * height;
      if (start + needed > bytes.length) {
        rejectedImages++;
        continue;
      }
      let to = 0;
      for (let y = 0; y < height; y++) {
        const row = start + y * bytesPerRow;
        for (let x = 0; x < width; x++) {
          const packedByte = bytes[row + (x >> 1)] ?? 0;
          const nibble = (x & 1) === 0 ? (packedByte >> 4) & 0x0f : packedByte & 0x0f;
          pixels[to++] = (paletteBase + nibble) & 0xff;
        }
      }
    } else {
      encoding = "8bit";
      transparentIndex = bytes[location + 5] ?? 0;
      const start = location + 6;
      const needed = width * height;
      if (start + needed > bytes.length) {
        rejectedImages++;
        continue;
      }
      pixels.set(bytes.slice(start, start + needed));
    }

    const paletteResource = paletteForEntry(index, palettes);
    images.push({
      id: `${sourcePath}#alis-${index}`,
      sourcePath,
      entryIndex: index,
      width,
      height,
      pixels,
      palette: paletteResource?.palette.slice() ?? defaultAlisPalette(),
      paletteSource: paletteResource ? "embedded" : "default",
      paletteEntryIndex: paletteResource?.entryIndex,
      transparentIndex,
      encoding,
    });
  }

  return {
    tableFound: true,
    tableEntries: table.entries,
    images,
    palettes,
    composites,
    rejectedImages,
  };
}
