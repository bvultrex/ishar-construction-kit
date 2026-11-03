import { directionBetween } from "./dungeon.ts";
import { validateGridLevel } from "./cont-grid.ts";
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
  const doorIds = new Set(game.doors.map((x) => x.id));
  const levelIds = new Set(game.levels.map((x)=>x.id));
  // Grid levels derive their links from the original layers (cont-grid.ts).
  const gridLevelIds = new Set(game.levels.filter((x)=>x.grid).map((x)=>x.id));

  if (!game.locations.length) problems.push({ path: "game.locations", message: "Mindestens ein Ort wird benötigt." });
  if (!game.levels.length) problems.push({path:"game.levels",message:"Mindestens ein Level wird benötigt."});
  for(const level of game.levels) if(!game.locations.some((location)=>(location.levelId || "level-1")===level.id)) problems.push({path:`level.${level.id}`,message:"Das Level hat kein Feld."});
  if (!locationIds.has(game.startLocationId)) problems.push({ path: "game.startLocationId", message: "Der Startort existiert nicht." });
  if(game.locations.find((location)=>location.id===game.startLocationId)?.outdoorSurface==="water") problems.push({path:"game.startLocationId",message:"Das Startfeld liegt im Wasser."});

  const allIds = [
    ...game.locations.map((x) => ["location", x.id] as const),
    ...game.items.map((x) => ["item", x.id] as const),
    ...game.encounters.map((x) => ["encounter", x.id] as const),
    ...game.quests.map((x) => ["quest", x.id] as const),
    ...game.characters.map((x) => ["character", x.id] as const),
    ...game.doors.map((x) => ["door", x.id] as const),
    ...game.levels.map((x) => ["level", x.id] as const),
    ...game.portals.map((x) => ["portal", x.id] as const),
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
    const levelId=location.levelId || "level-1";
    if(!levelIds.has(levelId)) problems.push({path:`location.${location.id}.levelId`,message:`Unbekanntes Level "${levelId}".`});
    const coordinateKey = `${levelId}:${location.x},${location.y}`;
    const occupant = occupied.get(coordinateKey);
    if (occupant) problems.push({ path: `location.${location.id}`, message: `Rasterfeld ${coordinateKey} ist bereits von "${occupant}" belegt.` });
    occupied.set(coordinateKey, location.id);
    if(location.outdoorSurface==="water" && location.exits.length) problems.push({path:`location.${location.id}.exits`,message:"Wasserfelder dürfen keine Ausgänge besitzen."});

    for (const exit of gridLevelIds.has(levelId) ? [] : location.exits) {
      const target = game.locations.find((candidate) => candidate.id === exit);
      if (!target) {
        problems.push({ path: `location.${location.id}.exits`, message: `Ausgang verweist auf unbekannten Ort "${exit}".` });
        continue;
      }
      if(target.outdoorSurface==="water") problems.push({path:`location.${location.id}.exits`,message:`Ein Ausgang führt in das Wasserfeld "${exit}".`});
      if (!directionBetween(location, target)) {
        problems.push({ path: `location.${location.id}.exits`, message: `"${exit}" liegt nicht direkt nördlich, östlich, südlich oder westlich im Raster.` });
      }
      if (!target.exits.includes(location.id)) {
        problems.push({ path: `location.${location.id}.exits`, message: `Verbindung zu "${exit}" ist nicht beidseitig.` });
      }
    }

    for (const item of location.itemIds) if (!itemIds.has(item)) problems.push({ path: `location.${location.id}.itemIds`, message: `Unbekanntes Item "${item}".` });
    for(const id of location.npcIds??[]) if(!(game.npcs??[]).some(n=>n.id===id)) problems.push({path:`location.${location.id}.npcIds`,message:`Unbekannter NPC "${id}".`});
    if(location.itemPlacementIds && (location.itemPlacementIds.length!==location.itemIds.length || new Set(location.itemPlacementIds).size!==location.itemPlacementIds.length)) problems.push({path:`location.${location.id}.itemPlacementIds`,message:'Item-Platzierungen benötigen je Kopie eine eindeutige ID.'});
    if (location.encounterId && !encounterIds.has(location.encounterId)) problems.push({ path: `location.${location.id}.encounterId`, message: `Unbekannte Begegnung "${location.encounterId}".` });
  }

  const npcIds=new Set<string>();
  for(const npc of game.npcs??[]) {
    if(!npc.id.trim() || npcIds.has(npc.id)) problems.push({path:'game.npcs',message:'NPC-IDs müssen eindeutig und nicht leer sein.'});
    npcIds.add(npc.id);
    for(const [index,stock] of (npc.stock??[]).entries()) {
      if(!itemIds.has(stock.itemId)) problems.push({path:`npc.${npc.id}.stock.${index}`,message:'Ware verweist auf einen unbekannten Gegenstand.'});
      if(!Number.isSafeInteger(stock.price)||stock.price<0||!Number.isSafeInteger(stock.quantity)||stock.quantity<0) problems.push({path:`npc.${npc.id}.stock.${index}`,message:'Preis und Bestand müssen ganze, nicht negative Zahlen sein.'});
    }
  }

  if (doorIds.size !== game.doors.length) problems.push({ path: "game.doors", message: "Tür-IDs müssen eindeutig sein." });

  for (const door of game.doors) {
    const from = game.locations.find((location) => location.id === door.fromLocationId);
    const to = game.locations.find((location) => location.id === door.toLocationId);
    if (!from || !to) {
      problems.push({ path: `door.${door.id}`, message: "Tür verweist auf einen unbekannten Raum." });
      continue;
    }
    if (!directionBetween(from, to)) problems.push({ path: `door.${door.id}`, message: "Tür verbindet keine direkt benachbarten Rasterfelder." });
    if (!from.exits.includes(to.id) || !to.exits.includes(from.id)) problems.push({ path: `door.${door.id}`, message: "Tür liegt nicht auf einer beidseitigen Raumverbindung." });
    if (door.keyItemId && !itemIds.has(door.keyItemId)) problems.push({ path: `door.${door.id}.keyItemId`, message: `Unbekanntes Schlüssel-Item "${door.keyItemId}".` });
  }

  for(const portal of game.portals){
    const from=game.locations.find((location)=>location.id===portal.fromLocationId);
    const to=game.locations.find((location)=>location.id===portal.toLocationId);
    if(!from || !to) problems.push({path:`portal.${portal.id}`,message:"Levelübergang verweist auf einen unbekannten Ort."});
    else if((from.levelId || "level-1")===(to.levelId || "level-1")) problems.push({path:`portal.${portal.id}`,message:"Ein Levelübergang muss verschiedene Level verbinden."});
    if(from?.outdoorSurface==="water" || to?.outdoorSurface==="water") problems.push({path:`portal.${portal.id}`,message:"Ein Levelübergang darf nicht im Wasser liegen."});
  }

  for (const encounter of game.encounters) {
    if (encounter.questId && !questIds.has(encounter.questId)) problems.push({ path: `encounter.${encounter.id}.questId`, message: `Unbekannte Quest "${encounter.questId}".` });
  }

  for (const level of game.levels) if (level.grid) problems.push(...validateGridLevel(level, game));

  if (!game.locations.some((x) => x.ending)) problems.push({ path: "game.locations", message: "Kein Abschluss-Ort markiert." });
  return problems;
}
