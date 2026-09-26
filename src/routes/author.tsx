import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useKit } from "@/lib/store";
import { useAssetPack } from "@/lib/asset-store";
import { DIRECTION_LABELS, DIRECTION_VECTORS, locationAt } from "@/lib/ishar/dungeon";
import { validateGame } from "@/lib/ishar/project-validation";
import type { AuthoredDoor, AuthoredGame, AuthoredLocation, Direction } from "@/lib/ishar/types";

export const Route = createFileRoute("/author")({ component: AuthorPage });

function csv(value: string) {
  return value.split(",").map((x) => x.trim()).filter(Boolean);
}

function DungeonMap({ game, selectedId, onSelect }: { game: AuthoredGame; selectedId: string; onSelect: (id: string) => void }) {
  const xs = game.locations.map((x) => x.x);
  const ys = game.locations.map((x) => x.y);
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
    {game.locations.flatMap((loc) => loc.exits.map((id) => {
      const target = game.locations.find((x) => x.id === id);
      if (!target || loc.id > target.id) return null;
      const a = point(loc);
      const b = point(target);
      return <line key={`${loc.id}-${id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="map-link"/>;
    }))}
    {game.locations.map((loc) => {
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
        <rect x={-36} y={-31} width={72} height={62} rx={5} className={`map-cell ${start ? "start" : ""} ${loc.ending ? "ending" : ""} ${selected ? "selected" : ""}`}/>
        <text y={-5} textAnchor="middle" className="map-name">{loc.name.slice(0, 13)}</text>
        <text y={14} textAnchor="middle" className="map-coord">{loc.x},{loc.y}</text>
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
  const selectedLocation = game.locations.find((location) => location.id === selectedLocationId) ?? game.locations[0];
  const textureCandidates = (pack?.discoveredAssets ?? []).filter((asset) => {
    if (asset.source !== "alis" || !asset.width || !asset.height) return false;
    const ratio = asset.width / asset.height;
    return asset.width >= 8 && asset.height >= 8 && asset.width <= 256 && asset.height <= 256 && ratio >= 0.35 && ratio <= 2.85;
  });
  const assetById = (id?: string) => id ? pack?.discoveredAssets?.find((asset)=>asset.id===id) : undefined;

  function setGame(next: AuthoredGame) {
    setProject({ ...project, game: next });
  }

  function patchLocation(id: string, patch: Partial<AuthoredLocation>) {
    setGame({ ...game, locations: game.locations.map((x) => x.id === id ? { ...x, ...patch } : x) });
  }

  function addDoor() {
    let n = game.doors.length + 1;
    let id = `door-${n}`;
    while (game.doors.some((x) => x.id === id)) id = `door-${++n}`;
    const from = game.locations[0]?.id ?? "";
    const to = game.locations[1]?.id ?? from;
    setGame({ ...game, doors: [...game.doors, { id, fromLocationId: from, toLocationId: to, initiallyOpen: false }] });
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
    const occupied = locationAt(game.locations, from.x + vector.x, from.y + vector.y);
    if (occupied) {
      setBuilderMessage(`Das Feld ${DIRECTION_LABELS[direction]} von "${from.name}" ist bereits durch "${occupied.name}" belegt.`);
      return;
    }
    const id = nextLocationId();
    const next: AuthoredLocation = {
      id,
      name: "Neuer Raum",
      description: "",
      x: from.x + vector.x,
      y: from.y + vector.y,
      exits: [from.id],
      itemIds: [],
      tilesetId: from.tilesetId,
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

  function setConnection(fromId: string, targetId: string, connected: boolean) {
    const from = game.locations.find((location) => location.id === fromId);
    const target = game.locations.find((location) => location.id === targetId);
    if (!from || !target) return;
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
    if (game.locations.length <= 1) return;
    const removed = game.locations.find((location)=>location.id===id);
    const remaining = game.locations
      .filter((location) => location.id !== id)
      .map((location) => ({ ...location, exits: location.exits.filter((exit) => exit !== id) }));
    const startLocationId = game.startLocationId === id ? remaining[0]!.id : game.startLocationId;
    const doors = game.doors.filter((door) => door.fromLocationId !== id && door.toLocationId !== id);
    setGame({ ...game, startLocationId, locations: remaining, doors });
    setSelectedLocationId(startLocationId);
    setBuilderMessage(`Raum "${removed?.name ?? id}" wurde gelöscht; Verbindungen und Türen wurden bereinigt.`);
  }

  return <section>
    <header className="page-head">
      <div><p className="eyebrow">Dungeon authoring</p><h1>Adventure Builder</h1><p>Baue ein kardinales Dungeon-Raster. X/Y-Positionen und beidseitige Verbindungen bestimmen die First-Person-Geometrie des Playtests.</p></div>
      <div className="toolbar"><Link className="file-button" to="/playtest">Dungeon betreten</Link><Link className="file-button" to="/assets">Asset Lab</Link><button className="secondary" onClick={addDoor}>Tür hinzufügen</button></div>
    </header>

    <div className="stats-grid file-stats">
      <article><span>Räume</span><strong>{game.locations.length}</strong></article>
      <article><span>Items</span><strong>{game.items.length}</strong></article>
      <article><span>Begegnungen</span><strong>{game.encounters.length}</strong></article>
      <article><span>Quests</span><strong>{game.quests.length}</strong></article>
      <article><span>Raster</span><strong>{problems.length ? problems.length : "OK"}</strong></article>
    </div>

    {builderMessage && <p className="audit-note builder-message">{builderMessage}</p>}
    {problems.length > 0 && <article className="stone-card validation-card"><h2>Dungeon-Geometrie prüfen</h2><ul>{problems.map((p, i) => <li key={i}><code>{p.path}</code> — {p.message}</li>)}</ul></article>}

    <div className="map-builder-grid">
      <article className="stone-card map-card">
        <div className="map-card-head"><div><p className="eyebrow">Live map</p><h2>Dungeon-Raster</h2></div><span className="audit-chip">{game.locations.length} Felder</span></div>
        <DungeonMap game={game} selectedId={selectedLocation?.id ?? ""} onSelect={(id)=>{setSelectedLocationId(id);setBuilderMessage("");}}/>
      </article>
      <article className="editor-panel selected-room-panel">
        <p className="eyebrow">Bearbeitungsfokus</p>
        <h2>{selectedLocation?.name ?? "Kein Raum"}</h2>
        {selectedLocation && <>
          <p className="selected-room-coord">Raster {selectedLocation.x},{selectedLocation.y} · <code>{selectedLocation.id}</code></p>
          <div className="neighbor-grid">
            {(["north","east","south","west"] as Direction[]).map((direction)=>{
              const vector=DIRECTION_VECTORS[direction];
              const target=locationAt(game.locations,selectedLocation.x+vector.x,selectedLocation.y+vector.y);
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
          {pack && <div className="room-surface-picker">
            <div className="surface-picker-head"><strong>Raum-Oberflächen</strong><span>{textureCandidates.length} ALIS-Kandidaten</span></div>
            {([
              ["wallAssetId","Wand"],
              ["floorAssetId","Boden"],
              ["ceilingAssetId","Decke"],
            ] as const).map(([field,label])=>{
              const current=assetById(selectedLocation[field]);
              return <label className="surface-select" key={field}>
                <span>{label}</span>
                <select value={selectedLocation[field] ?? ""} onChange={(e)=>patchLocation(selectedLocation.id,{[field]:e.target.value || undefined})}>
                  <option value="">Tileset-Standard</option>
                  {textureCandidates.map((asset)=><option key={asset.id} value={asset.id}>{asset.path} · {asset.width}×{asset.height}</option>)}
                </select>
                {current && <div className="surface-preview"><img src={current.url} alt=""/><code>{current.path}</code></div>}
              </label>;
            })}
          </div>}
          <button className="danger-button" disabled={game.locations.length<=1} onClick={()=>deleteLocation(selectedLocation.id)}>Ausgewählten Raum löschen</button>
        </>}
        <p className="audit-note">Klicke einen Raum direkt in der Karte an. Neue Räume werden immer relativ zu genau diesem ausgewählten Rasterfeld angelegt.</p>
      </article>
    </div>

    <div className="author-grid">
      <article className="editor-panel">
        <h2>Startfigur</h2>
        {game.characters.map((ch) => <div key={ch.id} className="author-block">
          <label>Name<input value={ch.name} onChange={(e)=>setGame({...game,characters:game.characters.map(x=>x.id===ch.id?{...x,name:e.target.value}:x)})}/></label>
          <div className="inline-fields">
            <label>HP<input type="number" min="1" value={ch.hp} onChange={(e)=>setGame({...game,characters:game.characters.map(x=>x.id===ch.id?{...x,hp:Number(e.target.value)}:x)})}/></label>
            <label>Angriff<input type="number" min="1" value={ch.attack} onChange={(e)=>setGame({...game,characters:game.characters.map(x=>x.id===ch.id?{...x,attack:Number(e.target.value)}:x)})}/></label>
          </div>
        </div>)}
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
        {game.items.map((item) => <div key={item.id} className="author-block">
          <label>Name<input value={item.name} onChange={(e)=>setGame({...game,items:game.items.map(x=>x.id===item.id?{...x,name:e.target.value}:x)})}/></label>
          <label>Beschreibung<textarea rows={3} value={item.description} onChange={(e)=>setGame({...game,items:game.items.map(x=>x.id===item.id?{...x,description:e.target.value}:x)})}/></label>
        </div>)}
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
      {game.locations.map((loc) => <article className="editor-panel location-editor" key={loc.id}>
        <div className="location-title"><div><strong>{loc.name}</strong><code>{loc.id} · {loc.x},{loc.y}</code></div><div className="toolbar"><button className={loc.id===selectedLocation?.id ? "" : "secondary"} onClick={()=>setSelectedLocationId(loc.id)}>{loc.id===selectedLocation?.id ? "Ausgewählt" : "In Karte auswählen"}</button><button className="danger-button compact" disabled={game.locations.length <= 1} onClick={()=>deleteLocation(loc.id)}>Raum löschen</button></div></div>
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
