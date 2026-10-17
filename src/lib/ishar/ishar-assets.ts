import type { Confidence, FileRecord } from "./types";

export interface IsharAssetSourceCandidate {
  path: string;
  sourceKind: "packed-io" | "fic-data" | "unknown-resource";
  confidence: Confidence;
  nextStep: string;
  rationale: string;
}

const NON_GRAPHICS_IO = /^(MAIN|MESSAGE[A-Z]?|TEXTIN[A-Z]?|SOS[A-Z]?|PARAM)\.IO$/i;

/**
 * Conservative bridge from File Lab inventory to future asset extraction.
 * This does not claim that a candidate contains graphics. It only narrows
 * local files that are technically eligible for deeper inspection.
 */
export function mapIsharAssetSources(records: FileRecord[]): IsharAssetSourceCandidate[] {
  const candidates: IsharAssetSourceCandidate[] = [];
  for (const record of records) {
    const base = record.path.split(/[/\\]/).pop() ?? record.path;
    if (record.ext === ".IO" && record.silm && !NON_GRAPHICS_IO.test(base)) {
      candidates.push({
        path: record.path,
        sourceKind: "packed-io",
        confidence: "possible",
        nextStep: record.silm.packerKind === 0x81 || record.silm.packerKind === 0x80
          ? "Mit vorhandenem Old-Packer-Decoder entpacken und Struktur/Paletten/Bitmap-Hinweise prüfen."
          : "A1/New-Packer zuerst reproduzierbar decodieren; keine Grafikextraktion behaupten.",
        rationale: `Silmarils-Container erkannt (${record.silm.packerName}); .IO kann laut bestehendem Audit Code, Grafik, Text oder Musik enthalten.`,
      });
      continue;
    }
    if (record.ext === ".FIC") {
      candidates.push({
        path: record.path,
        sourceKind: "fic-data",
        confidence: "unknown",
        nextStep: "Nur als Welt-/Map-Kontext untersuchen; nicht als Bildquelle behandeln, bis Bytes/Referenzen das belegen.",
        rationale: ".FIC ist im Projekt primär als Daten-/Kartenformat in Untersuchung.",
      });
      continue;
    }
    if (record.confidence === "unknown" && record.size > 512) {
      candidates.push({
        path: record.path,
        sourceKind: "unknown-resource",
        confidence: "unknown",
        nextStep: "Hex/String/Entropy und Referenzen aus entpacktem ALIS-Code korrelieren.",
        rationale: "Unklassifizierte lokale Ressource; bleibt bewusst ohne Grafik-Zuordnung.",
      });
    }
  }
  return candidates.sort((a, b) => {
    const rank: Record<Confidence, number> = { confirmed: 0, probable: 1, possible: 2, unknown: 3 };
    return rank[a.confidence] - rank[b.confidence] || a.path.localeCompare(b.path);
  });
}
