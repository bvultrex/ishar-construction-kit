import {useState} from 'react';
import {openNativeScriptDiagnostic,stepNativeScriptDiagnostic,type NativeScriptDiagnostic} from '@/lib/ishar/native-script-diagnostic';
const hex=(n:number)=>'0x'+n.toString(16).padStart(4,'0');
export function NativeScriptDiagnosticPanel(){
 const [state,setState]=useState<NativeScriptDiagnostic|null>(null),[name,setName]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function load(file:File){setBusy(true);setError('');try{if(file.size>32*1024*1024)throw Error('Maximal 32 MiB pro Modul.');const next=openNativeScriptDiagnostic(new Uint8Array(await file.arrayBuffer()));setState(next);setName(file.name);}catch(e){setError(String(e));}finally{setBusy(false);}}
 function step(){if(!state)return;try{setState(stepNativeScriptDiagnostic(state));setError('');}catch(e){setError(String(e));}}
 const word=(at:number)=>state?state.memory[(state.bp+at)&65535]|(state.memory[(state.bp+at+1)&65535]<<8):0;
 return <section className="stone-card" aria-labelledby="native-script-title">
  <h2 id="native-script-title">Native Skript-Diagnose</h2>
  <p>Ein lokales Ishar-1/2-IO-Modul mit dem rekonstruierten DOS-Kontextaufbau untersuchen. Diese Diagnose verwendet einen kontrollierten Testkontext und verändert weder Originaldatei noch Playtest.</p>
  <div className="toolbar"><label className="file-button">IO-Modul für Skript-Diagnose öffnen<input hidden type="file" accept=".io,.IO" disabled={busy} onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(file)void load(file);}}/></label>
   <button disabled={busy||!state||state.status!=='ready'} onClick={step}>Einen nativen Kontrollfluss-Schritt ausführen</button>
   <button disabled={busy||!state} onClick={()=>{if(state){setState(openNativeScriptDiagnostic(state.module.original));setError('');}}}>Diagnose zurücksetzen</button></div>
  {error&&<p role="alert">{error}</p>}
  {state&&<><p><strong>{name}</strong> · Modul-ID {state.module.header.id} · {state.module.image.length} dekodierte Bytes</p>
   <p role="status">{state.message}</p>
   <table><caption>Kontrollierter DOS-Kontext · Modulsegment 0x4000, Kontextsegment 0x5000</caption><thead><tr><th>Wert</th><th>Aktueller Stand</th></tr></thead><tbody>
    <tr><td>Kontextzeiger BP</td><td>{hex(state.bp)}</td></tr><tr><td>Header-Einstieg</td><td>{hex(state.module.header.entry)}</td></tr><tr><td>Skriptzeiger SI</td><td>{hex(state.si)}</td></tr><tr><td>Timer-Zielbyte (SS:0x0C99)</td><td>{state.globals[0xc99]}</td></tr>
    <tr><td>Nächstes Opcodebyte</td><td>{state.si<state.module.image.length?hex(state.module.image[state.si]):'außerhalb des Moduls'}</td></tr><tr><td>Skriptstackoffset (BP−0x0A)</td><td>{hex(word(-10))}</td></tr><tr><td>Gespeicherter Skriptzeiger (BP−0x08)</td><td>{hex(word(-8))}</td></tr><tr><td>Ausgeführte Schritte</td><td>{state.steps}</td></tr></tbody></table>
  </>}
  <p>Kontextaufbau: gegen alle 240 lokalen Originalmodule geprüft. Einzelschritte: Opcodes 5–10, 17, 41, 66, 71, 76, 106 und 156; andere Befehle stoppen unverändert. Noch keine vollständige VM, NPC-Simulation oder Scheduler-Ausführung. Für Module über 64 KiB ist nur die Kontextprüfung angebunden.</p>
 </section>;
}
