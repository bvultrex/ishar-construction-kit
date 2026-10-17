import { canTravel, doorBetween, turnLeft, turnRight } from "./dungeon.ts";
import type { AuthoredDoor, AuthoredLocation, Direction } from "./types";

// A walkable connection between room cells is open floor regardless of how
// they were created or grouped. Authored doors and distinct tilesets remain
// explicit boundaries. Group ids describe authoring, not physical walls.
export function roomsShareOpenSurface(a: AuthoredLocation, b: AuthoredLocation | undefined, doors: AuthoredDoor[]) {
  return !!b && a.sceneKind === "room" && b.sceneKind === "room"
    && (!a.tilesetId || !b.tilesetId || a.tilesetId === b.tilesetId)
    && !doorBetween(doors, a, b);
}

// Walk each visible row to its perimeter; offsets are relative to the
// forward sightline and drive the native room depth projection.
export function roomViewEdges(locations: AuthoredLocation[], cell: AuthoredLocation, facing: Direction, doors: AuthoredDoor[] = []) {
  const scanSide = (direction: Direction) => {
    const frontWalls: number[] = [];
    let current = cell;
    let count = 0;
    while (true) {
      const next = canTravel(locations, current, direction);
      if (!roomsShareOpenSurface(current, next, doors)) break;
      current = next!;
      count++;
      if (!roomsShareOpenSurface(current, canTravel(locations, current, facing), doors)) frontWalls.push(count);
    }
    return { count, frontWalls };
  };
  const left = scanSide(turnLeft(facing));
  const right = scanSide(turnRight(facing));
  return {
    leftInterior: left.count > 0,
    rightInterior: right.count > 0,
    leftPerimeterOffset: left.count,
    rightPerimeterOffset: right.count,
    leftFrontWalls: left.frontWalls,
    rightFrontWalls: right.frontWalls,
  };
}
