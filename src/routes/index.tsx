import { createFileRoute, Link } from "@tanstack/react-router";
import { useKit } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Overview });

function Overview() {
  const project = useKit((s) => s.project);
  const loadDemo = useKit((s) => s.loadDemo);
  return <section>
    <header className="page-head"><div><p className="eyebrow">Workbench / Recovery checkpoint</p><h1>Ishar Construction Kit</h1><p>Ein evidenzbasierter Baukasten für neue Ishar-artige RPG-Projekte.</p></div><button onClick={loadDemo}>Demo-Party laden</button></header>
    <div className="hero-grid">
      <article className="parchment-card"><h2>Projektstatus</h2><p><strong>{project.name}</strong></p><p>Charakterdaten und Save-Roundtrip sind als erster Kern vorhanden. UI, Karten, Quests und Export wachsen darum herum.</p></article>
      <article className="stone-card"><h2>Nächster stabiler Meilenstein</h2><ul><li>Character Lab auf Demo- und echten Saves</li><li>Byte-identischer Roundtrip</li><li>File Lab für IO/FIC/SAV</li><li>Audit-Wissen sichtbar halten</li></ul></article>
    </div>
    <div className="module-grid">
      {Object.entries(project.modules).map(([id, mod]) => <Link key={id} to={id === "character" ? "/characters" : id === "asset" ? "/files" : id === "build" ? "/project" : "/knowledge"} className="module-card"><span>{id}</span><strong>{mod.status}</strong><small>{mod.notes || "Noch nicht auditiert."}</small></Link>)}
    </div>
  </section>;
}
