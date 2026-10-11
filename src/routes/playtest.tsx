import { compassOf } from "@/lib/ishar/grid-editor";
import { doorLeafKind, DUNGEON_FRAMES as FRAMES, DUNGEON_NATIVE_FRAMES, DUNGEON_ROOM_FRAMES, usesNativeDungeonProjection } from "@/lib/ishar/dungeon-scenes";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useEffect, useMemo, useState } from "react";
import { useKit } from "@/lib/store";
import { useAssetPack } from "@/lib/asset-store";
import { assetFor } from "@/lib/ishar/asset-pack";
import { adjacentLocation, canTravel, doorBetween, DIRECTION_LABELS, turnBack, turnLeft, turnRight } from "@/lib/ishar/dungeon";
import { roomViewEdges, roomsShareOpenSurface } from "@/lib/ishar/room-surfaces";
import { visibleOutdoorCells } from "@/lib/ishar/outdoor-view";
import { projectSwampFeature, swampFeatureForCell, swampGroundFeatureForCell, swampTreeAssetIndex, swampTreeDisplayHeight, swampWaterExtent } from "@/lib/ishar/swamp-view";
import { validateGame } from "@/lib/ishar/project-validation";
import { edgeViewGrid, expandGridLevels, gridCellOf, gridDoorId, gridDoorNumber, sceneTriggerAt, trapAt, trapDamage } from "@/lib/ishar/cont-grid";
import { gridViewSprites, sceneTypeAt, scriptAt, type GridScript, spriteTargetId, VIEW_CLIP, VIEW_ORIGIN } from "@/lib/ishar/grid-view";
import { outdoorView, isOutdoorMap } from "@/lib/ishar/outdoor-grid-view";
import { afterStep, newMechState, STEP_RESET_DOORS, type MechEvent, type MechState } from "@/lib/ishar/door-mechanics";
import type { IsharGrid, AuthoredDoor, AuthoredEncounter, AuthoredGame, AuthoredLocation, Direction, DungeonAssetDepth, DungeonAssetRole } from "@/lib/ishar/types";
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

function alisCompositePreview(pack:LoadedAssetPack|null,module:string,index:number) {
  return pack?.discoveredAssets?.find((asset)=>asset.assetKind==="composite" &&
    asset.path.toUpperCase().endsWith(`${module}.IO · ALIS #${index}`));
}

function renderSwampScene(game:AuthoredGame,location:AuthoredLocation,facing:Direction,pack:LoadedAssetPack|null) {
  const sky=alisPreview(pack,"FOND1",1);
  const water=alisPreview(pack,"FOND1",0);
  const grass=[92,93,94,95].map((index)=>alisPreview(pack,"PLAINE1",index));
  const visibleCells=visibleOutdoorCells(game.locations,location,facing);
  const levelCells=game.locations.filter((cell)=>(cell.levelId||"level-1")===(location.levelId||"level-1"));
  const lowGrowth=levelCells.flatMap((cell)=>{
    const feature=swampGroundFeatureForCell(cell);
    if(!feature) return [];
    const projection=projectSwampFeature(feature,location,facing);
    return projection ? [{cell,feature,projection}] : [];
  }).sort((a,b)=>b.projection.forwardDistance-a.projection.forwardDistance).map(({cell,projection})=>{
    const band=projection.distanceBand;
    const asset=alisCompositePreview(pack,"PLAINE1",[22,23,24,25][band]!);
    if(!asset) return null;
    const scale=[1,1.2,1.15,.9][band]!;
    const width=(asset.width??32)*scale;
    const height=(asset.height??16)*scale;
    const {center,foot}=projection;
    if(center+width/2<0 || center-width/2>640) return null;
    return <image key={`swamp-low-${cell.id}`} href={asset.url} data-source={asset.path} data-cell-id={`${cell.id}-ground`}
      x={center-width/2} y={foot-height} width={width} height={height} preserveAspectRatio="none"/>;
  });
  const vegetation=levelCells
    .flatMap((cell)=>{
    const feature=swampFeatureForCell(cell);
    if(!feature) return [];
    const projection=projectSwampFeature(feature,location,facing);
    return projection ? [{cell,feature,projection}] : [];
  }).sort((a,b)=>b.projection.forwardDistance-a.projection.forwardDistance).map(({cell,feature,projection})=>{
    const explicit=cell.sceneryAssetId ? pack?.discoveredAssets?.find((asset)=>asset.id===cell.sceneryAssetId) : undefined;
    const tree=!explicit && feature.kind==="tree";
    const band=projection.distanceBand;
    const forestIndex=swampTreeAssetIndex(feature.family,band);
    const plantIndex=[21,29,30,31][band]!;
    const asset=explicit ?? alisCompositePreview(pack,tree ? "FORET1" : "PLAINE1",tree ? forestIndex : plantIndex);
    if(!asset) return null;
    const scale=tree ? 1 : [1.2,1.35,1.55,1.75][band]!;
    const width=(asset.width??48)*scale*(tree ? 640/256 : 1);
    const {center,foot}=projection;
    const height=tree ? swampTreeDisplayHeight(asset.height??48,foot,band) : (asset.height??48)*scale;
    if(center+width/2<0 || center-width/2>640) return null;
    return <g key={`swamp-${cell.id}`}>
      <image className="asset-layer" data-source={asset.path} data-cell-id={cell.id} href={asset.url}
        x={center-width/2} y={foot-height} width={width} height={height} preserveAspectRatio="none"/>
    </g>;
  });
  const waterPlanes=visibleCells.filter(({location:cell})=>cell.outdoorSurface==="water").map(({location:cell,depth,lateral})=>{
    if(!water) return null;
    const {x,width,top,bottom}=swampWaterExtent(depth,lateral);
    const maskId=`swamp-water-${cell.id}`;
    const height=bottom-top;
    const waterSurface=<>
      <image href={water.url} data-source={water.path} x={x} y={top} width={width} height={height} preserveAspectRatio="none"/>
      <rect x={x} y={top} width={width} height={height} fill="#747d77" opacity=".4"/>
    </>;
    return <g key={maskId}>
      <defs>
        <linearGradient id={`${maskId}-fade`} gradientUnits="userSpaceOnUse" x1="0" y1={top} x2="0" y2={bottom}>
          <stop stopColor="white" stopOpacity="0"/><stop offset=".18" stopColor="white"/>
          <stop offset=".72" stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0"/>
        </linearGradient>
        <mask id={`${maskId}-depth`} maskUnits="userSpaceOnUse" x={x} y={top} width={width} height={height}>
          <rect x={x} y={top} width={width} height={height} fill={`url(#${maskId}-fade)`}/>
        </mask>
        {lateral!==0 && <>
          <linearGradient id={`${maskId}-side`} x1="0" x2="1">
            <stop stopColor="white" stopOpacity={lateral<0 ? 1 : 0}/>
            <stop offset={lateral<0 ? ".65" : ".35"} stopColor="white" stopOpacity={lateral<0 ? 1 : .9}/>
            <stop offset="1" stopColor="white" stopOpacity={lateral<0 ? 0 : 1}/>
          </linearGradient>
          <mask id={`${maskId}-lateral`} maskUnits="userSpaceOnUse" x={x} y={top} width={width} height={height}>
            <rect x={x} y={top} width={width} height={height} fill={`url(#${maskId}-side)`}/>
          </mask>
        </>}
      </defs>
      <g mask={`url(#${maskId}-depth)`}>{lateral===0 ? waterSurface : <g mask={`url(#${maskId}-lateral)`}>{waterSurface}</g>}</g>
    </g>;
  });
  const grassLayers=grass.map((asset,index)=>{
    if(!asset) return null;
    const layer=[{y:333,width:640,height:67,centers:[320]},
      {y:280,width:520,height:113,centers:[75,565]},
      {y:255,width:280,height:60,centers:[100,320,540]},
      {y:235,width:200,height:35,centers:[80,240,400,560]}][index]!;
    return layer.centers.map((center)=><image key={`swamp-grass-${index}-${center}`} href={asset.url} data-source={asset.path}
      x={center-layer.width/2} y={layer.y} width={layer.width} height={layer.height} preserveAspectRatio="none"/>);
  });
  return <g className="outdoor-scene swamp-scene">
    <defs>
      <linearGradient id="swamp-ground-tone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a9b485"/>
        <stop offset=".45" stopColor="#879560"/>
        <stop offset="1" stopColor="#3f4b2d"/>
      </linearGradient>
    </defs>
    <rect width="640" height="400" fill="#8d8e73"/>
    {sky && <image href={sky.url} data-source={sky.path} x="0" y="0" width="640" height="231" preserveAspectRatio="none"/>}
    <rect y="224" width="640" height="176" fill="url(#swamp-ground-tone)"/>
    {grassLayers}
    {waterPlanes}
    {lowGrowth}
    {vegetation}
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
  const hitWidth=Math.max(64,width+16);
  const hitHeight=Math.max(52,height+16);
  return <g key={"distance-item-"+assetId+"-"+depth}>
    {depth===0 && <rect x={320-hitWidth/2} y={y+height/2-hitHeight/2} width={hitWidth} height={hitHeight}
      fill="transparent" pointerEvents="all"/>}
    <image href={preview.url} x={x} y={y} width={width} height={height}
      preserveAspectRatio="xMidYMid meet" className={"asset-layer item-depth item-depth-"+depth}/>
  </g>;
}

function HeldGroundItemCursor({ item, pack, position }: {
  item: AuthoredGame["items"][number] | undefined;
  pack: LoadedAssetPack | null;
  position: { x: number; y: number };
}) {
  const [pointer,setPointer]=useState(position);
  const assetId=semanticItemAssetId(pack,item,0);
  const discovered=pack?.discoveredAssets?.find((asset)=>asset.id===assetId);
  const imageUrl=discovered?.url ?? assetFor(pack,"item",undefined,undefined,item?.id)?.url;

  useEffect(()=>{
    document.body.classList.add("holding-ground-item");
    const follow=(event:PointerEvent)=>setPointer({x:event.clientX,y:event.clientY});
    window.addEventListener("pointermove",follow);
    return ()=>{
      document.body.classList.remove("holding-ground-item");
      window.removeEventListener("pointermove",follow);
    };
  },[]);

  return <div className="held-ground-item" style={{left:pointer.x,top:pointer.y}} role="img" aria-label={`${item?.name ?? "Gegenstand"} in der Hand`}>
    {imageUrl ? <img src={imageUrl} alt=""/> : <span aria-hidden="true">◆</span>}
  </div>;
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

// Original PCAVE.IO leaves (plan v3 §5.3): closed #8+d wood / #12+d grate, depth<4 only.
function originalDoorLeaf(pack:LoadedAssetPack|null,door:AuthoredDoor,open:boolean,depth:DungeonAssetDepth,tilesetId:string|undefined){
  if(depth>3) return undefined;
  const kind=doorLeafKind(door.originalIndex,tilesetId);
  const role:DungeonAssetRole=open ? (kind==="wood" ? "door.leaf.open.wood" : "door.leaf.open.grate") : (kind==="wood" ? "door.leaf.closed.wood" : "door.leaf.closed.grate");
  const found=assetFor(pack,role,depth,tilesetId);
  return found && found.entry.role===role ? {role,found} : undefined;
}

function renderDoorLeaf(pack:LoadedAssetPack|null,door:AuthoredDoor,open:boolean,depth:DungeonAssetDepth,tilesetId:string|undefined){
  const leaf=originalDoorLeaf(pack,door,open,depth,tilesetId);
  return leaf ? renderAsset(pack,leaf.role,depth,tilesetId) : null;
}

/** r7/r8: original-faithful view for IsharGrid levels (DJ1/DJ2/DJCAT script reimplementation, grid-view.ts).
 *  Door state is the global table main 0x4aa4 (by door number, shared by all maps; render-runtime.md §6). */
function renderGridView(pack:LoadedAssetPack|null,grid:IsharGrid,levelId:string,r:number,c:number,facing:Direction,doorOpen:(n:number)=>boolean,sceneType?:number,lift?:{door:number;dy:number;doorId?:string},redraw=0,forcedScript?:GridScript,switchOn:(i:number)=>boolean=()=>false){
  const outdoor=isOutdoorMap(grid.mapNumber);
  const script=outdoor ? `map${grid.mapNumber}` as GridScript : forcedScript ?? scriptAt(grid,r,c,sceneType);
  const tilesetId=outdoor ? `ishar2-out${grid.mapNumber}` : script==="DJ2" ? "ishar2-dj2" : script==="DJCAT" ? "ishar2-djcat" : "ishar2-dj1";
  // r12: maps 1-4 use the original outdoor/town scripts (PLAINE1/ARBO/VHOUSE2/MONTAGNE + scene overlays).
  const sprites=outdoor ? outdoorView(grid,r,c,facing,{sceneType,redraw}).map((s)=>({...s,routine:s.r<0 ? "background" : s.script})) : gridViewSprites(grid,r,c,facing,script,doorOpen,switchOn,{sceneType:sceneTypeAt(grid,r,c,sceneType),
    doorLift:(n)=>lift && lift.door===n ? lift.dy : 0,backgroundMirror:redraw%2===1});
  const sx=pack ? 640/pack.manifest.viewport.width : 2.5, sy=pack ? 400/pack.manifest.viewport.height : 400/113;
  let background=false;
  const nodes=sprites.map((sprite,i)=>{
    const id=spriteTargetId(sprite.module,sprite.index,sprite.mirror);
    const asset=assetFor(pack,"scene.sprite",undefined,tilesetId,id);
    if(!asset || asset.entry.targetId!==id) return null;
    if(sprite.routine==="background") background=true;
    // known: screen x = 127 + x - (w-1)/2, y = 78 - z - (h-1)/2 (frame), window starts at frame y 13
    const x=(VIEW_ORIGIN.x+sprite.x+(asset.entry.x??0))*sx, y=(VIEW_ORIGIN.y-sprite.y+(asset.entry.y??0))*sy;
    return <image key={`grid-${i}`} className="asset-layer grid-sprite" data-source={asset.entry.file} data-routine={sprite.routine} data-cell={`${sprite.r}/${sprite.c}`}
      href={asset.url} x={x} y={y} width={(asset.entry.width??0)*sx} height={(asset.entry.height??0)*sy} preserveAspectRatio="none"/>;
  });
  const clipId=`grid-clip-${levelId}`;
  return {script,tilesetId,nodes:<g className="grid-view" data-script={script} data-cell={`${r}/${c}`}>
    <defs><clipPath id={clipId}><rect x={VIEW_CLIP.x*sx} y={VIEW_CLIP.y*sy} width={VIEW_CLIP.width*sx} height={VIEW_CLIP.height*sy}/></clipPath></defs>
    <g clipPath={`url(#${clipId})`}>
      {!background && renderAsset(pack,"surface.ceiling",undefined,tilesetId)}
      {!background && renderAsset(pack,"surface.floor",undefined,tilesetId)}
      {nodes}
    </g>
  </g>};
}

/** r11: edge-model levels render through the original grid-view pipeline (runtime copy via
 *  buildEdgeGrid, never written back). Script follows the level tileset (DJ1/DJ2/DJCAT); scene type is a
 *  representative of that script (MAIN 0x01c96: 31 DJ1, 35 DJ2, 36 DJCAT; suspected for user levels). */
const EDGE_SCRIPT_BY_TILESET:Record<string,[GridScript,number]>={"ishar2-dj1":["DJ1",31],"ishar2-dj2":["DJ2",35],"ishar2-djcat":["DJCAT",36]};
function renderEdgeLevelAsGrid(pack:LoadedAssetPack|null,game:AuthoredGame,level:NonNullable<AuthoredGame["levels"][number]>,location:AuthoredLocation,facing:Direction,openDoors:string[],tilesetId:string|undefined,redraw=0,lift?:{door:number;dy:number;doorId?:string}){
  const pick=EDGE_SCRIPT_BY_TILESET[location.tilesetId || tilesetId || ""];
  if(!pick || !pack?.manifest.tilesets.some((t)=>t.entries.some((e)=>e.role==="scene.sprite"))) return undefined;
  const built=edgeViewGrid(game,level.id);
  if(!built.ok) return undefined;
  const r=location.y-built.minY, c=built.grid.cols-1-(location.x-built.minX);
  const open=(n:number)=>Object.entries(built.doorNumbers).some(([id,k])=>k===n && openDoors.includes(id));
  const edgeLift=lift?.doorId && built.doorNumbers[lift.doorId]!==undefined ? {door:built.doorNumbers[lift.doorId]!,dy:lift.dy} : undefined;
  return renderGridView(pack,built.grid,level.id,r,c,facing,open,pick[1],edgeLift,redraw,pick[0]);
}

const startSceneTypeOf=(game:AuthoredGame)=>game.levels.find((l)=>l.id===(game.locations.find((x)=>x.id===game.startLocationId)?.levelId || "level-1"))?.grid?.startSceneType;

/** known (render-runtime.md §6): main 0x4aa4 is indexed by door number only and survives map changes. */
function gridDoorOpen(game:AuthoredGame,openDoors:string[],n:number){
  void game; // initiallyOpen doors start in openDoors (save state is not modelled)
  return openDoors.some((id)=>gridDoorNumber(id)===n);
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

export function DungeonViewport({ game, location, facing, encounter, encounterDone, collectedItemIds, pack, openDoors, onGroundItemSelect, selectedGroundItemId, gridSceneType, gridLift, gridRedraw, gridSwitches }: {
  game: AuthoredGame;
  location: AuthoredLocation;
  facing: Direction;
  encounter?: AuthoredEncounter;
  encounterDone: boolean;
  collectedItemIds: string[];
  pack: LoadedAssetPack | null;
  openDoors: string[];
  onGroundItemSelect?: (itemId: string, position?: { x: number; y: number }) => void;
  selectedGroundItemId?: string | null;
  gridSceneType?: number;
  gridLift?: {door:number;dy:number};
  gridRedraw?: number;
  gridSwitches?: number[];
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

  // r12: imported CONT maps 1-4 use the original outdoor renderers instead of the CK swamp/outdoor heuristics
  // (only when the pack has the baked outdoor sprites; old CK presets without a grid are unchanged).
  const gridOutdoor=!!currentLevel?.grid && isOutdoorMap(currentLevel.grid.mapNumber)
    && !!pack?.manifest.tilesets.some((t)=>t.id===`ishar2-out${currentLevel.grid!.mapNumber}`);
  const gridView=currentLevel?.grid && (!outdoor || gridOutdoor)
    ? (()=>{ const {r,c}=gridCellOf(currentLevel.grid!,location); return renderGridView(pack,currentLevel.grid!,currentLevel.id,r,c,facing,(n)=>gridDoorOpen(game,openDoors,n),gridSceneType,gridLift,gridRedraw,undefined,(i)=>!!gridSwitches?.[i]); })()
    : currentLevel && !outdoor ? renderEdgeLevelAsGrid(pack,game,currentLevel,location,facing,openDoors,sceneTileset?.id,gridRedraw,gridLift) : undefined;
  for (let depth = 0; depth < 4 && cell && !outdoor && !gridView; depth++) {
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
    // DJ1 #71/#72 are edge-wall side reveals, not room passages (plan v3 §5.4).
    const leftOpeningRole: DungeonAssetRole="opening.left";
    const rightOpeningRole: DungeonAssetRole="opening.right";
    const forward = canTravel(game.locations, cell, facing);
    const cellTilesetId=cell.tilesetId;
    const roomBoundary=!!forward && (cell.sceneKind==="room" || forward.sceneKind==="room")
      && !roomsShareOpenSurface(cell,forward,game.doors);
    const forwardDoor = forward ? doorBetween(game.doors, cell, forward) : undefined;
    const forwardDoorOpen = !forwardDoor || openDoors.includes(forwardDoor.id);

    if(depth>=1 && depth<=2){
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
        {forwardDoor && renderDoorLeaf(pack,forwardDoor,forwardDoorOpen,depth as DungeonAssetDepth,cell.tilesetId)}
        {forwardDoor && !forwardDoorOpen && !originalDoorLeaf(pack,forwardDoor,false,depth as DungeonAssetDepth,cell.tilesetId) && renderRectAsset(pack, "door.front.closed", {x:inner.l+12,y:inner.t+4,width:Math.max(20,inner.r-inner.l-24),height:Math.max(30,inner.b-inner.t-8)}, depth as DungeonAssetDepth, cell.tilesetId, forwardDoor.id)}
        {forwardDoor && !forwardDoorOpen && !originalDoorLeaf(pack,forwardDoor,false,depth as DungeonAssetDepth,cell.tilesetId) && !assetFor(pack, "door.front.closed", depth as DungeonAssetDepth, cell.tilesetId, forwardDoor.id) &&
          <FallbackDoor x={inner.l+12} y={inner.t+4} width={Math.max(20,inner.r-inner.l-24)} height={Math.max(30,inner.b-inner.t-8)} grille={doorLeafKind(forwardDoor.originalIndex,sceneTileset?.id)==="grate"}/>}
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
  const currentItemLayer=currentItemAssetId
    ? renderDiscoveredItemAtDepth(pack,currentItemAssetId,0)
    : genericCurrentItemLayer ?? <g className="dungeon-item" transform="translate(500 310)">
        <ellipse cx="0" cy="36" rx="34" ry="8" className="item-shadow"/>
        <path d="M-22 34 L-14 -8 L14 -8 L22 34 Z" className="item-pedestal"/>
        <circle cx="0" cy="-24" r="13" className="item-glow"/>
        <path d="M-5 -30 L7 -25 L0 -15 L-8 -20 Z" className="item-core"/>
      </g>;

  return <div className={`dungeon-viewport ${outdoor ? "outdoor-viewport" : roomScene ? "room-viewport" : ""}`} style={{aspectRatio:String(viewportAspect)}} data-render-profile={renderProfile.id} data-scene-layout-version={pack?.sceneLayoutVersion}>
    <svg viewBox="0 0 640 400" preserveAspectRatio="none" aria-label={`Blick nach ${compassOf(facing)}`}>
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
      {gridOutdoor ? null : outdoor && currentLevel?.biome==="swamp" ? renderSwampScene(game,location,facing,pack) : outdoor ? <g className="outdoor-scene">
        <rect width="640" height="220" fill="url(#outdoor-sky)"/>
        <path d="M0 225 L60 193 L112 207 L180 181 L240 211 L330 188 L420 212 L492 184 L570 207 L640 190 V280 H0Z" fill="#4c5a51"/>
        <rect y="220" width="640" height="180" fill="url(#outdoor-ground)"/>
        {renderDiscoveredTexture(pack,location.floorAssetId,{kind:"rect",x:0,y:220,width:640,height:180},0,"outdoor-ground")}
        {renderDiscoveredLayer(pack,location.sceneryAssetId,{x:64,y:18,width:512,height:360})}
      </g> : renderAsset(pack, "viewport.background", undefined, locationTilesetId)}
      {!gridView && nativeScene && renderAsset(pack,"surface.ceiling",undefined,locationTilesetId)}
      {!gridView && nativeScene && renderAsset(pack,"surface.floor",undefined,locationTilesetId)}
      {gridView ? gridView.nodes : segments}
      {itemLayers}
      {currentItemId && <g className={`ground-item-choice${selectedGroundItemId===currentItemId ? " held" : ""}`}
        role="button" tabIndex={0} aria-label={`${currentItem?.name ?? currentItemId} ${selectedGroundItemId===currentItemId ? "am Fundort ablegen" : "vom Boden aufheben"}`}
        aria-pressed={selectedGroundItemId===currentItemId}
        onClick={(event)=>onGroundItemSelect?.(currentItemId,{x:event.clientX,y:event.clientY})}
        onKeyDown={(event)=>{if(event.key==="Enter" || event.key===" "){event.preventDefault();onGroundItemSelect?.(currentItemId);}}}>
        {currentItemLayer}
      </g>}
      <path className="dungeon-vignette" d="M0 0H640V400H0Z M32 25V375H608V25Z" fillRule="evenodd"/>
      {encounter && !encounterDone && (encounterLayer ?? <g className="enemy-silhouette" transform="translate(320 232)">
        <ellipse cx="0" cy="58" rx="58" ry="13" className="enemy-shadow"/>
        <path d="M-36 48 L-24 -52 L0 -84 L24 -52 L36 48 Z" className="enemy-body"/>
        <circle cx="0" cy="-88" r="24" className="enemy-head"/>
        <path d="M-23 -90 L-8 -105 L0 -95 L9 -108 L23 -90" className="enemy-crown"/>
        <circle cx="-8" cy="-91" r="3" className="enemy-eye"/><circle cx="8" cy="-91" r="3" className="enemy-eye"/>
        <path d="M-42 -22 L-70 23 L-52 30 L-26 2 M42 -22 L70 23 L52 30 L26 2" className="enemy-arms"/>
      </g>)}
    </svg>
    <div className="viewport-topbar"><span>{location.name}</span><strong>{compassOf(facing)}</strong></div>
    <div className="viewport-profile">{renderProfile.label} · {renderProfile.drawWidth}×{renderProfile.drawHeight}</div>
    {encounter && !encounterDone && <div className="enemy-hud"><strong>{encounter.name}</strong><span>im Weg</span></div>}
    {currentItemId && selectedGroundItemId===currentItemId && <div className="ground-item-prompt" role="status">{currentItem?.name ?? currentItemId} in der Hand · Fundort oder Charakterporträt anklicken</div>}
  </div>;
}

function DungeonMiniMap({ game, location, facing }: { game: AuthoredGame; location: AuthoredLocation; facing: Direction }) {
  const gridLevel=!!game.levels.find((level)=>level.id===(location.levelId || "level-1"))?.grid;
  // Grid levels can hold thousands of cells; show the neighbourhood only.
  const locations=game.locations.filter((room)=>(room.levelId || "level-1")===(location.levelId || "level-1")
    && (!gridLevel || Math.abs(room.x-location.x)<=6 && Math.abs(room.y-location.y)<=5));
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
        <rect x={-5} y={-5} width={10} height={10} className={`minimap-room${current ? " current" : ""}${room.outdoorSurface==="water" ? " water" : ""}`}/>
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
  // Grid levels (original CONT layers) are expanded into runtime cells/doors; the project itself is untouched.
  const game = useMemo(()=>expandGridLevels(project.game),[project.game]);
  const hero = game.characters[0];
  const problems = useMemo(()=>validateGame(project.game),[project.game]);
  const [locationId, setLocationId] = useState(game.startLocationId);
  const [facing, setFacing] = useState<Direction>(game.startFacing);
  const [partyHp,setPartyHp]=useState<Record<string,number>>(()=>Object.fromEntries(game.characters.map((member)=>[member.id,member.hp])));
  const [enemyHp, setEnemyHp] = useState<Record<string, number>>({});
  const [completedEncounters, setCompletedEncounters] = useState<string[]>([]);
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [inventory, setInventory] = useState<string[]>([]);
  const [itemOwners,setItemOwners]=useState<Record<string,string>>({});
  const [selectedItemId,setSelectedItemId]=useState<string|null>(null);
  const [selectedGroundItemId,setSelectedGroundItemId]=useState<string|null>(null);
  const [heldItemStart,setHeldItemStart]=useState({x:0,y:0});
  const [openDoors, setOpenDoors] = useState<string[]>(game.doors.filter((door)=>door.initiallyOpen).map((door)=>door.id));
  // r7: scene type main 0x4ef2 is state in the original, set by layer-B triggers on entry (GERDEP 0x0162a, known).
  // main 0x4ef2 is walk state (sticky); a save restores it. Without one, grid-view falls back to the nearest trigger.
  const [gridSceneType, setGridSceneType] = useState<number|undefined>(()=>startSceneTypeOf(game));
  const [gridLift, setGridLift] = useState<{door:number;dy:number;doorId?:string}|undefined>(undefined);
  // r12: switch table main 0x4ad8 + scale pans (door-mechanics.ts); doors stay in openDoors (0x4aa4 by number).
  const [mech, setMech] = useState<MechState>(()=>newMechState());
  const [gridRedraw, setGridRedraw] = useState(0); // first frame (0) is drawn unmirrored (FDJ* 0x13=1 -> cputnat)
  // Alderaan render tables (known): FDJ floor/ceiling #3 is redrawn mirrored on every other view update.
  const viewReset=useRef(true);
  useEffect(()=>{ if(viewReset.current){viewReset.current=false;setGridRedraw(0);} else setGridRedraw((n)=>n+1); },[locationId,facing]);
  const [log, setLog] = useState<string[]>(["Du betrittst den Dungeon."]);
  const [selectedPartyIndex,setSelectedPartyIndex]=useState(0);
  const [hudPanel,setHudPanel]=useState<"actions"|"character"|"inventory"|"map"|"quest"|null>(null);

  // The persisted project hydrates after the route's initial render. Keep the
  // authored entrance and party in sync without restarting ordinary movement.
  useEffect(()=>{viewReset.current=locationId!==game.startLocationId || facing!==game.startFacing;setLocationId(game.startLocationId);setFacing(game.startFacing);setGridSceneType(startSceneTypeOf(game));setGridRedraw(0);},[game.startLocationId,game.startFacing]);
  useEffect(()=>{
    setPartyHp(Object.fromEntries(game.characters.map((member)=>[member.id,member.hp])));
    setSelectedPartyIndex((index)=>Math.min(index,Math.max(0,game.characters.length-1)));
  },[game.characters]);
  useEffect(()=>{setOpenDoors(game.doors.filter((door)=>door.initiallyOpen).map((door)=>door.id));},[game.doors]);
  useEffect(()=>{setSelectedGroundItemId(null);},[locationId,facing]);

  const location = useMemo(() => game.locations.find((x) => x.id === locationId), [game.locations, locationId]);
  const encounter = location?.encounterId ? game.encounters.find((x) => x.id === location.encounterId) : undefined;
  const encounterDone = encounter ? completedEncounters.includes(encounter.id) : true;
  const currentEnemyHp = encounter ? (enemyHp[encounter.id] ?? encounter.enemyHp) : 0;
  const defeated = game.characters.every((member)=>(partyHp[member.id] ?? member.hp)<=0);
  const won = !!location?.ending && !defeated && encounterDone;
  const visibleItemIds = location?.itemIds.filter((id) => !inventory.includes(id)) ?? [];
  const heldItem=selectedGroundItemId ? game.items.find((item)=>item.id===selectedGroundItemId) : undefined;
  const level=game.levels.find((entry)=>entry.id===(location?.levelId || "level-1"));
  const portalsHere=game.portals.filter((portal)=>portal.fromLocationId===locationId || portal.toLocationId===locationId);
  const facingTarget = location ? canTravel(game.locations, location, facing) : undefined;
  const facingDoor = location && facingTarget ? doorBetween(game.doors, location, facingTarget) : undefined;
  const facingDoorClosed = !!facingDoor && !openDoors.includes(facingDoor.id);
  const selectedMember=game.characters[selectedPartyIndex] ?? hero;
  const selectedMemberItems=inventory.filter((id)=>itemOwners[id]===selectedMember?.id);
  const selectedItem=selectedItemId && selectedMemberItems.includes(selectedItemId)
    ? game.items.find((item)=>item.id===selectedItemId) : undefined;

  function reset() {
    setLocationId(game.startLocationId);
    setFacing(game.startFacing);
    setPartyHp(Object.fromEntries(game.characters.map((member)=>[member.id,member.hp])));
    setEnemyHp({});
    setCompletedEncounters([]);
    setCompletedQuests([]);
    setInventory([]);
    setItemOwners({});
    setSelectedItemId(null);
    setSelectedGroundItemId(null);
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
    if (!location || !encounterDone || defeated || selectedGroundItemId) return;
    const target = canTravel(game.locations, location, direction);
    if (!target) {
      const ahead=adjacentLocation(game.locations,location,direction);
      setLog((x)=>[ahead?.outdoorSurface==="water" ? "Das Wasser versperrt den Weg." : "Dort ist eine Wand.", ...x]);
      return;
    }
    const door = doorBetween(game.doors, location, target);
    const gridN = door ? gridDoorNumber(door.id) : undefined;
    if (door && !(gridN!==undefined ? gridDoorOpen(game,openDoors,gridN) : openDoors.includes(door.id))) {
      setLog((x)=>[door.keyItemId ? "Die Tür ist verschlossen." : "Die Tür ist geschlossen.", ...x]);
      return;
    }
    setLocationId(target.id);
    setLog((x)=>[`Du betrittst: ${target.name}.`, ...x]);
    // known GERDEP 0x013f3..0x01407: after every step doors 5, 9 and 17 fall closed again.
    const stepGrid=game.levels.find((entry)=>entry.id===(target.levelId || "level-1"))?.grid;
    if(stepGrid){ const g=gridCellOf(stepGrid,target); applyMech(afterStep(stepGrid,g.r,g.c,{...mech,doors:doorTable()})); }
    else if(gridN!==undefined) setOpenDoors((doors)=>doors.filter((id)=>!STEP_RESET_DOORS.includes(gridDoorNumber(id) ?? -1)));
    // DJTRAP hook (cont-grid.ts): damage formula known; which wall traps fire depends on facing (not modelled: every trap fires on entry).
    const grid=game.levels.find((entry)=>entry.id===(target.levelId || "level-1"))?.grid;
    const trap=grid ? trapAt(grid,gridCellOf(grid,target).r,gridCellOf(grid,target).c) : undefined;
    if(grid){ const g=gridCellOf(grid,target); const t=sceneTriggerAt(grid,g.r,g.c); if(t!==undefined) setGridSceneType(t); }
    if(grid && trap){
      const living=game.characters.filter((member)=>(partyHp[member.id] ?? member.hp)>0);
      const victim=living[Math.floor(Math.random()*living.length)];
      const damage=trapDamage(grid.mapNumber ?? 5,Math.floor(Math.random()*5));
      if(victim && damage>0) setPartyHp((current)=>({...current,[victim.id]:Math.max(0,(current[victim.id] ?? victim.hp)-damage)}));
      setLog((x)=>[`${trap.kind==="crusher" ? "Ein Block stürzt herab" : "Eine Falle schnappt zu"}${victim && damage>0 ? `: ${victim.name} verliert ${damage} LP` : ""}.`, ...x]);
    }
  }

  /** 0x4aa4 as a 50-entry table from the runtime door ids (shared by number across grid levels). */
  function doorTable(){ return Array.from({length:50},(_,n)=>gridDoorOpen(game,openDoors,n) ? 1 : 0); }
  function applyMech({state,events}:{state:MechState;events:MechEvent[]}){
    setMech(state);
    const ids=(n:number)=>game.levels.filter((l)=>l.grid).map((l)=>gridDoorId(l.id,n));
    const doorEv=events.filter((e)=>e.kind==="door");
    if(doorEv.length) setOpenDoors((doors)=>{ let d=[...doors]; for(const e of doorEv){ const all=ids(e.door); d=d.filter((id)=>!all.includes(id)); if(e.open) d.push(...all); } return d; });
    const msg=events.flatMap((e)=>e.kind==="door" && !STEP_RESET_DOORS.includes(e.door) ? [`Tür ${e.door} ${e.open ? "öffnet" : "schließt"} sich (${e.why}).`] : e.kind==="switch" ? [`Schalter ${e.index} ${e.on ? "gesetzt" : "gelöscht"} (${e.why}).`] : e.kind==="plate" ? [`Druckplatte ${e.index}.`] : []);
    if(msg.length) setLog((x)=>[...msg.reverse(),...x]);
  }

  function openFacingDoor() {
    if (!location || defeated) return;
    const target = canTravel(game.locations, location, facing);
    if (!target) return;
    const door = doorBetween(game.doors, location, target);
    if (!door || openDoors.includes(door.id)) return;
    const gridN = gridDoorNumber(door.id);
    if (gridN!==undefined && (gridDoorOpen(game,openDoors,gridN) || gridLift)) return;
    if (door.keyItemId && !inventory.includes(door.keyItemId)) {
      const key = game.items.find((item)=>item.id===door.keyItemId);
      setLog((x)=>[`Verschlossen. Benötigt: ${key?.name ?? door.keyItemId}.`, ...x]);
      return;
    }
    if (gridN!==undefined || level) {
      // known PCAVE 0x0031b..0x0034e: the leaf rises 4 px per frame over 21 frames, then the door is open;
      // frame rate ~23.5 fps (70 Hz tick, ctiming 3; hud-anim.md). Edge levels animate through their runtime grid.
      let frame=0;
      const timer=window.setInterval(()=>{
        frame++;
        if(frame>21){ window.clearInterval(timer); setGridLift(undefined); setOpenDoors((doors)=>[...doors, door.id]); return; }
        setGridLift({door:gridN ?? -1,dy:frame*4,doorId:door.id});
      },1000/23.5);
      setLog((x)=>["Tür geöffnet.", ...x]);
      return;
    }
    setOpenDoors((doors)=>[...doors, door.id]);
    setLog((x)=>["Tür geöffnet.", ...x]);
  }

  function takeItem(id: string, carrierId?: string) {
    if (!location?.itemIds.includes(id) || inventory.includes(id)) return false;
    if(!encounterDone || defeated){setLog((x)=>["Zuerst muss der Weg frei sein.",...x]);return false;}
    const item = game.items.find((x)=>x.id===id);
    const carrier=game.characters.find((member)=>member.id===carrierId) ?? game.characters[selectedPartyIndex] ?? hero;
    if(!carrier || (partyHp[carrier.id] ?? carrier.hp)<=0){setLog((x)=>["Wähle eine handlungsfähige Figur.",...x]);return false;}
    if(inventory.filter((itemId)=>itemOwners[itemId]===carrier.id).length>=9){setLog((x)=>[`${carrier.name} hat keinen freien Platz.`,...x]);return false;}
    setInventory((x)=>[...x,id]);
    setItemOwners((x)=>({...x,[id]:carrier.id}));
    setSelectedItemId(id);
    setSelectedGroundItemId(null);
    setLog((x)=>[`${carrier.name} nimmt ${item?.name ?? id} auf.`, ...x]);
    return true;
  }

  function selectGroundItem(id:string,position?:{x:number;y:number}){
    if(!visibleItemIds.includes(id) || defeated || !encounterDone) return;
    if(selectedGroundItemId===id){setSelectedGroundItemId(null);return;}
    if(selectedGroundItemId) return;
    setHeldItemStart(position ?? {x:window.innerWidth/2,y:window.innerHeight/2});
    setSelectedGroundItemId(id);
  }

  function transferItem(id:string,recipientId:string){
    const item=game.items.find((entry)=>entry.id===id);
    const recipient=game.characters.find((entry)=>entry.id===recipientId);
    if(!recipient || !inventory.includes(id) || !itemOwners[id] || itemOwners[id]===recipientId) return;
    if(inventory.filter((itemId)=>itemOwners[itemId]===recipientId).length>=9){setLog((x)=>[`${recipient.name} hat keinen freien Platz.`,...x]);return;}
    setItemOwners((x)=>({...x,[id]:recipientId}));
    setSelectedItemId(null);
    setLog((x)=>[`${item?.name ?? id} an ${recipient.name} übergeben.`,...x]);
  }

  function usePortal(id:string){
    if(defeated || !encounterDone || selectedGroundItemId) return;
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
      if(key==="escape" && selectedGroundItemId){setSelectedGroundItemId(null);return;}
      if(selectedGroundItemId) return;
      if (key === "arrowleft" || key === "a") setFacing((value)=>turnLeft(value));
      else if (key === "arrowright" || key === "d") setFacing((value)=>turnRight(value));
      else if (key === "arrowup" || key === "w") step(facing);
      else if (key === "arrowdown" || key === "s") step(turnBack(facing));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [facing, locationId, encounterDone, defeated, openDoors, selectedGroundItemId]);

  if (problems.length || !hero || !location) return <section><header className="page-head"><div><p className="eyebrow">Dungeon Playtest</p><h1>Projekt nicht spielbar</h1><p>Behebe zuerst die Raster- oder Referenzfehler im Adventure Builder.</p></div><Link className="file-button" to="/author">Zum Builder</Link></header><div className="empty-state">{problems.map((p,i)=><p key={i}>{p.path}: {p.message}</p>)}</div></section>;

  return <section className="crawler-page">
    <header className="page-head crawler-head">
      <div><p className="eyebrow">First-person dungeon runtime</p><h1>{project.name}</h1><p>WASD / Pfeiltasten: drehen und schrittweise bewegen.</p></div>
      <div className="toolbar"><Link className="file-button" to="/author">Dungeon bearbeiten</Link><Link className="file-button" to="/assets">Assets</Link><button onClick={reset}>Neu starten</button></div>
    </header>

    <div className="ishar-play-shell">
      <div className="ishar-stage-row">
        <main className="ishar-view-panel">
          {(hudPanel==="character" || hudPanel==="inventory") ? <section className="ishar-character-sheet" aria-label={`Charakterblatt ${selectedMember.name}`}>
            <header className="ishar-sheet-header"><div><small>Charakterblatt · {selectedPartyIndex+1}/5</small><h2>{selectedMember.name}</h2></div><button onClick={()=>setHudPanel(null)} aria-label="Charakterblatt schließen">×</button></header>
            <div className="ishar-sheet-body">
              <div className="ishar-sheet-status"><h3>Figur</h3>
                <p><span>Beruf</span><strong>{selectedMember.profession || "–"}</strong></p>
                <p><span>Volk</span><strong>{selectedMember.race || "–"}</strong></p>
                <p><span>Level</span><strong>{selectedMember.level ?? "–"}</strong></p>
                <p><span>Erfahrung</span><strong>{selectedMember.experience ?? "–"}</strong></p>
                <p><span>Vitalität</span><strong>{partyHp[selectedMember.id] ?? selectedMember.hp} / {selectedMember.hp}</strong></p>
                <p><span>Körperlich</span><strong>{selectedMember.physical ?? "–"}</strong></p>
                <p><span>Geistig</span><strong>{selectedMember.psychic ?? "–"}</strong></p>
                <p><span>Gesinnung</span><strong>{selectedMember.alignment ?? "–"}</strong></p>
                <p><span>Angriff</span><strong>{selectedMember.attack}</strong></p>
                <div className="ishar-sheet-health"><i style={{width:`${Math.max(0,Math.min(100,Math.round((partyHp[selectedMember.id] ?? selectedMember.hp)/Math.max(1,selectedMember.hp)*100)))}%`}}/></div>
              </div>
              <div className="ishar-sheet-pack"><h3>Gegenstände · {selectedMemberItems.length}/9</h3><div className="ishar-sheet-grid">{Array.from({length:9},(_,slot)=>{const id=selectedMemberItems[slot];const item=game.items.find((entry)=>entry.id===id);return <button key={slot} disabled={!id} aria-label={id ? `Platz ${slot+1}: ${item?.name ?? id}` : `Platz ${slot+1}: leer`} aria-pressed={!!id && selectedItemId===id} onClick={()=>setSelectedItemId(id)}>{item?.name ?? ""}</button>;})}</div></div>
            </div>
            {selectedItem && <div className="ishar-sheet-item"><strong>{selectedItem.name}</strong><p>{selectedItem.description || "Keine Beschreibung."}</p><div className="ishar-sheet-item-actions">{facingDoorClosed && facingDoor?.keyItemId===selectedItem.id && <button onClick={openFacingDoor}>An Tür verwenden</button>}{game.characters.filter((member)=>member.id!==selectedMember.id).map((member)=><button key={member.id} onClick={()=>transferItem(selectedItem.id,member.id)} disabled={inventory.filter((id)=>itemOwners[id]===member.id).length>=9}>An {member.name} geben</button>)}</div></div>}
          </section> : <><DungeonViewport game={game} location={location} facing={facing} encounter={encounter} encounterDone={encounterDone} collectedItemIds={inventory} pack={pack} openDoors={openDoors} onGroundItemSelect={selectGroundItem} selectedGroundItemId={selectedGroundItemId} gridSceneType={gridSceneType} gridLift={gridLift} gridRedraw={gridRedraw} gridSwitches={mech.switches}/>
          <div className="asset-runtime-status"><span>Asset-Pack</span><strong>{pack ? pack.manifest.name : "SVG-Fallback"}</strong>{game.assetPackId && !pack && <small>Projekt erwartet: {game.assetPackId}</small>}</div></>}
        </main>

        <aside className="ishar-control-panel">
          <div className="ishar-location-plaque"><small>{level?.name ?? "Dungeon"}</small>{location.name}</div>
          <nav className="ishar-hud-nav" aria-label="Spielmenü">
            <button aria-pressed={hudPanel==="actions"} onClick={()=>toggleHud("actions")}>Aktionen</button>
            <button aria-pressed={hudPanel==="character"} onClick={()=>toggleHud("character")}>Figur</button>
            <button aria-pressed={hudPanel==="inventory"} onClick={()=>toggleHud("inventory")}>Gepäck {inventory.length ? `(${inventory.length})` : ""}</button>
            <button aria-pressed={hudPanel==="map"} onClick={()=>toggleHud("map")}>Karte</button>
            <button aria-pressed={hudPanel==="quest"} onClick={()=>toggleHud("quest")}>Aufträge</button>
          </nav>
          {hudPanel && hudPanel!=="character" && hudPanel!=="inventory" && <section className="ishar-hud-panel" aria-label="Spielmenü-Inhalt">
            <button className="ishar-hud-close" onClick={()=>setHudPanel(null)} aria-label="Menü schließen">×</button>
            {hudPanel==="actions" && <><h3>Aktionen · {game.characters[selectedPartyIndex]?.name ?? hero.name}</h3><div className="ishar-hud-actions"><button onClick={attack} disabled={!encounter || encounterDone || defeated || (partyHp[game.characters[selectedPartyIndex]?.id ?? hero.id] ?? 0)<=0}>Angreifen</button><button onClick={openFacingDoor} disabled={!facingDoorClosed || defeated}>Tür öffnen</button>{visibleItemIds.map((id)=><button key={id} onClick={(event)=>selectGroundItem(id,{x:event.clientX,y:event.clientY})}>{game.items.find((item)=>item.id===id)?.name ?? id} {selectedGroundItemId===id ? "zurücklegen" : "aufheben"}</button>)}{portalsHere.map((portal)=><button key={portal.id} onClick={()=>usePortal(portal.id)} disabled={defeated || !encounterDone || !!selectedGroundItemId}>{portal.label}</button>)}</div></>}
            {hudPanel==="map" && <><h3>{level?.name ?? "Karte"}</h3><DungeonMiniMap game={game} location={location} facing={facing}/></>}
            {hudPanel==="quest" && <><h3>Aufträge</h3>{game.quests.map((quest)=><p key={quest.id}><strong>{quest.title}</strong> · {completedQuests.includes(quest.id) ? quest.completedText : quest.objective}</p>)}</>}
          </section>}
          <div className="ishar-dpad" aria-label="Dungeon-Steuerung">
            <span/>
            <button onClick={()=>step(facing)} disabled={!encounterDone || defeated || !!selectedGroundItemId} aria-label="Vorwärts">▲</button>
            <span/>
            <button onClick={()=>setFacing(turnLeft(facing))} disabled={!!selectedGroundItemId} aria-label="Links drehen">◀</button>
            <button className="dpad-center" onClick={()=>step(turnBack(facing))} disabled={!encounterDone || defeated || !!selectedGroundItemId} aria-label="Rückwärts">▼</button>
            <button onClick={()=>setFacing(turnRight(facing))} disabled={!!selectedGroundItemId} aria-label="Rechts drehen">▶</button>
          </div>
          <div className="ishar-context-buttons">
            {visibleItemIds.map((id)=><button key={id} onClick={(event)=>selectGroundItem(id,{x:event.clientX,y:event.clientY})} disabled={defeated}>{game.items.find((item)=>item.id===id)?.name ?? id} {selectedGroundItemId===id ? "zurücklegen" : "aufheben"}</button>)}
            {encounter && !encounterDone && !defeated && <button className="attack-button" onClick={attack} disabled={(partyHp[game.characters[selectedPartyIndex]?.id ?? hero.id] ?? 0)<=0}>⚔ Angriff <small>{currentEnemyHp}/{encounter.enemyHp}</small></button>}
            {facingDoorClosed && encounterDone && !defeated && <button className="door-button" onClick={openFacingDoor}>🚪 Öffnen<small>{facingDoor?.keyItemId ? "Schlüssel" : "Tür"}</small></button>}
            {portalsHere.map((portal)=>{const target=game.locations.find((entry)=>entry.id===(portal.fromLocationId===locationId ? portal.toLocationId : portal.fromLocationId));return <button key={portal.id} onClick={()=>usePortal(portal.id)} disabled={defeated || !encounterDone || !!selectedGroundItemId}>↗ {target?.name ?? portal.label}</button>})}
          </div>
          <div className="ishar-compass">Blick: <strong>{compassOf(facing)}</strong></div>
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
            <button className={`ishar-portrait${selectedGroundItemId && member && currentHp>0 ? " pickup-target" : ""}`} disabled={!member || (!!selectedGroundItemId && currentHp<=0)} aria-label={selectedGroundItemId && member ? `${member.name}: Gegenstand aufnehmen` : `${member?.name ?? `Slot ${index+1}`} Gepäck ansehen`} onClick={()=>{setSelectedPartyIndex(index);if(selectedGroundItemId){takeItem(selectedGroundItemId,member?.id);}else{setSelectedItemId(null);setHudPanel("inventory");}}}>{member ? member.name.slice(0,1).toUpperCase() : ""}</button>
            <button className="ishar-party-name" disabled={!member} onClick={()=>{setSelectedPartyIndex(index);setSelectedItemId(null);setHudPanel("character");}}>{member?.name ?? `Slot ${index+1}`}</button>
            <div className={`ishar-life-row ${originalLifeBar ? "original-life-sprite" : ""}`}>{originalLifeBar ? <img src={originalLifeBar} alt="Leben"/> : <span>LIFE</span>}<div className="ishar-life-track"><i style={{width:`${ratio}%`}}/></div></div>
          </article>;
        })}
      </div>

      {selectedGroundItemId && <HeldGroundItemCursor key={selectedGroundItemId} item={heldItem} pack={pack} position={heldItemStart}/>}

      {defeated && <div className="crawler-message danger"><strong>Die Gruppe wurde besiegt.</strong><button onClick={reset}>Erneut versuchen</button></div>}
      {won && <div className="crawler-message victory"><strong>Abschluss erreicht.</strong><span>Du kannst dich für weitere Tests weiterbewegen.</span></div>}
    </div>

    <div className="runtime-details">
      <section><p className="eyebrow">Raum</p><h2>{location.name}</h2><p>{location.description}</p></section>
      <section><h3>Quest</h3>{game.quests.map((q)=><div className="quest-line" key={q.id}><strong>{q.title}</strong><span>{completedQuests.includes(q.id)?"erfüllt":"aktiv"}</span><p>{completedQuests.includes(q.id)?q.completedText:q.objective}</p></div>)}</section>
      <section><h3>Gepäck</h3>{inventory.length ? <ul>{inventory.map((id)=><li key={id}>{game.items.find((x)=>x.id===id)?.name ?? id} · {game.characters.find((member)=>member.id===itemOwners[id])?.name ?? "Gruppe"}</li>)}</ul> : <p className="muted">leer</p>}</section>
      <section><h3>Protokoll</h3><div className="game-log">{log.slice(0,6).map((line,i)=><p key={i}>{line}</p>)}</div></section>
    </div>
  </section>;
}
