import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { DungeonViewport } from "@/routes/playtest";
import { compassOf, describeCell, GridMap, TOOLS, type BuilderTool, type Layers } from "@/builder/grid-builder";
import { paintFloor, paintWall, setDoor, setEdge, setNiche, setSceneTrigger, setTrap, validateGrid, wallRuleApplies, type EditResult } from "@/lib/ishar/grid-editor";
import { nicheSwitch } from "@/lib/ishar/door-mechanics";
import { useKit } from "@/lib/store";
import { useAssetPack } from "@/lib/asset-store";
import { DIRECTION_LABELS, DIRECTION_VECTORS, locationAt } from "@/lib/ishar/dungeon";
import { createRoomBlock } from "@/lib/ishar/room-builder";
import { createSwampTestArea } from "@/lib/ishar/swamp-area";
import { addGridLevel, bytesToBase64, cellA, cellB, cellWalkable, ckXOf, convertLevelToGrid, decomposeCode, doorNumber, edgeViewGrid, expandGridLevels, exportCont, gridCellOf, gridLocationId, importCont, ISHAR2_COLS, ISHAR2_ROWS, sceneTriggerAt, setGridCell, syntheticTestGrid, trapAt } from "@/lib/ishar/cont-grid";
import { assetCatalogGroup } from "@/lib/ishar/asset-catalog";
import { validateGame } from "@/lib/ishar/project-validation";
import { reconcileItemPlacements } from "@/lib/ishar/item-instances";
import { NpcEditor } from "@/builder/npc-editor";
import { OriginalMerchantEditor } from '@/components/builder/original-merchant-editor';
import { OriginalActorInspector } from '@/components/builder/original-actor-inspector';
import type { AuthoredDoor, AuthoredGame, AuthoredLevel, AuthoredLocation, Direction, IsharGrid } from "@/lib/ishar/types";

export const Route = createFileRoute("/author")({ component: AuthorPage });

function csv(value: string) {
  return value.split(",").map((x) => x.trim()).filter(Boolean);
}

function DungeonMap({ game, levelId, selectedId, onSelect }: { game: AuthoredGame; levelId:string; selectedId: string; onSelect: (id: string) => void }) {
  const locations=game.locations.filter((location)=>(location.levelId || "level-1")===levelId);
  const xs = locations.map((x) => x.x);
  const ys = locations.map((x) => x.y);
  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 0);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 0);
  const cell = 96;
  const pad = 48;
  const width = (maxX - minX + 1) * cell + pad * 2;
  const height = (maxY - minY + 1) * cell + pad * 2;
  const point = (loc: AuthoredLocation) => ({ x: pad + (loc.x - minX) * cell + cell / 2, y: pad + (loc.y - minY) * cell + cell / 2 });

  return <svg className="dungeon-map interactive-map" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Dungeon-Raster">
    {locations.flatMap((loc) => loc.exits.map((id) => {
      const target = game.locations.find((x) => x.id === id);
      if (!target || loc.id > target.id) return null;
      const a = point(loc);
      const b = point(target);
      return <line key={`${loc.id}-${id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="map-link"/>;
    }))}
    {locations.map((loc) => {
      const p = point(loc);
      const start = loc.id === game.startLocationId;
      const selected = loc.id === selectedId;
      return <g
        key={loc.id}
        transform={`translate(${p.x},${p.y})`}
        className={`map-room-button ${selected ? "selected" : ""}`}
        role="button"
        tabIndex={0}
        onClick={()=>onSelect(loc.id)}
        onKeyDown={(event)=>{if(event.key==="Enter" || event.key===" "){event.preventDefault();onSelect(loc.id);}}}
      >
        <rect x={-36} y={-31} width={72} height={62} rx={5} className={`map-cell ${start ? "start" : ""} ${loc.ending ? "ending" : ""} ${selected ? "selected" : ""} ${loc.sceneKind ?? "corridor"} ${loc.outdoorSurface==="water" ? "water" : ""}`}/>
        <text y={-5} textAnchor="middle" className="map-name">{loc.name.slice(0, 13)}</text>
        <text y={14} textAnchor="middle" className="map-coord">{loc.x},{loc.y} · {loc.outdoorSurface==="water" ? "Wasser" : loc.sceneKind==="outdoor" ? "Außen" : loc.sceneKind==="room" ? "Raum" : "Gang"}</text>
        {start && <text y={42} textAnchor="middle" className="map-facing">Start {DIRECTION_LABELS[game.startFacing]}</text>}
      </g>;
    })}
  </svg>;
}

function AuthorPage() {
  const { project, builderLevelId, selectBuilderLevel, editBuilderGame, undoBuilder, redoBuilder, builderPast, builderFuture } = useKit();
  const pack = useAssetPack((s) => s.pack);
  const game = project.game;
  const problems = validateGame(game);
  const [selectedLocationId, setSelectedLocationId] = useState(game.startLocationId);
  const [builderMessage, setBuilderMessage] = useState("");
  const [surfaceSearch, setSurfaceSearch] = useState("");
  const [roomWidth,setRoomWidth]=useState(2);
  const [roomHeight,setRoomHeight]=useState(2);
  const [newLevelKind,setNewLevelKind]=useState<AuthoredLevel["kind"]>("dungeon");
  const selectedLevelId=builderLevelId ?? game.locations.find((location)=>location.id===game.startLocationId)?.levelId ?? "level-1";
  const setSelectedLevelId=selectBuilderLevel;
  const selectedLevel=game.levels.find((level)=>level.id===selectedLevelId) ?? game.levels[0]!;
  const levelLocations=game.locations.filter((location)=>(location.levelId || "level-1")===selectedLevel.id);
  const selectedLocation = levelLocations.find((location) => location.id === selectedLocationId) ?? levelLocations[0];
  const allSurfaceCandidates = (pack?.discoveredAssets ?? []).filter((asset) => {
    if (asset.source !== "alis" || asset.assetKind === "composite" || asset.visualStatus !== "normal" || !asset.width || !asset.height) return false;
    if(["ui","font","houses"].includes(assetCatalogGroup(asset.path))) return false;
    const ratio = asset.width / asset.height;
    return asset.width >= 8 && asset.height >= 8 && asset.width <= 512 && asset.height <= 512 && ratio >= 0.2 && ratio <= 5;
  });
  const terrainCandidates = allSurfaceCandidates.filter((asset)=>asset.assetKind==="terrain");
  const textureCandidates = terrainCandidates.length ? terrainCandidates : allSurfaceCandidates;
  const assetById = (id?: string) => id ? pack?.discoveredAssets?.find((asset)=>asset.id===id) : undefined;
  const surfaceQuery=surfaceSearch.trim().toLowerCase();
  const matchingSurfaceCandidates=(surfaceQuery
    ? textureCandidates.filter((asset)=>`${asset.path} ${asset.knownUse ?? ""} ${asset.id}`.toLowerCase().includes(surfaceQuery))
    : textureCandidates
  );
  const MAX_SURFACE_OPTIONS=72;
  const surfaceOptions=(currentId?: string)=>{
    const current=assetById(currentId);
    const limited=matchingSurfaceCandidates.slice(0,MAX_SURFACE_OPTIONS);
    return current && !limited.some((asset)=>asset.id===current.id) ? [current,...limited] : limited;
  };
  const itemAssetCandidates = (pack?.discoveredAssets ?? []).filter((asset)=>{
    if(asset.source!=="alis" || asset.assetKind==="composite" || asset.visualStatus!=="normal") return false;
    if(["ui","font","houses"].includes(assetCatalogGroup(asset.path))) return false;
    if(!asset.width || !asset.height) return false;
    const path=asset.path.toUpperCase();
    return path.includes("OBJET.IO") || asset.suggestedRole==="item";
  });
  const houseAssets=(pack?.discoveredAssets??[]).filter((asset)=>assetCatalogGroup(asset.path)==="houses" && asset.visualStatus==="normal");
  const plantAssets=(pack?.discoveredAssets??[]).filter((asset)=>asset.source==="alis" && asset.visualStatus==="normal" && /(?:ARBO|FORET1|PLAINE1)\.IO · ALIS #/i.test(asset.path) && (asset.width??0)>=16 && (asset.height??0)>=10);

  function applyDistanceSet(itemId: string, setId: string) {
    const members=(pack?.discoveredAssets ?? []).filter((asset)=>asset.distanceSetId===setId);
    const near=members.find((asset)=>asset.distanceRole==="near")?.id;
    const mid=members.find((asset)=>asset.distanceRole==="mid")?.id;
    const far=members.find((asset)=>asset.distanceRole==="far")?.id;
    if(!near || !mid || !far) return;
    setGame({
      ...game,
      items: game.items.map((item)=>item.id===itemId
        ? {...item,assetId:undefined,assetNearId:near,assetMidId:mid,assetFarId:far}
        : item),
    });
    const label=members[0]?.distanceSetLabel ?? setId;
    setBuilderMessage(`Distanzset „${label}“ wurde für ${itemId} übernommen.`);
  }

  // History belongs to the project session, not this route's mount lifetime.
  function setGame(next: AuthoredGame) {
    editBuilderGame(next);
    setBuilderMessage("");
  }
  function undo(){ undoBuilder(); setBuilderMessage(""); setCellSel(undefined); }
  function redo(){ redoBuilder(); setBuilderMessage(""); setCellSel(undefined); }
  const canUndo=builderPast.length>0, canRedo=builderFuture.length>0;
  const navigate=useNavigate();
  const [tool,setTool]=useState<BuilderTool>("select");
  const [layers,setLayers]=useState<Layers>({shape:true,logic:true,scene:true,traps:true,hex:false});
  const [mapSize,setMapSize]=useState(14);
  const [tab,setTab]=useState<"karte"|"gruppe"|"items"|"quests"|"begegnungen"|"tueren"|"npcs"|"original">("karte");
  const [previewFacing,setPreviewFacing]=useState<Direction>(game.startFacing);

  function patchLocation(id: string, patch: Partial<AuthoredLocation>) {
    setGame({ ...game, locations: game.locations.map((x) => x.id === id ? { ...x, ...patch,
      ...(patch.itemIds ? {itemPlacementIds:reconcileItemPlacements(x.itemIds,x.itemPlacementIds??x.itemIds.map((_,i)=>`legacy-${i}`),patch.itemIds)} : {}) } : x) });
  }

  function setOutdoorSurface(id:string,surface:"grass"|"water") {
    if(surface==="water" && game.startLocationId===id){
      setBuilderMessage("Das Startfeld muss begehbar bleiben. Wähle zuerst ein anderes Startfeld.");
      return;
    }
    const locations=game.locations.map((location)=>location.id===id
      ? {...location,outdoorSurface:surface,exits:surface==="water" ? [] : location.exits}
      : surface==="water" ? {...location,exits:location.exits.filter((exit)=>exit!==id)} : location);
    const doors=surface==="water" ? game.doors.filter((door)=>door.fromLocationId!==id && door.toLocationId!==id) : game.doors;
    const portals=surface==="water" ? game.portals.filter((portal)=>portal.fromLocationId!==id && portal.toLocationId!==id) : game.portals;
    setGame({...game,locations,doors,portals});
    setBuilderMessage(surface==="water" ? "Wasserfeld gesetzt: Angrenzende Verbindungen, Türen und Übergänge wurden entfernt." : "Grasfeld gesetzt. Verbindungen können nun wieder angelegt werden.");
  }

  function addDoor() {
    const fromLocation=selectedLocation;
    const toLocation=fromLocation?.exits.map((id)=>game.locations.find((location)=>location.id===id)).find(Boolean);
    if(!fromLocation || !toLocation){setBuilderMessage("Wähle ein Feld mit benachbartem, verbundenem Ausgang für eine Tür.");return;}
    let n = game.doors.length + 1;
    let id = `door-${n}`;
    while (game.doors.some((x) => x.id === id)) id = `door-${++n}`;
    setGame({ ...game, doors: [...game.doors, { id, fromLocationId: fromLocation.id, toLocationId: toLocation.id, initiallyOpen: false }] });
  }

  function patchDoor(id: string, patch: Partial<AuthoredDoor>) {
    setGame({ ...game, doors: game.doors.map((door) => door.id === id ? { ...door, ...patch } : door) });
  }

  function deleteDoor(id: string) {
    setGame({ ...game, doors: game.doors.filter((door) => door.id !== id) });
  }

  function nextLocationId() {
    let n = game.locations.length + 1;
    let id = `location-${n}`;
    while (game.locations.some((x) => x.id === id)) id = `location-${++n}`;
    return id;
  }

  function createAdjacent(fromId: string, direction: Direction) {
    const from = game.locations.find((location) => location.id === fromId);
    if (!from) return;
    const vector = DIRECTION_VECTORS[direction];
    const occupied = locationAt(game.locations, from.x + vector.x, from.y + vector.y, from.levelId || "level-1");
    if (occupied) {
      setBuilderMessage(`Das Feld ${DIRECTION_LABELS[direction]} von "${from.name}" ist bereits durch "${occupied.name}" belegt.`);
      return;
    }
    const id = nextLocationId();
    const inheritedScene=from.sceneKind || (selectedLevel.kind==="outdoor" ? "outdoor" : selectedLevel.kind==="house" ? "room" : "corridor");
    const next: AuthoredLocation = {
      id,
      name: "Neuer Raum",
      description: "",
      x: from.x + vector.x,
      y: from.y + vector.y,
      levelId:from.levelId || "level-1",
      exits: [from.id],
      itemIds: [],
      tilesetId: from.tilesetId,
      sceneKind:inheritedScene,
      roomGroupId:inheritedScene==="room" ? from.roomGroupId : undefined,
      wallAssetId: from.wallAssetId,
      floorAssetId: from.floorAssetId,
      ceilingAssetId: from.ceilingAssetId,
    };
    setGame({
      ...game,
      locations: [
        ...game.locations.map((location) => location.id === from.id
          ? { ...location, exits: [...new Set([...location.exits, id])] }
          : location),
        next,
      ],
    });
    setSelectedLocationId(id);
    setBuilderMessage(`"${next.name}" wurde ${DIRECTION_LABELS[direction]} von "${from.name}" angelegt und verbunden.`);
  }

  function addRoomBlock() {
    if(!selectedLocation) return;
    const result=createRoomBlock(game,selectedLocation.id,roomWidth,roomHeight);
    if(!result.ok){setBuilderMessage(result.error);return;}
    setGame(result.game);
    setBuilderMessage(`${roomWidth}×${roomHeight}-Raumfläche mit ${result.createdIds.length+1} begehbaren Feldern angelegt. Innenkanten sind offen.`);
  }

  function addLevel(kind:AuthoredLevel["kind"]){
    let number=game.levels.length+1;
    while(game.levels.some((level)=>level.id===`level-${number}`)) number++;
    const id=`level-${number}`;
    const name=kind==="outdoor" ? `Oberwelt ${number}` : kind==="house" ? `Haus ${number}` : `Dungeon ${number}`;
    const entranceId=`${id}-entrance`;
    const tilesetId=selectedLevel.tilesetId || pack?.manifest.defaultTilesetId;
    const entrance:AuthoredLocation={id:entranceId,name:`${name} Eingang`,description:"",x:0,y:0,levelId:id,exits:[],itemIds:[],sceneKind:kind==="outdoor" ? "outdoor" : kind==="house" ? "room" : "corridor"};
    const portal=selectedLocation ? [{id:`portal-${id}`,fromLocationId:selectedLocation.id,toLocationId:entranceId,label:`Nach ${name}`}] : [];
    setGame({...game,levels:[...game.levels,{id,name,kind,tilesetId}],locations:[...game.locations,entrance],portals:[...game.portals,...portal]});
    setSelectedLevelId(id);
    setSelectedLocationId(entranceId);
    setBuilderMessage(`${name} angelegt${portal.length ? " und mit dem ausgewählten Feld verbunden" : ""}.`);
  }

  // ---- Original CONT grid (plan v3). Local only: imported bytes stay in the browser project.
  const [gridStart,setGridStart]=useState({r:"",c:""});
  function applyGridResult(result:ReturnType<typeof addGridLevel>|ReturnType<typeof convertLevelToGrid>,message:string){
    if(!result.ok){setBuilderMessage(result.error);return;}
    setGame(result.game);setSelectedLevelId(result.levelId);setSelectedLocationId(result.entryId);setBuilderMessage(message);
  }
  async function importContFile(file:File){
    if(!selectedLocation) return;
    const bytes=new Uint8Array(await file.arrayBuffer());
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),(x)=>x.toString(16).padStart(2,"0")).join("");
    const imported=importCont(bytes,file.name,digest);
    if(!imported.ok){setBuilderMessage(imported.error);return;}
    const start=gridStart.r!=="" && gridStart.c!=="" ? {r:Number(gridStart.r),c:Number(gridStart.c)} : undefined;
    applyGridResult(addGridLevel(game,imported.grid,selectedLocation.id,start),
      `${file.name}: ${imported.grid.game==="ishar2" ? "Ishar 2 · 90×60 · zwei Ebenen" : "Ishar 1 · 54×90 · eine Ebene. Der Ishar-2-Renderer ist dafür nicht geeignet"} importiert (SHA-256 ${digest.slice(0,12)}…). Enthält Originaldaten: Projekt nicht veröffentlichen oder committen.`);
  }
  function exportGridLevel(){
    const grid=selectedLevel.grid; if(!grid) return;
    const blob=new Blob([exportCont(grid)],{type:"application/octet-stream"});
    const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=grid.source?.file || `${selectedLevel.id}.FIC`;link.click();
    setTimeout(()=>URL.revokeObjectURL(link.href),1000);
  }
  function convertCurrentLevel(){
    const result=convertLevelToGrid(game,selectedLevel.id);
    applyGridResult(result,result.ok ? `Raster-Kopie angelegt; das Original-Level bleibt unverändert.${result.warnings.length ? " Hinweise: "+result.warnings.join(" ") : ""}` : "");
  }
  function addGridTestArea(){
    if(!selectedLocation) return;
    applyGridResult(addGridLevel(game,{...syntheticTestGrid(),source:{file:"Raster-Testebene",sha256:"",evidence:"suspected"}},selectedLocation.id,{r:9,c:2}),
      "Synthetische Raster-Testebene (ohne Originalbytes) mit Vollmauern, Kantentüren Holz/Gitter, Säulenraum und Fallen angelegt.");
  }

  function addSwampTestArea(){
    if(!selectedLocation) return;
    const result=createSwampTestArea(game,selectedLocation.id);
    if(!result) return;
    setGame(result.game);
    setSelectedLevelId(result.levelId);
    setSelectedLocationId(result.entranceId);
    setBuilderMessage("Sumpf-Testgebiet mit Grasfeldern und zwei unpassierbaren Wasserfeldern angelegt. Der Übergang liegt am zuvor ausgewählten Feld.");
  }

  function patchLevel(patch:Partial<AuthoredLevel>){
    setGame({...game,levels:game.levels.map((level)=>level.id===selectedLevel.id ? {...level,...patch} : level)});
  }

  function setConnection(fromId: string, targetId: string, connected: boolean) {
    const from = game.locations.find((location) => location.id === fromId);
    const target = game.locations.find((location) => location.id === targetId);
    if (!from || !target) return;
    if (connected && (from.outdoorSurface==="water" || target.outdoorSurface==="water")) {
      setBuilderMessage("Wasserfelder sind unpassierbar. Stelle sie zuerst auf Gras um.");
      return;
    }
    const locations = game.locations.map((location) => {
      if (location.id === from.id) {
        return { ...location, exits: connected ? [...new Set([...location.exits, target.id])] : location.exits.filter((id) => id !== target.id) };
      }
      if (location.id === target.id) {
        return { ...location, exits: connected ? [...new Set([...location.exits, from.id])] : location.exits.filter((id) => id !== from.id) };
      }
      return location;
    });
    const doors = connected
      ? game.doors
      : game.doors.filter((door) => !((door.fromLocationId === from.id && door.toLocationId === target.id) || (door.fromLocationId === target.id && door.toLocationId === from.id)));
    setGame({ ...game, locations, doors });
    setBuilderMessage(connected ? `"${from.name}" und "${target.name}" wurden verbunden.` : `Verbindung zwischen "${from.name}" und "${target.name}" wurde getrennt.`);
  }

  function deleteLocation(id: string) {
    const removed = game.locations.find((location)=>location.id===id);
    if (!removed || game.locations.filter((location)=>(location.levelId || "level-1")===(removed.levelId || "level-1")).length<=1) return;
    const remaining = game.locations
      .filter((location) => location.id !== id)
      .map((location) => ({ ...location, exits: location.exits.filter((exit) => exit !== id) }));
    const startLocationId = game.startLocationId === id ? remaining[0]!.id : game.startLocationId;
    const doors = game.doors.filter((door) => door.fromLocationId !== id && door.toLocationId !== id);
    setGame({ ...game, startLocationId, locations: remaining, doors, portals:game.portals.filter((portal)=>portal.fromLocationId!==id && portal.toLocationId!==id) });
    setSelectedLocationId(startLocationId);
    setBuilderMessage(`Raum "${removed?.name ?? id}" wurde gelöscht; Verbindungen und Türen wurden bereinigt.`);
  }

  // ---------------------------------------------------------------- r13 builder
  const editable=!!selectedLevel.grid;
  const edgeBuilt=!selectedLevel.grid ? edgeViewGrid(game,selectedLevel.id) : undefined;
  const viewGrid=selectedLevel.grid ?? (edgeBuilt?.ok ? edgeBuilt.grid : undefined);
  const ckAt=(r:number,c:number)=>edgeBuilt?.ok ? {x:edgeBuilt.minX+(edgeBuilt.grid.cols-1-c),y:edgeBuilt.minY+r} : selectedLevel.grid ? {x:ckXOf(selectedLevel.grid,c),y:r} : {x:0,y:0};
  const cellOfLocation=(l:AuthoredLocation)=>edgeBuilt?.ok ? {r:l.y-edgeBuilt.minY,c:edgeBuilt.grid.cols-1-(l.x-edgeBuilt.minX)} : selectedLevel.grid ? gridCellOf(selectedLevel.grid,l) : {r:0,c:0};
  const locationAtCell=(r:number,c:number)=>{const p=ckAt(r,c);return levelLocations.find((l)=>l.x===p.x && l.y===p.y);};
  const startHere=levelLocations.find((l)=>l.id===game.startLocationId);
  const [cellSel,setCellSel]=useState<{r:number;c:number}|undefined>(undefined);
  const sel=cellSel ?? (selectedLocation ? cellOfLocation(selectedLocation) : undefined);
  const selLocation=sel ? locationAtCell(sel.r,sel.c) : undefined;
  const expandedGame=useMemo(()=>expandGridLevels(game),[game]);
  const previewLocation=sel && viewGrid && cellWalkable(viewGrid,sel.r,sel.c)
    ? (editable ? expandedGame.locations.find((l)=>l.id===(selLocation?.id ?? gridLocationId(selectedLevel.id,sel.r,sel.c))) : selLocation) : undefined;
  const issues=editable ? validateGrid(selectedLevel.grid!) : [];
  const info=sel && viewGrid ? describeCell(viewGrid,sel.r,sel.c) : undefined;
  const outdoorScene=!!viewGrid && !wallRuleApplies(viewGrid);
  const legacyOutdoor=selectedLevel.biome==="swamp" || levelLocations.some((l)=>l.outdoorSurface || l.sceneryAssetId);
  const legacySurfaces=!!selLocation && !!(selLocation.wallAssetId || selLocation.floorAssetId || selLocation.ceilingAssetId);

  function editGrid(fn:(g:IsharGrid)=>EditResult){
    const g=selectedLevel.grid; if(!g) {setBuilderMessage("Edge-Level: zum Zeichnen „Als Raster-Kopie anlegen“ oder „Erweitert“ nutzen.");return;}
    if(g.game!=="ishar2"){setBuilderMessage("Ishar-1-Karte: Die Ishar-2-Zeichenwerkzeuge sind für dieses Format nicht verfügbar.");return;}
    const res=fn(g.layerB ? g : {...g,layerB:bytesToBase64(new Uint8Array(g.rows*g.cols))});
    if(res.ok) patchLevel({grid:res.grid});
    setBuilderMessage(res.message ?? (res.ok ? "" : "Nicht möglich."));
  }
  function patchGrid(patch:Partial<IsharGrid>){ if(selectedLevel.grid) patchLevel({grid:{...selectedLevel.grid,...patch}}); }
  function setStart(r:number,c:number,facing:Direction){
    let loc=locationAtCell(r,c); let locations=game.locations;
    if(!loc){ const p=ckAt(r,c); loc={id:`${selectedLevel.id}-start-${r}-${c}`,name:`Start ${r}/${c}`,description:"",x:p.x,y:p.y,levelId:selectedLevel.id,exits:[],itemIds:[],sceneKind:"corridor"}; locations=[...locations,loc]; }
    setGame({...game,locations,startLocationId:loc.id,startFacing:facing});
    setSelectedLocationId(loc.id);
  }
  function onCell(r:number,c:number,side:Direction){
    setCellSel({r,c}); const l=locationAtCell(r,c); if(l) setSelectedLocationId(l.id);
    if(tool==="select") return;
    if(tool==="start"){ if(viewGrid && !cellWalkable(viewGrid,r,c)) {setBuilderMessage("Start muss begehbar sein.");return;} if(!editable && !l){setBuilderMessage("Edge-Level: Start nur auf angelegten Feldern.");return;} setPreviewFacing(side); setStart(r,c,side); setBuilderMessage(`Start ${r}/${c}, Blick ${compassOf(side)}.`); return; }
    if(tool==="floor") editGrid((g)=>paintFloor(g,r,c));
    else if(tool==="wall") editGrid((g)=>paintWall(g,r,c));
    else if(tool==="edge") editGrid((g)=>{ const has=decomposeCode(cellA(g,r,c)).some((e)=>e>=1 && e<=8); return setEdge(g,r,c,side,!has); });
    else if(tool==="door") editGrid((g)=>{ const used=new Set<number>(); for(let i=0;i<g.rows*g.cols;i++){const d=doorNumber(cellB(g,Math.floor(i/g.cols),i%g.cols)); if(d!==undefined) used.add(d);} let n=doorNumber(cellB(g,r,c)) ?? 1; while(used.has(n) && doorNumber(cellB(g,r,c))!==n) n++; return setDoor(g,r,c,side,n); });
    else if(tool==="trap") editGrid((g)=>setTrap(g,r,c,trapAt(g,r,c) ? "none" : "crusher"));
    else if(tool==="niche") editGrid((g)=>setNiche(g,r,c,nicheSwitch(g,r,c)!==undefined ? undefined : 21));
    else if(tool==="scene") editGrid((g)=>setSceneTrigger(g,r,c,sceneTriggerAt(g,r,c)!==undefined ? undefined : (g.mapNumber===3 ? 10 : 31)));
  }
  function testHere(){
    if(viewGrid?.game==="ishar1"){setBuilderMessage("Diese CONT-Datei stammt aus Ishar 1. Für Thorm die CONT2.FIC aus Ishar 2 (10.800 Bytes) importieren.");return;}
    if(!sel || !viewGrid || !cellWalkable(viewGrid,sel.r,sel.c)) {setBuilderMessage("Wähle eine begehbare Zelle.");return;}
    if(!editable && !selLocation) {setBuilderMessage("Edge-Level: nur angelegte Felder.");return;}
    setStart(sel.r,sel.c,previewFacing); void navigate({to:"/playtest"});
  }
  function addBlankGridLevel(){
    if(!selectedLocation) return;
    let g:IsharGrid={game:"ishar2",rows:ISHAR2_ROWS,cols:ISHAR2_COLS,mapNumber:5,layerA:bytesToBase64(new Uint8Array(ISHAR2_ROWS*ISHAR2_COLS).fill(0xff)),layerB:bytesToBase64(new Uint8Array(ISHAR2_ROWS*ISHAR2_COLS)),source:{file:"Neues Raster",sha256:"",evidence:"suspected"}};
    for(let c=28;c<=32;c++) g=paintFloor(g,45,c).grid;
    applyGridResult(addGridLevel(game,g,selectedLocation.id,{r:45,c:30}),"Leeres Raster-Level (90×60, Karte 5 = Dungeon-Regeln) mit kurzem Gang angelegt.");
  }
  useEffect(()=>{
    const onKey=(ev:KeyboardEvent)=>{
      const t=ev.target as HTMLElement; if(["INPUT","TEXTAREA","SELECT"].includes(t.tagName)) return;
      if((ev.ctrlKey||ev.metaKey) && ev.key.toLowerCase()==="z"){ev.preventDefault(); ev.shiftKey ? redo() : undo(); return;}
      if((ev.ctrlKey||ev.metaKey) && ev.key.toLowerCase()==="y"){ev.preventDefault(); redo(); return;}
      const tl=TOOLS.find((x)=>x.key.toLowerCase()===ev.key.toLowerCase());
      if(tl && !ev.ctrlKey && !ev.metaKey && !ev.altKey && (editable || tl.id==="select" || tl.id==="start")) setTool(tl.id);
    };
    window.addEventListener("keydown",onKey); return ()=>window.removeEventListener("keydown",onKey);
  });
  const doorN=info?.door;

  return <section className="builder-r13">
    <header className="gb-top">
      <h1>Adventure Builder</h1>
      <span className="chip">{selectedLevel.name} · {selectedLevel.grid ? `Raster ${selectedLevel.grid.rows}×${selectedLevel.grid.cols}${selectedLevel.grid.mapNumber ? ` · Karte ${selectedLevel.grid.mapNumber}` : ""}` : "Edge-Modell"} · {outdoorScene ? "Außen/Stadt: Wandprüfung aus" : "Dungeon-Regeln (Wandprüfung)"}</span>
      {selectedLevel.grid?.source?.sha256 ? <span className="chip ok" title={selectedLevel.grid.source.sha256}>CONT {selectedLevel.grid.source.sha256.slice(0,8)}…</span> : null}
      <span className={`chip ${issues.length+problems.length ? "warn" : "ok"}`}>{issues.length+problems.length ? `${issues.length+problems.length} ${issues.length+problems.length===1 ? "Hinweis" : "Hinweise"}` : "Prüfung OK"}</span>
      <span className="gb-spacer"/>
      <button className="secondary" disabled={!canUndo} onClick={undo} title="Rückgängig (Strg+Z)">↶</button>
      <button className="secondary" disabled={!canRedo} onClick={redo} title="Wiederholen (Strg+Y)">↷</button>
      <label className="file-button secondary">CONT importieren<input hidden type="file" accept=".fic,.FIC" onChange={(event)=>{const file=event.target.files?.[0];if(file) void importContFile(file);event.target.value="";}}/></label>
      <button className="secondary" disabled={!selectedLevel.grid} onClick={exportGridLevel}>CONT exportieren</button>
      <button onClick={testHere} disabled={selectedLevel.grid?.game==="ishar1"}>▶ Ab hier testen</button>
    </header>
    {builderMessage && <p className="audit-note builder-message">{builderMessage}</p>}
    {selectedLevel.grid && <p className="audit-note">{selectedLevel.grid.game==="ishar2" ? "Ishar 2 · zwei Kartenebenen" : "Ishar 1 · eine Kartenebene. Kartenansicht und Export verfügbar; der Ishar-2-Renderer und dessen Zeichenwerkzeuge sind nicht anwendbar."}</p>}
    <div className="gb-body">
      <aside className="gb-panel gb-left">
        <h3>Level &amp; Übergänge</h3>
        {game.levels.map((level)=><button key={level.id} className={`gb-level ${level.id===selectedLevel.id ? "on" : ""}`} onClick={()=>{setSelectedLevelId(level.id);setCellSel(undefined);setSelectedLocationId(game.locations.find((location)=>(location.levelId || "level-1")===level.id)?.id || "");setBuilderMessage("");}}>
          {level.name}<small>{level.grid ? `Raster${level.grid.mapNumber ? " · Karte "+level.grid.mapNumber : ""}` : "Edge-Modell"} · {game.locations.filter((l)=>(l.levelId || "level-1")===level.id).length} Orte</small></button>)}
        <label>Neues Level<select value="" onChange={(event)=>{const v=event.target.value;event.target.value="";if(v==="grid") addBlankGridLevel(); else if(v==="test") addGridTestArea(); else if(v==="swamp") addSwampTestArea(); else if(v) addLevel(v as AuthoredLevel["kind"]);}}>
          <option value="">+ Level anlegen …</option><option value="grid">Raster-Dungeon (leer, empfohlen)</option><option value="test">Raster-Testebene (synthetisch)</option>
          <optgroup label="Edge-Modell (alt)"><option value="dungeon">Dungeon</option><option value="house">Haus / Innenraum</option><option value="outdoor">Oberwelt</option></optgroup>
          <option value="swamp">Sumpf-Testgebiet (CK-Preset)</option></select></label>
        <label>Name<input value={selectedLevel.name} onChange={(event)=>patchLevel({name:event.target.value})}/></label>
        {!selectedLevel.grid && <label>Typ<select value={selectedLevel.kind} onChange={(event)=>patchLevel({kind:event.target.value as AuthoredLevel["kind"]})}><option value="dungeon">Dungeon</option><option value="house">Haus / Innenraum</option><option value="outdoor">Oberwelt</option></select></label>}
        {selectedLevel.grid && <label>Karte (Regeln/Renderer)<select value={selectedLevel.grid.mapNumber ?? 5} onChange={(event)=>patchGrid({mapNumber:Number(event.target.value)})}>{[1,2,3,4,5,6,7].map((m)=><option key={m} value={m}>{m} · {({1:"Irvan (Außen)",2:"Thorm (Wald)",3:"Zach (Stadt)",4:"Jon (Gebirge)",5:"Dungeon",6:"Dungeon",7:"Dungeon"} as Record<number,string>)[m]}</option>)}</select></label>}
        <label>Asset-Set<select value={selectedLevel.tilesetId || ""} onChange={(event)=>patchLevel({tilesetId:event.target.value || undefined})}><option value="">Pack-Standard</option>{pack?.manifest.tilesets.map((tileset)=><option key={tileset.id} value={tileset.id}>{tileset.name}</option>)}</select></label>
        {!selectedLevel.grid && <button className="secondary" onClick={convertCurrentLevel}>Als Raster-Kopie anlegen</button>}
        <h3>Übergänge</h3>
        {game.portals.filter((p)=>levelLocations.some((l)=>l.id===p.fromLocationId || l.id===p.toLocationId)).map((portal)=><p key={portal.id} className="gb-portal">{portal.label}<button className="secondary compact" onClick={()=>setGame({...game,portals:game.portals.filter((entry)=>entry.id!==portal.id)})}>×</button></p>)}
        {selLocation && <label>Übergang ab {selLocation.name}<select defaultValue="" onChange={(event)=>{const to=event.target.value;if(!to)return;const target=game.locations.find((location)=>location.id===to);setGame({...game,portals:[...game.portals,{id:`portal-${Date.now()}`,fromLocationId:selLocation.id,toLocationId:to,label:`Nach ${target?.name ?? to}`}]});event.target.value="";}}><option value="">Zielort wählen</option>{game.locations.filter((location)=>(location.levelId || "level-1")!==selectedLevel.id).map((location)=><option key={location.id} value={location.id}>{game.levels.find((level)=>level.id===(location.levelId || "level-1"))?.name}: {location.name}</option>)}</select></label>}
        <h3>Ebenen</h3>
        {([["shape","Ebene A (Form, Kanten)"],["logic","Türen / Schalter (B)"],["scene","Szenenauslöser"],["traps","Fallen"],["hex","Rohbytes (hex, ab Zoom 18)"]] as const).map(([k,label])=><label key={k} className="check-row"><input type="checkbox" checked={layers[k]} onChange={(e)=>setLayers({...layers,[k]:e.target.checked})}/> {label}</label>)}
        <label>Zoom<select value={mapSize} onChange={(e)=>setMapSize(Number(e.target.value))}>{[10,14,18,24].map((s)=><option key={s} value={s}>{s} px</option>)}</select></label>
        <div className="gb-tabs">{(["karte","gruppe","items","quests","begegnungen","tueren","npcs","original"] as const).map((t)=><button key={t} className={tab===t ? "" : "secondary"} onClick={()=>setTab(t)}>{({karte:"Karte",gruppe:"Gruppe",items:"Items",quests:"Quests",begegnungen:"Begegnungen",tueren:"Türen (Edge)",npcs:"NPCs & Händler",original:"Originalskripte"} as Record<string,string>)[t]}</button>)}</div>
      </aside>

      <main className="gb-panel gb-center">
        {tab==="karte" ? <>
          <div className="gb-tools">{TOOLS.map((t)=><button key={t.id} title={t.hint} disabled={!editable && !["select","start"].includes(t.id)} className={tool===t.id ? "" : "secondary"} onClick={()=>setTool(t.id)}><kbd>{t.key}</kbd> {t.label}</button>)}</div>
          {!editable && <p className="muted">Edge-Level: Ansicht über die Laufzeit-Umrechnung (nur lesen). Zeichnen nach „Als Raster-Kopie anlegen“; bisherige Bearbeitung unter „Erweitert“.</p>}
          {viewGrid ? <GridMap grid={viewGrid} selected={sel} party={startHere ? {...cellOfLocation(startHere),facing:game.startFacing} : undefined} tool={tool} layers={layers} size={mapSize} editable={editable} onCell={onCell}/>
            : <p className="muted">{edgeBuilt && !edgeBuilt.ok ? edgeBuilt.error : "Kein Raster."}</p>}
          <div className="gb-legend"><span><i className="gb-sw floor"/>Boden</span><span><i className="gb-sw wall"/>Mauer 0xFF</span><span><i className="gb-sw edge"/>dünne Kante</span><span><i className="gb-sw door"/>Tür (Nr.)</span><span><i className="gb-sw niche"/>Nische/Schalter</span><span><i className="gb-sw plate"/>Druckplatte</span><span><i className="gb-sw trap"/>Falle</span><span><i className="gb-sw party"/>Start</span><span>Kompass: N oben, O rechts (Original)</span></div>
          <details className="gb-advanced"><summary>Erweitert (Edge-Modell: Verbindungen, Raumflächen, Rohwerte)</summary>
            {selectedLocation && !selectedLevel.grid && <>
              <div className="neighbor-grid">
                {(["east","south","west","north"] as Direction[]).map((direction)=>{
                  const vector=DIRECTION_VECTORS[direction];
                  const target=locationAt(game.locations,selectedLocation.x+vector.x,selectedLocation.y+vector.y,selectedLocation.levelId || "level-1");
                  const linked=!!target && selectedLocation.exits.includes(target.id) && target.exits.includes(selectedLocation.id);
                  return <div className={`neighbor-card ${linked ? "linked" : ""}`} key={direction}>
                    <strong>{compassOf(direction)}</strong>
                    {!target ? <><span>freies Feld</span><button onClick={()=>createAdjacent(selectedLocation.id,direction)}>+ Feld</button></>
                      : <><span>{target.name}</span><button onClick={()=>setConnection(selectedLocation.id,target.id,!linked)}>{linked ? "Trennen" : "Verbinden"}</button></>}
                  </div>;
                })}
              </div>
              <div className="room-build-controls">
                <label>Szenentyp<select value={selectedLocation.sceneKind??"corridor"} onChange={(event)=>patchLocation(selectedLocation.id,{sceneKind:event.target.value as AuthoredLocation["sceneKind"],roomGroupId:event.target.value==="room" ? selectedLocation.roomGroupId : undefined})}><option value="corridor">Gang</option><option value="room">Raum</option><option value="outdoor">Außenwelt</option></select></label>
                <label>Breite<input type="number" min="2" max="5" value={roomWidth} onChange={(event)=>setRoomWidth(Number(event.target.value))}/></label>
                <label>Tiefe<input type="number" min="2" max="5" value={roomHeight} onChange={(event)=>setRoomHeight(Number(event.target.value))}/></label>
                <button onClick={addRoomBlock}>Raumfläche anlegen</button>
              </div>
              <label>Verbindungen (IDs, Komma)<input value={selectedLocation.exits.join(", ")} onChange={(e)=>patchLocation(selectedLocation.id,{exits:csv(e.target.value)})}/></label>
              <button className="secondary" onClick={addDoor}>Tür zum ersten Ausgang anlegen (Edge)</button>
              {legacyOutdoor && selectedLocation.sceneKind==="outdoor" && <div className="room-surface-picker"><strong>CK-Oberwelt (altes Preset)</strong>
                {selectedLevel.kind==="outdoor" && <label>Landschaft<select value={selectedLevel.biome||""} onChange={(event)=>patchLevel({biome:event.target.value==="swamp" ? "swamp" : undefined})}><option value="">Allgemeine Außenwelt</option><option value="swamp">Sumpf (CK-Heuristik)</option></select></label>}
                <label>Gelände<select value={selectedLocation.outdoorSurface??"grass"} onChange={(event)=>setOutdoorSurface(selectedLocation.id,event.target.value as "grass"|"water")}><option value="grass">Gras · begehbar</option><option value="water">Wasser · unpassierbar</option></select></label>
                <label>Kulisse<select value={selectedLocation.sceneryAssetId??""} onChange={(event)=>patchLocation(selectedLocation.id,{sceneryAssetId:event.target.value||undefined})}><option value="">automatisch</option><optgroup label="Häuser">{houseAssets.map((asset)=><option key={asset.id} value={asset.id}>{asset.path}</option>)}</optgroup><optgroup label="Pflanzen">{plantAssets.map((asset)=><option key={asset.id} value={asset.id}>{asset.path}</option>)}</optgroup></select></label></div>}
            </>}
            {selectedLevel.grid && sel && <div className="row2"><label>Ebene A (roh, signed)<input type="number" value={cellA(selectedLevel.grid,sel.r,sel.c)} onChange={(e)=>editGrid((g)=>({ok:true,grid:setGridCell(g,"A",sel.r,sel.c,Number(e.target.value))}))}/></label><label>Ebene B (roh, signed)<input type="number" value={cellB(selectedLevel.grid,sel.r,sel.c)} onChange={(e)=>editGrid((g)=>({ok:true,grid:setGridCell(g,"B",sel.r,sel.c,Number(e.target.value))}))}/></label></div>}
            {legacySurfaces && selLocation && <p className="audit-note">Dieses Feld hat alte Wand/Boden/Decken-Texturen gesetzt. Sie wirken nur im SVG-Fallback ohne Asset-Pack; die Originalansicht zeichnet Originalsprites. <button className="secondary compact" onClick={()=>patchLocation(selLocation.id,{wallAssetId:undefined,floorAssetId:undefined,ceilingAssetId:undefined})}>Entfernen</button></p>}
          </details>
        </> : tab==="gruppe" ? <article className="editor-panel">
          <h2>Gruppe</h2>
          {game.characters.map((ch) => <div key={ch.id} className="author-block">
            <label>Name<input value={ch.name} onChange={(e)=>setGame({...game,characters:game.characters.map(x=>x.id===ch.id?{...x,name:e.target.value}:x)})}/></label>
            <div className="inline-fields">
              <label>HP<input type="number" min="1" value={ch.hp} onChange={(e)=>setGame({...game,characters:game.characters.map(x=>x.id===ch.id?{...x,hp:Number(e.target.value)}:x)})}/></label>
              <label>Angriff<input type="number" min="1" value={ch.attack} onChange={(e)=>setGame({...game,characters:game.characters.map(x=>x.id===ch.id?{...x,attack:Number(e.target.value)}:x)})}/></label>
            </div>
            <details className="character-author-details"><summary>Charakterblatt-Werte</summary>
              <div className="inline-fields">
                {([["race","Volk"],["profession","Beruf"]] as const).map(([f,l])=><label key={f}>{l}<input value={ch[f] ?? ""} onChange={(e)=>setGame({...game,characters:game.characters.map(x=>x.id===ch.id?{...x,[f]:e.target.value}:x)})}/></label>)}
                {([["level","Level"],["experience","Erfahrung"],["physical","Körperlich"],["psychic","Geistig"],["alignment","Gesinnung"]] as const).map(([f,l])=><label key={f}>{l}<input type="number" value={ch[f] ?? ""} onChange={(e)=>setGame({...game,characters:game.characters.map(x=>x.id===ch.id?{...x,[f]:e.target.value===""?undefined:Number(e.target.value)}:x)})}/></label>)}
              </div>
            </details>
            {game.characters.length>1 && <button className="danger-button compact" onClick={()=>setGame({...game,characters:game.characters.filter((entry)=>entry.id!==ch.id)})}>Aus Gruppe entfernen</button>}
          </div>)}
          <button disabled={game.characters.length>=5} onClick={()=>{let n=game.characters.length+1;while(game.characters.some((entry)=>entry.id===`hero-${n}`))n++;setGame({...game,characters:[...game.characters,{id:`hero-${n}`,name:`Figur ${n}`,hp:18,attack:4}]});}}>Figur hinzufügen ({game.characters.length}/5)</button>
        </article> : tab==="quests" ? <article className="editor-panel">
          <h2>Quest</h2>
          {game.quests.map((q) => <div key={q.id} className="author-block">
            <label>Titel<input value={q.title} onChange={(e)=>setGame({...game,quests:game.quests.map(x=>x.id===q.id?{...x,title:e.target.value}:x)})}/></label>
            <label>Ziel<textarea rows={3} value={q.objective} onChange={(e)=>setGame({...game,quests:game.quests.map(x=>x.id===q.id?{...x,objective:e.target.value}:x)})}/></label>
            <label>Abschlusstext<textarea rows={3} value={q.completedText} onChange={(e)=>setGame({...game,quests:game.quests.map(x=>x.id===q.id?{...x,completedText:e.target.value}:x)})}/></label>
          </div>)}
        </article> : tab==="items" ? <article className="editor-panel">
          <h2>Items</h2>
          {game.items.map((item) => <div key={item.id} className="author-block">
            <label>Name<input value={item.name} onChange={(e)=>setGame({...game,items:game.items.map(x=>x.id===item.id?{...x,name:e.target.value}:x)})}/></label>
            <label>Beschreibung<textarea rows={3} value={item.description} onChange={(e)=>setGame({...game,items:game.items.map(x=>x.id===item.id?{...x,description:e.target.value}:x)})}/></label>
            {pack && <div className="item-distance-assets"><strong>Distanz-Sprites</strong>
              {([["assetNearId","Nah (aktueller Raum)"],["assetMidId","Mittel (1 Raum)"],["assetFarId","Fern (2 Räume)"]] as const).map(([field,label])=>{
                const selectedId=item[field] ?? (field==="assetNearId" ? item.assetId : undefined); const selectedAsset=assetById(selectedId);
                return <label key={field}>{label}
                  <select value={selectedId ?? ""} onChange={(e)=>setGame({...game,items:game.items.map(x=>x.id===item.id?{...x,[field]:e.target.value || undefined,...(field==="assetNearId"?{assetId:undefined}:{})}:x)})}>
                    <option value="">Automatik / Fallback</option>
                    {itemAssetCandidates.map((asset)=><option key={asset.id} value={asset.id}>{asset.knownUse ? asset.knownUse+" · " : ""}{asset.path} · {asset.width}×{asset.height}</option>)}
                  </select>
                  {selectedAsset && <div className="surface-preview"><img src={selectedAsset.url} alt=""/><code>{selectedAsset.path}</code></div>}
                  {selectedAsset?.distanceSetId && <button type="button" className="secondary" onClick={()=>applyDistanceSet(item.id,selectedAsset.distanceSetId!)}>Ganzes Distanzset übernehmen</button>}
                </label>;
              })}
            </div>}
          </div>)}
        </article> : tab==="original" ? <><OriginalMerchantEditor /><OriginalActorInspector /></> : tab==="npcs" ? <NpcEditor game={game} onChange={setGame} pack={pack}/> : tab==="begegnungen" ? <article className="editor-panel">
          <h2>Begegnungen</h2>
          {game.encounters.map((enc) => <div key={enc.id} className="author-block">
            <label>Name<input value={enc.name} onChange={(e)=>setGame({...game,encounters:game.encounters.map(x=>x.id===enc.id?{...x,name:e.target.value}:x)})}/></label>
            <div className="inline-fields">
              <label>HP<input type="number" min="1" value={enc.enemyHp} onChange={(e)=>setGame({...game,encounters:game.encounters.map(x=>x.id===enc.id?{...x,enemyHp:Number(e.target.value)}:x)})}/></label>
              <label>Angriff<input type="number" min="0" value={enc.enemyAttack} onChange={(e)=>setGame({...game,encounters:game.encounters.map(x=>x.id===enc.id?{...x,enemyAttack:Number(e.target.value)}:x)})}/></label>
            </div>
            <label>Siegtext<textarea rows={3} value={enc.victoryText} onChange={(e)=>setGame({...game,encounters:game.encounters.map(x=>x.id===enc.id?{...x,victoryText:e.target.value}:x)})}/></label>
          </div>)}
        </article> : <article className="editor-panel">
          <h2>Türen (Edge-Modell)</h2>
          <p className="muted">Türen von Edge-Leveln. Holz oder Gitter folgt der Szene (PCAVE-Regel), nicht der Parität der Nummer. Raster-Türen bearbeitest du im Inspektor.</p>
          {game.doors.length ? game.doors.map((door) => <div key={door.id} className="author-block">
            <label>ID<input value={door.id} readOnly/></label>
            <div className="inline-fields">
              <label>Von<select value={door.fromLocationId} onChange={(e)=>patchDoor(door.id,{fromLocationId:e.target.value})}>{game.locations.map((location)=><option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
              <label>Nach<select value={door.toLocationId} onChange={(e)=>patchDoor(door.id,{toLocationId:e.target.value})}>{game.locations.map((location)=><option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
            </div>
            <label>Schlüssel-Item<select value={door.keyItemId ?? ""} onChange={(e)=>patchDoor(door.id,{keyItemId:e.target.value || undefined})}><option value="">kein Schlüssel</option>{game.items.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="check-row"><input type="checkbox" checked={door.initiallyOpen} onChange={(e)=>patchDoor(door.id,{initiallyOpen:e.target.checked})}/> Zu Spielbeginn offen</label>
            <label>Original-Türnummer<input type="number" min="1" max="49" value={door.originalIndex ?? ""} placeholder="keine" onChange={(e)=>patchDoor(door.id,{originalIndex:e.target.value==="" ? undefined : Number(e.target.value)})}/></label>
            <button className="danger-button compact" onClick={()=>deleteDoor(door.id)}>Tür löschen</button>
          </div>) : <p className="muted">Keine Edge-Türen.</p>}
        </article>}
      </main>

      <aside className="gb-panel gb-right">
        <h3>Inspektor{sel ? ` · Zelle r${sel.r} c${sel.c}` : ""}</h3>
        {info ? <>
          <div className="row2"><label>Ebene A<input readOnly value={info.aText}/></label><label>Ebene B<input readOnly value={info.bText}/></label></div>
          {info.edges.length>0 && <p className="muted">Kanten: {info.edges.join(", ")}</p>}
          {editable && doorN!==undefined && <div className="gb-door-edit">
            <div className="row2">
              <label>Originalnummer<input type="number" min="1" max="49" value={doorN} onChange={(e)=>editGrid((g)=>({ok:true,grid:setGridCell(g,"B",sel!.r,sel!.c,60+Math.max(1,Math.min(49,Number(e.target.value))))}))}/></label>
              <label>Zu Beginn<select value={selectedLevel.grid!.doorsInitiallyOpen?.[doorN] ? "open" : "closed"} onChange={(e)=>patchGrid({doorsInitiallyOpen:{...selectedLevel.grid!.doorsInitiallyOpen,[doorN]:e.target.value==="open"}})}><option value="closed">zu</option><option value="open">offen</option></select></label>
            </div>
            <label>Schlüssel<select value={selectedLevel.grid!.doorKeys?.[doorN] ?? ""} onChange={(e)=>{const k={...selectedLevel.grid!.doorKeys};if(e.target.value) k[doorN]=e.target.value; else delete k[doorN];patchGrid({doorKeys:k});}}><option value="">kein Schlüssel</option>{game.items.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            {[48,24,25,26,27,28,29,8,30,12,13,5,9,17].includes(doorN) && <p className="muted">Originalmechanik: {({48:"öffnet bei Schaltern 21–26",24:"Waage gelöst",25:"Waage",26:"Waage",27:"Waage",28:"Zeittür (Stunde 1 auf, 4 zu)",29:"Gegenstand −21 / Zauber 18",8:"Gegenstand −17 / Zauber 18",30:"Gegenstand −22 (0x50ab)",12:"Druckplatte 4",13:"Druckplatten 2/3",5:"schließt nach jedem Schritt",9:"schließt nach jedem Schritt",17:"schließt nach jedem Schritt"} as Record<number,string>)[doorN]}</p>}
            <button className="secondary compact" onClick={()=>editGrid((g)=>({ok:true,grid:setGridCell(g,"B",sel!.r,sel!.c,0)}))}>Tür entfernen</button>
          </div>}
          {editable && info.niche!==undefined && <label>Schalter (0x4ad8)<input type="number" min="1" max="49" value={info.niche} onChange={(e)=>editGrid((g)=>setNiche(g,sel!.r,sel!.c,Number(e.target.value)))}/></label>}
          {editable && info.scene!==undefined && <label>Szenentyp<input type="number" value={info.scene} onChange={(e)=>editGrid((g)=>setSceneTrigger(g,sel!.r,sel!.c,Number(e.target.value)))}/></label>}
          {editable && info.trap && <label>Falle<select value={info.trap.kind==="crusher" ? "crusher" : `wall${info.trap.variant}`} onChange={(e)=>editGrid((g)=>setTrap(g,sel!.r,sel!.c,e.target.value as "crusher"))}><option value="crusher">Fallblock (B −9)</option><option value="wall0">Wandfalle 0 (B −64)</option><option value="wall1">Wandfalle 1</option><option value="wall2">Wandfalle 2</option><option value="wall3">Wandfalle 3</option><option value="none">keine</option></select></label>}
          {selLocation ? <div className="gb-location">
            <label>Ort<input value={selLocation.name} onChange={(e)=>patchLocation(selLocation.id,{name:e.target.value})}/></label>
            <label>Beschreibung<textarea rows={2} value={selLocation.description} onChange={(e)=>patchLocation(selLocation.id,{description:e.target.value})}/></label>
            <label>Begegnung<select value={selLocation.encounterId ?? ""} onChange={(e)=>patchLocation(selLocation.id,{encounterId:e.target.value || undefined})}><option value="">keine</option>{game.encounters.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
            <div className="gb-items"><span>Items</span>{game.items.map((item)=><label key={item.id} className="check-row"><input type="checkbox" checked={selLocation.itemIds.includes(item.id)} onChange={(e)=>patchLocation(selLocation.id,{itemIds:e.target.checked ? [...selLocation.itemIds,item.id] : selLocation.itemIds.filter((x)=>x!==item.id)})}/> {item.name}</label>)}</div>
            <div className="gb-items"><span>NPCs & Händler</span>{(game.npcs??[]).map(npc=><label key={npc.id} className="check-row"><input type="checkbox" checked={selLocation.npcIds?.includes(npc.id)??false} onChange={e=>patchLocation(selLocation.id,{npcIds:e.target.checked?[...(selLocation.npcIds??[]),npc.id]:(selLocation.npcIds??[]).filter(id=>id!==npc.id)})}/>{npc.name}</label>)}</div>
            <label className="check-row"><input type="checkbox" checked={!!selLocation.ending} onChange={(e)=>patchLocation(selLocation.id,{ending:e.target.checked})}/> Abschluss-Feld</label>
            <button className="danger-button compact" disabled={levelLocations.length<=1 || selLocation.id===game.startLocationId} onClick={()=>deleteLocation(selLocation.id)}>Ort löschen</button>
          </div> : editable && viewGrid && cellWalkable(viewGrid,sel!.r,sel!.c) && <button className="secondary" onClick={()=>{const p=ckAt(sel!.r,sel!.c);const id=`${selectedLevel.id}-loc-${sel!.r}-${sel!.c}`;setGame({...game,locations:[...game.locations,{id,name:`Ort ${sel!.r}/${sel!.c}`,description:"",x:p.x,y:p.y,levelId:selectedLevel.id,exits:[],itemIds:[],sceneKind:"corridor"}]});setSelectedLocationId(id);}}>Ort hier anlegen (Name, Items, Begegnung)</button>}
        </> : <p className="muted">Zelle in der Karte wählen.</p>}
        <h3>Vorschau</h3>
        <div className="gb-preview">{previewLocation ? <DungeonViewport game={editable ? expandedGame : game} location={previewLocation} facing={previewFacing} encounterDone={true} collectedItemIds={[]} pack={pack} openDoors={(editable ? expandedGame : game).doors.filter((d)=>d.initiallyOpen).map((d)=>d.id)} gridSceneType={selectedLevel.grid?.startSceneType}/> : <p className="muted">Begehbare Zelle wählen.</p>}</div>
        <div className="row2"><button className="secondary" onClick={()=>setPreviewFacing(({east:"south",south:"west",west:"north",north:"east"} as Record<Direction,Direction>)[previewFacing])}>⟳ Drehen ({compassOf(previewFacing)})</button><button className="secondary" onClick={testHere}>Blick testen</button></div>
        <h3>Prüfung</h3>
        {!outdoorScene ? null : <p className="muted">Karte 1–4: Wandregel-Prüfung aus (Außen ausgenommen; Stadtcodes Karte 3 noch nicht dekodiert).</p>}
        {[...issues.map((i,k)=><div key={`g${k}`} className={`gb-issue ${i.level}`}>{i.message} <button className="secondary compact" onClick={()=>{setCellSel({r:i.r,c:i.c});setTab("karte");}}>Springen</button>{i.fix && <button className="secondary compact" onClick={()=>editGrid((g)=>({ok:true,grid:i.fix!(g),message:"Behoben."}))}>{i.fixLabel}</button>}</div>),
          ...problems.map((p,k)=>{const loc=game.locations.find((l)=>p.path===`location.${l.id}`);return <div key={`p${k}`} className="gb-issue warn"><code>{p.path}</code> — {p.message}{loc && <button className="secondary compact" onClick={()=>{setSelectedLevelId(loc.levelId || "level-1");setSelectedLocationId(loc.id);setCellSel(undefined);}}>Springen</button>}</div>;})]}
        {!issues.length && !problems.length && <p className="muted">Keine Hinweise.</p>}
      </aside>
    </div>
  </section>;
}
