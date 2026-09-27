import { canTravel, turnLeft, turnRight } from "./dungeon.ts";
import type { AuthoredLocation, Direction } from "./types";

// A room group represents one continuous floor. Walk each visible row out to
// its perimeter; a direct neighbor is not itself a wall. Distances are cell
// offsets from the forward sightline, used by the native depth projection.
export function roomViewEdges(locations: AuthoredLocation[], cell: AuthoredLocation, facing: Direction) {
  const sameRoom = (other: AuthoredLocation | undefined) =>
    !!cell.roomGroupId && cell.sceneKind === "room" && other?.sceneKind === "room"
    && other.roomGroupId === cell.roomGroupId;
  const scanSide = (direction: Direction) => {
    const frontWalls: number[] = [];
    let current = cell;
    let count = 0;
    while (true) {
      const next = canTravel(locations, current, direction);
      if (!sameRoom(next)) break;
      current = next!;
      count++;
      if (!sameRoom(canTravel(locations, current, facing))) frontWalls.push(count);
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
