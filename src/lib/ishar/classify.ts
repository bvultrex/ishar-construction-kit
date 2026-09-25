import { detectSilm } from "./silm-pack";
import { exeHints, extractStrings, isMz, magicHex, shannonEntropy } from "./binary";
import type { Confidence, FileRecord } from "./types";

/**
 * Classification uses only extension, magic bytes and publicly documented
 * Silmarils names. Unknown files stay unknown — we never invent a role.
 */
const PUBLIC_IO_ROLES: Record<string, { role: string; reason: string; confidence: Confidence }> = {
  "MAIN.IO": {
    role: "ALIS-Kern / Systemskript",
    reason: "old-games.ru + ZenHAX: MAIN.IO ist das sprachunabhängige Kernskript.",
    confidence: "probable",
  },
  "MESSAGEE.IO": {
    role: "UI-/Systemtexte (Englisch)",
    reason: "old-games.ru: EN MESSAGEE.IO = Spielmeldungen.",
    confidence: "probable",
  },
  "MESSAGED.IO": {
    role: "UI-/Systemtexte (Deutsch)",
    reason: "old-games.ru: DE MESSAGED.IO.",
    confidence: "probable",
  },
  "MESSAGEI.IO": {
    role: "UI-/Systemtexte (Italienisch)",
    reason: "old-games.ru: IT MESSAGEI.IO.",
    confidence: "probable",
  },
  "MESSAGE.IO": {
    role: "UI-/Systemtexte (Französisch)",
    reason: "old-games.ru: FR MESSAGE.IO.",
    confidence: "probable",
  },
  "TEXTINE.IO": {
    role: "Spieltexte / Dialoge (Englisch)",
    reason: "old-games.ru: EN TEXTINE.IO.",
    confidence: "probable",
  },
  "TEXTIND.IO": {
    role: "Spieltexte / Dialoge (Deutsch)",
    reason: "old-games.ru: DE TEXTIND.IO.",
    confidence: "probable",
  },
  "TEXTINI.IO": {
    role: "Spieltexte / Dialoge (Italienisch)",
    reason: "old-games.ru: IT TEXTINI.IO.",
    confidence: "probable",
  },
  "TEXTIN.IO": {
    role: "Spieltexte / Dialoge (Französisch)",
    reason: "ZenHAX + old-games.ru: TEXTIN.IO.",
    confidence: "probable",
  },
  "SOSE.IO": {
    role: "Save-/SOS-Texte (Englisch)",
    reason: "old-games.ru listet EN SOSE.IO unter „Arbeit mit save-Dateien“.",
    confidence: "possible",
  },
  "SOSD.IO": {
    role: "Save-/SOS-Texte (Deutsch)",
    reason: "old-games.ru: DE SOSD.IO.",
    confidence: "possible",
  },
  "SOS.IO": {
    role: "Save-/SOS-Texte (Französisch)",
    reason: "ZenHAX listet SOS.IO; old-games.ru FR SOS.IO.",
    confidence: "possible",
  },
  "PARAM.IO": {
    role: "Parameter / sprachunabhängige Daten",
    reason: "old-games.ru: PARAM.IO „Namen und sonstiges“, einheitlich für alle Sprachen.",
    confidence: "possible",
  },
  "FRISE.IO": {
    role: "Unbekannt (in Sprachkern-Liste)",
    reason: "Dateiname in old-games.ru genannt, Funktion nicht beschrieben.",
    confidence: "unknown",
  },
  "GERDEP.IO": {
    role: "Unbekannt (in Sprachkern-Liste)",
    reason: "Dateiname in old-games.ru genannt, Funktion nicht beschrieben.",
    confidence: "unknown",
  },
  "BLANCPC.IO": {
    role: "Unbekannt",
    reason: "ZenHAX erwähnt BLANCPC.IO als häufige Silmarils-Datei.",
    confidence: "unknown",
  },
};

export function classifyFile(path: string, bytes: Uint8Array): FileRecord {
  const base = path.split(/[/\\]/).pop() ?? path;
  const upper = base.toUpperCase();
  const dot = upper.lastIndexOf(".");
  const ext = dot >= 0 ? upper.slice(dot) : "";
  const entropy = shannonEntropy(bytes);
  const silm = detectSilm(bytes);
  const mz = isMz(bytes);
  const stringsPreview = extractStrings(bytes, 4, 12);
  const publicIo = PUBLIC_IO_ROLES[upper];

  let role = "unbekannt";
  let confidence: Confidence = "unknown";
  let reason = "Keine öffentliche Zuordnung, kein erkanntes Magic.";
  let gameHint: FileRecord["classification"]["gameHint"] = "unknown";

  if (ext === ".SAV") {
    role = "Savegame";
    confidence = "confirmed";
    reason = "PCGamingWiki: DOS-Saves liegen als *.SAV im Spielordner. Cheats referenzieren GAME01.SAV / beliebige *.SAV.";
    gameHint = "shared";
  } else if (upper === "START.STP") {
    role = "Start-/Konfigurationsdatei";
    confidence = "confirmed";
    reason = "PCGamingWiki: START.STP ist die DOS-Konfiguration für Ishar 1 und Ishar 2.";
    gameHint = "shared";
  } else if (upper === "START.EXE") {
    role = "ALIS-Interpreter / Haupt-EXE";
    confidence = "confirmed";
    reason =
      "ZenHAX: START.EXE packed with PACK 2.01. old-games.ru: START.EXE ist Interpreter der ALIS-Bytecode-VM (dort DIET genannt — widersprüchlich, beide Quellen dokumentieren).";
    gameHint = "shared";
  } else if (upper === "EN1.FIC") {
    role = "Namen / sprachunabhängige Tabelle";
    confidence = "possible";
    reason = "old-games.ru: EN1.FIC (nicht gepackt), „Namen und sonstiges“.";
  } else if (ext === ".FIC") {
    role = "Daten-/Kartendatei (möglich)";
    confidence = "possible";
    reason =
      "GOG-Forum IshadNha: Cont1.fic = Karte Irvan's Island, 60 Bytes, transponiert. Andere .FIC ohne Beleg.";
  } else if (ext === ".COM") {
    role = "DOS-Loader / COM-Stub";
    confidence = "possible";
    reason = "Solanacean/Ishar1-loader ersetzt start.exe durch ishar1.com in der DOSBox-Konfig.";
  } else if (publicIo) {
    role = publicIo.role;
    confidence = publicIo.confidence;
    reason = publicIo.reason;
    gameHint = "shared";
  } else if (ext === ".IO" && silm) {
    role = "Gepacktes ALIS-Skript / Ressource";
    confidence = "probable";
    reason = `Silmarils-Packer erkannt (${silm.packerName}). ZenHAX: .IO enthält Code, Grafik, Text, Musik.`;
    gameHint = "shared";
  } else if (ext === ".AO" && silm) {
    role = "Gepacktes ALIS-Skript (Amiga/Atari)";
    confidence = "probable";
    reason = "silm-depack verwendet .AO auf Amiga/Atari. Gleicher Packer.";
  } else if (ext === ".IO") {
    role = "Vermutete ALIS-Ressource (ungepackt oder unbekannter Packer)";
    confidence = "possible";
    reason = "Endung .IO ist in Silmarils-DOS-Titeln üblich, Magic nicht erkannt.";
  } else if (mz) {
    role = "DOS-Executable";
    confidence = "confirmed";
    reason = ["MZ-Header.", ...exeHints(bytes)].join(" ");
  } else if (entropy > 7.5) {
    role = "Komprimiert oder verschlüsselt (möglich)";
    confidence = "possible";
    reason = `Hohe Shannon-Entropie (${entropy.toFixed(2)}). Kein bekanntes Magic.`;
  }

  return {
    path,
    size: bytes.length,
    ext: ext || "(none)",
    entropy: Number(entropy.toFixed(3)),
    magic: magicHex(bytes),
    classification: { role, gameHint },
    confidence,
    reason,
    silm,
    mz,
    stringsPreview,
  };
}
