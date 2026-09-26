/**
 * Silmarils packed-script detection and bounded unpackers.
 *
 * Old 0x80/0x81 path: based on maestun/silm-depack / ALIS (MIT).
 * DOS A1 path: bounded bitstream formulation independently cross-checked
 * against the user-provided legacy Workbench codec and maestun/alis unpack.c.
 *
 * The decoder deliberately validates sizes, dictionary widths and every
 * backreference. Corrupt/truncated resources fail closed instead of reading
 * outside the input/output buffers.
 */
import type { Endian, SilmHeader } from "./types";

export const PACKER_OLD = 0x81;
export const PACKER_OLD_INTERLACED = 0x80;
export const PACKER_NEW = 0xa1;
const HEADER = 6;
const DICT = 8;
const VM_SPECS = 16;
const MAX_UNPACKED = 16 * 1024 * 1024;
const A1_ZERO_LOOKAHEAD = 0xff;

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
  if (unpackedSize < HEADER || unpackedSize > MAX_UNPACKED) return null;
  const isMain = readU16(bytes, 4, le) === 0;
  return { packerKind, packerName: packerName(packerKind), unpackedSize, endian, isMain };
}

export function detectSilm(bytes: Uint8Array): SilmHeader | null {
  // DOS resources encode the 24-bit size little-endian with the packer byte at
  // offset 3. Prefer that unambiguous signature, while preserving BE support.
  if (isPackerKind(bytes[3] ?? -1)) return probe(bytes, "le");
  if (isPackerKind(bytes[0] ?? -1)) return probe(bytes, "be");
  return probe(bytes, "le") ?? probe(bytes, "be");
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

class BitReader {
  private position = 0;

  constructor(private readonly bytes: Uint8Array) {}

  read(width: number): number {
    if (!Number.isInteger(width) || width < 0 || width > 24) throw new Error(`Ungültige Bitbreite ${width}.`);
    if (this.position + width > this.bytes.length * 8) {
      throw new Error(`A1-Bitstream abgeschnitten bei Bit ${this.position}/${this.bytes.length * 8}.`);
    }
    let value = 0;
    for (let index = 0; index < width; index++) {
      const byte = this.bytes[this.position >> 3] ?? 0;
      const bit = (byte >> (7 - (this.position & 7))) & 1;
      value = value * 2 + bit;
      this.position++;
    }
    return value;
  }
}

function unpackNewA1(bytes: Uint8Array, header: SilmHeader): Uint8Array {
  if (header.packerKind !== PACKER_NEW) throw new Error("Kein A1-Modul.");
  if (header.endian !== "le") throw new Error("A1-Decoder ist für DOS/Little-Endian verifiziert.");

  const packedHeaderSize = header.isMain ? HEADER + VM_SPECS : HEADER;
  const unpackedSize = header.unpackedSize - packedHeaderSize;
  if (unpackedSize <= 0 || unpackedSize > MAX_UNPACKED) throw new Error("A1-Ausgabegröße ist ungültig.");
  if (bytes.length < packedHeaderSize + DICT) throw new Error("A1-Header/Dictionary ist abgeschnitten.");

  const dictionary = bytes.slice(packedHeaderSize, packedHeaderSize + DICT);
  if (dictionary.length !== DICT || dictionary.some((width) => width > 16)) {
    throw new Error("A1-Dictionary ist ungültig.");
  }

  // The original decoder can read a few zero-filled words beyond the physical
  // packed stream. Reproduce that behavior in a bounded buffer.
  const packed = bytes.slice(packedHeaderSize + DICT);
  const padded = new Uint8Array(packed.length + A1_ZERO_LOOKAHEAD);
  padded.set(packed);
  const bits = new BitReader(padded);

  const output = new Uint8Array(unpackedSize + A1_ZERO_LOOKAHEAD);
  let outputLength = 0;

  const count = (width: number, stop: number) => {
    let total = 0;
    while (true) {
      const value = bits.read(width);
      total += value;
      if (total > unpackedSize) throw new Error("A1-Lauflänge überschreitet die erwartete Ausgabegröße.");
      if (value !== stop) return total;
    }
  };

  while (outputLength < unpackedSize) {
    if (bits.read(1)) {
      const literalLength = count(2, 3) + 1;
      if (outputLength + literalLength > unpackedSize + A1_ZERO_LOOKAHEAD) {
        throw new Error("A1-Literal überschreitet den Ausgabepuffer.");
      }
      for (let index = 0; index < literalLength; index++) {
        output[outputLength++] = bits.read(8);
      }
      if (outputLength >= unpackedSize) break;
    }

    const selector = bits.read(3);
    const distanceBits = dictionary[selector];
    if (distanceBits === undefined) throw new Error("A1-Dictionary-Selektor außerhalb des Bereichs.");
    const distance = bits.read(distanceBits) + 1;
    const copyLength = (selector & 3) !== 0 ? (selector & 3) + 1 : count(3, 7) + 5;

    if (distance > outputLength) {
      throw new Error(`A1-Rückreferenz vor Ausgabebeginn (out=${outputLength}, distance=${distance}).`);
    }
    if (outputLength + copyLength > unpackedSize + A1_ZERO_LOOKAHEAD) {
      throw new Error("A1-Rückreferenz überschreitet den Ausgabepuffer.");
    }

    for (let index = 0; index < copyLength; index++) {
      output[outputLength] = output[outputLength - distance] ?? 0;
      outputLength++;
    }
  }

  return output.slice(0, unpackedSize);
}

export function unpackSilm(bytes: Uint8Array): {
  header: SilmHeader;
  data: Uint8Array | null;
  note: string;
} | null {
  const header = detectSilm(bytes);
  if (!header) return null;

  if (header.packerKind === PACKER_NEW) {
    try {
      const data = unpackNewA1(bytes, header);
      return {
        header,
        data,
        note: `Entpackt mit DOS A1/New-Packer (${data.length} Bytes, bounded decoder).`,
      };
    } catch (err) {
      return { header, data: null, note: `A1-Unpack fehlgeschlagen: ${String(err)}` };
    }
  }

  const le = header.endian === "le";
  let packedSize = bytes.length - HEADER;
  let unpackedSize = header.unpackedSize - HEADER;
  let cursor = HEADER;
  if (header.isMain) {
    cursor += VM_SPECS;
    packedSize -= VM_SPECS;
    unpackedSize -= VM_SPECS;
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
