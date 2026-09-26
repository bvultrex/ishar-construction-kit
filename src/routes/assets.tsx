import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { createDemoAssetPack, exampleAssetManifest, loadAssetPack, type DiscoveredAssetPreview } from "@/lib/ishar/asset-pack";
import { autoImportIsharZip, type IsharAutoImportReport } from "@/lib/ishar/ishar-auto-import";
import { useAssetPack } from "@/lib/asset-store";
import { useKit } from "@/lib/store";
import { mapIsharAssetSources } from "@/lib/ishar/ishar-assets";
import type { DungeonAssetEntry, DungeonAssetRole } from "@/lib/ishar/types";

export const Route = createFileRoute("/assets")({ component: AssetsPage });

function AssetsPage() {
  const { pack, setPack, updatePack, clearPack } = useAssetPack();
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

  function assignPreview(asset: DiscoveredAssetPreview, role: DungeonAssetRole | "dungeon-base") {
    if (!pack) return;
    const tilesetIndex=pack.manifest.tilesets.findIndex((tileset)=>tileset.id===pack.manifest.defaultTilesetId);
    if (tilesetIndex<0) return;
    const roles: DungeonAssetRole[] = role==="dungeon-base"
      ? ["wall.front","wall.left","wall.right","surface.floor","surface.ceiling"]
      : role==="wall.front" ? ["wall.front","wall.left","wall.right"] : [role];
    const textureRoles=new Set<DungeonAssetRole>(["wall.front","wall.left","wall.right","surface.floor","surface.ceiling"]);
    const entries=pack.manifest.tilesets[tilesetIndex]!.entries.filter((entry)=>!roles.includes(entry.role));
    const nextUrls={...pack.urls};
    const nextPaths={...pack.paths};
    const additions: DungeonAssetEntry[]=[];
    for(const targetRole of roles){
      const id="manual-"+targetRole.replace(/[^a-z0-9]+/gi,"-")+"-"+asset.id;
      const entry: DungeonAssetEntry={
        id,
        role:targetRole,
        file:asset.path,
        renderMode:textureRoles.has(targetRole) ? "texture" : "layer",
        tileWidth:asset.width ? Math.max(8,Math.min(96,asset.width)) : undefined,
        tileHeight:asset.height ? Math.max(8,Math.min(96,asset.height)) : undefined,
      };
      additions.push(entry);
      nextUrls[id]=asset.url;
      nextPaths[id]=asset.path;
    }
    const tilesets=pack.manifest.tilesets.map((tileset,index)=>index===tilesetIndex ? {...tileset,entries:[...additions,...entries]} : tileset);
    updatePack({
      ...pack,
      manifest:{...pack.manifest,tilesets},
      urls:nextUrls,
      paths:nextPaths,
      discoveredAssets:pack.discoveredAssets?.map((candidate)=>candidate.id===asset.id ? {...candidate,runtimeAssigned:true,suggestedRole:roles[0]} : candidate),
    });
    setMessage(role==="dungeon-base"
      ? `"${asset.path}" ist jetzt Basistextur für Wände, Boden und Decke.`
      : `"${asset.path}" ist jetzt ${roles.join(", ")}.`);
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
  const displayedAssets = [...(pack?.discoveredAssets ?? [])].sort((a,b)=>{
    const rank=(asset: typeof a)=>asset.assetKind==="terrain" ? 3 : asset.assetKind==="composite" ? 2 : asset.assetKind==="sprite" ? 1 : 0;
    const at=rank(a);
    const bt=rank(b);
    if(at!==bt) return bt-at;
    const statusRank=(asset: typeof a)=>asset.visualStatus==="normal" ? 0 : asset.visualStatus==="palette-suspect" ? 1 : 2;
    const af=statusRank(a);
    const bf=statusRank(b);
    if(af!==bf) return af-bf;
    return Number(b.runtimeAssigned)-Number(a.runtimeAssigned);
  });

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
        <article><span>ALIS-Bilder</span><strong>{autoReport.alisImagesExtracted}</strong></article>
        <article><span>0x1C/1E</span><strong>{autoReport.alisTerrainTexturesExtracted}</strong></article>
        <article><span>Flat/Masken</span><strong>{autoReport.alisFlatColorAssets}</strong></article>
        <article><span>Palette offen</span><strong>{autoReport.alisPaletteSuspectAssets}</strong></article>
        <article><span>Palette repariert</span><strong>{autoReport.ishar2ScenePaletteRepairs}</strong></article>
        <article><span>Paletten</span><strong>{autoReport.alisPaletteResources}</strong></article>
        <article><span>Composites</span><strong>{autoReport.alisCompositeResources}</strong></article>
        <article><span>Composite-Vorschau</span><strong>{autoReport.alisCompositePreviews}</strong></article>
        <article><span>Zugeordnet</span><strong>{autoReport.mappedImages}</strong></article>
      </div>
      <article className="stone-card"><h2>Automatik-Bericht</h2><ul>{autoReport.notes.map((note,index)=><li key={index}>{note}</li>)}</ul><p className="muted">{autoReport.candidateResources} mögliche Ressourcencontainer untersucht · {autoReport.decodedOldPacker} Old-Packer + {autoReport.decodedA1Packer} A1 entpackt · {autoReport.alisTablesFound} ALIS-Grafiktabellen · {autoReport.alisPaletteResources} Paletten · {autoReport.alisCompositeResources} Composites · {autoReport.failedPackedDecode} Decode-Fehler.</p>{autoReport.alisImagesSkippedForBudget>0 && <p className="muted">{autoReport.alisImagesSkippedForBudget} Bilder wurden wegen des Browser-Speicherlimits nur katalogisiert/übersprungen.</p>}</article>
      <article className="stone-card resource-format-card">
        <div className="map-card-head"><div><p className="eyebrow">Hard diagnostic</p><h2>ALIS-Ressourcenformate</h2></div><span className="badge confirmed">{Object.values(autoReport.alisResourceFormatCounts).reduce((sum,count)=>sum+count,0)} Einträge</span></div>
        <div className="format-chip-grid">{Object.entries(autoReport.alisResourceFormatCounts).sort(([a],[b])=>a.localeCompare(b)).map(([format,count])=><span key={format} className={format==="0x1c" || format==="0x1e" ? "terrain-format" : ""}><code>{format}</code><strong>{count}</strong></span>)}</div>
        <p className="audit-note">Für den aktuellen Ishar-Pfad sind <code>0x10/0x12/0x14/0x16</code> plus <code>0xFF</code>-Composites die entscheidenden sichtbaren Grafikklassen. <code>0x1c/0x1e</code> bleiben nur als Diagnosewert sichtbar.</p>
        <p className="muted">Palettenbasis: <strong>{autoReport.paletteBaseLabel}</strong>{autoReport.paletteBaseVerified ? " · verifiziert" : " · heuristisch"} · {autoReport.localPaletteOverlayImages} lokale Überlagerungen · {autoReport.ishar2ScenePaletteRepairs} Szenen-Reparaturen · {autoReport.alisPaletteSuspectAssets} Palette-offen.</p>
        {!!autoReport.playtestFallbackRoles.length && <p className="audit-note">Playtest bindet automatisch belastbare Originalgrafik-Fallbacks für: <strong>{autoReport.playtestFallbackRoles.join(", ")}</strong>. Wand/Boden/Decke bleiben bis zur Szenenrekonstruktion beim sichtbaren Stein-Fallback.</p>}
      </article>
      {!!autoReport.defaultAssignments.length && <article className="stone-card default-assignments"><h2>Automatisch gewähltes Standard-Tileset</h2><p className="muted">Diese Rollen werden sofort im Playtest benutzt. „Possible“ ist bewusst nur eine Heuristik und kann später manuell überschrieben werden.</p><div className="default-assignment-grid">{autoReport.defaultAssignments.map((assignment,index)=><div key={assignment.role+"-"+index}><strong>{assignment.role}</strong><span className={"badge "+assignment.confidence}>{assignment.confidence}</span><code>{assignment.sourcePath} · ALIS #{assignment.entryIndex}</code><small>{assignment.reason}</small></div>)}</div></article>}
    </section>}

    {!pack ? <div className="hero-grid">
      <article className="parchment-card"><h2>Kein manuelles Setup nötig</h2><p>Für normale Nutzung brauchst du kein Manifest. Wähle oben die ZIP deiner Ishar-Installation; File Lab und Asset Lab werden in einem Schritt befüllt.</p><p><strong>Wichtig:</strong> Noch unbekannte proprietäre Grafikformate werden protokolliert, nicht geraten.</p></article>
      <article className="stone-card"><h2>Fallback bleibt spielbar</h2><p>Wenn ein Originalasset noch nicht decodiert werden kann, bleibt die vorhandene Dungeon-Geometrie sichtbar. Neue Decoder können später dieselbe ZIP automatisch besser auswerten.</p><p className="muted">Projekt erwartet aktuell: {project.game.assetPackId || "kein externes Pack"}</p></article>
    </div> : <>
      <div className="stats-grid file-stats">
        <article><span>Pack</span><strong>{pack.manifest.name}</strong></article>
        <article><span>Renderprofil</span><strong>{pack.manifest.renderProfileId ?? "custom"}</strong></article>
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
      {!!pack.discoveredAssets?.length && <section className="discovered-assets">
        <div className="map-card-head"><div><p className="eyebrow">Aus Originalarchiv extrahiert</p><h2>Gefundene Grafiken</h2></div><span className="audit-chip">{pack.discoveredAssets.length}</span></div>
        <p className="muted">Automatisch erkannte Kategorien werden markiert. Unklare Grafiken bleiben sichtbar, aber werden nicht blind in den Dungeon gerendert.</p>
        <div className="asset-discovery-grid">{displayedAssets.slice(0,240).map((asset)=><article className={asset.assetKind==="terrain" ? "terrain-asset-card" : ""} key={asset.id}>
          <img src={asset.url} alt=""/>
          <strong>{asset.assetKind==="terrain" ? "Terrain-Textur" : asset.assetKind==="composite" ? "Composite" : (asset.suggestedRole ?? "unzugeordnet")}</strong>
          <small>{asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ""}{asset.assetKind==="terrain" ? "ALIS 0x1C/0x1E" : asset.assetKind==="composite" ? "ALIS 0xFF zusammengesetzt" : asset.source==="alis" ? "ALIS Sprite" : "Standardbild"}</small>
          <code title={asset.path}>{asset.path}</code>
          <div className="asset-card-badges">
            <span className={"badge " + (asset.assetKind==="terrain" || asset.assetKind==="composite" ? "confirmed" : asset.runtimeAssigned ? "confirmed" : asset.suggestedRole ? "suspected" : "unknown")}>{asset.assetKind==="terrain" ? "Terrain" : asset.assetKind==="composite" ? "Composite" : asset.runtimeAssigned ? "Runtime" : asset.suggestedRole ? "Vorschlag" : "prüfen"}</span>
            {asset.paletteStatus && <span className={"badge " + (asset.paletteStatus==="embedded" ? "confirmed" : "suspected")}>Palette: {asset.paletteStatus}</span>}
            {asset.visualStatus==="flat-color" && <span className="badge unknown">einfarbig / Maske?</span>}
            {asset.visualStatus==="palette-suspect" && <span className="badge suspected">Palette offen</span>}
          </div>
          {asset.assetKind==="composite" ? <small className="muted">Zusammengesetzte Vorschau aus mehreren ALIS-Grafikbausteinen. Noch nicht als kachelbare Oberfläche behandeln.</small> : asset.visualStatus!=="flat-color" && asset.visualStatus!=="palette-suspect" ? <div className="asset-quick-map">
            <button onClick={()=>assignPreview(asset,"dungeon-base")}>Basis</button>
            <button className="secondary" onClick={()=>assignPreview(asset,"wall.front")}>Wand</button>
            <button className="secondary" onClick={()=>assignPreview(asset,"surface.floor")}>Boden</button>
            <button className="secondary" onClick={()=>assignPreview(asset,"surface.ceiling")}>Decke</button>
          </div> : <small className="muted">Nicht als Dungeon-Basis angeboten, bis Palette/Maskenrolle geklärt ist.</small>}
        </article>)}</div>
        {displayedAssets.length>240 && <p className="muted">Composites und belastbare Vorschauen werden zuerst angezeigt. Insgesamt sind {displayedAssets.length-240} weitere Vorschauen im Import erfasst.</p>}
      </section>}

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
