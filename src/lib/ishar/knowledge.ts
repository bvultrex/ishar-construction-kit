import type { Evidence } from "./types";

export interface KnowledgeEntry {
  id: string;
  system: string;
  title: string;
  evidence: Evidence;
}

export const KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "alis-vm",
    system: "Engine",
    title: "ALIS-Bytecode-Interpreter",
    evidence: {
      kind: "known",
      summary:
        "Silmarils-Spiele (Ishar, Transarctica, …) laufen auf der ALIS-VM. START.EXE ist der Interpreter; gepackte Skripte enthalten Code, Grafik und Musik.",
      source: "maestun/silm-depack README; old-games.ru Ishar-Trilogy-Thread",
      nextTest: "Unpacked START.EXE strings + IO-Header gegen silm-depack prüfen.",
    },
  },
  {
    id: "io-pack",
    system: "Engine",
    title: "Silmarils-Packer auf .IO / .AO",
    evidence: {
      kind: "known",
      summary:
        "Packer-Kennung im höchsten Byte eines 32-bit Magic: 0x81 old, 0x80 old interlaced, 0xA1 new. Unpacked size in den unteren 24 Bit. Header 6 Bytes. New-Packer hat 8-Byte-Dictionary. MAIN-Skripte haben 16 Byte VM-Specs.",
      source: "maestun/silm-depack unpack.c (MIT)",
      nextTest: "Nach ZIP-Import jedes .IO mit detectSilm klassifizieren.",
    },
  },
  {
    id: "start-exe-pack",
    system: "Engine",
    title: "START.EXE ist gepackt — Packer widersprüchlich",
    evidence: {
      kind: "suspected",
      summary:
        "ZenHAX: PACK 2.01 (UUP v1.4 entpackt spanische/französische EXE). old-games.ru: DIET, entpackt mit Unp 4.11. Beide können für verschiedene Releases stimmen. Nicht als eine Tatsache behandeln.",
      source: "ZenHAX t=8705; old-games.ru thread 77409",
      nextTest: "START.EXE-Header + Strings nach PACK/DIET scannen, MD5 mit ZenHAX-Werten vergleichen falls gleiche Version.",
    },
  },
  {
    id: "saves",
    system: "Save",
    title: "*.SAV im Spielordner",
    evidence: {
      kind: "known",
      summary:
        "Ishar 1 und 2 speichern unter <game>\\*.SAV. GOG leitet DOSBox-Writes nach cloud_saves/. Ishar 1 Save kostet Gold (Loader umgeht das). Ishar 2 kann Ishar-1-Saves via I→II importieren.",
      source: "PCGamingWiki Ishar 1 & 2; Solanacean/Ishar1-loader",
      nextTest: "Mehrere Saves aus unterschiedlichen Spielständen liefern.",
    },
  },
  {
    id: "array-layout",
    system: "Charakter",
    title: "Party als Arrays, nicht als Records",
    evidence: {
      kind: "suspected",
      summary:
        "IshadNha: Ishar 2 speichert keine einzelnen PC-Records, sondern 5×1- bzw. 10×1-Arrays. Ishar-1-DEBUG-Offsets haben denselben 5-Byte-Abstand bei Attributen.",
      source: "GOG-Forum UGE-Thread; directx.pl Ishar-1 DEBUG",
      nextTest: "Nur Charakter 3 ändern, Save diffen — nur Index 2 jedes Arrays darf kippen.",
    },
  },
  {
    id: "endian",
    system: "Charakter",
    title: "Savegame-Endian",
    evidence: {
      kind: "suspected",
      summary:
        "IshadNha: Ishar-2-Saves sind big-endian (Amiga-Erbe), obwohl DOS-Host little-endian ist. 16-bit HP/Gold/XP daher mit BE-Default und LE-Toggle.",
      source: "GOG-Forum UGE-Thread",
      nextTest: "Bekannten HP-Wert (z.B. 48) als 00 30 vs 30 00 suchen.",
    },
  },
  {
    id: "i2-offsets",
    system: "Charakter",
    title: "Ishar-2-Stat-Offsets",
    evidence: {
      kind: "suspected",
      summary:
        "Öffentliche Tabelle (DLH.NET): XP 986, HP 996, HPmax 1016, Gold 1026, Inventar 1036 stride 30, Beruf 1276, Rasse 1281, Level 1291, Attribute 1296–1330, Talente 7546+, Wahrnehmung 7729. Amiga-ppa.pl weicht leicht ab.",
      source: "https://www.dlh.net/de/cheats/2572/ishar-2.html ; ppa.pl",
      nextTest: "Erstes vollständig entschlüsselbares Subsystem: Round-Trip dieser Felder an einem echten Save.",
    },
  },
  {
    id: "i1-offsets",
    system: "Charakter",
    title: "Ishar-1 DEBUG-Offsets",
    evidence: {
      kind: "suspected",
      summary:
        "GAME01.SAV: Vitalität 0x02D5, Gold 0x02DF, Psychic 0x02E9, Level 0x03E2, STR 0x03E7, WIS 0x03EC, CON 0x03F1, AGI 0x03F6, INT 0x03FB, Physical 0x0400. Troels' 8-Zeilen-Notation ist mehrdeutig und wird nicht als Fakt genutzt.",
      source: "directx.pl/ishar-1",
      nextTest: "Ishar-1-Save importieren und dieselben Diffs fahren.",
    },
  },
  {
    id: "names",
    system: "Charakter",
    title: "Charakternamen im Save",
    evidence: {
      kind: "unknown",
      summary: "Kein öffentlicher Offset für den Namen. Editor speichert Namen nur als Overlay, schreibt sie nicht ins SAV.",
      source: "—",
      nextTest: "Namen im Spiel ändern, zwei Saves diffen, ASCII/latin1-String suchen.",
    },
  },
  {
    id: "gender",
    system: "Charakter",
    title: "Geschlecht (Ishar-2-Verbesserung)",
    evidence: {
      kind: "unknown",
      summary:
        "Ishar 2 hat weibliche Modelle und geschlechtsspezifische Darstellung. Save-Offset unbekannt. Statisch in EXE vs. Daten: unbekannt.",
      source: "Spielbeobachtung (Auftrag), kein File-Beleg",
      nextTest: "Männlichen/weiblichen Charakter gleicher Klasse diffen.",
    },
  },
  {
    id: "maps-fic",
    system: "Welt",
    title: "Karten in .FIC",
    evidence: {
      kind: "suspected",
      summary:
        "Cont1.fic = Irvan's Island, 60 Bytes, im Hexeditor transponiert (x↔y), zwei Sektionen: Terrain und Spezialereignisse.",
      source: "GOG-Forum IshadNha",
      nextTest: "Nach Upload alle .FIC listen, Größen vergleichen, 60-Byte-Dateien als Mini-Karten behandeln.",
    },
  },
  {
    id: "config-stp",
    system: "Engine",
    title: "START.STP",
    evidence: {
      kind: "known",
      summary: "Konfigurationsdatei im Spielordner für Ishar 1 und 2.",
      source: "PCGamingWiki",
      nextTest: "Datei lesen, ASCII vs. binär, Keys dokumentieren.",
    },
  },
  {
    id: "texts",
    system: "Dialog",
    title: "Texte in TEXTIN*.IO / MESSAGE*.IO",
    evidence: {
      kind: "suspected",
      summary:
        "Sprachsuffix E/D/I, französische Basis ohne Suffix. Nach Unpack sollten Strings sichtbar sein. ZenHAX: Ishar-2-Amiga Strings mit Prefix 0x1E 0x04, NUL-terminiert.",
      source: "old-games.ru; ZenHAX dim568",
      nextTest: "TEXTINE.IO entpacken, String-Prefix 1E 04 suchen.",
    },
  },
  {
    id: "spell-learn",
    system: "Magie",
    title: "Zauber lernen (Ishar 1)",
    evidence: {
      kind: "unknown",
      summary:
        "Gamedesign: Ishar 1 lehrt Zauber nicht automatisch per Level. Speicherort (Save-Bitmaske vs. statische Tabelle) unbekannt. Cheat-Tabelle Ishar 2: Spell-Block ~12 Bytes/Charakter ab 7577.",
      source: "Auftrag + DLH.NET Spell-Range 7577–7637",
      nextTest: "Vor/nach dem Lernen eines Zaubers speichern.",
    },
  },
  {
    id: "training",
    system: "Charakter",
    title: "Attribut-Training (Ishar 1)",
    evidence: {
      kind: "unknown",
      summary: "Ishar 1 erlaubt Training von STR/INT/AGI/CON. Trainer-NPCs und Kosten: nicht in Files belegt.",
      source: "Auftrag / Spielmechanik",
      nextTest: "Vor/nach Training speichern, nur das trainierte Array-Feld darf steigen.",
    },
  },
];

export const ARCHITECTURE_NOTES = {
  staticVsDynamic: [
    {
      kind: "suspected" as const,
      text: "Statisch (vermutlich in .IO / EXE): Berufe, Rassen, Spruchdefinitionen, Item-Templates, Karten, Dialoge, Grafiken.",
    },
    {
      kind: "suspected" as const,
      text: "Dynamisch (Save): Party-Werte, Inventar, Gold, Position, Questflags, tote Bosse, gelernte Zauber.",
    },
    {
      kind: "unknown" as const,
      text: "Händlerbestände, Tavernengerüchte, Tag/Nacht, Hunger: Save oder neu gewürfelt? Unbekannt.",
    },
  ],
  i1vsI2: [
    {
      topic: "Kampfsystem / Magie-UI",
      i1: "Älteres Handling",
      i2: "Deutlich überarbeitet (Auftrag)",
      dataOrExe: "unbekannt — zuerst UI-Strings und Spell-Tabellen vergleichen, nicht Dateien tauschen",
    },
    {
      topic: "Geschlecht / weibliche Modelle",
      i1: "weitgehend männliche Darstellung",
      i2: "Geschlechtssystem, weibliche Körper, teils geschlechtsspezifische Rüstung",
      dataOrExe: "unbekannt",
    },
    {
      topic: "Zauber lernen",
      i1: "explizit lernen / kaufen",
      i2: "vermutlich vereinfacht",
      dataOrExe: "unbekannt",
    },
    {
      topic: "Attribut-Training",
      i1: "vorhanden",
      i2: "entfernt oder vereinfacht",
      dataOrExe: "unbekannt",
    },
    {
      topic: "Save-Goldkosten",
      i1: "Gold zum Speichern",
      i2: "kostenlos",
      dataOrExe: "EXE-Logik (Ishar1-loader patched das)",
    },
    {
      topic: "Charakterimport",
      i1: "—",
      i2: "I→II importiert Ishar-1-Saves",
      dataOrExe: "belegt (PCGamingWiki) — wichtiges Brückenformat",
    },
  ],
};

export const RE_PLAN = [
  {
    phase: 1,
    title: "Analyse / Inventar",
    status: "active",
    tasks: [
      "ZIP mit vollständiger Ishar-1-Installation importieren",
      "Vollständige Dateiliste, Größen, Magic, Entropie",
      "Ishar-2-ZIP analog, dann Dateinamen vergleichen",
      "Keine Dateinamen erfinden",
    ],
  },
  {
    phase: 2,
    title: "Charakterdaten",
    status: "active",
    tasks: [
      "Öffentliche Ishar-2-Offsets am echten Save verifizieren",
      "Verlustfreier Round-Trip (nur bekannte Bytes patchen)",
      "Namen, Geschlecht, Zauberbits per Save-Diff finden",
      "Ishar-1-DEBUG-Map analog härten",
    ],
  },
  {
    phase: 3,
    title: "Items / Inventar",
    status: "planned",
    tasks: ["Item-IDs in Inventarslots", "Statische Item-Tabelle in .IO/.FIC/.EXE"],
  },
  {
    phase: 4,
    title: "Zauber",
    status: "planned",
    tasks: ["Spell-Block 7577", "Lernquellen (NPC, Händler, Buch)"],
  },
  {
    phase: 5,
    title: "Karten",
    status: "planned",
    tasks: [".FIC-Größenraster", "Terrain vs. Event-Layer", "Übergänge"],
  },
  {
    phase: 6,
    title: "NPCs / Gegner",
    status: "planned",
    tasks: ["Spawnzonen vs. fixe Bosse", "Persistente Todes-Flags"],
  },
  {
    phase: 7,
    title: "Texte",
    status: "planned",
    tasks: ["TEXTIN*.IO unpack", "Tavernen-Zuhören", "String-Prefix 1E 04"],
  },
  {
    phase: 8,
    title: "Quests / Flags",
    status: "planned",
    tasks: ["Save-Diff vor/nach Quest", "globale vs. Kartenflags"],
  },
  {
    phase: 9,
    title: "Ishar 2 Differenzen",
    status: "planned",
    tasks: ["Nicht blind Dateien tauschen", "datengetrieben vs. EXE"],
  },
  {
    phase: 10,
    title: "Editor-Module verbinden",
    status: "planned",
    tasks: ["Gemeinsames Projektformat", "Validierung"],
  },
  {
    phase: 11,
    title: "New Game Project",
    status: "planned",
    tasks: ["File → New Project", "eigene Daten, Original nur Import"],
  },
  {
    phase: 12,
    title: "Standalone-Runtime",
    status: "planned",
    tasks: ["Limitierungen der Original-ALIS-Engine dokumentieren", "eigene Runtime nur wenn nötig"],
  },
];
