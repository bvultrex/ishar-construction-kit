import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { createDemoAssetPack, exampleAssetManifest, loadAssetPack } from "@/lib/ishar/asset-pack";
import { autoImportIsharZip, type IsharAutoImportReport } from "@/lib/ishar/ishar-auto-import";
import { useAssetPack } from "@/lib/asset-store";
import { useKit } from "@/lib/store";
import { mapIsharAssetSources } from "@/lib/ishar/ishar-assets";

export const Route = createFileRoute("/assets")({ component: AssetsPage });

function AssetsPage() {
  const { pack, setPack, clearPack } = useAssetPack();
  const { project, setProject, inventory, inventorySource, setInventory } = useKit();
  const sourceCandidates = mapIsharAssetSources(inventory);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [autoReport, setAutoReport] = useState<IsharAutoImportReport | null>(null);

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
      setBusy(true);
      const next = await loadAssetPack(files);
      setAutoReport(null);
      activatePack(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Asset-Pack konnte nicht geladen werden.");
    } finally {
      setBusy(false);
    }
  }

  async function importIsharZip(file: File) {
    try {
      setBusy(true);
      setMessage("Ishar-Archiv wird analysiert, klassifiziert und soweit verifiziert möglich entpackt …");
      const result = await autoImportIsharZip(file);
      setInventory(result.inventory, file.name);
      setAutoReport(result.report);
      setPack(result.pack);
      const sourceGames = result.report.detectedGame === "unknown"
        ? project.sourceGames
        : [...new Set([...project.sourceGames.filter((game)=>game!=="unknown"), result.report.detectedGame])];
      setProject({
        ...project,
        sourceGames,
        game: { ...project.game, assetPackId: result.pack.manifest.id },
        modules: {
          ...project.modules,
          asset: { status: "partial", notes: "Ishar-ZIP-Autoimport analysiert lokale Ressourcen und verteilt sicher erkennbare Bilder." },
        },
      });
      setMessage(result.report.mappedImages
        ? `${result.pack.manifest.name}: ${result.report.mappedImages} Bild(er) automatisch zugeordnet.`
        : `${result.pack.manifest.name}: Archiv erkannt und analysiert; noch keine Grafik konnte sicher automatisch zugeordnet werden.`);
    } catch (error) {
      setAutoReport(null);
      setMessage(error instanceof Error ? error.message : "Ishar-Archiv konnte nicht analysiert werden.");
    } finally {
      setBusy(false);
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
      <div><p className="eyebrow">Ishar asset import</p><h1>Asset Lab</h1><p>Standardweg: Wähle einfach deine lokale Ishar-ZIP. Das Toolkit analysiert den Inhalt und verteilt alles, was es mit ausreichender Sicherheit erkennt, automatisch in die Engine.</p></div>
      <div className="toolbar">
        <label className="file-button primary-import">{busy ? "Analysiere …" : "Ishar-ZIP automatisch einlesen"}<input type="file" accept=".zip" disabled={busy} onChange={(e)=>{const f=e.currentTarget.files?.[0]; if(f) void importIsharZip(f);}}/></label>
        <button className="secondary" disabled={busy} onClick={()=>{setAutoReport(null);activatePack(createDemoAssetPack());}}>Demo-Pack</button>
      </div>
    </header>

    <div className="asset-import-steps">
      <article><strong>1</strong><span>Ishar-ZIP auswählen</span><small>Originaldateien bleiben lokal im Browser.</small></article>
      <article><strong>2</strong><span>Automatisch analysieren</span><small>Spielversion, Container und bekannte Packer werden erkannt.</small></article>
      <article><strong>3</strong><span>Assets verteilen</span><small>Nur ausreichend sichere Grafiktreffer werden automatisch gerendert.</small></article>
    </div>
    {message && <p className="audit-note">{message}</p>}
    {autoReport && <section className="auto-import-report">
      <div className="stats-grid file-stats">
        <article><span>Erkannt</span><strong>{autoReport.detectedGame==="ishar1" ? "Ishar 1" : autoReport.detectedGame==="ishar2" ? "Ishar 2" : "?"}</strong></article>
        <article><span>Dateien</span><strong>{autoReport.totalFiles}</strong></article>
        <article><span>A1 entpackt</span><strong>{autoReport.decodedA1Packer}</strong></article>
        <article><span>Bilder</span><strong>{autoReport.directImages + autoReport.embeddedImages}</strong></article>
        <article><span>Zugeordnet</span><strong>{autoReport.mappedImages}</strong></article>
      </div>
      <article className="stone-card"><h2>Automatik-Bericht</h2><ul>{autoReport.notes.map((note,index)=><li key={index}>{note}</li>)}</ul><p className="muted">{autoReport.candidateResources} mögliche Ressourcencontainer untersucht · {autoReport.decodedOldPacker} Old-Packer + {autoReport.decodedA1Packer} A1 entpackt · {autoReport.failedPackedDecode} Decode-Fehler.</p></article>
    </section>}

    {!pack ? <div className="hero-grid">
      <article className="parchment-card"><h2>Kein manuelles Setup nötig</h2><p>Für normale Nutzung brauchst du kein Manifest. Wähle oben die ZIP deiner Ishar-Installation; File Lab und Asset Lab werden in einem Schritt befüllt.</p><p><strong>Wichtig:</strong> Noch unbekannte proprietäre Grafikformate werden protokolliert, nicht geraten.</p></article>
      <article className="stone-card"><h2>Fallback bleibt spielbar</h2><p>Wenn ein Originalasset noch nicht decodiert werden kann, bleibt die vorhandene Dungeon-Geometrie sichtbar. Neue Decoder können später dieselbe ZIP automatisch besser auswerten.</p><p className="muted">Projekt erwartet aktuell: {project.game.assetPackId || "kein externes Pack"}</p></article>
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

    <details className="asset-expert-mode">
      <summary>Expertenmodus: eigenes Asset-Pack / Manifest laden</summary>
      <div className="toolbar expert-toolbar">
        <label className="file-button">Asset-ZIP mit Manifest<input type="file" accept=".zip" disabled={busy} onChange={(e)=>{const f=e.currentTarget.files?.[0]; if(f) void importFiles([f]);}}/></label>
        <label className="file-button">Asset-Ordner<input type="file" multiple disabled={busy} ref={(node)=>{if(node) node.setAttribute("webkitdirectory","");}} onChange={(e)=>void importFiles(Array.from(e.currentTarget.files ?? []))}/></label>
        <button className="secondary" onClick={downloadExample}>Beispielmanifest</button>
      </div>
    </details>

    <article className="stone-card asset-source-map">
      <div className="map-card-head"><div><p className="eyebrow">Ishar compatibility mapping</p><h2>Lokale Quellkandidaten</h2></div><span className="audit-chip">{sourceCandidates.length} Kandidaten</span></div>
      {!inventory.length ? <p>Importiere zuerst im <Link to="/files">File Lab</Link> deine lokale Ishar-Installation oder ein Archiv. Danach werden mögliche Ressourcendateien hier evidenzbewusst vorsortiert.</p> : <>
        <p>Quelle: {inventorySource}. Diese Liste sagt <strong>nicht</strong>, dass eine Datei Grafik enthält; sie priorisiert nur Kandidaten für den nächsten Reverse-Engineering-Schritt.</p>
        <div className="file-table-wrap"><table className="file-table"><thead><tr><th>Datei</th><th>Typ</th><th>Evidenz</th><th>Nächster Schritt</th></tr></thead><tbody>{sourceCandidates.slice(0,40).map((candidate)=><tr key={candidate.path}><td><strong>{candidate.path}</strong><small>{candidate.rationale}</small></td><td>{candidate.sourceKind}</td><td><span className={"badge " + candidate.confidence}>{candidate.confidence}</span></td><td>{candidate.nextStep}</td></tr>)}</tbody></table></div>
      </>}
    </article>
  </section>;
}
