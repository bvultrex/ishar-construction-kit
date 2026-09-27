import { DUNGEON_FRAMES as FRAMES, DUNGEON_NATIVE_FRAMES, DUNGEON_ROOM_FRAMES, usesNativeDungeonProjection } from "@/lib/ishar/dungeon-scenes";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useKit } from "@/lib/store";
import { useAssetPack } from "@/lib/asset-store";
import { assetFor } from "@/lib/ishar/asset-pack";
import { canTravel, doorBetween, DIRECTION_LABELS, turnBack, turnLeft, turnRight } from "@/lib/ishar/dungeon";
import { roomViewEdges, roomsShareOpenSurface } from "@/lib/ishar/room-surfaces";
import { visibleOutdoorCells } from "@/lib/ishar/outdoor-view";
import { validateGame } from "@/lib/ishar/project-validation";
import type { AuthoredEncounter, AuthoredGame, AuthoredLocation, Direction, DungeonAssetDepth, DungeonAssetRole } from "@/lib/ishar/types";
import type { LoadedAssetPack } from "@/lib/ishar/asset-pack";
import { displayAspect, renderProfileForManifest, sourceScale } from "@/lib/ishar/render-profile";

export const Route = createFileRoute("/playtest")({ component: PlaytestPage });



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
    data-source={asset.entry.file}
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

function alisPreview(pack:LoadedAssetPack|null,module:string,index:number) {
  return pack?.discoveredAssets?.find((asset)=>asset.path.toUpperCase().endsWith(`${module}.IO · ALIS #${index}`));
}

function renderSwampScene(game:AuthoredGame,location:AuthoredLocation,facing:Direction,pack:LoadedAssetPack|null) {
  const sky=alisPreview(pack,"FOND1",1);
  const ground=alisPreview(pack,"FOND1",0);
  const grassEdge=alisPreview(pack,"PLAINE1",92);
  const vegetation=visibleOutdoorCells(game.locations,location,facing).map(({location:cell,depth,lateral})=>{
    const hash=Math.abs(cell.x*73+cell.y*139+17);
    const explicit=cell.sceneryAssetId ? pack?.discoveredAssets?.find((asset)=>asset.id===cell.sceneryAssetId) : undefined;
    // Keep the player's own center clear. Plants can still obscure other cells,
    // but movement remains determined solely by authored cardinal exits.
    if(depth===0 && lateral===0 && !explicit) return null;
    const family=hash%5;
    const asset=explicit ?? (family<=1 ? alisPreview(pack,"PLAINE1",depth)
      : family===2 ? alisPreview(pack,"FORET1",8+depth)
      : alisPreview(pack,"ARBO",69+depth));
    if(!asset) return null;
    const scale=[2.05,1.6,1.2,.9][depth]!;
    const width=Math.min(540,(asset.width??48)*scale);
    const height=Math.min(350,(asset.height??48)*scale);
    const spacing=[198,137,89,55][depth]!;
    const jitter=((hash%7)-3)*[9,6,4,2][depth]!;
    const center=320+lateral*spacing+jitter;
    const foot=[387,327,278,250][depth]!;
    return <image key={`swamp-${cell.id}`} className="asset-layer" data-source={asset.path}
      href={asset.url} x={center-width/2} y={foot-height} width={width} height={height} preserveAspectRatio="none"/>;
  });
  return <g className="outdoor-scene swamp-scene">
    <rect width="640" height="250" fill="#748575"/>
    {sky && <image href={sky.url} data-source={sky.path} x="0" y="0" width="640" height="255" preserveAspectRatio="none"/>}
    <path d="M0 229 Q80 210 160 225 T320 218 T480 228 T640 214 V265 H0Z" fill="#36483b" opacity=".65"/>
    <rect y="238" width="640" height="162" fill="#4c4b34"/>
    {ground && <image href={ground.url} data-source={ground.path} x="0" y="263" width="640" height="137" preserveAspectRatio="none" opacity=".72"/>}
    {vegetation}
    {grassEdge && <image href={grassEdge.url} data-source={grassEdge.path} x="0" y="371" width="640" height="29" preserveAspectRatio="none" opacity=".8"/>}
  </g>;
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
  if(asset.entry.renderMode!=="texture") {
    if(role!=="surface.floor" && role!=="surface.ceiling") return renderAsset(pack,role,depth,tilesetId);
    const clipId=`surface-${asset.entry.id}-${depth}-${role}`;
    return <g><defs><clipPath id={clipId}><polygon points={points(polygon)}/></clipPath></defs>
      <g clipPath={`url(#${clipId})`}>{renderAsset(pack,role,depth,tilesetId)}</g></g>;
  }
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

function renderSidePassage(
  pack: LoadedAssetPack | null,
  depth: DungeonAssetDepth,
  side: "left" | "right",
  tilesetId: string | undefined,
  outer: {l:number;t:number;r:number;b:number},
  inner: {l:number;t:number;r:number;b:number},
  continues: boolean,
) {
  const near=side==="left" ? outer.l+10 : outer.r-10;
  const far=side==="left" ? inner.l-8 : inner.r+8;
  const topNear=outer.t+40, topFar=inner.t+25;
  const bottomNear=outer.b-40, bottomFar=inner.b-25;
  const shape=[[near,topNear],[far,topFar],[far,bottomFar],[near,bottomNear]];
  const clipId=`side-passage-${side}-${depth}`;
  // A branch that continues around the corner must not read as a wall or
  // closed leaf flush with the doorway. Keep the imported arch above a
  // recessed, depth-matched wall and let the main floor show below its sill.
  const back=assetFor(pack,"wall.front",Math.min(depth+(continues ? 2 : 1),3) as DungeonAssetDepth,tilesetId);
  const backWidth=back && pack ? (back.entry.width ?? pack.manifest.viewport.width)*640/pack.manifest.viewport.width : 0;
  const backHeight=back && pack ? (back.entry.height ?? pack.manifest.viewport.height)*400/pack.manifest.viewport.height : 0;
  const backX=continues
    ? side==="left" ? near-backWidth*.4 : near-backWidth*.6
    : side==="left" ? near-backWidth : far;
  return <g className="side-passage">
    <defs><clipPath id={clipId}><polygon points={points(shape)}/></clipPath></defs>
    <g clipPath={`url(#${clipId})`}>
      {continues && <polygon points={points([[near,topNear],[far,topFar],[far,bottomFar-28],[near,bottomNear-28]])} fill="#17110c"/>}
      {back && <image href={back.url} x={backX} y={continues ? topFar+18 : 0} width={backWidth} height={backHeight} preserveAspectRatio="none" opacity={continues ? .7 : .82}/>}
    </g>
  </g>;
}

function renderRoomOpeningArt(pack:LoadedAssetPack|null,depth:DungeonAssetDepth,side:"left"|"right",tilesetId:string|undefined,outer:{l:number;t:number;r:number;b:number},inner:{l:number;t:number;r:number;b:number}){
  const asset=assetFor(pack,`opening.${side}`,depth,tilesetId);
  if(!asset) return null;
  const x=side==="left" ? outer.l : inner.r;
  const width=side==="left" ? inner.l-outer.l : outer.r-inner.r;
  return <image className="asset-layer room-opening-art" href={asset.url} x={x} y={outer.t} width={width} height={outer.b-outer.t} preserveAspectRatio="none"/>;
}

function renderRoomFrontArch(pack:LoadedAssetPack|null,depth:DungeonAssetDepth,tilesetId:string|undefined,inner:{l:number;t:number;r:number;b:number}){
  const asset=assetFor(pack,"door.front.open",depth,tilesetId);
  return asset ? <image className="asset-layer room-front-arch" href={asset.url} x={inner.l} y={inner.t} width={inner.r-inner.l} height={inner.b-inner.t} preserveAspectRatio="none"/> : null;
}

function renderRoomWall(
  pack: LoadedAssetPack | null,
  polygon: number[][],
  depth: DungeonAssetDepth,
  tilesetId: string | undefined,
  part: string,
) {
  const wall=assetFor(pack,"wall.front",depth,tilesetId);
  if(!wall) return null;
  const xs=polygon.map(point=>point[0]!);
  const ys=polygon.map(point=>point[1]!);
  const x=Math.min(...xs), y=Math.min(...ys);
  const clipId=`room-wall-${part}-${depth}`;
  return <g>
    <defs><clipPath id={clipId}><polygon points={points(polygon)}/></clipPath></defs>
    <image href={wall.url} x={x} y={y} width={Math.max(...xs)-x} height={Math.max(...ys)-y} preserveAspectRatio="none" clipPath={`url(#${clipId})`}/>
  </g>;
}

function renderRoomPerimeterSide(
  pack:LoadedAssetPack|null,
  side:"left"|"right",
  depth:DungeonAssetDepth,
  tilesetId:string|undefined,
  outer:{l:number;t:number;r:number;b:number},
  inner:{l:number;t:number;r:number;b:number},
  offset:number,
) {
  const near=side==="left" ? outer.l-offset*(outer.r-outer.l) : outer.r+offset*(outer.r-outer.l);
  const far=side==="left" ? inner.l-offset*(inner.r-inner.l) : inner.r+offset*(inner.r-inner.l);
  const shape=side==="left"
    ? [[near,outer.t],[far,inner.t],[far,inner.b],[near,outer.b]]
    : [[far,inner.t],[near,outer.t],[near,outer.b],[far,inner.b]];
  const asset=assetFor(pack,`wall.${side}`,depth,tilesetId);
  const scaleY=pack ? 400/pack.manifest.viewport.height : 1;
  return <g className={`room-perimeter-wall ${side}`}>
    <polygon points={points(shape)} fill="url(#fallback-wall-pattern)"/>
    {asset && <image className="asset-layer" href={asset.url} x={Math.min(near,far)} y={(asset.entry.y??0)*scaleY}
      width={Math.abs(far-near)} height={(asset.entry.height??pack!.manifest.viewport.height)*scaleY}
      opacity={asset.entry.opacity??1} preserveAspectRatio="none"/>}
  </g>;
}

function renderRoomLateralFront(
  pack:LoadedAssetPack|null,side:"left"|"right",offset:number,depth:DungeonAssetDepth,
  tilesetId:string|undefined,inner:{l:number;t:number;r:number;b:number},
) {
  const dx=(side==="left" ? -1 : 1)*offset*(inner.r-inner.l);
  const rect={x:inner.l,y:inner.t,width:inner.r-inner.l,height:inner.b-inner.t};
  return <g key={`room-front-${side}-${depth}-${offset}`} className="room-perimeter-front" transform={`translate(${dx} 0)`}>
    <rect {...rect} fill="url(#fallback-wall-pattern)"/>
    {renderRectAsset(pack,"wall.front",rect,depth,tilesetId)}
  </g>;
}

function FallbackDoor({x,y,width,height,grille}: {x:number;y:number;width:number;height:number;grille:boolean}) {
  // The original closed leaves have not been recovered from the ALIS resources.
  // These two silhouettes follow the visible DJ1/DJ2 playthrough references only.
  const arch=Math.min(height*0.19,width*0.28);
  const outline=`M ${x} ${y+height} V ${y+arch} Q ${x+width/2} ${y-arch*0.55} ${x+width} ${y+arch} V ${y+height} Z`;
  const clipId=`fallback-door-${grille?"grille":"planks"}-${Math.round(width)}-${Math.round(height)}`;
  return <g className="fallback-door">
    <defs><clipPath id={clipId}><path d={outline}/></clipPath></defs>
    <g clipPath={`url(#${clipId})`}>
      <rect x={x} y={y} width={width} height={height} fill="#100c09"/>
      {grille ? <>
        {Array.from({length:9},(_,i)=> <rect key={`v-${i}`} x={x+width*(i+0.45)/9} y={y} width={Math.max(2,width*0.045)} height={height} fill="#493326" stroke="#1b130f" strokeWidth="1"/>)}
        {[0.23,0.48,0.73].map((f)=><rect key={`h-${f}`} x={x} y={y+height*f} width={width} height={Math.max(3,height*0.045)} fill="#4d3526" stroke="#1b130f" strokeWidth="1"/>)}
      </> : <>
        {Array.from({length:9},(_,i)=> <g key={i}>
          <rect x={x+width*i/9+1} y={y} width={Math.max(1,width/9-2)} height={height} fill={i%2 ? "#3a2313" : "#52331c"}/>
          <path d={`M ${x+width*i/9+3} ${y} V ${y+height}`} stroke="#8d6238" strokeWidth="1" opacity=".7"/>
        </g>)}
        {[0.36,0.72].map((f)=><rect key={f} x={x} y={y+height*f} width={width} height={Math.max(2,height*0.024)} fill="#26180e" opacity=".8"/>)}
        <path d={`M ${x+width/2} ${y} V ${y+height}`} stroke="#120c08" strokeWidth="3"/>
      </>}
    </g>
    <path d={outline} fill="none" stroke="#24170e" strokeWidth="2"/>
  </g>;
}

export function DungeonViewport({ game, location, facing, encounter, encounterDone, collectedItemIds, pack, openDoors }: {
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
  const levelTilesetId=(room:AuthoredLocation)=>room.tilesetId || game.levels.find((level)=>level.id===(room.levelId || "level-1"))?.tilesetId;
  const locationTilesetId=levelTilesetId(location);
  const sceneTileset=pack?.manifest.tilesets.find(t=>t.id===locationTilesetId)
    ?? pack?.manifest.tilesets.find(t=>t.id===pack.manifest.defaultTilesetId);
  const currentLevel=game.levels.find((level)=>level.id===(location.levelId || "level-1"));
  const sceneKind=location.sceneKind || (currentLevel?.kind==="outdoor" ? "outdoor" : currentLevel?.kind==="house" ? "room" : "corridor");
  const outdoor=sceneKind==="outdoor";
  const roomScene=sceneKind==="room";
  const nativeScene=!outdoor && usesNativeDungeonProjection(pack?.sceneLayoutVersion,sceneTileset?.id);
  const frames=nativeScene ? DUNGEON_NATIVE_FRAMES : roomScene ? DUNGEON_ROOM_FRAMES : FRAMES;
  const segments: React.ReactNode[] = [];
  const itemLayers: React.ReactNode[] = [];
  let cell: AuthoredLocation | undefined = {...location,tilesetId:locationTilesetId};

  for (let depth = 0; depth < 4 && cell && !outdoor; depth++) {
    const outer = frames[depth]!;
    const inner = frames[depth + 1]!;
    const leftDirection=turnLeft(facing);
    const rightDirection=turnRight(facing);
    const leftTarget=canTravel(game.locations,cell,leftDirection);
    const rightTarget=canTravel(game.locations,cell,rightDirection);
    const leftOpen=!!leftTarget;
    const rightOpen=!!rightTarget;
    const leftContinues=!!leftTarget && !!canTravel(game.locations,leftTarget,leftDirection);
    const rightContinues=!!rightTarget && !!canTravel(game.locations,rightTarget,rightDirection);
    const roomEdges=roomViewEdges(game.locations,cell,facing,game.doors);
    const leftRoomOpen=roomEdges.leftInterior;
    const rightRoomOpen=roomEdges.rightInterior;
    const leftRoomBoundary=!!leftTarget && (cell.sceneKind==="room" || leftTarget.sceneKind==="room")
      && !roomsShareOpenSurface(cell,leftTarget,game.doors);
    const rightRoomBoundary=!!rightTarget && (cell.sceneKind==="room" || rightTarget.sceneKind==="room")
      && !roomsShareOpenSurface(cell,rightTarget,game.doors);
    const leftOpeningRole: DungeonAssetRole=leftRoomBoundary && assetFor(pack,"opening.room.left",depth as DungeonAssetDepth,cell.tilesetId)
      ? "opening.room.left" : "opening.left";
    const rightOpeningRole: DungeonAssetRole=rightRoomBoundary && assetFor(pack,"opening.room.right",depth as DungeonAssetDepth,cell.tilesetId)
      ? "opening.room.right" : "opening.right";
    const forward = canTravel(game.locations, cell, facing);
    const cellTilesetId=cell.tilesetId;
    const roomBoundary=!!forward && (cell.sceneKind==="room" || forward.sceneKind==="room")
      && !roomsShareOpenSurface(cell,forward,game.doors);
    const forwardDoor = forward ? doorBetween(game.doors, cell, forward) : undefined;
    const forwardDoorOpen = !forwardDoor || openDoors.includes(forwardDoor.id);

    if(depth<=2){
      const visibleItemId=cell.itemIds.find((id)=>!collectedItemIds.includes(id));
      const visibleItem=visibleItemId ? game.items.find((item)=>item.id===visibleItemId) : undefined;
      const assetId=semanticItemAssetId(pack,visibleItem,depth);
      const layer=renderDiscoveredItemAtDepth(pack,assetId,depth);
      if(layer) itemLayers.unshift(layer);
    }

    segments.unshift(
      <g key={`segment-${depth}`} className={`dungeon-depth depth-${depth}`}>
        <polygon className="dungeon-ceiling" fill="url(#fallback-ceiling-pattern)" points={points([[outer.l,outer.t],[outer.r,outer.t],[inner.r,inner.t],[inner.l,inner.t]])}/>
        {!nativeScene && <polygon className="dungeon-floor" fill="url(#fallback-floor-pattern)" points={points([[outer.l,outer.b],[inner.l,inner.b],[inner.r,inner.b],[outer.r,outer.b]])}/>}
        {!leftRoomOpen && <polygon className="dungeon-wall side-left" fill="url(#fallback-wall-pattern)" points={points([[outer.l,outer.t],[inner.l,inner.t],[inner.l,inner.b],[outer.l,outer.b]])}/>}
        {!rightRoomOpen && <polygon className="dungeon-wall side-right" fill="url(#fallback-wall-pattern)" points={points([[inner.r,inner.t],[outer.r,outer.t],[outer.r,outer.b],[inner.r,inner.b]])}/>}
        {!forward && <>
          <rect className="dungeon-back-wall" fill="url(#fallback-wall-pattern)" x={inner.l} y={inner.t} width={inner.r-inner.l} height={inner.b-inner.t}/>
          <line className="dungeon-mortar" x1={inner.l} y1={(inner.t+inner.b)/2} x2={inner.r} y2={(inner.t+inner.b)/2}/>
          <line className="dungeon-mortar" x1={(inner.l+inner.r)/2} y1={inner.t} x2={(inner.l+inner.r)/2} y2={inner.b}/>
        </>}
        {renderDiscoveredTexture(pack, cell.ceilingAssetId, {kind:"polygon",points:[[outer.l,outer.t],[outer.r,outer.t],[inner.r,inner.t],[inner.l,inner.t]]}, depth as DungeonAssetDepth, "ceiling") ?? renderPolygonAsset(pack, "surface.ceiling", [[outer.l,outer.t],[outer.r,outer.t],[inner.r,inner.t],[inner.l,inner.t]], depth as DungeonAssetDepth, cell.tilesetId)}
        {renderDiscoveredTexture(pack, cell.floorAssetId, {kind:"polygon",points:[[outer.l,outer.b],[inner.l,inner.b],[inner.r,inner.b],[outer.r,outer.b]]}, depth as DungeonAssetDepth, "floor") ?? (!nativeScene && renderPolygonAsset(pack, "surface.floor", [[outer.l,outer.b],[inner.l,inner.b],[inner.r,inner.b],[outer.r,outer.b]], depth as DungeonAssetDepth, cell.tilesetId))}
        {nativeScene && roomEdges.leftInterior && renderRoomPerimeterSide(pack,"left",depth as DungeonAssetDepth,cell.tilesetId,outer,inner,roomEdges.leftPerimeterOffset)}
        {nativeScene && roomEdges.rightInterior && renderRoomPerimeterSide(pack,"right",depth as DungeonAssetDepth,cell.tilesetId,outer,inner,roomEdges.rightPerimeterOffset)}
        {nativeScene && roomEdges.leftFrontWalls.map((offset)=>renderRoomLateralFront(pack,"left",offset,depth as DungeonAssetDepth,cellTilesetId,inner))}
        {nativeScene && roomEdges.rightFrontWalls.map((offset)=>renderRoomLateralFront(pack,"right",offset,depth as DungeonAssetDepth,cellTilesetId,inner))}
        {!leftRoomOpen && (renderDiscoveredTexture(pack, cell.wallAssetId, {kind:"polygon",points:[[outer.l,outer.t],[inner.l,inner.t],[inner.l,inner.b],[outer.l,outer.b]]}, depth as DungeonAssetDepth, "wall-left") ?? (roomScene && !nativeScene ? renderRoomWall(pack,[[outer.l,outer.t],[inner.l,inner.t],[inner.l,inner.b],[outer.l,outer.b]],depth as DungeonAssetDepth,cell.tilesetId,"left") : renderPolygonAsset(pack, "wall.left", [[outer.l,outer.t],[inner.l,inner.t],[inner.l,inner.b],[outer.l,outer.b]], depth as DungeonAssetDepth, cell.tilesetId)))}
        {!rightRoomOpen && (renderDiscoveredTexture(pack, cell.wallAssetId, {kind:"polygon",points:[[inner.r,inner.t],[outer.r,outer.t],[outer.r,outer.b],[inner.r,inner.b]]}, depth as DungeonAssetDepth, "wall-right") ?? (roomScene && !nativeScene ? renderRoomWall(pack,[[inner.r,inner.t],[outer.r,outer.t],[outer.r,outer.b],[inner.r,inner.b]],depth as DungeonAssetDepth,cell.tilesetId,"right") : renderPolygonAsset(pack, "wall.right", [[inner.r,inner.t],[outer.r,outer.t],[outer.r,outer.b],[inner.r,inner.b]], depth as DungeonAssetDepth, cell.tilesetId)))}
        {/* The branch backing belongs behind the transparent stone arch, not over it. */}
        {leftOpen && !leftRoomOpen && renderSidePassage(pack,depth as DungeonAssetDepth,"left",cell.tilesetId,outer,inner,leftContinues)}
        {rightOpen && !rightRoomOpen && renderSidePassage(pack,depth as DungeonAssetDepth,"right",cell.tilesetId,outer,inner,rightContinues)}
        {leftOpen && !leftRoomOpen && (roomScene && !nativeScene ? renderRoomOpeningArt(pack,depth as DungeonAssetDepth,"left",cell.tilesetId,outer,inner) : renderAsset(pack,leftOpeningRole,depth as DungeonAssetDepth,cell.tilesetId))}
        {rightOpen && !rightRoomOpen && (roomScene && !nativeScene ? renderRoomOpeningArt(pack,depth as DungeonAssetDepth,"right",cell.tilesetId,outer,inner) : renderAsset(pack,rightOpeningRole,depth as DungeonAssetDepth,cell.tilesetId))}
        {!forward && (renderDiscoveredTexture(pack, cell.wallAssetId, {kind:"rect",x:inner.l,y:inner.t,width:inner.r-inner.l,height:inner.b-inner.t}, depth as DungeonAssetDepth, "wall-front") ?? (roomScene && !nativeScene ? renderRoomWall(pack,[[inner.l,inner.t],[inner.r,inner.t],[inner.r,inner.b],[inner.l,inner.b]],depth as DungeonAssetDepth,cell.tilesetId,"front") : renderRectAsset(pack, "wall.front", {x:inner.l,y:inner.t,width:inner.r-inner.l,height:inner.b-inner.t}, depth as DungeonAssetDepth, cell.tilesetId)))}
        {forwardDoor && !forwardDoorOpen && renderRectAsset(pack, "door.front.closed", {x:inner.l+12,y:inner.t+4,width:Math.max(20,inner.r-inner.l-24),height:Math.max(30,inner.b-inner.t-8)}, depth as DungeonAssetDepth, cell.tilesetId, forwardDoor.id)}
        {forwardDoor && !forwardDoorOpen && !assetFor(pack, "door.front.closed", depth as DungeonAssetDepth, cell.tilesetId, forwardDoor.id) &&
          <FallbackDoor x={inner.l+12} y={inner.t+4} width={Math.max(20,inner.r-inner.l-24)} height={Math.max(30,inner.b-inner.t-8)} grille={sceneTileset?.id==="ishar2-dj2"}/>}
        {roomBoundary && (nativeScene ? renderAsset(pack,"door.front.open",depth as DungeonAssetDepth,cell.tilesetId) : renderRoomFrontArch(pack,depth as DungeonAssetDepth,cell.tilesetId,inner))}
        {forwardDoor && !roomBoundary && (roomScene && !nativeScene ? renderRoomFrontArch(pack,depth as DungeonAssetDepth,cell.tilesetId,inner) : renderAsset(pack,"door.front.open",depth as DungeonAssetDepth,cell.tilesetId,forwardDoor.id))}
      </g>
    );

    if (!forward || !forwardDoorOpen) break;
    cell = {...forward,tilesetId:levelTilesetId(forward)};
  }

  const encounterLayer = encounter && !encounterDone ? renderAsset(pack, "encounter", undefined, locationTilesetId, encounter.id) : null;
  const currentItemId=location.itemIds.find((id)=>!collectedItemIds.includes(id));
  const currentItem=currentItemId ? game.items.find((item)=>item.id===currentItemId) : undefined;
  const currentItemAssetId=semanticItemAssetId(pack,currentItem,0);
  const genericCurrentItemLayer=!currentItemAssetId && currentItemId
    ? renderAsset(pack, "item", undefined, locationTilesetId, currentItemId)
    : null;

  return <div className={`dungeon-viewport ${outdoor ? "outdoor-viewport" : roomScene ? "room-viewport" : ""}`} style={{aspectRatio:String(viewportAspect)}} data-render-profile={renderProfile.id} data-scene-layout-version={pack?.sceneLayoutVersion}>
    <svg viewBox="0 0 640 400" preserveAspectRatio="none" aria-label={`Blick nach ${DIRECTION_LABELS[facing]}`}>
      <defs>
        <linearGradient id="outdoor-sky" x2="0" y2="1"><stop stopColor="#24466d"/><stop offset="1" stopColor="#8f9b91"/></linearGradient>
        <linearGradient id="outdoor-ground" x2="0" y2="1"><stop stopColor="#666045"/><stop offset="1" stopColor="#2c271b"/></linearGradient>
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
      {outdoor && currentLevel?.biome==="swamp" ? renderSwampScene(game,location,facing,pack) : outdoor ? <g className="outdoor-scene">
        <rect width="640" height="220" fill="url(#outdoor-sky)"/>
        <path d="M0 225 L60 193 L112 207 L180 181 L240 211 L330 188 L420 212 L492 184 L570 207 L640 190 V280 H0Z" fill="#4c5a51"/>
        <rect y="220" width="640" height="180" fill="url(#outdoor-ground)"/>
        {renderDiscoveredTexture(pack,location.floorAssetId,{kind:"rect",x:0,y:220,width:640,height:180},0,"outdoor-ground")}
        {renderDiscoveredLayer(pack,location.sceneryAssetId,{x:64,y:18,width:512,height:360})}
      </g> : renderAsset(pack, "viewport.background", undefined, locationTilesetId)}
      {nativeScene && renderAsset(pack,"surface.ceiling",undefined,locationTilesetId)}
      {nativeScene && renderAsset(pack,"surface.floor",undefined,locationTilesetId)}
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
  const locations=game.locations.filter((room)=>(room.levelId || "level-1")===(location.levelId || "level-1"));
  const xs=locations.map((room)=>room.x);
  const ys=locations.map((room)=>room.y);
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
    {locations.flatMap((room)=>room.exits.map((id)=>{
      const target=game.locations.find((candidate)=>candidate.id===id);
      if(!target || room.id>target.id) return null;
      const a=point(room), b=point(target);
      return <line key={`${room.id}-${id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="minimap-link"/>;
    }))}
    {locations.map((room)=>{
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
  const originalHudSprite=(entryIndex:number)=>pack?.discoveredAssets?.find((asset)=>
    new RegExp(`(?:^|/)FRISE\\.IO · ALIS #${entryIndex}$`,"i").test(asset.path)
  )?.url;
  const originalActionBar=originalHudSprite(36);
  const originalLifeBar=originalHudSprite(1);
  const game = project.game;
  const hero = game.characters[0];
  const problems = validateGame(game);
  const [locationId, setLocationId] = useState(game.startLocationId);
  const [facing, setFacing] = useState<Direction>(game.startFacing);
  const [partyHp,setPartyHp]=useState<Record<string,number>>(()=>Object.fromEntries(game.characters.map((member)=>[member.id,member.hp])));
  const [enemyHp, setEnemyHp] = useState<Record<string, number>>({});
  const [completedEncounters, setCompletedEncounters] = useState<string[]>([]);
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [inventory, setInventory] = useState<string[]>([]);
  const [selectedItemId,setSelectedItemId]=useState<string|null>(null);
  const [openDoors, setOpenDoors] = useState<string[]>(game.doors.filter((door)=>door.initiallyOpen).map((door)=>door.id));
  const [log, setLog] = useState<string[]>(["Du betrittst den Dungeon."]);
  const [selectedPartyIndex,setSelectedPartyIndex]=useState(0);
  const [hudPanel,setHudPanel]=useState<"actions"|"character"|"inventory"|"map"|"quest"|null>(null);

  // The persisted project hydrates after the route's initial render. Keep the
  // authored entrance and party in sync without restarting ordinary movement.
  useEffect(()=>{setLocationId(game.startLocationId);setFacing(game.startFacing);},[game.startLocationId,game.startFacing]);
  useEffect(()=>{
    setPartyHp(Object.fromEntries(game.characters.map((member)=>[member.id,member.hp])));
    setSelectedPartyIndex((index)=>Math.min(index,Math.max(0,game.characters.length-1)));
  },[game.characters]);
  useEffect(()=>{setOpenDoors(game.doors.filter((door)=>door.initiallyOpen).map((door)=>door.id));},[game.doors]);

  const location = useMemo(() => game.locations.find((x) => x.id === locationId), [game.locations, locationId]);
  const encounter = location?.encounterId ? game.encounters.find((x) => x.id === location.encounterId) : undefined;
  const encounterDone = encounter ? completedEncounters.includes(encounter.id) : true;
  const currentEnemyHp = encounter ? (enemyHp[encounter.id] ?? encounter.enemyHp) : 0;
  const defeated = game.characters.every((member)=>(partyHp[member.id] ?? member.hp)<=0);
  const won = !!location?.ending && !defeated && encounterDone;
  const visibleItemIds = location?.itemIds.filter((id) => !inventory.includes(id)) ?? [];
  const level=game.levels.find((entry)=>entry.id===(location?.levelId || "level-1"));
  const portalsHere=game.portals.filter((portal)=>portal.fromLocationId===locationId || portal.toLocationId===locationId);
  const facingTarget = location ? canTravel(game.locations, location, facing) : undefined;
  const facingDoor = location && facingTarget ? doorBetween(game.doors, location, facingTarget) : undefined;
  const facingDoorClosed = !!facingDoor && !openDoors.includes(facingDoor.id);

  function reset() {
    setLocationId(game.startLocationId);
    setFacing(game.startFacing);
    setPartyHp(Object.fromEntries(game.characters.map((member)=>[member.id,member.hp])));
    setEnemyHp({});
    setCompletedEncounters([]);
    setCompletedQuests([]);
    setInventory([]);
    setSelectedItemId(null);
    setOpenDoors(game.doors.filter((door)=>door.initiallyOpen).map((door)=>door.id));
    setLog(["Dungeon neu betreten."]);
    setSelectedPartyIndex(0);
    setHudPanel(null);
  }

  function attack() {
    if (!hero || !encounter || encounterDone || defeated) return;
    const attacker=game.characters[selectedPartyIndex] ?? hero;
    if((partyHp[attacker.id] ?? attacker.hp)<=0) return;
    const nextEnemy = Math.max(0, currentEnemyHp - attacker.attack);
    if (nextEnemy === 0) {
      setEnemyHp((x)=>({...x,[encounter.id]:0}));
      setCompletedEncounters((x)=>[...x,encounter.id]);
      if (encounter.questId && !completedQuests.includes(encounter.questId)) setCompletedQuests((x)=>[...x,encounter.questId!]);
      setLog((x)=>[encounter.victoryText, ...x]);
      return;
    }
    const nextAttacker = Math.max(0, (partyHp[attacker.id] ?? attacker.hp) - encounter.enemyAttack);
    setEnemyHp((x)=>({...x,[encounter.id]:nextEnemy}));
    setPartyHp((current)=>({...current,[attacker.id]:nextAttacker}));
    setLog((x)=>[`${attacker.name} trifft für ${attacker.attack}. ${encounter.name} trifft für ${encounter.enemyAttack}.`, ...x]);
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
    setSelectedItemId(id);
    setLog((x)=>[`${item?.name ?? id} aufgenommen.`, ...x]);
  }

  function usePortal(id:string){
    if(defeated || !encounterDone) return;
    const portal=game.portals.find((entry)=>entry.id===id);
    if(!portal) return;
    const targetId=portal.fromLocationId===locationId ? portal.toLocationId : portal.fromLocationId;
    const target=game.locations.find((entry)=>entry.id===targetId);
    if(!target) return;
    setLocationId(target.id);
    setLog((entries)=>[`Levelwechsel: ${target.name}.`,...entries]);
    setHudPanel(null);
  }

  function toggleHud(panel:NonNullable<typeof hudPanel>){setHudPanel((current)=>current===panel ? null : panel);}

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
          <div className="ishar-location-plaque"><small>{level?.name ?? "Dungeon"}</small>{location.name}</div>
          <nav className="ishar-hud-nav" aria-label="Spielmenü">
            <button aria-pressed={hudPanel==="actions"} onClick={()=>toggleHud("actions")}>Aktionen</button>
            <button aria-pressed={hudPanel==="character"} onClick={()=>toggleHud("character")}>Figur</button>
            <button aria-pressed={hudPanel==="inventory"} onClick={()=>toggleHud("inventory")}>Inventar {inventory.length ? `(${inventory.length})` : ""}</button>
            <button aria-pressed={hudPanel==="map"} onClick={()=>toggleHud("map")}>Karte</button>
            <button aria-pressed={hudPanel==="quest"} onClick={()=>toggleHud("quest")}>Aufträge</button>
          </nav>
          {hudPanel && <section className="ishar-hud-panel" aria-label="Spielmenü-Inhalt">
            <button className="ishar-hud-close" onClick={()=>setHudPanel(null)} aria-label="Menü schließen">×</button>
            {hudPanel==="actions" && <><h3>Aktionen · {game.characters[selectedPartyIndex]?.name ?? hero.name}</h3><div className="ishar-hud-actions"><button onClick={attack} disabled={!encounter || encounterDone || defeated || (partyHp[game.characters[selectedPartyIndex]?.id ?? hero.id] ?? 0)<=0}>Angreifen</button><button onClick={openFacingDoor} disabled={!facingDoorClosed || defeated}>Tür öffnen</button>{visibleItemIds.map((id)=><button key={id} onClick={()=>takeItem(id)}>{game.items.find((item)=>item.id===id)?.name ?? id} aufnehmen</button>)}{portalsHere.map((portal)=><button key={portal.id} onClick={()=>usePortal(portal.id)} disabled={defeated || !encounterDone}>{portal.label}</button>)}</div></>}
            {hudPanel==="character" && <><h3>{game.characters[selectedPartyIndex]?.name ?? hero.name}</h3><p>Leben: {partyHp[game.characters[selectedPartyIndex]?.id ?? hero.id] ?? 0}/{game.characters[selectedPartyIndex]?.hp ?? hero.hp} · Angriff: {game.characters[selectedPartyIndex]?.attack ?? hero.attack}</p></>}
            {hudPanel==="inventory" && <><h3>Inventar</h3>{inventory.length ? <><div className="ishar-inventory-list">{inventory.map((id)=><button key={id} aria-pressed={selectedItemId===id} onClick={()=>setSelectedItemId(id)}>{game.items.find((item)=>item.id===id)?.name ?? id}</button>)}</div>{selectedItemId && inventory.includes(selectedItemId) && <div className="ishar-inventory-detail"><strong>{game.items.find((item)=>item.id===selectedItemId)?.name ?? selectedItemId}</strong><p>{game.items.find((item)=>item.id===selectedItemId)?.description || "Keine Beschreibung."}</p>{facingDoorClosed && facingDoor?.keyItemId===selectedItemId && <button onClick={openFacingDoor}>Schlüssel an Tür verwenden</button>}</div>}</> : <p>Noch keine Gegenstände.</p>}</>}
            {hudPanel==="map" && <><h3>{level?.name ?? "Karte"}</h3><DungeonMiniMap game={game} location={location} facing={facing}/></>}
            {hudPanel==="quest" && <><h3>Aufträge</h3>{game.quests.map((quest)=><p key={quest.id}><strong>{quest.title}</strong> · {completedQuests.includes(quest.id) ? quest.completedText : quest.objective}</p>)}</>}
          </section>}
          <div className="ishar-dpad" aria-label="Dungeon-Steuerung">
            <span/>
            <button onClick={()=>step(facing)} disabled={!encounterDone || defeated} aria-label="Vorwärts">▲</button>
            <span/>
            <button onClick={()=>setFacing(turnLeft(facing))} aria-label="Links drehen">◀</button>
            <button className="dpad-center" onClick={()=>step(turnBack(facing))} disabled={!encounterDone || defeated} aria-label="Rückwärts">▼</button>
            <button onClick={()=>setFacing(turnRight(facing))} aria-label="Rechts drehen">▶</button>
          </div>
          <div className="ishar-context-buttons">
            {visibleItemIds.map((id)=><button key={id} onClick={()=>takeItem(id)} disabled={defeated}>{game.items.find((item)=>item.id===id)?.name ?? id} aufnehmen</button>)}
            {encounter && !encounterDone && !defeated && <button className="attack-button" onClick={attack} disabled={(partyHp[game.characters[selectedPartyIndex]?.id ?? hero.id] ?? 0)<=0}>⚔ Angriff <small>{currentEnemyHp}/{encounter.enemyHp}</small></button>}
            {facingDoorClosed && encounterDone && !defeated && <button className="door-button" onClick={openFacingDoor}>🚪 Öffnen<small>{facingDoor?.keyItemId ? "Schlüssel" : "Tür"}</small></button>}
            {portalsHere.map((portal)=>{const target=game.locations.find((entry)=>entry.id===(portal.fromLocationId===locationId ? portal.toLocationId : portal.fromLocationId));return <button key={portal.id} onClick={()=>usePortal(portal.id)} disabled={defeated || !encounterDone}>↗ {target?.name ?? portal.label}</button>})}
          </div>
          <div className="ishar-compass">Blick: <strong>{DIRECTION_LABELS[facing]}</strong></div>
        </aside>
      </div>

      <div className="ishar-party-strip">
        {Array.from({length:5},(_,index)=>{
          const member=game.characters[index];
          const currentHp=member ? (partyHp[member.id] ?? member.hp) : 0;
          const maxHp=member?.hp ?? 1;
          const ratio=member ? Math.max(0,Math.min(100,Math.round(currentHp/maxHp*100))) : 0;
          return <article className={member ? `ishar-party-card ${selectedPartyIndex===index ? "selected" : ""}` : "ishar-party-card empty"} key={member?.id ?? `empty-${index}`}>
            <button className={`ishar-action-tab ${originalActionBar ? "original-hud-sprite" : ""}`} disabled={!member} aria-label={`${member?.name ?? `Slot ${index+1}`} Aktionen`} onClick={()=>{setSelectedPartyIndex(index);toggleHud("actions");}}>{originalActionBar ? <img src={originalActionBar} alt=""/> : member ? "ACTION" : "—"}</button>
            <button className="ishar-portrait" disabled={!member} aria-label={`${member?.name ?? `Slot ${index+1}`} ansehen`} onClick={()=>{setSelectedPartyIndex(index);toggleHud("character");}}>{member ? member.name.slice(0,1).toUpperCase() : ""}</button>
            <div className="ishar-party-name">{member?.name ?? `Slot ${index+1}`}</div>
            <div className={`ishar-life-row ${originalLifeBar ? "original-life-sprite" : ""}`}>{originalLifeBar ? <img src={originalLifeBar} alt="Leben"/> : <span>LIFE</span>}<div className="ishar-life-track"><i style={{width:`${ratio}%`}}/></div></div>
          </article>;
        })}
      </div>

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
