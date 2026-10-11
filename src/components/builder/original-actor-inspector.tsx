import {useState} from 'react';
import {readOriginalActorDispatch,actorScriptCandidates,type OriginalActorDispatch} from '@/lib/ishar/original-actor-dispatch';
import {readActorSave,actorViewCandidate,type ActorSave} from '@/lib/ishar/save-actors';
export function OriginalActorInspector() {
  const [dispatch,setDispatch]=useState<OriginalActorDispatch|null>(null);
  const [save,setSave]=useState<ActorSave|null>(null);
  const [error,setError]=useState('');
  return <article className="panel"><h2>Originaldaten: NPCs & Gegner</h2><p>EAFF.IO.asm und einen Originalsave lokal laden. Der Typ bestimmt das Originalskript; Slots 50–52 haben eigene Zuordnungen. Bedingte Fälle bleiben als solche sichtbar.</p>
    <div className="toolbar"><label className="file-button">EAFF-Listing öffnen<input type="file" accept=".asm,.txt" onChange={async e=>{
      const file=e.currentTarget.files?.[0];if(!file)return;
      try{setDispatch(readOriginalActorDispatch(await file.text()));setError('');}catch(err){setError(String(err));}
    }}/></label><label className="file-button">Akteur-Save öffnen<input type="file" accept=".sav" onChange={async e=>{
      const file=e.currentTarget.files?.[0];if(!file)return;
      const parsed=readActorSave(new Uint8Array(await file.arrayBuffer()));
      if(!parsed){setError('Kein unterstützter Ishar-2-DOS-Save.');return;}setSave(parsed);setError('');
    }}/></label></div>
    {error&&<p role="alert">{error}</p>}
    {dispatch&&<p>{dispatch.specialSlots.length} Sonderplätze · {dispatch.types.length} Typzuordnungen aus dem Originallisting.</p>}
    {save&&<div className="file-table-wrap"><table className="file-table"><thead><tr><th>Slot</th><th>Typ</th><th>r/c</th><th>Szene</th><th>HP</th><th>Sichtkandidat</th><th>Originalskript</th></tr></thead><tbody>{save.actors.filter(actor=>actor.hp>0).map(actor=>{
      const view=actorViewCandidate(save,actor),binding=dispatch?actorScriptCandidates(dispatch,actor):null;
      return <tr key={actor.id}><td>{actor.id}</td><td>{actor.type}</td><td>{actor.row}/{actor.col}</td><td>{actor.scene}</td><td>{actor.hp}</td><td>{view?`${view.distance} / ${view.lateral}`:'außerhalb'}</td><td>{binding?`${binding.scriptIds.map(id=>'0x'+id.toString(16)).join(', ')||'kein direktes clive'} · ${binding.entry}${binding.conditional?' · bedingt':''}`:'Listing benötigt / unbekannt'}</td></tr>;
    })}</tbody></table></div>}
  </article>;
}
