import {useMemo,useState} from 'react';
import {deriveIshar2SaveLayout,readIshar2SavedMain,patchIshar2SavedMain,type Ishar2SaveLayout} from '@/lib/ishar/ishar2-save-layout';
import {sha256} from '@/lib/ishar/cont-patch';
import {downloadBytes} from '@/lib/utils';
/** Native save data editor. Deliberately separate from candidate character maps. */
export function OriginalSaveMainEditor(){
 const [layout,setLayout]=useState<Ishar2SaveLayout|null>(null),[source,setSource]=useState<{name:string;bytes:Uint8Array;hash:string}|null>(null);
 const [bytes,setBytes]=useState<Uint8Array|null>(null),[past,setPast]=useState<Uint8Array[]>([]),[future,setFuture]=useState<Uint8Array[]>([]);
 const [fieldOffset,setFieldOffset]=useState(2),[index,setIndex]=useState('0'),[draft,setDraft]=useState('0'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const fields=layout?.fields.filter(field=>field.space==='main')??[],field=fields.find(field=>field.fileOffset===fieldOffset)??fields[0];
 const memory=useMemo(()=>bytes&&layout?readIshar2SavedMain(bytes,layout):null,[bytes,layout]);
 const address=field&&Number.isInteger(Number(index))&&index.trim()!==''&&Number(index)>=0&&Number(index)<field.memoryBytes?field.memoryAddress+Number(index):null;
 const current=address===null?undefined:memory?.get(address),changed=!!bytes&&!!source&&bytes.some((v,i)=>v!==source.bytes[i]);
 async function open(file:File,kind:'io'|'save'){
  setBusy(true);setError('');setMessage('');
  try{
   if(file.size>(kind==='io'?16*1024*1024:8359))throw Error('Datei überschreitet die unterstützte Größe.');
   const data=new Uint8Array(await file.arrayBuffer());
   if(kind==='io'){const next=await deriveIshar2SaveLayout(data);if(bytes)readIshar2SavedMain(bytes,next);setLayout(next);setMessage('IO-Profil geprüft: 141 originale Save-Felder.');}
   else{if(data.length!==8359||data[0]!==0||data[1]!==2)throw Error('Erwartet: Ishar-2-DOS-Save, Header 2, 8359 Bytes.');if(layout)readIshar2SavedMain(data,layout);setSource({name:file.name,bytes:data,hash:await sha256(data)});setBytes(data.slice());setPast([]);setFuture([]);setMessage('Save als getrennte Arbeitskopie geladen.');}
  }catch(err){setError(err instanceof Error?err.message:String(err));}finally{setBusy(false);}
 }
 function apply(){
  if(!layout||!bytes||address===null)return;
  try{
   const value=Number(draft);if(draft.trim()===''||!Number.isInteger(value)||value<0||value>255)throw Error('Bytewert muss eine ganze Zahl von 0 bis 255 sein.');
   const next=patchIshar2SavedMain(bytes,layout,[{address,width:1,value}]);
   if(next.some((v,i)=>v!==bytes[i])){setPast([...past.slice(-31),bytes]);setFuture([]);setBytes(next);}
   setError('');setMessage(`MAIN 0x${address.toString(16)} als Byte übernommen.`);
  }catch(err){setError(err instanceof Error?err.message:String(err));}
 }
 function undo(){if(!bytes||!past.length)return;setFuture([bytes,...future]);setBytes(past[past.length-1]!);setPast(past.slice(0,-1));setError('');setMessage('Save-Änderung rückgängig gemacht.');}
 function redo(){if(!bytes||!future.length)return;setPast([...past,bytes]);setBytes(future[0]!);setFuture(future.slice(1));setError('');setMessage('Save-Änderung wiederhergestellt.');}
 function exportSave(){if(!bytes||!source||!layout)return;readIshar2SavedMain(bytes,layout);downloadBytes(source.name.replace(/\.sav$/i,'')+'.MAIN-EDIT.SAV',bytes);setMessage('Neue SAV-Kopie exportiert. Originalspielprüfung steht aus.');}
 async function report(){
  if(!source||!bytes||!layout)return;
  try{const edits=[];for(let at=0;at<bytes.length;at++)if(bytes[at]!==source.bytes[at])edits.push({fileOffset:at,before:source.bytes[at],after:bytes[at]});
   const json={format:'ishar-ck-save-main-report',version:1,game:'ishar2',file:source.name,ioSha256:layout.ioSha256,sourceSha256:source.hash,targetSha256:await sha256(bytes),edits,verification:'original-I/O-layout only; not tested in original execution'};
   downloadBytes(source.name+'.MAIN-report.json',new TextEncoder().encode(JSON.stringify(json,null,2)+'\n'));setError('');
  }catch(err){setError(err instanceof Error?err.message:String(err));}
 }
 return <section className="stone-card original-save-main" aria-labelledby="save-main-title">
  <h2 id="save-main-title">Original-Save: belegte MAIN-Felder</h2>
  <p>Ishar 2 DOS: IO.IO und SAV lokal öffnen. Die Feldzuordnung stammt aus den originalen Lese- und Schreibinstruktionen. Diese Werkzeugansicht bearbeitet Rohwerte; ungeklärte Felder erhalten keine erfundenen Namen.</p>
  <div className="toolbar"><label className="file-button">Original IO.IO prüfen<input hidden disabled={busy} type="file" accept=".io,.IO" onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(file)void open(file,'io');}}/></label><label className="file-button">MAIN-Save öffnen<input hidden disabled={busy} type="file" accept=".sav,.SAV" onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(file)void open(file,'save');}}/></label>
   <button disabled={!past.length||busy} onClick={undo}>MAIN rückgängig</button><button disabled={!future.length||busy} onClick={redo}>MAIN wiederholen</button><button disabled={!bytes||!layout||busy} onClick={exportSave}>MAIN-SAV exportieren</button><button disabled={!bytes||!layout||busy} onClick={()=>void report()}>MAIN-Bericht exportieren</button>
  </div>
  {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
  <p>{layout?'IO-Profil verifiziert · 140 MAIN-Bereiche; Header separat erhalten.':'Original IO.IO für die belegte Feldzuordnung benötigt.'}</p>
  {source&&<p><strong>{source.name}</strong> · <span title={source.hash}>SHA-256 {source.hash.slice(0,12)}…</span> · {changed?'geändert':'unverändert'}</p>}
  {field&&memory&&<>
   <label className="dark-label">Gespeicherter MAIN-Bereich<select aria-label="Gespeicherter MAIN-Bereich" value={field.fileOffset} onChange={e=>{setFieldOffset(Number(e.currentTarget.value));setIndex('0');}}>{fields.map(f=><option key={f.fileOffset} value={f.fileOffset}>MAIN 0x{f.memoryAddress.toString(16)} · {f.memoryBytes} Bytes · SAV {f.fileOffset} · {f.storage}</option>)}</select></label>
   <div className="field-grid"><label className="dark-label">Byte im Bereich<input aria-label="MAIN Byteindex" type="number" min={0} max={field.memoryBytes-1} value={index} onChange={e=>setIndex(e.target.value)}/></label><label className="dark-label">Neuer Bytewert<input aria-label="MAIN Bytewert" type="number" min={0} max={255} step={1} value={draft} onChange={e=>setDraft(e.target.value)}/></label></div>
   <p>{current===undefined?'Gültigen Byteindex wählen.':`MAIN 0x${address!.toString(16)}: aktuell ${current} (0x${current.toString(16).padStart(2,'0')})`}</p>
   <button disabled={address===null||busy} onClick={apply}>MAIN-Byte übernehmen</button>
   <p>Original-I/O: Lesen 0x{field.readPc.toString(16)}, Schreiben 0x{field.writePc.toString(16)}. Wortfelder werden hier als zwei einzelne Bytes gezeigt.</p>
  </>}
  <p className="audit-note">Die Quelle bleibt unverändert. Exportiert wird eine neue SAV-Kopie; Änderungen bleiben bis zum Export nur in dieser Ansicht. Ein geändertes Byte-Scalarfeld wird wie im Original als vorzeichenerweitertes BE16 gespeichert. Originalspielausführung und vollständige Feldbedeutungen sind noch offen.</p>
 </section>;
}
