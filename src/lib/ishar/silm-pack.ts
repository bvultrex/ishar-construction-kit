/**
 * Silmarils packed-script header detection + old RLE unpacker.
 *
 * Ported from maestun/silm-depack (MIT), which reverse-engineered the ALIS
 * packer used by Ishar, Transarctica, Bunny Bricks and other Silmarils titles.
 *
 * We detect both endian interpretations. Full new-packer (0xA1) decode is
 * marked experimental — the original C uses 68k-style register tricks.
 */
import type { Endian, SilmHeader } from "./types";

export const PACKER_OLD = 0x81;
export const PACKER_OLD_INTERLACED = 0x80;
export const PACKER_NEW = 0xa1;
const HEADER = 6;
const DICT = 8;
const VM_SPECS = 16;

function packerName(kind: number): string {
  if (kind === PACKER_OLD) return "Silmarils old (0x81)";
  if (kind === PACKER_OLD_INTERLACED) return "Silmarils old interlaced (0x80)";
  if (kind === PACKER_NEW) return "Silmarils new (0xA1)";
  return `unknown 0x${kind.toString(16)}`;
}

export function isPackerKind(kind: number): boolean {
  return kind === PACKER_OLD || kind === PACKER_OLD_INTERLACED || kind === PACKER_NEW;
}

function readU32(bytes: Uint8Array, le: boolean): number {
  const b0 = bytes[0] ?? 0;
  const b1 = bytes[1] ?? 0;
  const b2 = bytes[2] ?? 0;
  const b3 = bytes[3] ?? 0;
  return le ? b0 | (b1 << 8) | (b2 << 16) | (b3 << 24) : (b0 << 24) | (b1 << 16) | (b2 << 8) | b3;
}

function readU16(bytes: Uint8Array, offset: number, le: boolean): number {
  const a = bytes[offset] ?? 0;
  const b = bytes[offset + 1] ?? 0;
  return le ? a | (b << 8) : (a << 8) | b;
}

function probe(bytes: Uint8Array, endian: Endian): SilmHeader | null {
  if (bytes.length < HEADER) return null;
  const le = endian === "le";
  const magic = readU32(bytes, le) >>> 0;
  const packerKind = (magic >>> 24) & 0xff;
  if (!isPackerKind(packerKind)) return null;
  const unpackedSize = magic & 0x00ffffff;
  if (unpackedSize < HEADER || unpackedSize > 16 * 1024 * 1024) return null;
  const isMain = readU16(bytes, 4, le) === 0;
  return { packerKind, packerName: packerName(packerKind), unpackedSize, endian, isMain };
}

export function detectSilm(bytes: Uint8Array): SilmHeader | null {
  return probe(bytes, "be") ?? probe(bytes, "le");
}

function unpackOld(packed: Uint8Array, unpackedSize: number, interlaced: boolean): Uint8Array {
  const out = new Uint8Array(unpackedSize);
  const inc = interlaced ? 8 : 1;
  let src = 0;
  let pass = inc;
  let destBase = 0;
  while (pass-- > 0) {
    let dest = destBase;
    while (dest < unpackedSize) {
      if (src >= packed.length) break;
      const d1 = packed[src++] ?? 0;
      let counter = d1 & 0x7f;
      if (d1 & 0x80) {
        const val = packed[src++] ?? 0;
        while (counter--) {
          if (dest >= unpackedSize) break;
          out[dest] = val;
          dest += inc;
        }
      } else {
        while (counter--) {
          if (dest >= unpackedSize || src >= packed.length) break;
          out[dest] = packed[src++] ?? 0;
          dest += inc;
        }
      }
    }
    destBase += 1;
  }
  return out;
}

export function unpackSilm(bytes: Uint8Array): {
  header: SilmHeader;
  data: Uint8Array | null;
  note: string;
} | null {
  const header = detectSilm(bytes);
  if (!header) return null;
  const le = header.endian === "le";
  let packedSize = bytes.length - HEADER;
  let unpackedSize = header.unpackedSize - HEADER;
  let cursor = HEADER;
  if (header.isMain) {
    cursor += VM_SPECS;
    packedSize -= VM_SPECS;
    unpackedSize -= VM_SPECS;
  }
  if (header.packerKind === PACKER_NEW) {
    cursor += DICT;
    packedSize -= DICT;
    return {
      header,
      data: null,
      note: "Neuer Packer (0xA1) erkannt. Decode ist experimentell und wartet auf Originaldateien zum Test. Siehe maestun/silm-depack.",
    };
  }
  if (cursor < 0 || unpackedSize <= 0 || packedSize <= 0) {
    return { header, data: null, note: "Header inkonsistent." };
  }
  const packed = bytes.slice(cursor);
  try {
    const data = unpackOld(packed, unpackedSize, header.packerKind === PACKER_OLD_INTERLACED);
    return { header, data, note: `Entpackt mit ${header.packerName} (${le ? "LE" : "BE"}).` };
  } catch (err) {
    return { header, data: null, note: `Unpack fehlgeschlagen: ${String(err)}` };
  }
}
