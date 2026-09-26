import { createFileRoute, Link } from "@tanstack/react-router";
import { useKit } from "@/lib/store";
import { validateGame } from "@/lib/ishar/project-validation";

export const Route = createFileRoute("/")({ component: Overview });

function Overview() {
  const project = useKit((s) => s.project);
  const loadDemo = useKit((s) => s.loadDemo);
  const problems = validateGame(project.game);
  return <section>
    <header className="page-head"><div><p className="eyebrow">Workbench / playable slice</p><h1>Ishar Construction Kit</h1><p>Ein evidenzbasierter Baukasten für neue Ishar-artige RPG-Projekte – mit getrenntem Originaldaten-Audit und eigenem Authoring-Modell.</p></div><div className="toolbar"><Link className="file-button" to="/author">Adventure Builder</Link><button onClick={loadDemo}>Demo-Party laden</button></div></header>
    <div className="hero-grid">
      <article className="parchment-card"><h2>{project.name}</h2><p>Der erste originale Vertical-Slice ist angelegt: Figur, Orte, Item, Begegnung, Quest und Abschluss können im Browser bearbeitet und direkt gespielt werden.</p><p><strong>{problems.length ? `${problems.length} Referenzproblem(e)` : "Projekt validiert"}</strong></p></article>
      <article className="stone-card"><h2>Testbarer Pfad</h2><ol><li>Projekt im Adventure Builder bearbeiten</li><li>Referenzen validieren</li><li>Playtest vom Tor bis zum Heiligtum</li><li>Projekt exportieren und wieder öffnen</li></ol><Link className="file-button" to="/playtest">Direkt zum Playtest</Link></article>
    </div>
    <div className="module-grid">
      {Object.entries(project.modules).map(([id, mod]) => {
        const to = id === "character" ? "/characters" : id === "asset" ? "/assets" : id === "build" ? "/project" : ["item","world","npc","quest","dialogue"].includes(id) ? "/author" : "/knowledge";
        return <Link key={id} to={to} className="module-card"><span>{id}</span><strong>{mod.status}</strong><small>{mod.notes || "Noch nicht auditiert."}</small></Link>;
      })}
    </div>
  </section>;
}
