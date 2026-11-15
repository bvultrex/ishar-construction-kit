import { useState } from 'react';
import { useKit } from '@/lib/store';
import { readOriginalMerchants, type OriginalMerchant } from '@/lib/ishar/original-merchants';
import { downloadBytes } from '@/lib/utils';
import { isOriginalSave, readOriginalCarrier, receiveOriginalPurchase, type OriginalPurchase } from '@/lib/ishar/original-commerce';

export function OriginalMerchantEditor() {
  const [merchants,setMerchants]=useState<OriginalMerchant[]>([]);
  const [error,setError]=useState('');
  const [source,setSource]=useState('');
  const [save,setSave]=useState<Uint8Array|null>(null);
  const [saveName,setSaveName]=useState('');
  const [held,setHeld]=useState<OriginalPurchase|null>(null);
  const [notice,setNotice]=useState('');
  return <article className="panel"><h2>Originaldaten: Händler</h2><p>Lokales MARCHAND.IO.asm öffnen. Sechs Warenplätze je Selektor; Felder: Objektcode, Preis × 1000, Preisrest und Bündelmenge. Der Export enthält bearbeitete Daten und Quelladressen; er verändert noch keine IO-Datei.</p>
    <label className="file-button">Skriptlisting öffnen<input type="file" accept=".asm,.txt" onChange={async e=>{
      const file=e.currentTarget.files?.[0]; if(!file) return;
      try { const result=readOriginalMerchants(await file.text()); setMerchants(result);setSource(file.name);setHeld(null);setError(''); }
      catch(err){setError(String(err));}
    }}/></label>
    {error && <p role="alert">{error}</p>}
    <section aria-label="Originalhandel prüfen"><h3>Originalhandel mit lokalem Save</h3><p>Ware wählen, anschließend einen Charakter anklicken. Zahlung und Inventarzuordnung erfolgen zusammen. Das Originalsave bleibt unverändert; der Export ist eine bearbeitete Kopie. Bei teilweise passenden Bündeln berechnet das Original den vollen Preis.</p>
    <label className="file-button">Ishar-2-Save öffnen<input type="file" accept=".sav" onChange={async e=>{
      const file=e.currentTarget.files?.[0];if(!file) return;
      const bytes=new Uint8Array(await file.arrayBuffer());
      if(!isOriginalSave(bytes)){setError('Erwartet: Ishar-2-DOS-Save, Version 2, 8359 Bytes.');return;}
      setSave(bytes);setSaveName(file.name);setHeld(null);setNotice('');setError('');
    }}/></label>
    {save && <><p>{saveName} · {held?`In der Hand: Objekt ${held.objectCode}, Menge ${held.quantity}`:'Kein Gegenstand in der Hand.'}</p>
      <div className="toolbar">{Array.from({length:5},(_,carrier)=>{
        const person=readOriginalCarrier(save,carrier);
        return <button key={carrier} disabled={!person.present||!held} onClick={()=>{
          if(!held)return;
          const result=receiveOriginalPurchase(save,held,carrier);
          if(!result.ok){setNotice(({ 'empty-character':'Charakterplatz ist leer.','insufficient-gold':'Nicht genügend Gold.','full-backpack':'Rucksack voll.','full-stack':'Stapel voll.' })[result.reason]);return;}
          setSave(result.bytes);setHeld(null);setNotice(`${result.accepted} übernommen${result.discarded?`, ${result.discarded} aus dem Bündel verworfen`:''}.`);
        }}>Charakter {carrier+1} · {person.money[0]*1000+person.money[1]} Gold</button>;
      })}<button disabled={!held} onClick={()=>{setHeld(null);setNotice('Ware zurückgelegt; keine Zahlung.');}}>Ware zurücklegen</button>
      <button onClick={()=>downloadBytes(saveName.replace(/\.sav$/i,'')+'-TRADE-CK.SAV',save)}>Save-Kopie exportieren</button></div></>}
    <p role="status">{notice}</p></section>
    {!!merchants.length && <><button onClick={()=>{const kit=useKit.getState();kit.setProject({...kit.project,game:{...kit.project.game,originalMerchants:merchants}});setNotice('Händlerdaten im Projekt gespeichert; der Playtest verwendet dieses Sortiment.');}}>Im Playtest verwenden</button><button onClick={()=>downloadBytes('ishar2-merchant-edits.json',new TextEncoder().encode(JSON.stringify({format:'ishar2-merchant-edits-v1',source,merchants},null,2)))}>Bearbeitete Daten exportieren</button>
    {merchants.map((merchant,mi)=><details key={merchant.selector}><summary>Händler {merchant.selector} · {merchant.entry}</summary><table className="file-table"><thead><tr><th>Platz</th><th>Objektcode</th><th>Preis × 1000</th><th>Preisrest</th><th>Bündelmenge</th><th>Handel</th></tr></thead><tbody>{merchant.slots.map((slot,si)=><tr key={si}><td>{si}</td>{slot.fields.map((value,fi)=><td key={fi}><input aria-label={`Händler ${merchant.selector} Platz ${si} Feld ${fi}`} type="number" value={value} disabled={!slot.addresses[fi]} onChange={e=>{
      const next=Number(e.target.value); if(!Number.isInteger(next)||next< -32768||next>32767) return;
      const address=slot.addresses[fi];
      // Shared selectors refer to the same literal instruction; edits follow its address.
      setMerchants(prev=>prev.map(m=>({...m,slots:m.slots.map(s=>({...s,fields:s.fields.map((v,k)=>s.addresses[k]===address?next:v)}))})));
    }}/><small>{slot.addresses[fi]??'Initialwert'}</small></td>)}<td><button disabled={!save||!!held||slot.fields[0]!>=0||slot.fields[0]!< -89} onClick={()=>{
      const [objectCode,thousands,remainder,quantity]=slot.fields;
      if(thousands!<0||remainder!<0||remainder!>=1000||quantity!<1||quantity!>255){setNotice('Ungültige Preis- oder Mengenfelder.');return;}
      setHeld({objectCode:objectCode!,price:[thousands!,remainder!],quantity:quantity!});setNotice('Empfangenden Charakter wählen oder Ware zurücklegen.');
    }}>In die Hand nehmen</button></td></tr>)}</tbody></table></details>)} </>}
  </article>;
}
