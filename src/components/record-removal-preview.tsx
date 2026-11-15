import {useState} from 'react';
import {stepOriginalDosPhysicalScript} from '@/lib/ishar/original-dos-physical-script';

/** Synthetic, copyright-free fixture through the same physical opcode75 adapter. */
export function RecordRemovalPreview(){
 const [result,setResult]=useState<Uint8Array|null>(null),[error,setError]=useState('');
 const source=new Uint8Array(0x100000),view=new DataView(source.buffer);
 const word=(at:number,value:number)=>view.setUint16(at,value,true);
 word(0x1c0b0+0xbea,0x6000);word(0x1c0b0+0xbf6,0x1000);word(0x501e8,0x200);word(0x501ea,0x20);word(0x51022,0x200);
 for(const [index,at] of [0x200,0x240,0x280].entries()){
  source[0x60000+at]=index===1?255:0;source[0x60000+at+1]=index===2?1:2;
  word(0x60000+at+2,0x20);word(0x60000+at+4,index<2?at+0x40:0);word(0x60000+at+6,index<2?at+0x40:0);
 }
 source.set([75,0,2],0x40100);
 function run(){try{setResult(stepOriginalDosPhysicalScript(source,0x1c0b,{ds:0x4000,es:0x5000,si:0x100,bp:0x200,dx:0,cx:0}).memory);setError('');}catch(e){setError(String(e));}}
 const memory=result??source,readWord=(at:number)=>memory[at]|memory[at+1]<<8;
 const active:number[]=[];let at=readWord(0x501e8);while(at&&active.length<3){active.push(at);at=readWord(0x60000+at+4);}
 return <section className="stone-card">
  <p className="eyebrow">Testversion · 14. November 2026</p><h2>Neue Grafikverwaltung ausprobieren</h2>
  <p>Diese kleine Testszene zeigt den neuen Originalpfad zum Entfernen einer Grafikgruppe. Zwei Einträge gehören zu Gruppe 2, ein dritter zu Gruppe 1. Der Auftrag entfernt Gruppe 2 aus der aktiven Liste und erhält Gruppe 1.</p>
  <p>Die Szene verwendet ausschließlich künstliche Daten. Sie führt denselben rekonstruierten Befehl aus, der inzwischen auch im originalen LOGO-Ablauf geprüft wurde. Das vollständige Originalspiel ist hier noch nicht angebunden.</p>
  <div className="toolbar"><button onClick={run} disabled={!!result}>Gruppe 2 entfernen</button><button onClick={()=>{setResult(null);setError('');}}>Zurücksetzen</button></div>
  {error&&<p role="alert">{error}</p>}
  <p role="status">{result?'Auftrag ausgeführt: Gruppe 1 bleibt aktiv.':'Bereit: Drei Grafikeinträge sind aktiv.'}</p>
  <table><thead><tr><th>Eintrag</th><th>Gruppe</th><th>Aktiv</th><th>Zustand</th></tr></thead><tbody>{[0x200,0x240,0x280].map((entry,index)=><tr key={entry}><td>{index+1}</td><td>{source[0x60000+entry+1]}</td><td>{active.includes(entry)?'Ja':'Nein'}</td><td>{result&&entry===0x240?'Zur Wiederverwendung freigegeben':memory[0x60000+entry]===1?'Für Bildbereinigung vorgemerkt':'Unverändert'}</td></tr>)}</tbody></table>
 </section>;
}
