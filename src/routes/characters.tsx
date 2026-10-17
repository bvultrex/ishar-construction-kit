import {OriginalSaveMainEditor} from '@/components/original-save-main-editor';
import { createFileRoute } from "@tanstack/react-router";
import { useKit } from "@/lib/store";
import { className, raceName, ISHAR1_SAVE, ISHAR2_SAVE } from "@/lib/ishar/save-maps";
import { patchParty } from "@/lib/ishar/save-codec";
import { downloadBytes } from "@/lib/utils";
import type { CharacterView } from "@/lib/ishar/types";
import { readActorSave, actorViewCandidate } from "@/lib/ishar/save-actors";
import {readSaveWorldItems,worldItemViewCandidate} from '@/lib/ishar/save-world-items';

export const Route = createFileRoute("/characters")({ component: CharacterLab });

const editable: Array<[keyof CharacterView, string]> = [
  ["level", "Stufe"], ["xp", "Erfahrung"], ["hp", "Vitalität"], ["hpMax", "Vitalität max."],
  ["gold", "Gold"], ["strength", "Kraft"], ["constitution", "Verfassung"], ["wisdom", "Weisheit"],
  ["intelligence", "Intelligenz"], ["agility", "Beweglichkeit"], ["psychic", "Geistig"],
  ["physical", "Körperlich"], ["armorClass", "Rüstung"], ["skillPerception", "Wahrnehmung"],
];

function CharacterLab() {
  const state = useKit();
  const { party, selectedSlot, setSlot, game, endian, loadDemo, setGame, setEndian, loadSave, patchCharacter } = state;
  const map = game === "ishar1" ? ISHAR1_SAVE : ISHAR2_SAVE;
  const ch = party[selectedSlot];
  const actorSave=game==="ishar2" && !state.isDemo && state.originalBytes ? readActorSave(state.originalBytes) : null;
  const worldItems=actorSave&&state.originalBytes?readSaveWorldItems(state.originalBytes):null;

  async function openSave(file: File) {
    loadSave(file.name, new Uint8Array(await file.arrayBuffer()));
  }

  function exportPatched() {
    if (!state.originalBytes) return;
    const result = patchParty(state.originalBytes, map, endian, party);
    const base = state.saveName.replace(/\.sav$/i, "") || "ISHAR_EDIT";
    downloadBytes(`${base}-CK.SAV`, result.bytes);
  }

  return <section>
    <header className="page-head">
      <div><p className="eyebrow">Character Lab / candidate save map</p><h1>{ch?.overlayName || "Party & Save-Struktur"}</h1><p>{ch ? `${className(map, ch.classId)} · ${raceName(map, ch.raceId)}` : "Lokale Save-Dateien werden ausschließlich im Browser verarbeitet."}</p></div>
      <div className="toolbar">
        <label className="file-button">Save öffnen<input type="file" accept=".sav" onChange={(e)=>{ const f=e.currentTarget.files?.[0]; if(f) void openSave(f); }} /></label>
        <button onClick={loadDemo}>Demo</button>
        <button className="secondary" disabled={!state.originalBytes} onClick={exportPatched}>Patch exportieren</button>
      </div>
    </header>
    <OriginalSaveMainEditor/>
    <div className="control-bar">
      <label>Spiel<select value={game} onChange={(e)=>setGame(e.target.value as "ishar1"|"ishar2")}><option value="ishar1">Ishar 1</option><option value="ishar2">Ishar 2</option></select></label>
      <label>Endian<select value={endian} onChange={(e)=>setEndian(e.target.value as "be"|"le")}><option value="be">Big endian</option><option value="le">Little endian</option></select></label>
      <span className="audit-chip">Map: {map.confidence}</span>
      {state.saveName && <span className="muted">{state.saveName} · {state.originalBytes?.length ?? 0} Bytes</span>}
    </div>
    {!party.length ? <div className="empty-state">Noch kein Save geladen. Die Demo nutzt synthetische Daten und berührt keine Originaldateien.</div> : <>
      <div className="party-strip">{party.map(c => <button key={c.slot} className={c.slot===selectedSlot?"selected":""} onClick={()=>setSlot(c.slot)}><strong>{c.overlayName || `Slot ${c.slot+1}`}</strong><small>Lv {c.level}</small></button>)}</div>
      {ch && <div className="editor-grid">
        <article className="editor-panel">
          <h2>Identität</h2>
          <label>Name <input value={ch.overlayName} onChange={(e)=>patchCharacter(ch.slot,{overlayName:e.target.value})}/><small>Overlay, noch nicht ins SAV geschrieben</small></label>
          {game === "ishar2" && <>
            <label>Beruf<select value={ch.classId} onChange={(e)=>patchCharacter(ch.slot,{classId:Number(e.target.value)})}>{map.classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label>Rasse<select value={ch.raceId} onChange={(e)=>patchCharacter(ch.slot,{raceId:Number(e.target.value)})}>{map.races.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
          </>}
        </article>
        <article className="editor-panel wide">
          <h2>Werte</h2>
          <div className="field-grid">{editable.filter(([key])=>key in map.fields).map(([key,label])=><label key={String(key)}>{label}<input type="number" min="0" value={Number(ch[key])} onChange={(e)=>patchCharacter(ch.slot,{[key]:Number(e.target.value)} as Partial<CharacterView>)}/><small>{map.fields[String(key)]?.confidence}</small></label>)}</div>
        </article>
      </div>}
      <p className="audit-note">Export schreibt nur bekannte gemappte Felder in eine Kopie der geladenen Datei. Unbekannte Bytes bleiben unverändert. Namen bleiben bis zur Offset-Verifikation reine Projekt-Overlays.</p>
    </>}
    {actorSave&&worldItems&&<article className="editor-panel"><h2>Original-Gegenstandspositionen</h2><p>Gespeicherte Objekttabellen, unabhängig von CONT. Aufgeführt sind Datensätze der aktuellen Karte. Der Renderer scannt IDs 0–110; weitere gespeicherte IDs werden als ungeprüft angezeigt.</p><div className="file-table-wrap"><table className="file-table"><thead><tr><th>Objekt-ID</th><th>r/c</th><th>Blick</th><th>Sichtkandidat</th></tr></thead><tbody>{worldItems.filter(item=>item.scene===actorSave.map).map(item=>{
      const candidate=worldItemViewCandidate(actorSave,item);return <tr key={item.id}><td>{item.id}</td><td>{item.row}/{item.col}</td><td>{item.facing}</td><td>{item.id>110?'außerhalb AFFOBJ-Schleife':candidate?`Distanz ${candidate.distance}, seitlich ${candidate.lateral}`:'außerhalb'}</td></tr>;
    })}</tbody></table></div></article>}
    {actorSave && <article className="editor-panel">
      <h2>NPC- und Kreaturenpositionen im Originalsave</h2>
      <p>Karte {actorSave.map} · r{actorSave.row}/c{actorSave.col} · Originalblick {actorSave.facing} · Szene {actorSave.scene}</p>
      <p>Originalslots 50–109 mit HP &gt; 0. „Sichtbereich“ prüft Szene, Blick und Entfernung; Verdeckung und Spriteauswahl werden separat geprüft. Diese Übersicht platziert noch keine NPCs im Playtest.</p>
      <div className="file-table-wrap"><table className="file-table"><thead><tr><th>Slot</th><th>Typ</th><th>Position r/c</th><th>Blick</th><th>HP</th><th>Szene</th><th>Sichtbereich</th></tr></thead>
        <tbody>{actorSave.actors.filter(a=>a.hp>0).map(actor=>{
          const candidate=actorViewCandidate(actorSave,actor);
          return <tr key={actor.id}><td>{actor.id}</td><td>{actor.type}</td><td>{actor.row}/{actor.col}</td><td>{actor.facing}</td><td>{actor.hp}</td><td>{actor.scene}</td><td>{candidate ? `Distanz ${candidate.distance}, seitlich ${candidate.lateral}` : "außerhalb"}</td></tr>;
        })}</tbody></table></div>
    </article>}
  </section>;
}
