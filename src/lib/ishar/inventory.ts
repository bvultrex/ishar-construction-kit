import JSZip from "jszip";
import { classifyFile } from "./classify";
import type { FileRecord } from "./types";

const SKIP = /(^|\/)(__MACOSX|\.DS_Store|Thumbs\.db)(\/|$)/i;

export async function inventoryZip(file: File): Promise<FileRecord[]> {
  const buf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);
  const records: FileRecord[] = [];
  const entries = Object.values(zip.files);
  for (const entry of entries) {
    if (entry.dir) continue;
    if (SKIP.test(entry.name)) continue;
    const bytes = new Uint8Array(await entry.async("uint8array"));
    records.push(classifyFile(entry.name, bytes));
  }
  records.sort((a, b) => a.path.localeCompare(b.path));
  return records;
}

export async function inventoryLoose(files: File[]): Promise<FileRecord[]> {
  const records: FileRecord[] = [];
  for (const file of files) {
    if (SKIP.test(file.name)) continue;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    records.push(classifyFile(path, bytes));
  }
  records.sort((a, b) => a.path.localeCompare(b.path));
  return records;
}

export function summarizeInventory(records: FileRecord[]) {
  const byRole = new Map<string, number>();
  const unknown: FileRecord[] = [];
  const relevant: FileRecord[] = [];
  for (const r of records) {
    byRole.set(r.classification.role, (byRole.get(r.classification.role) ?? 0) + 1);
    if (r.confidence === "unknown") unknown.push(r);
    if (r.confidence === "confirmed" || r.confidence === "probable") relevant.push(r);
  }
  return {
    total: records.length,
    bytes: records.reduce((s, r) => s + r.size, 0),
    byRole: [...byRole.entries()].sort((a, b) => b[1] - a[1]),
    unknown,
    relevant,
    savs: records.filter((r) => r.ext === ".SAV"),
    exes: records.filter((r) => r.mz || r.ext === ".EXE"),
    io: records.filter((r) => r.ext === ".IO" || r.ext === ".AO"),
  };
}
