import type {
  CharacterView,
  Endian,
  InventorySlot,
  PatchResult,
  SaveMap,
} from "./types";
import { ISHAR2_SAVE } from "./save-maps";

export function readU16(buf: Uint8Array, offset: number, endian: Endian): number {
  if (offset + 1 >= buf.length) return 0;
  const a = buf[offset] ?? 0;
  const b = buf[offset + 1] ?? 0;
  return endian === "be" ? (a << 8) | b : a | (b << 8);
}

export function writeU16(
  buf: Uint8Array,
  offset: number,
  value: number,
  endian: Endian,
): void {
  const v = value & 0xffff;
  if (offset + 1 >= buf.length) return;
  if (endian === "be") {
    buf[offset] = (v >> 8) & 0xff;
    buf[offset + 1] = v & 0xff;
  } else {
    buf[offset] = v & 0xff;
    buf[offset + 1] = (v >> 8) & 0xff;
  }
}

function fieldOffset(specOffset: number, slot: number, size: 1 | 2): number {
  return specOffset + slot * size;
}

export function readField(
  buf: Uint8Array,
  map: SaveMap,
  fieldId: string,
  slot: number,
  endian: Endian,
): number {
  const spec = map.fields[fieldId];
  if (!spec) return 0;
  const off = fieldOffset(spec.offset, slot, spec.size);
  if (spec.size === 2) return readU16(buf, off, endian);
  return buf[off] ?? 0;
}

export function writeField(
  buf: Uint8Array,
  map: SaveMap,
  fieldId: string,
  slot: number,
  value: number,
  endian: Endian,
): number[] {
  const spec = map.fields[fieldId];
  if (!spec) return [];
  const off = fieldOffset(spec.offset, slot, spec.size);
  const changed: number[] = [];
  if (spec.size === 2) {
    writeU16(buf, off, value, endian);
    changed.push(off, off + 1);
  } else if (off < buf.length) {
    buf[off] = value & 0xff;
    changed.push(off);
  }
  return changed;
}

function readInventory(buf: Uint8Array, slot: number, endian: Endian): InventorySlot[] {
  const inv = ISHAR2_SAVE.inventory;
  if (!inv) return [];
  const base = inv.base + slot * inv.stride;
  const slots: InventorySlot[] = [];
  for (let i = 0; i < inv.backpack; i++) {
    const off = base + i * 2;
    const itemId = readU16(buf, off, endian);
    slots.push({
      index: i,
      kind: "backpack",
      itemId,
      raw: [buf[off] ?? 0, buf[off + 1] ?? 0],
    });
  }
  const afterPack = base + inv.backpack * 2;
  const extra: Array<InventorySlot["kind"]> = ["hand", "hand", "armor", "helm"];
  extra.forEach((kind, i) => {
    const off = afterPack + i * 2;
    slots.push({
      index: inv.backpack + i,
      kind,
      itemId: readU16(buf, off, endian),
      raw: [buf[off] ?? 0, buf[off + 1] ?? 0],
    });
  });
  return slots;
}

function writeInventory(
  buf: Uint8Array,
  slot: number,
  items: InventorySlot[],
  endian: Endian,
): number[] {
  const inv = ISHAR2_SAVE.inventory;
  if (!inv) return [];
  const base = inv.base + slot * inv.stride;
  const changed: number[] = [];
  for (const item of items) {
    const off = base + item.index * 2;
    writeU16(buf, off, item.itemId, endian);
    changed.push(off, off + 1);
  }
  return changed;
}

const SPELL_BASE = 7577;
const SPELL_STRIDE = 12;

export function readCharacter(
  buf: Uint8Array,
  map: SaveMap,
  slot: number,
  endian: Endian,
  overlayName = "",
): CharacterView {
  const n = (id: string) => readField(buf, map, id, slot, endian);
  const spellOff = SPELL_BASE + slot * SPELL_STRIDE;
  const spellBytes = Array.from(buf.slice(spellOff, spellOff + SPELL_STRIDE));
  const classId = n("classId");
  const raceId = n("raceId");
  const present = map.game === "ishar1" ? n("level") > 0 || n("hp") > 0 : raceId > 0 || classId > 0 || n("level") > 0;
  return {
    slot,
    present,
    overlayName,
    classId,
    raceId,
    level: n("level"),
    xp: n("xp"),
    hp: n("hp"),
    hpMax: n("hpMax"),
    gold: n("gold"),
    strength: n("strength"),
    constitution: n("constitution"),
    wisdom: n("wisdom"),
    intelligence: n("intelligence"),
    agility: n("agility"),
    psychic: n("psychic"),
    physical: n("physical"),
    armorClass: n("armorClass"),
    skillOneHand: n("skillOneHand"),
    skillTwoHand: n("skillTwoHand"),
    skillThrow: n("skillThrow"),
    skillShoot: n("skillShoot"),
    skillLock: n("skillLock"),
    skillFirstAid: n("skillFirstAid"),
    skillPerception: n("skillPerception"),
    inventory: map.inventory ? readInventory(buf, slot, endian) : [],
    spellBytes,
  };
}

export function readParty(
  buf: Uint8Array,
  map: SaveMap,
  endian: Endian,
  overlays: Record<number, string> = {},
): CharacterView[] {
  return Array.from({ length: map.partySize }, (_, slot) =>
    readCharacter(buf, map, slot, endian, overlays[slot] ?? ""),
  );
}

const PATCHABLE: Array<keyof CharacterView> = [
  "classId",
  "raceId",
  "level",
  "xp",
  "hp",
  "hpMax",
  "gold",
  "strength",
  "constitution",
  "wisdom",
  "intelligence",
  "agility",
  "psychic",
  "physical",
  "armorClass",
  "skillOneHand",
  "skillTwoHand",
  "skillThrow",
  "skillShoot",
  "skillLock",
  "skillFirstAid",
  "skillPerception",
];

export function patchParty(
  original: Uint8Array,
  map: SaveMap,
  endian: Endian,
  party: CharacterView[],
): PatchResult {
  const bytes = new Uint8Array(original);
  const changedOffsets: number[] = [];
  for (const ch of party) {
    for (const key of PATCHABLE) {
      if (!(key in map.fields)) continue;
      const value = ch[key];
      if (typeof value !== "number") continue;
      changedOffsets.push(...writeField(bytes, map, key, ch.slot, value, endian));
    }
    if (map.inventory && ch.inventory.length) {
      changedOffsets.push(...writeInventory(bytes, ch.slot, ch.inventory, endian));
    }
  }
  const unique = [...new Set(changedOffsets)].sort((a, b) => a - b);
  const mismatches: string[] = [];
  const readback = readParty(bytes, map, endian);
  for (const ch of party) {
    const rb = readback[ch.slot];
    if (!rb) continue;
    for (const key of PATCHABLE) {
      if (!(key in map.fields)) continue;
      if (rb[key] !== ch[key]) mismatches.push(`slot ${ch.slot} ${key}: wrote ${String(ch[key])}, read ${String(rb[key])}`);
    }
  }
  let untouched = true;
  for (let i = 0; i < original.length; i++) {
    if (bytes[i] === original[i]) continue;
    if (!unique.includes(i)) {
      untouched = false;
      mismatches.push(`unexpected mutate at ${i}`);
    }
  }
  return {
    bytes,
    changedOffsets: unique,
    untouched,
    readbackOk: mismatches.length === 0,
    mismatches,
  };
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function diffBytes(a: Uint8Array, b: Uint8Array, limit = 400): { offset: number; a: number; b: number }[] {
  const out: { offset: number; a: number; b: number }[] = [];
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n && out.length < limit; i++) {
    const av = a[i] ?? -1;
    const bv = b[i] ?? -1;
    if (av !== bv) out.push({ offset: i, a: av, b: bv });
  }
  return out;
}

export function losslessIdentityTest(buf: Uint8Array, map: SaveMap, endian: Endian): PatchResult {
  const party = readParty(buf, map, endian);
  return patchParty(buf, map, endian, party);
}

const DEMO_NAMES = ["Aramir", "Selena", "Gronn", "Kesh", "Lyra"];

export function createDemoSave(): { bytes: Uint8Array; overlays: Record<number, string> } {
  const bytes = new Uint8Array(8192);
  const endian: Endian = "be";
  const map = ISHAR2_SAVE;
  const seeds: Array<Partial<CharacterView>> = [
    {
      slot: 0,
      classId: 0x01,
      raceId: 1,
      level: 5,
      xp: 4200,
      hp: 48,
      hpMax: 52,
      gold: 340,
      strength: 16,
      constitution: 14,
      wisdom: 8,
      intelligence: 9,
      agility: 11,
      psychic: 12,
      physical: 40,
      armorClass: 6,
      skillOneHand: 28,
      skillTwoHand: 12,
      skillThrow: 8,
      skillShoot: 6,
      skillLock: 4,
      skillFirstAid: 10,
      skillPerception: 11,
    },
    {
      slot: 1,
      classId: 0x06,
      raceId: 2,
      level: 4,
      xp: 3100,
      hp: 28,
      hpMax: 32,
      gold: 120,
      strength: 8,
      constitution: 9,
      wisdom: 12,
      intelligence: 17,
      agility: 13,
      psychic: 48,
      physical: 22,
      armorClass: 3,
      skillOneHand: 6,
      skillTwoHand: 4,
      skillThrow: 5,
      skillShoot: 8,
      skillLock: 7,
      skillFirstAid: 9,
      skillPerception: 14,
    },
    {
      slot: 2,
      classId: 0x05,
      raceId: 3,
      level: 4,
      xp: 2800,
      hp: 40,
      hpMax: 44,
      gold: 90,
      strength: 13,
      constitution: 16,
      wisdom: 15,
      intelligence: 10,
      agility: 8,
      psychic: 36,
      physical: 38,
      armorClass: 7,
      skillOneHand: 14,
      skillTwoHand: 18,
      skillThrow: 3,
      skillShoot: 2,
      skillLock: 2,
      skillFirstAid: 24,
      skillPerception: 9,
    },
    {
      slot: 3,
      classId: 0x03,
      raceId: 4,
      level: 3,
      xp: 1500,
      hp: 46,
      hpMax: 50,
      gold: 40,
      strength: 18,
      constitution: 15,
      wisdom: 6,
      intelligence: 7,
      agility: 10,
      psychic: 4,
      physical: 44,
      armorClass: 5,
      skillOneHand: 10,
      skillTwoHand: 26,
      skillThrow: 12,
      skillShoot: 4,
      skillLock: 3,
      skillFirstAid: 6,
      skillPerception: 8,
    },
    {
      slot: 4,
      classId: 0x02,
      raceId: 1,
      level: 2,
      xp: 800,
      hp: 26,
      hpMax: 30,
      gold: 55,
      strength: 11,
      constitution: 11,
      wisdom: 10,
      intelligence: 11,
      agility: 14,
      psychic: 16,
      physical: 24,
      armorClass: 4,
      skillOneHand: 12,
      skillTwoHand: 8,
      skillThrow: 10,
      skillShoot: 18,
      skillLock: 11,
      skillFirstAid: 8,
      skillPerception: 16,
    },
  ];

  const dummyInv = (n: number): InventorySlot[] =>
    Array.from({ length: 13 }, (_, index): InventorySlot => {
      const kind: InventorySlot["kind"] =
        index < 9 ? "backpack" : index === 9 || index === 10 ? "hand" : index === 11 ? "armor" : "helm";
      return {
        index,
        kind,
        itemId: 0,
        raw: [0, 0],
      };
    }).map((s) => {
      if (n === 0 && s.index === 9) return { ...s, itemId: 0xff9b };
      if (n === 0 && s.index === 11) return { ...s, itemId: 0xffb9 };
      if (n === 0 && s.index === 12) return { ...s, itemId: 0xffa7 };
      if (n === 1 && s.index === 9) return { ...s, itemId: 0x0012 };
      return s;
    });

  const party: CharacterView[] = seeds.map((s, i) => ({
    present: true,
    overlayName: DEMO_NAMES[i] ?? "",
    inventory: dummyInv(i),
    spellBytes: [],
    classId: 0,
    raceId: 0,
    level: 0,
    xp: 0,
    hp: 0,
    hpMax: 0,
    gold: 0,
    strength: 0,
    constitution: 0,
    wisdom: 0,
    intelligence: 0,
    agility: 0,
    psychic: 0,
    physical: 0,
    armorClass: 0,
    skillOneHand: 0,
    skillTwoHand: 0,
    skillThrow: 0,
    skillShoot: 0,
    skillLock: 0,
    skillFirstAid: 0,
    skillPerception: 0,
    slot: i,
    ...s,
  }));

  const patched = patchParty(bytes, map, endian, party);
  const overlays: Record<number, string> = {};
  DEMO_NAMES.forEach((name, i) => {
    overlays[i] = name;
  });
  return { bytes: patched.bytes, overlays };
}

export function selfTest(): { ok: boolean; lines: string[] } {
  const lines: string[] = [];
  const { bytes, overlays } = createDemoSave();
  const map = ISHAR2_SAVE;
  const endian: Endian = "be";
  const party = readParty(bytes, map, endian, overlays);
  lines.push(`demo length ${bytes.length}`);
  lines.push(`slot0 STR=${party[0]?.strength} class=${party[0]?.classId} hp=${party[0]?.hp}`);
  if (party[0]?.strength !== 16) lines.push("FAIL strength");
  if (party[0]?.hp !== 48) lines.push("FAIL hp");
  if (party[1]?.intelligence !== 17) lines.push("FAIL int");
  const ident = losslessIdentityTest(bytes, map, endian);
  if (!ident.readbackOk || !ident.untouched) {
    lines.push(`FAIL identity ${ident.mismatches.join("; ")}`);
  } else {
    lines.push("identity patch: all other bytes unchanged");
  }
  const edited = party.map((c) => (c.slot === 0 ? { ...c, gold: 777, strength: 20 } : c));
  const patched = patchParty(bytes, map, endian, edited);
  const again = readParty(patched.bytes, map, endian);
  if (again[0]?.gold !== 777) lines.push("FAIL gold write");
  if (again[0]?.strength !== 20) lines.push("FAIL str write");
  if (again[1]?.intelligence !== 17) lines.push("FAIL sibling untouched logically");
  const diffs = diffBytes(bytes, patched.bytes);
  const unexpected = diffs.filter((d) => !patched.changedOffsets.includes(d.offset));
  if (unexpected.length) lines.push(`FAIL extra diffs ${unexpected.length}`);
  else lines.push(`write touched ${patched.changedOffsets.length} bytes`);
  const ok = lines.every((l) => !l.startsWith("FAIL"));
  return { ok, lines };
}
