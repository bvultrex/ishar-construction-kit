import {originalActorAiGate} from '@/lib/ishar/original-actor-ai';
import {savedMainMemory,type ActorListingBundle} from '@/lib/ishar/original-actor-frame';
import {useEffect,useMemo,useState} from 'react';
import {readOriginalActorDispatch,actorScriptCandidates,type OriginalActorDispatch} from '@/lib/ishar/original-actor-dispatch';
import {readActorSave,actorViewCandidate,type ActorSave} from '@/lib/ishar/save-actors';
export function OriginalActorInspector() {
  const [dispatch,setDispatch]=useState<OriginalActorDispatch|null>(null);
  const [save,setSave]=useState<ActorSave|null>(null);
  const [error,setError]=useState('');
  const [bytes,setBytes]=useState<Uint8Array|null>(null);
  const [loader,setLoader]=useState('');
  useEffect(()=>{
    let cancelled=false;
    fetch('/__local/ishar-actors').then(async response=>{
      if(!response.ok)return;
      const bundle:ActorListingBundle=await response.json();
      if(!cancelled){setLoader(bundle.loader);setDispatch(readOriginalActorDispatch(bundle.dispatch));}
    }).catch(()=>{});
    return ()=>{cancelled=true;};
  },[]);
  const memory=useMemo(()=>{if(!bytes||!loader)return null;try{return savedMainMemory(loader,bytes);}catch{return null;}},[bytes,loader]);
  const aiStatus=(id:number)=>{if(!memory)return 'Lokales IO-Listing benötigt';try{return originalActorAiGate(memory,id,false).reason;}catch{return 'Benötigter Originalzustand fehlt';}};
  return <article className="panel"><h2>Originaldaten: NPCs & Gegner</h2><p>EAFF.IO.asm und einen Originalsave lokal laden. Der Typ bestimmt das Originalskript; Slots 50–52 haben eigene Zuordnungen. Bedingte Fälle bleiben als solche sichtbar.</p>
    <div className="toolbar"><label className="file-button">EAFF-Listing öffnen<input type="file" accept=".asm,.txt" onChange={async e=>{
      const file=e.currentTarget.files?.[0];if(!file)return;
      try{setDispatch(readOriginalActorDispatch(await file.text()));setError('');}catch(err){setError(String(err));}
    }}/></label><label className="file-button">Akteur-Save öffnen<input type="file" accept=".sav" onChange={async e=>{
      const file=e.currentTarget.files?.[0];if(!file)return;
      const nextBytes=new Uint8Array(await file.arrayBuffer()),parsed=readActorSave(nextBytes);
      if(!parsed){setError('Kein unterstützter Ishar-2-DOS-Save.');return;}setSave(parsed);setBytes(nextBytes);setError('');
    }}/></label></div>
    {error&&<p role="alert">{error}</p>}
    {dispatch&&<p>{dispatch.specialSlots.length} Sonderplätze · {dispatch.types.length} Typzuordnungen aus dem Originallisting.</p>}
    <p>Die EATT-Prüfung zeigt den Original-Eingangszweig bei stillstehender Gruppe. Sie bestätigt noch keinen Angriff; Zielwahl, Zeitgeber und Schaden folgen separat.</p>
    {save&&<div className="file-table-wrap"><table className="file-table"><thead><tr><th>Slot</th><th>Typ</th><th>r/c</th><th>Szene</th><th>HP</th><th>Sichtkandidat</th><th>Originalskript</th><th>EATT-Eingangsprüfung (Stillstand)</th></tr></thead><tbody>{save.actors.filter(actor=>actor.hp>0).map(actor=>{
      const view=actorViewCandidate(save,actor),binding=dispatch?actorScriptCandidates(dispatch,actor):null;
      return <tr key={actor.id}><td>{actor.id}</td><td>{actor.type}</td><td>{actor.row}/{actor.col}</td><td>{actor.scene}</td><td>{actor.hp}</td><td>{view?`${view.distance} / ${view.lateral}`:'außerhalb'}</td><td>{binding?`${binding.scriptIds.map(id=>'0x'+id.toString(16)).join(', ')||'kein direktes clive'} · ${binding.entry}${binding.conditional?' · bedingt':''}`:'Listing benötigt / unbekannt'}</td><td>{aiStatus(actor.id)}</td></tr>;
    })}</tbody></table></div>}
  </article>;
}
