import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { createDemoAssetPack, exampleAssetManifest, loadAssetPack } from "@/lib/ishar/asset-pack";
import { useAssetPack } from "@/lib/asset-store";
import { useKit } from "@/lib/store";
import { mapIsharAssetSources } from "@/lib/ishar/ishar-assets";

export const Route = createFileRoute("/assets")({ component: AssetsPage });

function AssetsPage() {
  const { pack, setPack, clearPack } = useAssetPack();
  const { project, setProject, inventory, inventorySource } = useKit();
  const sourceCandidates = mapIsharAssetSources(inventory);
  const [message, setMessage] = useState("");

  function activatePack(next: ReturnType<typeof createDemoAssetPack>) {
    setPack(next);
    setProject({
      ...project,
      game: { ...project.game, assetPackId: next.manifest.id },
      modules: {
        ...project.modules,
        asset: { status: "partial", notes: "Lokales Asset-Pack wird im First-Person-Viewport gerendert." },
      },
    });
    setMessage('Asset-Pack "' + next.manifest.name + '" geladen. Fehlende Dateien: ' + next.missingEntryIds.length + ".");
  }

  async function importFiles(files: File[]) {
    try {
      const next = await loadAssetPack(files);
      activatePack(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Asset-Pack konnte nicht geladen werden.");
    }
  }

  function downloadExample() {
    const blob = new Blob([JSON.stringify(exampleAssetManifest(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "manifest.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const entries = pack ? [...pack.manifest.shared, ...pack.manifest.tilesets.flatMap((tileset) => tileset.entries)] : [];

  return <section>
    <header className="page-head">
      <div><p className="eyebrow">Local asset pipeline</p><h1>Asset Lab</h1><p>Importiert lokale Bild-Layer als ZIP oder Ordner. Originalspiel-Grafiken bleiben außerhalb des Repositories und werden nur im Browser verwendet.</p></div>
      <div className="toolbar">
        <button onClick={()=>activatePack(createDemoAssetPack())}>Demo-Pack laden</button>
        <label className="file-button">Asset-ZIP öffnen<input type="file" accept=".zip" onChange={(e)=>{const f=e.currentTarget.files?.[0]; if(f) void importFiles([f]);}}/></label>
        <label className="file-button">Asset-Ordner öffnen<input type="file" multiple ref={(node)=>{if(node) node.setAttribute("webkitdirectory","");}} onChange={(e)=>void importFiles(Array.from(e.currentTarget.files ?? []))}/></label>
        <button className="secondary" onClick={downloadExample}>Beispielmanifest</button>
      </div>
    </header>

    {message && <p className="audit-note">{message}</p>}

    {!pack ? <div className="hero-grid">
      <article className="parchment-card"><h2>Pack-Struktur</h2><p>Ein Pack enthält ein <code>manifest.json</code> und beliebige lokale PNG/WebP/SVG-Dateien. Das Manifest ordnet Bilder Rollen wie Frontwand, Seitenwand, Öffnung, Gegner oder Item zu.</p><button onClick={downloadExample}>Manifest herunterladen</button></article>
      <article className="stone-card"><h2>Nächster Test</h2><p>Mit <strong>Demo-Pack laden</strong> kannst du die Bild-Layer-Pipeline sofort testen. Eigene Packs rendern vorhandene Layer und fallen für fehlende Rollen auf die bisherige SVG-Geometrie zurück.</p><p className="muted">Projekt erwartet aktuell: {project.game.assetPackId || "kein externes Pack"}</p></article>
    </div> : <>
      <div className="stats-grid file-stats">
        <article><span>Pack</span><strong>{pack.manifest.name}</strong></article>
        <article><span>Tilesets</span><strong>{pack.manifest.tilesets.length}</strong></article>
        <article><span>Layer</span><strong>{entries.length}</strong></article>
        <article><span>Dateien</span><strong>{pack.fileCount}</strong></article>
        <article><span>Fehlend</span><strong>{pack.missingEntryIds.length}</strong></article>
      </div>

      <div className="hero-grid">
        <article className="stone-card"><h2>{pack.manifest.id}</h2><p>Viewport {pack.manifest.viewport.width} × {pack.manifest.viewport.height} · Default-Tileset: {pack.manifest.defaultTilesetId}</p><p className="muted">Quelle: {pack.sourceLabel}. Blob-URLs existieren nur in dieser Browser-Sitzung.</p></article>
        <article className="stone-card"><h2>Playtest</h2><p>{project.game.assetPackId === pack.manifest.id ? "Dieses Pack ist dem Projekt zugeordnet." : "Pack-ID stimmt nicht mit dem Projekt überein."}</p><div className="toolbar"><Link className="file-button" to="/playtest">Viewport testen</Link><button className="secondary" onClick={clearPack}>Pack entladen</button></div></article>
      </div>

      <div className="asset-tilesets">{pack.manifest.tilesets.map((tileset)=><article className="editor-panel" key={tileset.id}><h2>{tileset.name}</h2><code>{tileset.id}</code><p>{tileset.entries.length} Layer</p></article>)}</div>

      <div className="file-table-wrap"><table className="file-table"><thead><tr><th>Vorschau</th><th>ID</th><th>Rolle</th><th>Tiefe</th><th>Datei</th><th>Status</th></tr></thead><tbody>{entries.map((entry)=><tr key={entry.id}><td className="asset-preview-cell">{pack.urls[entry.id] ? <img src={pack.urls[entry.id]} alt=""/> : <span>—</span>}</td><td><code>{entry.id}</code></td><td>{entry.role}</td><td>{entry.depth ?? "global"}</td><td><code>{entry.file}</code></td><td><span className={"badge " + (pack.urls[entry.id] ? "confirmed" : "unknown")}>{pack.urls[entry.id] ? "geladen" : "fehlt"}</span></td></tr>)}</tbody></table></div>
    </>}

    <article className="stone-card asset-source-map">
      <div className="map-card-head"><div><p className="eyebrow">Ishar compatibility mapping</p><h2>Lokale Quellkandidaten</h2></div><span className="audit-chip">{sourceCandidates.length} Kandidaten</span></div>
      {!inventory.length ? <p>Importiere zuerst im <Link to="/files">File Lab</Link> deine lokale Ishar-Installation oder ein Archiv. Danach werden mögliche Ressourcendateien hier evidenzbewusst vorsortiert.</p> : <>
        <p>Quelle: {inventorySource}. Diese Liste sagt <strong>nicht</strong>, dass eine Datei Grafik enthält; sie priorisiert nur Kandidaten für den nächsten Reverse-Engineering-Schritt.</p>
        <div className="file-table-wrap"><table className="file-table"><thead><tr><th>Datei</th><th>Typ</th><th>Evidenz</th><th>Nächster Schritt</th></tr></thead><tbody>{sourceCandidates.slice(0,40).map((candidate)=><tr key={candidate.path}><td><strong>{candidate.path}</strong><small>{candidate.rationale}</small></td><td>{candidate.sourceKind}</td><td><span className={"badge " + candidate.confidence}>{candidate.confidence}</span></td><td>{candidate.nextStep}</td></tr>)}</tbody></table></div>
      </>}
    </article>
  </section>;
}
