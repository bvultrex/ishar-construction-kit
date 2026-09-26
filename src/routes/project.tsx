import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useKit } from "@/lib/store";
import { normalizeProject, projectJson } from "@/lib/ishar/project";
import { validateGame } from "@/lib/ishar/project-validation";

export const Route = createFileRoute("/project")({ component: ProjectPage });

function ProjectPage() {
  const { project, setProject, resetProject } = useKit();
  const [message, setMessage] = useState("");
  const problems = validateGame(project.game);

  function downloadProject(){
    const blob = new Blob([projectJson(project)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`${project.name.replace(/[^a-z0-9_-]+/gi,"-")}.ishar-ck-project.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importProject(file: File) {
    try {
      const next = normalizeProject(JSON.parse(await file.text()));
      setProject(next);
      setMessage(`Projekt "${next.name}" geladen.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Projekt konnte nicht geladen werden.");
    }
  }

  return <section>
    <header className="page-head">
      <div><p className="eyebrow">Project</p><h1>{project.name}</h1><p>Format {project.format} v{project.version} · lokal im Browser gespeichert</p></div>
      <div className="toolbar">
        <Link className="file-button" to="/author">Adventure Builder</Link>
        <Link className="file-button" to="/assets">Asset Lab</Link>
        <label className="file-button">Projekt öffnen<input type="file" accept=".json,.ishar-ck-project" onChange={(e)=>{const f=e.currentTarget.files?.[0]; if(f) void importProject(f);}}/></label>
        <button onClick={downloadProject}>Projekt exportieren</button>
      </div>
    </header>
    {message && <p className="audit-note">{message}</p>}
    <div className="hero-grid">
      <article className="parchment-card">
        <h2>Projektidentität</h2>
        <label className="dark-label">Name<input value={project.name} onChange={(e)=>setProject({...project,name:e.target.value})}/></label>
        <label className="dark-label">Notizen<textarea rows={6} value={project.notes} onChange={(e)=>setProject({...project,notes:e.target.value})}/></label>
      </article>
      <article className="stone-card">
        <h2>Testbarkeit</h2>
        <p>{problems.length ? `${problems.length} Referenzproblem(e) verhindern einen sauberen Playtest.` : "Projekt-Referenzen sind konsistent und der Browser-Playtest kann gestartet werden."}</p>
        <p className="muted">Der Vertical-Slice verwendet nur originale Construction-Kit-Daten. Originalspiel-Dateien bleiben externe Forschungsquellen.</p><p className="muted">Externes Asset-Pack: {project.game.assetPackId || "nicht zugeordnet"}</p>
        <div className="toolbar"><Link className="file-button" to="/playtest">Playtest</Link><button className="secondary" onClick={()=>resetProject("My Ishar Adventure")}>Starter-Projekt zurücksetzen</button></div>
      </article>
    </div>
  </section>;
}
