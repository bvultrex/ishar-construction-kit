import { directionBetween } from "./dungeon";
import type { AuthoredGame } from "./types";

export interface ProjectProblem {
  path: string;
  message: string;
}

export function validateGame(game: AuthoredGame): ProjectProblem[] {
  const problems: ProjectProblem[] = [];
  const locationIds = new Set(game.locations.map((x) => x.id));
  const itemIds = new Set(game.items.map((x) => x.id));
  const encounterIds = new Set(game.encounters.map((x) => x.id));
  const questIds = new Set(game.quests.map((x) => x.id));

  if (!game.locations.length) problems.push({ path: "game.locations", message: "Mindestens ein Ort wird benötigt." });
  if (!locationIds.has(game.startLocationId)) problems.push({ path: "game.startLocationId", message: "Der Startort existiert nicht." });

  const allIds = [
    ...game.locations.map((x) => ["location", x.id] as const),
    ...game.items.map((x) => ["item", x.id] as const),
    ...game.encounters.map((x) => ["encounter", x.id] as const),
    ...game.quests.map((x) => ["quest", x.id] as const),
    ...game.characters.map((x) => ["character", x.id] as const),
  ];
  const seen = new Set<string>();
  for (const [kind, id] of allIds) {
    if (!id.trim()) problems.push({ path: kind, message: "Leere ID gefunden." });
    const key = kind + ":" + id;
    if (seen.has(key)) problems.push({ path: key, message: "ID ist innerhalb des Typs doppelt." });
    seen.add(key);
  }

  const occupied = new Map<string, string>();
  for (const location of game.locations) {
    const coordinateKey = `${location.x},${location.y}`;
    const occupant = occupied.get(coordinateKey);
    if (occupant) problems.push({ path: `location.${location.id}`, message: `Rasterfeld ${coordinateKey} ist bereits von "${occupant}" belegt.` });
    occupied.set(coordinateKey, location.id);

    for (const exit of location.exits) {
      const target = game.locations.find((candidate) => candidate.id === exit);
      if (!target) {
        problems.push({ path: `location.${location.id}.exits`, message: `Ausgang verweist auf unbekannten Ort "${exit}".` });
        continue;
      }
      if (!directionBetween(location, target)) {
        problems.push({ path: `location.${location.id}.exits`, message: `"${exit}" liegt nicht direkt nördlich, östlich, südlich oder westlich im Raster.` });
      }
      if (!target.exits.includes(location.id)) {
        problems.push({ path: `location.${location.id}.exits`, message: `Verbindung zu "${exit}" ist nicht beidseitig.` });
      }
    }

    for (const item of location.itemIds) if (!itemIds.has(item)) problems.push({ path: `location.${location.id}.itemIds`, message: `Unbekanntes Item "${item}".` });
    if (location.encounterId && !encounterIds.has(location.encounterId)) problems.push({ path: `location.${location.id}.encounterId`, message: `Unbekannte Begegnung "${location.encounterId}".` });
  }

  for (const encounter of game.encounters) {
    if (encounter.questId && !questIds.has(encounter.questId)) problems.push({ path: `encounter.${encounter.id}.questId`, message: `Unbekannte Quest "${encounter.questId}".` });
  }

  if (!game.locations.some((x) => x.ending)) problems.push({ path: "game.locations", message: "Kein Abschluss-Ort markiert." });
  return problems;
}
