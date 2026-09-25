export function shannonEntropy(bytes: Uint8Array): number {
  if (bytes.length === 0) return 0;
  const counts = new Float64Array(256);
  for (let i = 0; i < bytes.length; i++) counts[bytes[i] ?? 0]++;
  let h = 0;
  const n = bytes.length;
  for (let i = 0; i < 256; i++) {
    const c = counts[i] ?? 0;
    if (!c) continue;
    const p = c / n;
    h -= p * Math.log2(p);
  }
  return h;
}

export function magicHex(bytes: Uint8Array, n = 8): string {
  return Array.from(bytes.slice(0, n))
    .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
    .join(" ");
}

export function isMz(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0x4d && bytes[1] === 0x5a;
}

export function extractStrings(bytes: Uint8Array, min = 4, limit = 40): string[] {
  const out: string[] = [];
  let buf = "";
  const push = () => {
    if (buf.length >= min && out.length < limit) out.push(buf);
    buf = "";
  };
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i] ?? 0;
    if (c >= 32 && c < 127) buf += String.fromCharCode(c);
    else push();
  }
  push();
  return out;
}

export function histogram(bytes: Uint8Array): number[] {
  const h = new Array<number>(256).fill(0);
  for (let i = 0; i < bytes.length; i++) h[bytes[i] ?? 0]!++;
  return h;
}

const PACK201_MARKERS = ["PACK", "PKlite", "PKLITE", "diet", "DIET", "EXEPACK"];

export function exeHints(bytes: Uint8Array): string[] {
  const hints: string[] = [];
  if (!isMz(bytes)) return hints;
  hints.push("MZ DOS executable");
  const sample = extractStrings(bytes, 4, 80).join(" ");
  for (const m of PACK201_MARKERS) {
    if (sample.toLowerCase().includes(m.toLowerCase())) hints.push(`String-Marker: ${m}`);
  }
  if (/pack\s*2\.?0/i.test(sample)) hints.push("Möglicher PACK 2.01 Marker");
  return hints;
}

export function asciiDump(bytes: Uint8Array, offset: number, length = 16): string {
  let s = "";
  for (let i = 0; i < length; i++) {
    const c = bytes[offset + i] ?? 0;
    s += c >= 32 && c < 127 ? String.fromCharCode(c) : ".";
  }
  return s;
}
