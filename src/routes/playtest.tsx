import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useKit } from "@/lib/store";
import { useAssetPack } from "@/lib/asset-store";
import { assetFor } from "@/lib/ishar/asset-pack";
import { canTravel, doorBetween, DIRECTION_LABELS, turnBack, turnLeft, turnRight } from "@/lib/ishar/dungeon";
import { validateGame } from "@/lib/ishar/project-validation";
import type { AuthoredEncounter, AuthoredGame, AuthoredLocation, Direction, DungeonAssetDepth, DungeonAssetRole } from "@/lib/ishar/types";
import type { LoadedAssetPack } from "@/lib/ishar/asset-pack";
import { displayAspect, renderProfileForManifest, sourceScale } from "@/lib/ishar/render-profile";

export const Route = createFileRoute("/playtest")({ component: PlaytestPage });

const FRAMES = [
  { l: 0, t: 0, r: 640, b: 400 },
  { l: 72, t: 46, r: 568, b: 354 },
  { l: 148, t: 92, r: 492, b: 308 },
  { l: 210, t: 128, r: 430, b: 272 },
  { l: 254, t: 154, r: 386, b: 246 },
];

function points(values: number[][]) {
  return values.map((value) => value.join(",")).join(" ");
}

function renderAsset(
  pack: LoadedAssetPack | null,
  role: DungeonAssetRole,
  depth?: DungeonAssetDepth,
  tilesetId?: string,
  targetId?: string,
) {
  const asset = assetFor(pack, role, depth, tilesetId, targetId);
  if (!asset || !pack) return null;
  const scaleX = 640 / pack.manifest.viewport.width;
  const scaleY = 400 / pack.manifest.viewport.height;
  const x = (asset.entry.x ?? 0) * scaleX;
  const y = (asset.entry.y ?? 0) * scaleY;
  const width = (asset.entry.width ?? pack.manifest.viewport.width) * scaleX;
  const height = (asset.entry.height ?? pack.manifest.viewport.height) * scaleY;
  return <image
    key={asset.entry.id}
    className="asset-layer"
    href={asset.url}
    x={x}
    y={y}
    width={width}
    height={height}
    opacity={asset.entry.opacity ?? 1}
    preserveAspectRatio="none"
  />;
}

function texturePattern(
  pack: LoadedAssetPack,
  asset: NonNullable<ReturnType<typeof assetFor>>,
  patternId: string,
) {
  const profile=renderProfileForManifest(pack.manifest);
  const scale=sourceScale(profile);
  const tileWidth=(asset.entry.tileWidth ?? 64)*scale.x;
  const tileHeight=(asset.entry.tileHeight ?? 64)*scale.y;
  return <pattern id={patternId} patternUnits="userSpaceOnUse" width={tileWidth} height={tileHeight}>
    <image href={asset.url} x="0" y="0" width={tileWidth} height={tileHeight} preserveAspectRatio="xMidYMid slice"/>
  </pattern>;
}

function renderDiscoveredTexture(
  pack: LoadedAssetPack | null,
  assetId: string | undefined,
  shape: { kind: "polygon"; points: number[][] } | { kind: "rect"; x: number; y: number; width: number; height: number },
  depth: DungeonAssetDepth,
  keyPrefix: string,
) {
  if (!pack || !assetId) return null;
  const preview=pack.discoveredAssets?.find((asset)=>asset.id===assetId);
  if(!preview) return null;
  const profile=renderProfileForManifest(pack.manifest);
  const scale=sourceScale(profile);
  const tileWidth=Math.max(8,(preview.width ?? 32)*scale.x);
  const tileHeight=Math.max(8,(preview.height ?? 32)*scale.y);
  const patternId=`manual-${keyPrefix}-${assetId.replace(/[^a-z0-9]/gi,"-")}-${depth}`;
  const pattern=<pattern id={patternId} patternUnits="userSpaceOnUse" width={tileWidth} height={tileHeight}>
    <image href={preview.url} x="0" y="0" width={tileWidth} height={tileHeight} preserveAspectRatio="xMidYMid slice"/>
  </pattern>;
  return <g key={patternId}>
    <defs>{pattern}</defs>
    {shape.kind==="polygon"
      ? <polygon points={points(shape.points)} fill={`url(#${patternId})`}/>
      : <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill={`url(#${patternId})`}/>}
  </g>;
}

function renderDiscoveredLayer(
  pack: LoadedAssetPack | null,
  assetId: string | undefined,
  box: {x:number;y:number;width:number;height:number},
) {
  if(!pack || !assetId) return null;
  const preview=pack.discoveredAssets?.find((asset)=>asset.id===assetId);
  if(!preview) return null;
  return <image
    key={"manual-layer-"+assetId}
    href={preview.url}
    x={box.x}
    y={box.y}
    width={box.width}
    height={box.height}
    preserveAspectRatio="xMidYMid meet"
    className="asset-layer"
  />;
}
function semanticItemAssetId(
  pack: LoadedAssetPack | null,
  item: AuthoredGame["items"][number] | undefined,
  depth: number,
) {
  if(!pack || !item || depth<0 || depth>2) return undefined;
  const explicit=depth===0 ? (item.assetNearId ?? item.assetId) : depth===1 ? item.assetMidId : item.assetFarId;
  if(explicit && pack.discoveredAssets?.some((asset)=>asset.id===explicit)) return explicit;

  // If the author selected only one member of a detected distance family,
  // recover its siblings automatically instead of stretching one sprite.
  const anchorId=item.assetNearId ?? item.assetMidId ?? item.assetFarId ?? item.assetId;
  const anchor=anchorId ? pack.discoveredAssets?.find((asset)=>asset.id===anchorId) : undefined;
  if(anchor?.distanceSetId){
    const wantedRole=depth===0 ? "near" : depth===1 ? "mid" : "far";
    const sibling=pack.discoveredAssets?.find((asset)=>asset.distanceSetId===anchor.distanceSetId && asset.distanceRole===wantedRole);
    if(sibling) return sibling.id;
  }

  const name=(item.name+" "+item.description).toLowerCase();
  if(/schl[uü]ssel|\bkey\b/.test(name) && pack.manifest.renderProfileId==="ishar2-dos"){
    const entry=[69,70,71][depth]!;
    const match=pack.discoveredAssets?.find((asset)=>
      asset.source==="alis"
      && asset.visualStatus==="normal"
      && /OBJET\.IO/i.test(asset.path)
      && new RegExp("ALIS #"+entry+"(?:\\D|$)","i").test(asset.path)
    );
    if(match) return match.id;
  }
  return undefined;
}

function renderDiscoveredItemAtDepth(
  pack: LoadedAssetPack | null,
  assetId: string | undefined,
  depth: number,
) {
  if(!pack || !assetId || depth<0 || depth>2) return null;
  const preview=pack.discoveredAssets?.find((asset)=>asset.id===assetId);
  if(!preview) return null;
  const profile=renderProfileForManifest(pack.manifest);
  const scale=sourceScale(profile);
  const width=Math.max(12,(preview.width ?? 16)*scale.x);
  const height=Math.max(12,(preview.height ?? 16)*scale.y);
  const frame=FRAMES[Math.min(depth+1,FRAMES.length-1)]!;
  const x=320-width/2;
  const y=frame.b-height;
  return <image
    key={"distance-item-"+assetId+"-"+depth}
    href={preview.url}
    x={x}
    y={y}
    width={width}
    height={height}
    preserveAspectRatio="xMidYMid meet"
    className={"asset-layer item-depth item-depth-"+depth}
  />;
}


function renderPolygonAsset(
  pack: LoadedAssetPack | null,
  role: DungeonAssetRole,
  polygon: number[][],
  depth: DungeonAssetDepth,
  tilesetId?: string,
) {
  const asset=assetFor(pack,role,depth,tilesetId);
  if(!asset || !pack) return null;
  if(asset.entry.renderMode!=="texture") return renderAsset(pack,role,depth,tilesetId);
  const patternId=`tex-${asset.entry.id}-${depth}-${role.replace(/[^a-z0-9]/gi,"-")}`;
  return <g key={patternId}>
    <defs>{texturePattern(pack,asset,patternId)}</defs>
    <polygon points={points(polygon)} fill={`url(#${patternId})`} opacity={asset.entry.opacity ?? 1}/>
  </g>;
}

function renderRectAsset(
  pack: LoadedAssetPack | null,
  role: DungeonAssetRole,
  rect: {x:number;y:number;width:number;height:number},
  depth: DungeonAssetDepth,
  tilesetId?: string,
  targetId?: string,
) {
  const asset=assetFor(pack,role,depth,tilesetId,targetId);
  if(!asset || !pack) return null;
  if(asset.entry.renderMode!=="texture") return renderAsset(pack,role,depth,tilesetId,targetId);
  const patternId=`tex-${asset.entry.id}-${depth}-${role.replace(/[^a-z0-9]/gi,"-")}`;
  return <g key={patternId}>
    <defs>{texturePattern(pack,asset,patternId)}</defs>
    <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill={`url(#${patternId})`} opacity={asset.entry.opacity ?? 1}/>
  </g>;
}

function DungeonViewport({ game, location, facing, encounter, encounterDone, collectedItemIds, pack, openDoors }: {
  game: AuthoredGame;
  location: AuthoredLocation;
  facing: Direction;
  encounter?: AuthoredEncounter;
  encounterDone: boolean;
  collectedItemIds: string[];
  pack: LoadedAssetPack | null;
  openDoors: string[];
}) {
  const renderProfile=renderProfileForManifest(pack?.manifest);
  const viewportAspect=displayAspect(renderProfile);
  const segments: React.ReactNode[] = [];
  const itemLayers: React.ReactNode[] = [];
  let cell: AuthoredLocation | undefined = location;

  for (let depth = 0; depth < 4 && cell; depth++) {
    const outer = FRAMES[depth]!;
    const inner = FRAMES[depth + 1]!;
    const leftOpen = !!canTravel(game.locations, cell, turnLeft(facing));
    const rightOpen = !!canTravel(game.locations, cell, turnRight(facing));
    const forward = canTravel(game.locations, cell, facing);
    const forwardDoor = forward ? doorBetween(game.doors, cell, forward) : undefined;
    const forwardDoorOpen = !forwardDoor || openDoors.includes(forwardDoor.id);

    if(depth<=2){
      const visibleItemId=cell.itemIds.find((id)=>!collectedItemIds.includes(id));
      const visibleItem=visibleItemId ? game.items.find((item)=>item.id===visibleItemId) : undefined;
      const assetId=semanticItemAssetId(pack,visibleItem,depth);
      const layer=renderDiscoveredItemAtDepth(pack,assetId,depth);
      if(layer) itemLayers.unshift(layer);
    }

    segments.push(
      <g key={`segment-${depth}`} className={`dungeon-depth depth-${depth}`}>
        <polygon className="dungeon-ceiling" fill="url(#fallback-ceiling-pattern)" points={points([[outer.l,outer.t],[outer.r,outer.t],[inner.r,inner.t],[inner.l,inner.t]])}/>
        <polygon className="dungeon-floor" fill="url(#fallback-floor-pattern)" points={points([[outer.l,outer.b],[inner.l,inner.b],[inner.r,inner.b],[outer.r,outer.b]])}/>
        <polygon className="dungeon-wall side-left" fill="url(#fallback-wall-pattern)" points={points([[outer.l,outer.t],[inner.l,inner.t],[inner.l,inner.b],[outer.l,outer.b]])}/>
        <polygon className="dungeon-wall side-right" fill="url(#fallback-wall-pattern)" points={points([[inner.r,inner.t],[outer.r,outer.t],[outer.r,outer.b],[inner.r,inner.b]])}/>
        {leftOpen && <polygon className="dungeon-opening side-opening" points={points([[outer.l+5,outer.t+34],[inner.l-2,inner.t+20],[inner.l-2,inner.b-20],[outer.l+5,outer.b-34]])}/>}
        {rightOpen && <polygon className="dungeon-opening side-opening" points={points([[inner.r+2,inner.t+20],[outer.r-5,outer.t+34],[outer.r-5,outer.b-34],[inner.r+2,inner.b-20]])}/>}
        {!forward && <>
          <rect className="dungeon-back-wall" fill="url(#fallback-wall-pattern)" x={inner.l} y={inner.t} width={inner.r-inner.l} height={inner.b-inner.t}/>
          <line className="dungeon-mortar" x1={inner.l} y1={(inner.t+inner.b)/2} x2={inner.r} y2={(inner.t+inner.b)/2}/>
          <line className="dungeon-mortar" x1={(inner.l+inner.r)/2} y1={inner.t} x2={(inner.l+inner.r)/2} y2={inner.b}/>
        </>}
        {renderDiscoveredTexture(pack, cell.ceilingAssetId, {kind:"polygon",points:[[outer.l,outer.t],[outer.r,outer.t],[inner.r,inner.t],[inner.l,inner.t]]}, depth as DungeonAssetDepth, "ceiling") ?? renderPolygonAsset(pack, "surface.ceiling", [[outer.l,outer.t],[outer.r,outer.t],[inner.r,inner.t],[inner.l,inner.t]], depth as DungeonAssetDepth, cell.tilesetId)}
        {renderDiscoveredTexture(pack, cell.floorAssetId, {kind:"polygon",points:[[outer.l,outer.b],[inner.l,inner.b],[inner.r,inner.b],[outer.r,outer.b]]}, depth as DungeonAssetDepth, "floor") ?? renderPolygonAsset(pack, "surface.floor", [[outer.l,outer.b],[inner.l,inner.b],[inner.r,inner.b],[outer.r,outer.b]], depth as DungeonAssetDepth, cell.tilesetId)}
        {renderDiscoveredTexture(pack, cell.wallAssetId, {kind:"polygon",points:[[outer.l,outer.t],[inner.l,inner.t],[inner.l,inner.b],[outer.l,outer.b]]}, depth as DungeonAssetDepth, "wall-left") ?? renderPolygonAsset(pack, "wall.left", [[outer.l,outer.t],[inner.l,inner.t],[inner.l,inner.b],[outer.l,outer.b]], depth as DungeonAssetDepth, cell.tilesetId)}
        {renderDiscoveredTexture(pack, cell.wallAssetId, {kind:"polygon",points:[[inner.r,inner.t],[outer.r,outer.t],[outer.r,outer.b],[inner.r,inner.b]]}, depth as DungeonAssetDepth, "wall-right") ?? renderPolygonAsset(pack, "wall.right", [[inner.r,inner.t],[outer.r,outer.t],[outer.r,outer.b],[inner.r,inner.b]], depth as DungeonAssetDepth, cell.tilesetId)}
        {leftOpen && <polygon className="dungeon-opening side-opening" points={points([[outer.l+5,outer.t+34],[inner.l-2,inner.t+20],[inner.l-2,inner.b-20],[outer.l+5,outer.b-34]])}/>}
        {rightOpen && <polygon className="dungeon-opening side-opening" points={points([[inner.r+2,inner.t+20],[outer.r-5,outer.t+34],[outer.r-5,outer.b-34],[inner.r+2,inner.b-20]])}/>}
        {leftOpen && renderAsset(pack, "opening.left", depth as DungeonAssetDepth, cell.tilesetId)}
        {rightOpen && renderAsset(pack, "opening.right", depth as DungeonAssetDepth, cell.tilesetId)}
        {!forward && (renderDiscoveredTexture(pack, cell.wallAssetId, {kind:"rect",x:inner.l,y:inner.t,width:inner.r-inner.l,height:inner.b-inner.t}, depth as DungeonAssetDepth, "wall-front") ?? renderRectAsset(pack, "wall.front", {x:inner.l,y:inner.t,width:inner.r-inner.l,height:inner.b-inner.t}, depth as DungeonAssetDepth, cell.tilesetId))}
        {forwardDoor && renderRectAsset(pack, forwardDoorOpen ? "door.front.open" : "door.front.closed", {x:inner.l+12,y:inner.t+4,width:Math.max(20,inner.r-inner.l-24),height:Math.max(30,inner.b-inner.t-8)}, depth as DungeonAssetDepth, cell.tilesetId, forwardDoor.id)}
        {forwardDoor && !forwardDoorOpen && !assetFor(pack, "door.front.closed", depth as DungeonAssetDepth, cell.tilesetId, forwardDoor.id) && <g className="fallback-door">
          <rect x={inner.l + 12} y={inner.t + 4} width={Math.max(20, inner.r-inner.l-24)} height={Math.max(30, inner.b-inner.t-8)} rx="2"/>
          <circle cx={inner.r - 26} cy={(inner.t+inner.b)/2} r="4"/>
        </g>}
      </g>
    );

    if (!forward || !forwardDoorOpen) break;
    cell = forward;
  }

  const encounterLayer = encounter && !encounterDone ? renderAsset(pack, "encounter", undefined, location.tilesetId, encounter.id) : null;
  const currentItemId=location.itemIds.find((id)=>!collectedItemIds.includes(id));
  const currentItem=currentItemId ? game.items.find((item)=>item.id===currentItemId) : undefined;
  const currentItemAssetId=semanticItemAssetId(pack,currentItem,0);
  const genericCurrentItemLayer=!currentItemAssetId && currentItemId
    ? renderAsset(pack, "item", undefined, location.tilesetId, currentItemId)
    : null;

  return <div className="dungeon-viewport" style={{aspectRatio:String(viewportAspect)}} data-render-profile={renderProfile.id}>
    <svg viewBox="0 0 640 400" preserveAspectRatio="none" aria-label={`Blick nach ${DIRECTION_LABELS[facing]}`}>
      <defs>
        <pattern id="fallback-wall-pattern" width="56" height="34" patternUnits="userSpaceOnUse">
          <rect width="56" height="34" className="fallback-stone-base"/>
          <path d="M0 1H56M0 17H56M0 33H56M28 1V17M14 17V33M42 17V33" className="fallback-stone-line"/>
        </pattern>
        <pattern id="fallback-floor-pattern" width="64" height="40" patternUnits="userSpaceOnUse" patternTransform="skewX(-18)">
          <rect width="64" height="40" className="fallback-floor-base"/>
          <path d="M0 1H64M0 20H64M0 39H64M32 1V20M16 20V39M48 20V39" className="fallback-floor-line"/>
        </pattern>
        <pattern id="fallback-ceiling-pattern" width="64" height="36" patternUnits="userSpaceOnUse">
          <rect width="64" height="36" className="fallback-ceiling-base"/>
          <path d="M0 1H64M0 18H64M0 35H64M32 1V18M16 18V35M48 18V35" className="fallback-ceiling-line"/>
        </pattern>
      </defs>
      <rect width="640" height="400" className="dungeon-dark"/>
      {renderAsset(pack, "viewport.background", undefined, location.tilesetId)}
      {segments}
      {itemLayers}
      <path className="dungeon-vignette" d="M0 0H640V400H0Z M32 25V375H608V25Z" fillRule="evenodd"/>
      {encounter && !encounterDone && (encounterLayer ?? <g className="enemy-silhouette" transform="translate(320 232)">
        <ellipse cx="0" cy="58" rx="58" ry="13" className="enemy-shadow"/>
        <path d="M-36 48 L-24 -52 L0 -84 L24 -52 L36 48 Z" className="enemy-body"/>
        <circle cx="0" cy="-88" r="24" className="enemy-head"/>
        <path d="M-23 -90 L-8 -105 L0 -95 L9 -108 L23 -90" className="enemy-crown"/>
        <circle cx="-8" cy="-91" r="3" className="enemy-eye"/><circle cx="8" cy="-91" r="3" className="enemy-eye"/>
        <path d="M-42 -22 L-70 23 L-52 30 L-26 2 M42 -22 L70 23 L52 30 L26 2" className="enemy-arms"/>
      </g>)}
      {currentItemId && !currentItemAssetId && (genericCurrentItemLayer ?? <g className="dungeon-item" transform="translate(500 310)">
        <ellipse cx="0" cy="36" rx="34" ry="8" className="item-shadow"/>
        <path d="M-22 34 L-14 -8 L14 -8 L22 34 Z" className="item-pedestal"/>
        <circle cx="0" cy="-24" r="13" className="item-glow"/>
        <path d="M-5 -30 L7 -25 L0 -15 L-8 -20 Z" className="item-core"/>
      </g>)}
    </svg>
    <div className="viewport-topbar"><span>{location.name}</span><strong>{DIRECTION_LABELS[facing]}</strong></div>
    <div className="viewport-profile">{renderProfile.label} · {renderProfile.drawWidth}×{renderProfile.drawHeight}</div>
    {encounter && !encounterDone && <div className="enemy-hud"><strong>{encounter.name}</strong><span>im Weg</span></div>}
  </div>;
}

function DungeonMiniMap({ game, location, facing }: { game: AuthoredGame; location: AuthoredLocation; facing: Direction }) {
  const xs=game.locations.map((room)=>room.x);
  const ys=game.locations.map((room)=>room.y);
  const minX=Math.min(...xs,0);
  const maxX=Math.max(...xs,0);
  const minY=Math.min(...ys,0);
  const maxY=Math.max(...ys,0);
  const cell=18;
  const pad=8;
  const width=(maxX-minX+1)*cell+pad*2;
  const height=(maxY-minY+1)*cell+pad*2;
  const point=(room:AuthoredLocation)=>({x:pad+(room.x-minX)*cell+cell/2,y:pad+(room.y-minY)*cell+cell/2});
  const facingRotation:Record<Direction,number>={north:0,east:90,south:180,west:270};
  return <svg className="play-minimap" viewBox={`0 0 ${width} ${height}`} aria-label="Minimap">
    <rect width={width} height={height} className="minimap-bg"/>
    {game.locations.flatMap((room)=>room.exits.map((id)=>{
      const target=game.locations.find((candidate)=>candidate.id===id);
      if(!target || room.id>target.id) return null;
      const a=point(room), b=point(target);
      return <line key={`${room.id}-${id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="minimap-link"/>;
    }))}
    {game.locations.map((room)=>{
      const p=point(room);
      const current=room.id===location.id;
      return <g key={room.id} transform={`translate(${p.x},${p.y})`}>
        <rect x={-5} y={-5} width={10} height={10} className={current ? "minimap-room current" : "minimap-room"}/>
        {current && <polygon points="0,-8 4,2 -4,2" className="minimap-facing" transform={`rotate(${facingRotation[facing]})`}/>} 
      </g>;
    })}
  </svg>;
}
function PlaytestPage() {
  const project = useKit((s) => s.project);
  const pack = useAssetPack((s) => s.pack);
  const game = project.game;
  const hero = game.characters[0];
  const problems = validateGame(game);
  const [locationId, setLocationId] = useState(game.startLocationId);
  const [facing, setFacing] = useState<Direction>(game.startFacing);
  const [heroHp, setHeroHp] = useState(hero?.hp ?? 1);
  const [enemyHp, setEnemyHp] = useState<Record<string, number>>({});
  const [completedEncounters, setCompletedEncounters] = useState<string[]>([]);
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [inventory, setInventory] = useState<string[]>([]);
  const [openDoors, setOpenDoors] = useState<string[]>(game.doors.filter((door)=>door.initiallyOpen).map((door)=>door.id));
  const [log, setLog] = useState<string[]>(["Du betrittst den Dungeon."]);

  const location = useMemo(() => game.locations.find((x) => x.id === locationId), [game.locations, locationId]);
  const encounter = location?.encounterId ? game.encounters.find((x) => x.id === location.encounterId) : undefined;
  const encounterDone = encounter ? completedEncounters.includes(encounter.id) : true;
  const currentEnemyHp = encounter ? (enemyHp[encounter.id] ?? encounter.enemyHp) : 0;
  const defeated = heroHp <= 0;
  const won = !!location?.ending && !defeated && encounterDone;
  const visibleItemIds = location?.itemIds.filter((id) => !inventory.includes(id)) ?? [];
  const facingTarget = location ? canTravel(game.locations, location, facing) : undefined;
  const facingDoor = location && facingTarget ? doorBetween(game.doors, location, facingTarget) : undefined;
  const facingDoorClosed = !!facingDoor && !openDoors.includes(facingDoor.id);

  function reset() {
    setLocationId(game.startLocationId);
    setFacing(game.startFacing);
    setHeroHp(hero?.hp ?? 1);
    setEnemyHp({});
    setCompletedEncounters([]);
    setCompletedQuests([]);
    setInventory([]);
    setOpenDoors(game.doors.filter((door)=>door.initiallyOpen).map((door)=>door.id));
    setLog(["Dungeon neu betreten."]);
  }

  function attack() {
    if (!hero || !encounter || encounterDone || defeated) return;
    const nextEnemy = Math.max(0, currentEnemyHp - hero.attack);
    if (nextEnemy === 0) {
      setEnemyHp((x)=>({...x,[encounter.id]:0}));
      setCompletedEncounters((x)=>[...x,encounter.id]);
      if (encounter.questId && !completedQuests.includes(encounter.questId)) setCompletedQuests((x)=>[...x,encounter.questId!]);
      setLog((x)=>[encounter.victoryText, ...x]);
      return;
    }
    const nextHero = Math.max(0, heroHp - encounter.enemyAttack);
    setEnemyHp((x)=>({...x,[encounter.id]:nextEnemy}));
    setHeroHp(nextHero);
    setLog((x)=>[`${hero.name} trifft für ${hero.attack}. ${encounter.name} trifft für ${encounter.enemyAttack}.`, ...x]);
  }

  function step(direction: Direction) {
    if (!location || !encounterDone || defeated) return;
    const target = canTravel(game.locations, location, direction);
    if (!target) {
      setLog((x)=>["Dort ist eine Wand.", ...x]);
      return;
    }
    const door = doorBetween(game.doors, location, target);
    if (door && !openDoors.includes(door.id)) {
      setLog((x)=>[door.keyItemId ? "Die Tür ist verschlossen." : "Die Tür ist geschlossen.", ...x]);
      return;
    }
    setLocationId(target.id);
    setLog((x)=>[`Du betrittst: ${target.name}.`, ...x]);
  }

  function openFacingDoor() {
    if (!location || defeated) return;
    const target = canTravel(game.locations, location, facing);
    if (!target) return;
    const door = doorBetween(game.doors, location, target);
    if (!door || openDoors.includes(door.id)) return;
    if (door.keyItemId && !inventory.includes(door.keyItemId)) {
      const key = game.items.find((item)=>item.id===door.keyItemId);
      setLog((x)=>[`Verschlossen. Benötigt: ${key?.name ?? door.keyItemId}.`, ...x]);
      return;
    }
    setOpenDoors((doors)=>[...doors, door.id]);
    setLog((x)=>["Tür geöffnet.", ...x]);
  }

  function takeItem(id: string) {
    if (inventory.includes(id)) return;
    const item = game.items.find((x)=>x.id===id);
    setInventory((x)=>[...x,id]);
    setLog((x)=>[`${item?.name ?? id} aufgenommen.`, ...x]);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input,textarea,select")) return;
      const key = event.key.toLowerCase();
      if (["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d"].includes(key)) event.preventDefault();
      if (key === "arrowleft" || key === "a") setFacing((value)=>turnLeft(value));
      else if (key === "arrowright" || key === "d") setFacing((value)=>turnRight(value));
      else if (key === "arrowup" || key === "w") step(facing);
      else if (key === "arrowdown" || key === "s") step(turnBack(facing));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [facing, locationId, encounterDone, defeated, openDoors]);

  if (problems.length || !hero || !location) return <section><header className="page-head"><div><p className="eyebrow">Dungeon Playtest</p><h1>Projekt nicht spielbar</h1><p>Behebe zuerst die Raster- oder Referenzfehler im Adventure Builder.</p></div><Link className="file-button" to="/author">Zum Builder</Link></header><div className="empty-state">{problems.map((p,i)=><p key={i}>{p.path}: {p.message}</p>)}</div></section>;

  return <section className="crawler-page">
    <header className="page-head crawler-head">
      <div><p className="eyebrow">First-person dungeon runtime</p><h1>{project.name}</h1><p>WASD / Pfeiltasten: drehen und schrittweise bewegen.</p></div>
      <div className="toolbar"><Link className="file-button" to="/author">Dungeon bearbeiten</Link><Link className="file-button" to="/assets">Assets</Link><button onClick={reset}>Neu starten</button></div>
    </header>

    <div className="ishar-play-shell">
      <div className="ishar-stage-row">
        <main className="ishar-view-panel">
          <DungeonViewport game={game} location={location} facing={facing} encounter={encounter} encounterDone={encounterDone} collectedItemIds={inventory} pack={pack} openDoors={openDoors}/>
          <div className="asset-runtime-status"><span>Asset-Pack</span><strong>{pack ? pack.manifest.name : "SVG-Fallback"}</strong>{game.assetPackId && !pack && <small>Projekt erwartet: {game.assetPackId}</small>}</div>
        </main>

        <aside className="ishar-control-panel">
          <div className="ishar-location-plaque">{location.name}</div>
          <DungeonMiniMap game={game} location={location} facing={facing}/>
          <div className="ishar-dpad" aria-label="Dungeon-Steuerung">
            <span/>
            <button onClick={()=>step(facing)} disabled={!encounterDone || defeated} aria-label="Vorwärts">▲</button>
            <span/>
            <button onClick={()=>setFacing(turnLeft(facing))} aria-label="Links drehen">◀</button>
            <button className="dpad-center" onClick={()=>step(turnBack(facing))} disabled={!encounterDone || defeated} aria-label="Rückwärts">▼</button>
            <button onClick={()=>setFacing(turnRight(facing))} aria-label="Rechts drehen">▶</button>
          </div>
          <div className="ishar-context-buttons">
            {encounter && !encounterDone && !defeated && <button className="attack-button" onClick={attack}>⚔ Angriff <small>{currentEnemyHp}/{encounter.enemyHp}</small></button>}
            {facingDoorClosed && encounterDone && !defeated && <button className="door-button" onClick={openFacingDoor}>🚪 Öffnen<small>{facingDoor?.keyItemId ? "Schlüssel" : "Tür"}</small></button>}
          </div>
          <div className="ishar-compass">Blick: <strong>{DIRECTION_LABELS[facing]}</strong></div>
        </aside>
      </div>

      <div className="ishar-party-strip">
        {Array.from({length:5},(_,index)=>{
          const member=game.characters[index];
          const currentHp=index===0 ? heroHp : member?.hp ?? 0;
          const maxHp=member?.hp ?? 1;
          const ratio=member ? Math.max(0,Math.min(100,Math.round(currentHp/maxHp*100))) : 0;
          return <article className={member ? "ishar-party-card" : "ishar-party-card empty"} key={member?.id ?? `empty-${index}`}>
            <div className="ishar-action-tab">{member ? "ACTION" : "—"}</div>
            <div className="ishar-portrait">{member ? member.name.slice(0,1).toUpperCase() : ""}</div>
            <div className="ishar-party-name">{member?.name ?? `Slot ${index+1}`}</div>
            <div className="ishar-life-row"><span>LIFE</span><div className="ishar-life-track"><i style={{width:`${ratio}%`}}/></div></div>
          </article>;
        })}
      </div>

      {visibleItemIds.length > 0 && !defeated && <div className="ishar-context-bar">{visibleItemIds.map((id)=>{
        const item=game.items.find((x)=>x.id===id);
        return <button key={id} onClick={()=>takeItem(id)}>{item?.name ?? id} aufnehmen</button>;
      })}</div>}
      {defeated && <div className="crawler-message danger"><strong>Die Gruppe wurde besiegt.</strong><button onClick={reset}>Erneut versuchen</button></div>}
      {won && <div className="crawler-message victory"><strong>Abschluss erreicht.</strong><span>Du kannst dich für weitere Tests weiterbewegen.</span></div>}
    </div>

    <div className="runtime-details">
      <section><p className="eyebrow">Raum</p><h2>{location.name}</h2><p>{location.description}</p></section>
      <section><h3>Quest</h3>{game.quests.map((q)=><div className="quest-line" key={q.id}><strong>{q.title}</strong><span>{completedQuests.includes(q.id)?"erfüllt":"aktiv"}</span><p>{completedQuests.includes(q.id)?q.completedText:q.objective}</p></div>)}</section>
      <section><h3>Inventar</h3>{inventory.length ? <ul>{inventory.map((id)=><li key={id}>{game.items.find((x)=>x.id===id)?.name ?? id}</li>)}</ul> : <p className="muted">leer</p>}</section>
      <section><h3>Protokoll</h3><div className="game-log">{log.slice(0,6).map((line,i)=><p key={i}>{line}</p>)}</div></section>
    </div>
  </section>;
}
