import {useEffect,useMemo,useState} from 'react';
import {readAlisModule,writeAlisModule,type AlisModule} from '@/lib/ishar/alis-module';
import {describeAlisPalettes,editAlisPalette,vgaDac} from '@/lib/ishar/alis-assets';
import {sha256} from '@/lib/ishar/cont-patch';
function download(data:Uint8Array|string,name:string,type='application/octet-stream'){
 const blob=new Blob([typeof data==='string'?data:Uint8Array.from(data).buffer],{type}),url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function AlisPaletteEditor(){
 const [source,setSource]=useState<{name:string;module:AlisModule;hash:string}|null>(null);
 const [image,setImage]=useState<Uint8Array|null>(null),[entry,setEntry]=useState(0),[color,setColor]=useState(0);
 const [draft,setDraft]=useState(['0','0','0']),[past,setPast]=useState<Uint8Array[]>([]),[future,setFuture]=useState<Uint8Array[]>([]);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const palettes=useMemo(()=>image?describeAlisPalettes(image):[],[image]);
 const palette=palettes.find(item=>item.entryIndex===entry)??palettes[0];
 const selectedColor=palette?Math.max(palette.firstColor,Math.min(color,palette.firstColor+palette.colorCount-1)):0;
 const stored=palette?.colors[selectedColor-palette.firstColor];
 const changed=useMemo(()=>!!image&&!!source&&image.some((value,index)=>value!==source.module.image[index]),[image,source]);
 useEffect(()=>{if(stored)setDraft(stored.map(String));},[image,entry,selectedColor]);
 async function load(file:File){
  setBusy(true);setError('');setMessage('');
  try{
   if(file.size>32*1024*1024)throw Error('Dieses Werkzeug unterstützt IO-Dateien bis 32 MiB.');
   const module=readAlisModule(new Uint8Array(await file.arrayBuffer())),entries=describeAlisPalettes(module.image);
   setSource({name:file.name,module,hash:await sha256(module.original)});setImage(module.image.slice());setPast([]);setFuture([]);
   setEntry(entries[0]?.entryIndex??0);setColor(entries[0]?.firstColor??0);
   setMessage(entries.length?`${entries.length} bearbeitbare DOS-Paletten geladen.`:'Keine unterstützten DOS-Paletten in diesem Modul gefunden.');
  }catch(err){setError(err instanceof Error?err.message:String(err));}
  finally{setBusy(false);}
 }
 function apply(){
  if(!image||!palette)return;
  try{
   if(draft.some(value=>value.trim()===''))throw Error('Bitte alle drei Farbkomponenten eingeben.');
   const next=editAlisPalette(image,palette.entryIndex,selectedColor,draft.map(Number));
   if(next.some((value,index)=>value!==image[index])){setPast([...past.slice(-31),image]);setFuture([]);setImage(next);}
   setError('');setMessage(`Farbe ${selectedColor} übernommen. Export erfolgt als neue IO-Kopie.`);
  }catch(err){setError(err instanceof Error?err.message:String(err));}
 }
 function undo(){if(!image||!past.length)return;setImage(past[past.length-1]!);setPast(past.slice(0,-1));setFuture([image,...future]);setError('');setMessage('Änderung rückgängig gemacht.');}
 function redo(){if(!image||!future.length)return;setImage(future[0]!);setPast([...past,image]);setFuture(future.slice(1));setError('');setMessage('Änderung wiederhergestellt.');}
 function exportModule(){
  if(!source||!image)return;
  try{const bytes=writeAlisModule(source.module,image);download(bytes,source.name.replace(/\.io$/i,'')+'.modified.IO');setError('');setMessage('IO-Kopie exportiert und durch erneutes Lesen geprüft. Originalspielprüfung steht aus.');}
  catch(err){setError(err instanceof Error?err.message:String(err));}
 }
 async function exportReport(){
  if(!source||!image)return;
  const edits=[];for(let at=0;at<image.length;at++)if(image[at]!==source.module.image[at])edits.push({imageOffset:at,before:source.module.image[at],after:image[at]});
  const report={format:'ishar-ck-alis-palette-report',version:1,file:source.name,sourceSha256:source.hash,imageSha256:await sha256(image),edits,verification:'image bytes only; not tested in original execution'};
  download(JSON.stringify(report,null,2)+'\n',source.name+'.palette-report.json','application/json');
 }
 const display=(rgb:number[])=>rgb.map(value=>palette?.encoding==='dos-packed16'?value<<5:vgaDac(value));
 return <section className="stone-card palette-module-editor" aria-labelledby="palette-editor-title">
  <h2 id="palette-editor-title">Originalmodul: Paletten bearbeiten</h2>
  <p>Lokales DOS-IO-Modul öffnen, eine enthaltene Palette bearbeiten und eine neue IO-Kopie exportieren. Die Quelldatei wird nicht verändert.</p>
  <div className="toolbar"><label className="file-button">IO-Modul für Palette öffnen<input hidden type="file" accept=".io,.IO" disabled={busy} onChange={event=>{const file=event.currentTarget.files?.[0];event.currentTarget.value='';if(file)void load(file);}}/></label>
   <button className="secondary" disabled={!past.length||busy} onClick={undo}>Palette rückgängig</button><button className="secondary" disabled={!future.length||busy} onClick={redo}>Palette wiederholen</button>
   <button disabled={!source||busy} onClick={exportModule}>IO-Kopie exportieren</button><button className="secondary" disabled={!source||busy} onClick={()=>void exportReport()}>Palettenbericht exportieren</button>
  </div>
  {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
  {source&&<p><strong>{source.name}</strong> · {source.module.encoding} · <span title={source.hash}>SHA-256 {source.hash.slice(0,12)}…</span> · {changed?'ungespeicherte Änderungen':'unverändert'}</p>}
  {palette&&<>
   <label className="dark-label">Palettenressource<select value={palette.entryIndex} onChange={event=>{setEntry(Number(event.currentTarget.value));setError('');}}>{palettes.map(item=><option key={item.entryIndex} value={item.entryIndex}>#{item.entryIndex} · Farben {item.firstColor}–{item.firstColor+item.colorCount-1} · {item.encoding}</option>)}</select></label>
   <div className="palette-edit-grid" aria-label="Palettenfarben">{palette.colors.map((rgb,index)=>{const native=palette.firstColor+index,shown=display(rgb);return <button key={native} aria-label={`Farbe ${native}`} aria-pressed={native===selectedColor} title={`Farbe ${native}: ${rgb.join(' / ')}`} style={{background:`rgb(${shown.join(',')})`,color:shown.map(value=>{const c=value/255;return c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4;}).reduce((sum,value,i)=>sum+value*[0.2126,0.7152,0.0722][i]!,0)>0.179?'#000':'#fff'}} onClick={()=>setColor(native)}>{native}</button>;})}</div>
   <p>Farbe {selectedColor}: {palette.encoding==='dos-packed16'?'wirksame Komponenten':'gespeicherte Werte'} 0–{palette.maxChannel}. Die Vorschau zeigt {palette.encoding==='dos-packed16'?'die effektiven DOS-Farbwerte':'die VGA-DAC-Quantisierung'}.</p>
   <div className="palette-edit-fields">{['Rot','Grün','Blau'].map((label,index)=><label className="dark-label" key={label}>{label}<input aria-label={`Palette ${label}`} type="number" min={0} max={palette.maxChannel} step={1} value={draft[index]} onChange={event=>setDraft(draft.map((value,i)=>i===index?event.currentTarget.value:value))}/></label>)}</div>
   <button onClick={apply}>Palettenfarbe übernehmen</button>
   <p className="audit-note">Eine Palette kann mehrere Grafiken beeinflussen. Welche Palette wann aktiv ist, bestimmen die Originalskripte. Der Export enthält die Modulbytes; eine Prüfung im Originalspiel steht noch aus.</p>
  </>}
 </section>;
}
