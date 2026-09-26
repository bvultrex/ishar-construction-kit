/**
 * Conservative DOS ALIS graphics-resource reader.
 *
 * Resource-table layout and indexed bitmap cases are independently ported from
 * skruug/silm-extract (MIT). This module returns indexed pixels + palette only;
 * browser encoding/render mapping lives in the import layer.
 */
export interface AlisIndexedImage {
  id: string;
  sourcePath: string;
  entryIndex: number;
  width: number;
  height: number;
  pixels: Uint8Array;
  palette: Uint8Array;
  transparentIndex?: number;
  encoding: "4bit" | "4bit-offset" | "8bit";
}

export interface AlisImageExtraction {
  tableFound: boolean;
  tableEntries: number;
  images: AlisIndexedImage[];
  rejectedImages: number;
}

const MAX_TABLE_ENTRIES = 4096;
const MAX_DIMENSION = 1024;
const MAX_PIXELS_PER_IMAGE = 1024 * 1024;

function readU16LE(bytes: Uint8Array, offset: number) {
  if (offset < 0 || offset + 2 > bytes.length) return undefined;
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8);
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

function defaultPalette() {
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

function readActivePalette(bytes: Uint8Array, address: number, entries: number) {
  const palette = defaultPalette();

  for (let index = 0; index < entries; index++) {
    const location = entryLocation(bytes, address, index);
    if (location === undefined) continue;
    const h0 = bytes[location - 2];
    const h1 = bytes[location - 1];
    if (h0 !== 0xfe || (h1 !== 0x00 && h1 !== 0xff)) continue;

    if (h1 === 0x00) {
      if (location + 32 > bytes.length) return palette;
      for (let color = 0; color < 16; color++) {
        const first = bytes[location + color * 2] ?? 0;
        const second = bytes[location + color * 2 + 1] ?? 0;
        const at = color * 3;
        palette[at] = (first & 0x0f) << 5;
        palette[at + 1] = (second >> 4) << 5;
        palette[at + 2] = (second & 0x0f) << 5;
      }
      return palette;
    }

    const start = location + 2;
    if (start + 256 * 3 > bytes.length) return palette;
    palette.set(bytes.slice(start, start + 256 * 3));
    return palette;
  }

  return palette;
}

function validDimensions(width: number, height: number) {
  return width > 0
    && height > 0
    && width <= MAX_DIMENSION
    && height <= MAX_DIMENSION
    && width * height <= MAX_PIXELS_PER_IMAGE;
}

export function extractAlisIndexedImages(
  bytes: Uint8Array,
  sourcePath: string,
  packed = true,
): AlisImageExtraction {
  const table = findGraphicsTable(bytes, packed);
  if (!table) return { tableFound: false, tableEntries: 0, images: [], rejectedImages: 0 };

  const palette = readActivePalette(bytes, table.address, table.entries);
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

    images.push({
      id: `${sourcePath}#alis-${index}`,
      sourcePath,
      entryIndex: index,
      width,
      height,
      pixels,
      palette: palette.slice(),
      transparentIndex,
      encoding,
    });
  }

  return { tableFound: true, tableEntries: table.entries, images, rejectedImages };
}
