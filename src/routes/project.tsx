import { createFileRoute } from "@tanstack/react-router";
import { useKit } from "@/lib/store";
import { projectJson } from "@/lib/ishar/project";

export const Route = createFileRoute("/project")({ component: ProjectPage });

function ProjectPage() {
  const { project, setProject } = useKit();
  function downloadProject(){
    const blob = new Blob([projectJson(project)],{type:"application/json"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`${project.name.replace(/[^a-z0-9_-]+/gi,"-")}.ishar-ck-project.json`; a.click(); URL.revokeObjectURL(url);
  }
  return <section><header className="page-head"><div><p className="eyebrow">Project</p><h1>{project.name}</h1><p>Format {project.format} v{project.version}</p></div><button onClick={downloadProject}>Projekt exportieren</button></header>
    <div className="hero-grid"><article className="parchment-card"><h2>Projektidentität</h2><label className="dark-label">Name<input value={project.name} onChange={(e)=>setProject({...project,name:e.target.value})}/></label><label className="dark-label">Notizen<textarea rows={6} value={project.notes} onChange={(e)=>setProject({...project,notes:e.target.value})}/></label></article><article className="stone-card"><h2>Authoring-Ziel</h2><p>Der Baukasten soll verifizierte Ishar-Systeme in eigene Charaktere, Items, Magie, Welt, NPCs, Quests und Dialoge überführen, ohne Originalassets mitzuliefern.</p><p className="muted">Projektdateien enthalten nur Construction-Kit-Metadaten und Overlays. Originaldaten bleiben externe Quellen.</p></article></div>
  </section>;
}
