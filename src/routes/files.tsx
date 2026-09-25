import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useKit } from "@/lib/store";
import { inventoryLoose, inventoryZip, summarizeInventory } from "@/lib/ishar/inventory";
import { formatBytes } from "@/lib/utils";

export const Route = createFileRoute("/files")({ component: FileLab });

function FileLab() {
  const { inventory, setInventory } = useKit();
  const [busy,setBusy] = useState(false);
  const summary = summarizeInventory(inventory);

  async function ingest(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    try {
      if (files.length === 1 && files[0]!.name.toLowerCase().endsWith(".zip")) setInventory(await inventoryZip(files[0]!), files[0]!.name);
      else setInventory(await inventoryLoose(files), `${files.length} lokale Datei(en)`);
    } finally { setBusy(false); }
  }

  return <section>
    <header className="page-head"><div><p className="eyebrow">File Lab</p><h1>Binärdaten inventarisieren</h1><p>IO, FIC, SAV und EXE werden lokal nach Magic, Entropie, Packer-Headern und belegten Dateinamen klassifiziert.</p></div><label className="file-button">{busy?"Analysiere…":"ZIP / Dateien öffnen"}<input type="file" multiple disabled={busy} onChange={(e)=>void ingest(Array.from(e.currentTarget.files ?? []))}/></label></header>
    {!inventory.length ? <div className="empty-state">Zieh hier keine Originaldaten ins Repo: Wähle sie lokal aus. Das File Lab liest sie im Browser und speichert nichts hoch.</div> : <>
      <div className="stats-grid file-stats"><article><span>Dateien</span><strong>{summary.total}</strong></article><article><span>Volumen</span><strong>{formatBytes(summary.bytes)}</strong></article><article><span>Saves</span><strong>{summary.savs.length}</strong></article><article><span>IO/AO</span><strong>{summary.io.length}</strong></article><article><span>Unbekannt</span><strong>{summary.unknown.length}</strong></article></div>
      <div className="file-table-wrap"><table className="file-table"><thead><tr><th>Datei</th><th>Rolle</th><th>Größe</th><th>Magic</th><th>Evidenz</th></tr></thead><tbody>{inventory.map(r=><tr key={r.path}><td><strong>{r.path}</strong>{r.silm && <small>{r.silm.packerName}</small>}</td><td>{r.classification.role}</td><td>{formatBytes(r.size)}</td><td><code>{r.magic}</code></td><td><span className={`badge ${r.confidence}`}>{r.confidence}</span></td></tr>)}</tbody></table></div>
    </>}
  </section>;
}
