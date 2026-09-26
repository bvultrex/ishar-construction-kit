import type { AuthoredDoor, AuthoredLocation, Direction } from "./types";

export const DIRECTIONS: Direction[] = ["north", "east", "south", "west"];

export const DIRECTION_LABELS: Record<Direction, string> = {
  north: "N",
  east: "O",
  south: "S",
  west: "W",
};

export const DIRECTION_VECTORS: Record<Direction, { x: number; y: number }> = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
};

export function turnLeft(direction: Direction): Direction {
  return DIRECTIONS[(DIRECTIONS.indexOf(direction) + 3) % 4]!;
}

export function turnRight(direction: Direction): Direction {
  return DIRECTIONS[(DIRECTIONS.indexOf(direction) + 1) % 4]!;
}

export function turnBack(direction: Direction): Direction {
  return DIRECTIONS[(DIRECTIONS.indexOf(direction) + 2) % 4]!;
}

export function locationAt(locations: AuthoredLocation[], x: number, y: number) {
  return locations.find((location) => location.x === x && location.y === y);
}

export function adjacentLocation(locations: AuthoredLocation[], location: AuthoredLocation, direction: Direction) {
  const vector = DIRECTION_VECTORS[direction];
  return locationAt(locations, location.x + vector.x, location.y + vector.y);
}

export function canTravel(locations: AuthoredLocation[], location: AuthoredLocation, direction: Direction) {
  const target = adjacentLocation(locations, location, direction);
  return target && location.exits.includes(target.id) ? target : undefined;
}

export function directionBetween(a: AuthoredLocation, b: AuthoredLocation): Direction | undefined {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === -1) return "north";
  if (dx === 1 && dy === 0) return "east";
  if (dx === 0 && dy === 1) return "south";
  if (dx === -1 && dy === 0) return "west";
  return undefined;
}


export function doorBetween(doors: AuthoredDoor[], a: AuthoredLocation, b: AuthoredLocation) {
  return doors.find((door) =>
    (door.fromLocationId === a.id && door.toLocationId === b.id)
    || (door.fromLocationId === b.id && door.toLocationId === a.id)
  );
}
