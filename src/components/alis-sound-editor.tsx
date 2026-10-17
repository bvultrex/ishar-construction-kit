import {useMemo,useState} from 'react';
import {readAlisModule,writeAlisModule,type AlisModule} from '@/lib/ishar/alis-module';
import {readAlisSoundDirectory,editAlisSampleSpeed} from '@/lib/ishar/original-alis-sounds';

export function AlisSoundEditor(){
 const [source,setSource]=useState<{name:string;module:AlisModule}|null>(null),[image,setImage]=useState<Uint8Array|null>(null);
 const [past,setPast]=useState<Uint8Array[]>([]),[future,setFuture]=useState<Uint8Array[]>([]),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [index,setIndex]=useState(0),[draft,setDraft]=useState('10'),[busy,setBusy]=useState(false);
 const entries=useMemo(()=>image?readAlisSoundDirectory(image):[],[image]),selected=entries[index];
 async function load(file:File){setBusy(true);try{
  if(file.size>32*1024*1024)throw Error('IO-Datei ist größer als 32 MiB.');
  const module=readAlisModule(new Uint8Array(await file.arrayBuffer())),sounds=readAlisSoundDirectory(module.image);
  setSource({name:file.name,module});setImage(module.image);setIndex(0);setDraft(String(sounds[0]?.sampleHeader?.speed??10));setPast([]);setFuture([]);setError('');setMessage(`${sounds.length} Soundeinträge geladen.`);
 }catch(e){setError(String(e));}finally{setBusy(false);}}
 function apply(){if(!image)return;try{
  if(!/^\d+$/.test(draft))throw Error('Geschwindigkeit als ganze Zahl 0–255 eingeben.');
  const next=editAlisSampleSpeed(image,index,Number(draft));
  if(next.image.some((b,i)=>b!==image[i])){setPast([...past.slice(-31),image]);setFuture([]);setImage(next.image);}
  setError('');setMessage(`Header geändert. Betroffene Ressourcen: ${next.affectedIndices.join(', ')}.`);
 }catch(e){setError(String(e));}}
 function exportModule(){if(!source||!image)return;try{
  const bytes=writeAlisModule(source.module,image),url=URL.createObjectURL(new Blob([Uint8Array.from(bytes).buffer])),a=document.createElement('a');a.href=url;a.download=source.name.replace(/\.io$/i,'')+'.sound-modified.IO';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  setError('');setMessage('Neue IO-Kopie exportiert; dekodierter Inhalt geprüft. Originalspielprüfung steht aus.');
 }catch(e){setError(String(e));}}
 return <section className="stone-card" aria-labelledby="sound-editor-title">
  <h2 id="sound-editor-title">Originalmodul: Soundressourcen</h2>
  <p>Soundheader eines lokalen DOS-IO-Moduls untersuchen und die gespeicherte Geschwindigkeit ändern. Die Quelldatei bleibt unverändert.</p>
  <div className="toolbar"><label className="file-button">IO-Modul für Sound öffnen<input hidden type="file" accept=".io,.IO" disabled={busy} onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(file)void load(file);}}/></label>
   <button disabled={busy||!past.length} onClick={()=>{if(!image)return;const next=past.at(-1)!;setFuture([image,...future]);setPast(past.slice(0,-1));setImage(next);setError('');setMessage('Änderung rückgängig gemacht.');setDraft(String(readAlisSoundDirectory(next)[index]?.sampleHeader?.speed??10));}}>Sound rückgängig</button>
   <button disabled={busy||!future.length} onClick={()=>{if(!image)return;const next=future[0]!;setPast([...past,image]);setFuture(future.slice(1));setImage(next);setError('');setMessage('Änderung wiederhergestellt.');setDraft(String(readAlisSoundDirectory(next)[index]?.sampleHeader?.speed??10));}}>Sound wiederholen</button>
   <button disabled={busy||!source} onClick={exportModule}>Sound-IO-Kopie exportieren</button>
  </div>
  {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
  {source&&<p>{source.name} · {image?.some((b,i)=>b!==source.module.image[i])?'ungespeicherte Änderungen':'unverändert'}</p>}
  {!!entries.length&&<label className="dark-label">Soundressource<select value={index} onChange={e=>{const i=Number(e.currentTarget.value);setIndex(i);setDraft(String(entries[i]?.sampleHeader?.speed??10));}}>{entries.map(e=><option key={e.index} value={e.index}>#{e.index} · Typ {e.type} · Offset {e.offset}</option>)}</select></label>}
  {selected?.sampleHeader&&<><p>Gespeicherte Länge: {selected.sampleHeader.declaredLength} · Packungsfeld: {selected.sampleHeader.packing} · Schleifenfeld: {selected.sampleHeader.loopField}</p>
   <label className="dark-label">Gespeicherte Geschwindigkeit<input aria-label="Sample-Geschwindigkeit" type="number" min={0} max={255} step={1} value={draft} onChange={e=>setDraft(e.currentTarget.value)}/></label><button disabled={busy} onClick={apply}>Sample-Geschwindigkeit übernehmen</button>
   <p>Der Wert wird verwendet, wenn das Originalskript keine Geschwindigkeit vorgibt. Gemeinsam referenzierte Header ändern sich zusammen. Audiowiedergabe und Prüfung im Originalspiel stehen noch aus.</p></>}
  {selected&&!selected.sampleHeader&&<p>Dieser Ressourcentyp ist noch nicht als bearbeitbarer Sampleheader erschlossen.</p>}
 </section>;
}
