import { createFileRoute, Link } from "@tanstack/react-router";
import { useKit } from "@/lib/store";
import { validateGame } from "@/lib/ishar/project-validation";
import type { AuthoredGame, AuthoredLocation } from "@/lib/ishar/types";

export const Route = createFileRoute("/author")({ component: AuthorPage });

function csv(value: string) {
  return value.split(",").map((x) => x.trim()).filter(Boolean);
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
    setGame({ ...game, locations: [...game.locations, { id, name: "Neuer Ort", description: "", exits: [], itemIds: [] }] });
  }

  return <section>
    <header className="page-head">
      <div><p className="eyebrow">Original project authoring</p><h1>Adventure Builder</h1><p>Bearbeite einen kleinen vollständigen RPG-Vertical-Slice. Änderungen werden lokal im Browser gespeichert.</p></div>
      <div className="toolbar"><Link className="file-button" to="/playtest">Playtest starten</Link><button onClick={addLocation}>Ort hinzufügen</button></div>
    </header>

    <div className="stats-grid file-stats">
      <article><span>Orte</span><strong>{game.locations.length}</strong></article>
      <article><span>Items</span><strong>{game.items.length}</strong></article>
      <article><span>Begegnungen</span><strong>{game.encounters.length}</strong></article>
      <article><span>Quests</span><strong>{game.quests.length}</strong></article>
      <article><span>Validierung</span><strong>{problems.length ? problems.length : "OK"}</strong></article>
    </div>

    {problems.length > 0 && <article className="stone-card validation-card"><h2>Referenzen prüfen</h2><ul>{problems.map((p, i) => <li key={i}><code>{p.path}</code> — {p.message}</li>)}</ul></article>}

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
        <h2>Item</h2>
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
      <h2>Welt / Orte</h2>
      {game.locations.map((loc) => <article className="editor-panel location-editor" key={loc.id}>
        <div className="location-title"><strong>{loc.name}</strong><code>{loc.id}</code></div>
        <label>Name<input value={loc.name} onChange={(e)=>patchLocation(loc.id,{name:e.target.value})}/></label>
        <label>Beschreibung<textarea rows={3} value={loc.description} onChange={(e)=>patchLocation(loc.id,{description:e.target.value})}/></label>
        <div className="inline-fields">
          <label>Ausgänge (IDs, Komma)<input value={loc.exits.join(", ")} onChange={(e)=>patchLocation(loc.id,{exits:csv(e.target.value)})}/></label>
          <label>Items (IDs, Komma)<input value={loc.itemIds.join(", ")} onChange={(e)=>patchLocation(loc.id,{itemIds:csv(e.target.value)})}/></label>
        </div>
        <div className="inline-fields">
          <label>Begegnung<select value={loc.encounterId ?? ""} onChange={(e)=>patchLocation(loc.id,{encounterId:e.target.value || undefined})}><option value="">keine</option>{game.encounters.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
          <label>Startort<select value={game.startLocationId} onChange={(e)=>setGame({...game,startLocationId:e.target.value})}>{game.locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
        </div>
        <label className="check-row"><input type="checkbox" checked={!!loc.ending} onChange={(e)=>patchLocation(loc.id,{ending:e.target.checked})}/> Abschluss-Ort</label>
      </article>)}
    </div>
  </section>;
}
