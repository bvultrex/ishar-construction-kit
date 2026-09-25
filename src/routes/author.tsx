import { createFileRoute, Link } from "@tanstack/react-router";
import { useKit } from "@/lib/store";
import { DIRECTION_LABELS } from "@/lib/ishar/dungeon";
import { validateGame } from "@/lib/ishar/project-validation";
import type { AuthoredGame, AuthoredLocation, Direction } from "@/lib/ishar/types";

export const Route = createFileRoute("/author")({ component: AuthorPage });

function csv(value: string) {
  return value.split(",").map((x) => x.trim()).filter(Boolean);
}

function DungeonMap({ game }: { game: AuthoredGame }) {
  const xs = game.locations.map((x) => x.x);
  const ys = game.locations.map((x) => x.y);
  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 0);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 0);
  const cell = 84;
  const pad = 42;
  const width = (maxX - minX + 1) * cell + pad * 2;
  const height = (maxY - minY + 1) * cell + pad * 2;
  const point = (loc: AuthoredLocation) => ({ x: pad + (loc.x - minX) * cell + cell / 2, y: pad + (loc.y - minY) * cell + cell / 2 });

  return <svg className="dungeon-map" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Dungeon-Raster">
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
      return <g key={loc.id} transform={`translate(${p.x},${p.y})`}>
        <rect x={-32} y={-28} width={64} height={56} rx={4} className={`map-cell ${start ? "start" : ""} ${loc.ending ? "ending" : ""}`}/>
        <text y={-4} textAnchor="middle" className="map-name">{loc.name.slice(0, 12)}</text>
        <text y={14} textAnchor="middle" className="map-coord">{loc.x},{loc.y}</text>
        {start && <text y={38} textAnchor="middle" className="map-facing">Start {DIRECTION_LABELS[game.startFacing]}</text>}
      </g>;
    })}
  </svg>;
}

function AuthorPage() {
  const { project, setProject } = useKit();
  const game = project.game;
  const problems = validateGame(game);

  function setGame(next: AuthoredGame) {
    setProject({ ...project, game: next });
  }

  function patchLocation(id: string, patch: Partial<AuthoredLocation>) {
    setGame({ ...game, locations: game.locations.map((x) => x.id === id ? { ...x, ...patch } : x) });
  }

  function addLocation() {
    let n = game.locations.length + 1;
    let id = `location-${n}`;
    while (game.locations.some((x) => x.id === id)) id = `location-${++n}`;
    const maxY = Math.max(...game.locations.map((x) => x.y), 0);
    setGame({ ...game, locations: [...game.locations, { id, name: "Neuer Raum", description: "", x: 0, y: maxY + 1, exits: [], itemIds: [] }] });
  }

  return <section>
    <header className="page-head">
      <div><p className="eyebrow">Dungeon authoring</p><h1>Adventure Builder</h1><p>Baue ein kardinales Dungeon-Raster. X/Y-Positionen und beidseitige Verbindungen bestimmen die First-Person-Geometrie des Playtests.</p></div>
      <div className="toolbar"><Link className="file-button" to="/playtest">Dungeon betreten</Link><button onClick={addLocation}>Raum hinzufügen</button></div>
    </header>

    <div className="stats-grid file-stats">
      <article><span>Räume</span><strong>{game.locations.length}</strong></article>
      <article><span>Items</span><strong>{game.items.length}</strong></article>
      <article><span>Begegnungen</span><strong>{game.encounters.length}</strong></article>
      <article><span>Quests</span><strong>{game.quests.length}</strong></article>
      <article><span>Raster</span><strong>{problems.length ? problems.length : "OK"}</strong></article>
    </div>

    {problems.length > 0 && <article className="stone-card validation-card"><h2>Dungeon-Geometrie prüfen</h2><ul>{problems.map((p, i) => <li key={i}><code>{p.path}</code> — {p.message}</li>)}</ul></article>}

    <div className="map-builder-grid">
      <article className="stone-card map-card">
        <div className="map-card-head"><div><p className="eyebrow">Live map</p><h2>Dungeon-Raster</h2></div><span className="audit-chip">{game.locations.length} Felder</span></div>
        <DungeonMap game={game}/>
      </article>
      <article className="editor-panel">
        <h2>Startposition</h2>
        <label>Startfeld<select value={game.startLocationId} onChange={(e)=>setGame({...game,startLocationId:e.target.value})}>{game.locations.map(l=><option key={l.id} value={l.id}>{l.name} ({l.x},{l.y})</option>)}</select></label>
        <label>Blickrichtung<select value={game.startFacing} onChange={(e)=>setGame({...game,startFacing:e.target.value as Direction})}><option value="north">Norden</option><option value="east">Osten</option><option value="south">Süden</option><option value="west">Westen</option></select></label>
        <p className="audit-note">Benachbarte Räume müssen genau ein Rasterfeld auseinanderliegen. Nur N/O/S/W-Verbindungen werden als begehbare Gänge gerendert.</p>
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
        <div className="location-title"><strong>{loc.name}</strong><code>{loc.id} · {loc.x},{loc.y}</code></div>
        <div className="inline-fields">
          <label>Name<input value={loc.name} onChange={(e)=>patchLocation(loc.id,{name:e.target.value})}/></label>
          <div className="coordinate-fields"><label>X<input type="number" value={loc.x} onChange={(e)=>patchLocation(loc.id,{x:Number(e.target.value)})}/></label><label>Y<input type="number" value={loc.y} onChange={(e)=>patchLocation(loc.id,{y:Number(e.target.value)})}/></label></div>
        </div>
        <label>Beschreibung<textarea rows={2} value={loc.description} onChange={(e)=>patchLocation(loc.id,{description:e.target.value})}/></label>
        <div className="inline-fields">
          <label>Verbindungen (IDs, Komma)<input value={loc.exits.join(", ")} onChange={(e)=>patchLocation(loc.id,{exits:csv(e.target.value)})}/></label>
          <label>Items (IDs, Komma)<input value={loc.itemIds.join(", ")} onChange={(e)=>patchLocation(loc.id,{itemIds:csv(e.target.value)})}/></label>
        </div>
        <label>Begegnung<select value={loc.encounterId ?? ""} onChange={(e)=>patchLocation(loc.id,{encounterId:e.target.value || undefined})}><option value="">keine</option>{game.encounters.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
        <label className="check-row"><input type="checkbox" checked={!!loc.ending} onChange={(e)=>patchLocation(loc.id,{ending:e.target.checked})}/> Abschluss-Feld</label>
      </article>)}
    </div>
  </section>;
}
