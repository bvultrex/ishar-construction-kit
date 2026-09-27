import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useKit } from "@/lib/store";
import { useAssetPack } from "@/lib/asset-store";
import { DIRECTION_LABELS, DIRECTION_VECTORS, locationAt } from "@/lib/ishar/dungeon";
import { createRoomBlock } from "@/lib/ishar/room-builder";
import { createSwampTestArea } from "@/lib/ishar/swamp-area";
import { assetCatalogGroup } from "@/lib/ishar/asset-catalog";
import { validateGame } from "@/lib/ishar/project-validation";
import type { AuthoredDoor, AuthoredGame, AuthoredLevel, AuthoredLocation, Direction } from "@/lib/ishar/types";

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
  const { project, setProject } = useKit();
  const pack = useAssetPack((s) => s.pack);
  const game = project.game;
  const problems = validateGame(game);
  const [selectedLocationId, setSelectedLocationId] = useState(game.startLocationId);
  const [builderMessage, setBuilderMessage] = useState("");
  const [surfaceSearch, setSurfaceSearch] = useState("");
  const [roomWidth,setRoomWidth]=useState(2);
  const [roomHeight,setRoomHeight]=useState(2);
  const [newLevelKind,setNewLevelKind]=useState<AuthoredLevel["kind"]>("dungeon");
  const [selectedLevelId,setSelectedLevelId]=useState(game.locations.find((location)=>location.id===game.startLocationId)?.levelId || "level-1");
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

  function setGame(next: AuthoredGame) {
    setProject({ ...project, game: next });
  }

  function patchLocation(id: string, patch: Partial<AuthoredLocation>) {
    setGame({ ...game, locations: game.locations.map((x) => x.id === id ? { ...x, ...patch } : x) });
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

  return <section>
    <header className="page-head">
      <div><p className="eyebrow">Welt und Dungeon bauen</p><h1>Adventure Builder</h1><p>Baue Gänge, zusammenhängende Raumflächen und offene Außenweltfelder im kardinalen Raster. Beidseitige Verbindungen bestimmen die Bewegung.</p></div>
      <div className="toolbar"><Link className="file-button" to="/playtest">Dungeon betreten</Link><Link className="file-button" to="/assets">Asset Lab</Link><button className="secondary" onClick={addDoor}>Tür hinzufügen</button></div>
    </header>

    <article className="stone-card level-builder">
      <div><p className="eyebrow">Level-Ebenen</p><h2>{selectedLevel.name}</h2><p>Jedes Level hat ein eigenes Raster und ein Asset-Set. Übergänge verbinden die Ebenen im Playtest.</p></div>
      <label>Aktives Level<select value={selectedLevel.id} onChange={(event)=>{const id=event.target.value;setSelectedLevelId(id);setSelectedLocationId(game.locations.find((location)=>(location.levelId || "level-1")===id)?.id || "");setBuilderMessage("");}}>{game.levels.map((level)=><option key={level.id} value={level.id}>{level.name}</option>)}</select></label>
      <label>Name<input value={selectedLevel.name} onChange={(event)=>patchLevel({name:event.target.value})}/></label>
      <label>Typ<select value={selectedLevel.kind} onChange={(event)=>patchLevel({kind:event.target.value as AuthoredLevel["kind"]})}><option value="dungeon">Dungeon</option><option value="house">Haus / Innenraum</option><option value="outdoor">Oberwelt</option></select></label>
      {selectedLevel.kind==="outdoor" && <label>Landschaft<select value={selectedLevel.biome||""} onChange={(event)=>patchLevel({biome:event.target.value==="swamp" ? "swamp" : undefined})}><option value="">Allgemeine Außenwelt</option><option value="swamp">Sumpf · Testszene</option></select></label>}
      <label>Asset-Set<select value={selectedLevel.tilesetId || ""} onChange={(event)=>patchLevel({tilesetId:event.target.value || undefined})}><option value="">Pack-Standard</option>{pack?.manifest.tilesets.map((tileset)=><option key={tileset.id} value={tileset.id}>{tileset.name}</option>)}</select></label>
      <div className="level-create"><label>Neues Level<select value={newLevelKind} onChange={(event)=>setNewLevelKind(event.target.value as AuthoredLevel["kind"])}><option value="dungeon">Dungeon</option><option value="house">Haus / Innenraum</option><option value="outdoor">Oberwelt</option></select></label><button onClick={()=>addLevel(newLevelKind)}>Level anlegen</button></div>
      <button className="secondary" onClick={addSwampTestArea}>Sumpf-Testgebiet anlegen</button>
    </article>

    <div className="stats-grid file-stats">
      <article><span>Level</span><strong>{game.levels.length}</strong></article>
      <article><span>Felder</span><strong>{levelLocations.length}</strong></article>
      <article><span>Items</span><strong>{game.items.length}</strong></article>
      <article><span>Begegnungen</span><strong>{game.encounters.length}</strong></article>
      <article><span>Quests</span><strong>{game.quests.length}</strong></article>
      <article><span>Raster</span><strong>{problems.length ? problems.length : "OK"}</strong></article>
    </div>

    {builderMessage && <p className="audit-note builder-message">{builderMessage}</p>}
    {problems.length > 0 && <article className="stone-card validation-card"><h2>Dungeon-Geometrie prüfen</h2><ul>{problems.map((p, i) => <li key={i}><code>{p.path}</code> — {p.message}</li>)}</ul></article>}

    <div className="map-builder-grid">
      <article className="stone-card map-card">
        <div className="map-card-head"><div><p className="eyebrow">Live map</p><h2>{selectedLevel.name}</h2></div><span className="audit-chip">{levelLocations.length} Felder</span></div>
        <DungeonMap game={game} levelId={selectedLevel.id} selectedId={selectedLocation?.id ?? ""} onSelect={(id)=>{setSelectedLocationId(id);setBuilderMessage("");}}/>
      </article>
      <article className="editor-panel selected-room-panel">
        <p className="eyebrow">Bearbeitungsfokus</p>
        <h2>{selectedLocation?.name ?? "Kein Raum"}</h2>
        {selectedLocation && <>
          <p className="selected-room-coord">Raster {selectedLocation.x},{selectedLocation.y} · <code>{selectedLocation.id}</code></p>
          <div className="neighbor-grid">
            {(["north","east","south","west"] as Direction[]).map((direction)=>{
              const vector=DIRECTION_VECTORS[direction];
              const target=locationAt(game.locations,selectedLocation.x+vector.x,selectedLocation.y+vector.y,selectedLocation.levelId || "level-1");
              const linked=!!target && selectedLocation.exits.includes(target.id) && target.exits.includes(selectedLocation.id);
              return <div className={`neighbor-card ${linked ? "linked" : ""}`} key={direction}>
                <strong>{DIRECTION_LABELS[direction]}</strong>
                {!target ? <>
                  <span>freies Feld</span>
                  <button onClick={()=>createAdjacent(selectedLocation.id,direction)}>+ Raum</button>
                </> : <>
                  <span>{target.name}</span>
                  <button className="secondary" onClick={()=>setSelectedLocationId(target.id)}>Auswählen</button>
                  <button onClick={()=>setConnection(selectedLocation.id,target.id,!linked)}>{linked ? "Trennen" : "Verbinden"}</button>
                </>}
              </div>;
            })}
          </div>
          <div className="selected-room-actions">
            <label>Startfeld<select value={game.startLocationId} onChange={(e)=>setGame({...game,startLocationId:e.target.value})}>{game.locations.map(l=><option key={l.id} value={l.id}>{l.name} ({l.x},{l.y})</option>)}</select></label>
            <label>Blickrichtung<select value={game.startFacing} onChange={(e)=>setGame({...game,startFacing:e.target.value as Direction})}><option value="north">Norden</option><option value="east">Osten</option><option value="south">Süden</option><option value="west">Westen</option></select></label>
          </div>
          <div className="room-build-controls">
            <label>Szenentyp<select value={selectedLocation.sceneKind??"corridor"} onChange={(event)=>patchLocation(selectedLocation.id,{sceneKind:event.target.value as AuthoredLocation["sceneKind"],roomGroupId:event.target.value==="room" ? selectedLocation.roomGroupId : undefined})}><option value="corridor">Gang</option><option value="room">Raum</option><option value="outdoor">Außenwelt · ohne Wände</option></select></label>
            <label>Breite<input type="number" min="2" max="5" value={roomWidth} onChange={(event)=>setRoomWidth(Number(event.target.value))}/></label>
            <label>Tiefe<input type="number" min="2" max="5" value={roomHeight} onChange={(event)=>setRoomHeight(Number(event.target.value))}/></label>
            <button onClick={addRoomBlock}>Raumfläche anlegen</button>
          </div>
          <p className="muted">Die ausgewählte Zelle ist die nordwestliche Ecke. Raumflächen verbinden alle Nachbarfelder im Rechteck; dazwischen stehen keine Wände.</p>
          <div className="level-portals"><strong>Levelübergänge</strong>{game.portals.filter((portal)=>portal.fromLocationId===selectedLocation.id || portal.toLocationId===selectedLocation.id).map((portal)=>{const targetId=portal.fromLocationId===selectedLocation.id ? portal.toLocationId : portal.fromLocationId;const target=game.locations.find((location)=>location.id===targetId);return <p key={portal.id}>{portal.label} → {target?.name ?? targetId} <button className="secondary" onClick={()=>setGame({...game,portals:game.portals.filter((entry)=>entry.id!==portal.id)})}>Entfernen</button></p>})}<label>Mit anderem Level verbinden<select defaultValue="" onChange={(event)=>{const to=event.target.value;if(!to)return;const id=`portal-${Date.now()}`;const target=game.locations.find((location)=>location.id===to);setGame({...game,portals:[...game.portals,{id,fromLocationId:selectedLocation.id,toLocationId:to,label:`Nach ${target?.name ?? to}`}]});event.target.value="";}}><option value="">Zielort wählen</option>{game.locations.filter((location)=>(location.levelId || "level-1")!==(selectedLocation.levelId || "level-1")).map((location)=><option key={location.id} value={location.id}>{game.levels.find((level)=>level.id===(location.levelId || "level-1"))?.name}: {location.name}</option>)}</select></label></div>
          {selectedLocation.sceneKind==="outdoor" && <div className="room-surface-picker"><label>Gelände<select value={selectedLocation.outdoorSurface??"grass"} onChange={(event)=>setOutdoorSurface(selectedLocation.id,event.target.value as "grass"|"water")}><option value="grass">Gras · begehbar</option><option value="water">Graues Wasser · unpassierbar</option></select></label><label>Kulisse / Bewuchs<select value={selectedLocation.sceneryAssetId??""} onChange={(event)=>patchLocation(selectedLocation.id,{sceneryAssetId:event.target.value||undefined})}><option value="">Automatischer Bewuchs (Sumpf) / freie Landschaft</option><optgroup label="Häuser">{houseAssets.map((asset)=><option key={asset.id} value={asset.id}>{asset.path} · {asset.width}×{asset.height}</option>)}</optgroup><optgroup label="Pflanzen und Gelände">{plantAssets.map((asset)=><option key={asset.id} value={asset.id}>{asset.path} · {asset.width}×{asset.height}</option>)}</optgroup></select></label>{selectedLocation.sceneryAssetId && <div className="surface-preview"><img src={assetById(selectedLocation.sceneryAssetId)?.url} alt="Ausgewählte Kulisse"/><code>{assetById(selectedLocation.sceneryAssetId)?.path}</code></div>}</div>}
          {pack && <div className="room-surface-picker">
            <div className="surface-picker-head"><strong>Raum-Oberflächen</strong><span>{terrainCandidates.length ? terrainCandidates.length+" echte Terrain-Texturen" : textureCandidates.length+" ALIS-Fallbacks"}</span></div>
            <label className="surface-search">Asset-Suche
              <input value={surfaceSearch} onChange={(e)=>setSurfaceSearch(e.target.value)} placeholder="z. B. DJ1.IO, STAGE.IO oder ALIS #123"/>
              <small>{matchingSurfaceCandidates.length > MAX_SURFACE_OPTIONS
                ? `${MAX_SURFACE_OPTIONS} von ${matchingSurfaceCandidates.length} Treffern angezeigt – Suche eingrenzen.`
                : `${matchingSurfaceCandidates.length} Treffer`}</small>
            </label>
            {([
              ["wallAssetId","Wand"],
              ["floorAssetId","Boden"],
              ["ceilingAssetId","Decke"],
            ] as const).map(([field,label])=>{
              const current=assetById(selectedLocation[field]);
              const options=surfaceOptions(selectedLocation[field]);
              return <label className="surface-select" key={field}>
                <span>{label}</span>
                <select value={selectedLocation[field] ?? ""} onChange={(e)=>patchLocation(selectedLocation.id,{[field]:e.target.value || undefined})}>
                  <option value="">Tileset-Standard</option>
                  {options.map((asset)=><option key={asset.id} value={asset.id}>{asset.assetKind==="terrain" ? "Terrain · " : ""}{asset.path} · {asset.width}×{asset.height}</option>)}
                </select>
                {current && <div className="surface-preview"><img src={current.url} alt=""/><code>{current.path}</code></div>}
              </label>;
            })}
          </div>}
          {pack && terrainCandidates.length===0 && <p className="audit-note">In diesem Import wurden noch keine ALIS-0x1C/0x1E-Terraintexturen erkannt. Die Auswahl zeigt deshalb ältere Sprite-Fallbacks.</p>}
          <button className="danger-button" disabled={levelLocations.length<=1} onClick={()=>deleteLocation(selectedLocation.id)}>Ausgewählten Raum löschen</button>
        </>}
        <p className="audit-note">Klicke einen Raum direkt in der Karte an. Neue Räume werden immer relativ zu genau diesem ausgewählten Rasterfeld angelegt.</p>
      </article>
    </div>

    <div className="author-grid">
      <article className="editor-panel">
        <h2>Gruppe</h2>
        {game.characters.map((ch) => <div key={ch.id} className="author-block">
          <label>Name<input value={ch.name} onChange={(e)=>setGame({...game,characters:game.characters.map(x=>x.id===ch.id?{...x,name:e.target.value}:x)})}/></label>
          <div className="inline-fields">
            <label>HP<input type="number" min="1" value={ch.hp} onChange={(e)=>setGame({...game,characters:game.characters.map(x=>x.id===ch.id?{...x,hp:Number(e.target.value)}:x)})}/></label>
            <label>Angriff<input type="number" min="1" value={ch.attack} onChange={(e)=>setGame({...game,characters:game.characters.map(x=>x.id===ch.id?{...x,attack:Number(e.target.value)}:x)})}/></label>
          </div>
          {game.characters.length>1 && <button className="danger-button compact" onClick={()=>setGame({...game,characters:game.characters.filter((entry)=>entry.id!==ch.id)})}>Aus Gruppe entfernen</button>}
        </div>)}
        <button disabled={game.characters.length>=5} onClick={()=>{let n=game.characters.length+1;while(game.characters.some((entry)=>entry.id===`hero-${n}`))n++;setGame({...game,characters:[...game.characters,{id:`hero-${n}`,name:`Figur ${n}`,hp:18,attack:4}]});}}>Figur hinzufügen ({game.characters.length}/5)</button>
      </article>

      <article className="editor-panel">
        <h2>Quest</h2>
        {game.quests.map((q) => <div key={q.id} className="author-block">
          <label>Titel<input value={q.title} onChange={(e)=>setGame({...game,quests:game.quests.map(x=>x.id===q.id?{...x,title:e.target.value}:x)})}/></label>
          <label>Ziel<textarea rows={3} value={q.objective} onChange={(e)=>setGame({...game,quests:game.quests.map(x=>x.id===q.id?{...x,objective:e.target.value}:x)})}/></label>
          <label>Abschlusstext<textarea rows={3} value={q.completedText} onChange={(e)=>setGame({...game,quests:game.quests.map(x=>x.id===q.id?{...x,completedText:e.target.value}:x)})}/></label>
        </div>)}
      </article>

      <article className="editor-panel">
        <h2>Items</h2>
        {game.items.map((item) => {
          const distanceFields = [
            ["assetNearId","Nah (aktueller Raum)"],
            ["assetMidId","Mittel (1 Raum)"],
            ["assetFarId","Fern (2 Räume)"],
          ] as const;
          return <div key={item.id} className="author-block">
            <label>Name<input value={item.name} onChange={(e)=>setGame({...game,items:game.items.map(x=>x.id===item.id?{...x,name:e.target.value}:x)})}/></label>
            <label>Beschreibung<textarea rows={3} value={item.description} onChange={(e)=>setGame({...game,items:game.items.map(x=>x.id===item.id?{...x,description:e.target.value}:x)})}/></label>
            {pack && <div className="item-distance-assets">
              <strong>Distanz-Sprites</strong>
              {distanceFields.map(([field,label])=>{
                const selectedId=item[field] ?? (field==="assetNearId" ? item.assetId : undefined);
                const selectedAsset=assetById(selectedId);
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
          </div>;
        })}
      </article>

      <article className="editor-panel">
        <h2>Türen</h2>
        {game.doors.length ? game.doors.map((door) => <div key={door.id} className="author-block">
          <label>ID<input value={door.id} readOnly/></label>
          <div className="inline-fields">
            <label>Von<select value={door.fromLocationId} onChange={(e)=>patchDoor(door.id,{fromLocationId:e.target.value})}>{game.locations.map((location)=><option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
            <label>Nach<select value={door.toLocationId} onChange={(e)=>patchDoor(door.id,{toLocationId:e.target.value})}>{game.locations.map((location)=><option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
          </div>
          <label>Schlüssel-Item<select value={door.keyItemId ?? ""} onChange={(e)=>patchDoor(door.id,{keyItemId:e.target.value || undefined})}><option value="">kein Schlüssel</option>{game.items.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="check-row"><input type="checkbox" checked={door.initiallyOpen} onChange={(e)=>patchDoor(door.id,{initiallyOpen:e.target.checked})}/> Zu Spielbeginn offen</label>
          <button className="danger-button" onClick={()=>deleteDoor(door.id)}>Tür löschen</button>
        </div>) : <p className="muted">Noch keine Türen angelegt.</p>}
      </article>

      <article className="editor-panel">
        <h2>Begegnung</h2>
        {game.encounters.map((enc) => <div key={enc.id} className="author-block">
          <label>Name<input value={enc.name} onChange={(e)=>setGame({...game,encounters:game.encounters.map(x=>x.id===enc.id?{...x,name:e.target.value}:x)})}/></label>
          <div className="inline-fields">
            <label>HP<input type="number" min="1" value={enc.enemyHp} onChange={(e)=>setGame({...game,encounters:game.encounters.map(x=>x.id===enc.id?{...x,enemyHp:Number(e.target.value)}:x)})}/></label>
            <label>Angriff<input type="number" min="0" value={enc.enemyAttack} onChange={(e)=>setGame({...game,encounters:game.encounters.map(x=>x.id===enc.id?{...x,enemyAttack:Number(e.target.value)}:x)})}/></label>
          </div>
          <label>Siegtext<textarea rows={3} value={enc.victoryText} onChange={(e)=>setGame({...game,encounters:game.encounters.map(x=>x.id===enc.id?{...x,victoryText:e.target.value}:x)})}/></label>
        </div>)}
      </article>
    </div>

    <div className="location-list">
      <h2>Dungeon-Felder</h2>
      {levelLocations.map((loc) => <article className="editor-panel location-editor" key={loc.id}>
        <div className="location-title"><div><strong>{loc.name}</strong><code>{loc.id} · {loc.x},{loc.y}</code></div><div className="toolbar"><button className={loc.id===selectedLocation?.id ? "" : "secondary"} onClick={()=>setSelectedLocationId(loc.id)}>{loc.id===selectedLocation?.id ? "Ausgewählt" : "In Karte auswählen"}</button><button className="danger-button compact" disabled={levelLocations.length <= 1} onClick={()=>deleteLocation(loc.id)}>Raum löschen</button></div></div>
        <div className="inline-fields">
          <label>Name<input value={loc.name} onChange={(e)=>patchLocation(loc.id,{name:e.target.value})}/></label>
          <details className="advanced-coordinates"><summary>Rasterposition (fortgeschritten)</summary><div className="coordinate-fields"><label>X<input type="number" value={loc.x} onChange={(e)=>patchLocation(loc.id,{x:Number(e.target.value)})}/></label><label>Y<input type="number" value={loc.y} onChange={(e)=>patchLocation(loc.id,{y:Number(e.target.value)})}/></label></div></details>
        </div>
        <label>Beschreibung<textarea rows={2} value={loc.description} onChange={(e)=>patchLocation(loc.id,{description:e.target.value})}/></label>
        <div className="inline-fields">
          <label>Verbindungen (fortgeschritten)<input value={loc.exits.join(", ")} onChange={(e)=>patchLocation(loc.id,{exits:csv(e.target.value)})}/></label>
          <label>Items (IDs, Komma)<input value={loc.itemIds.join(", ")} onChange={(e)=>patchLocation(loc.id,{itemIds:csv(e.target.value)})}/></label>
        </div>
        <div className="inline-fields">
          <label>Begegnung<select value={loc.encounterId ?? ""} onChange={(e)=>patchLocation(loc.id,{encounterId:e.target.value || undefined})}><option value="">keine</option>{game.encounters.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
          {pack ? <label>Tileset<select value={loc.tilesetId ?? ""} onChange={(e)=>patchLocation(loc.id,{tilesetId:e.target.value || undefined})}><option value="">Pack-Standard ({pack.manifest.defaultTilesetId})</option>{pack.manifest.tilesets.map((tileset)=><option key={tileset.id} value={tileset.id}>{tileset.name}</option>)}</select></label> : <label>Tileset-ID<input value={loc.tilesetId ?? ""} placeholder="Pack-Standard" onChange={(e)=>patchLocation(loc.id,{tilesetId:e.target.value || undefined})}/></label>}
        </div>
        <label className="check-row"><input type="checkbox" checked={!!loc.ending} onChange={(e)=>patchLocation(loc.id,{ending:e.target.checked})}/> Abschluss-Feld</label>
      </article>)}
    </div>
  </section>;
}
