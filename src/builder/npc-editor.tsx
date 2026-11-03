import type { AuthoredGame, AuthoredNpc } from '@/lib/ishar/types';
import type { LoadedAssetPack } from '@/lib/ishar/asset-pack';

export function NpcEditor({game,onChange,pack}:{game:AuthoredGame;onChange:(game:AuthoredGame)=>void;pack:LoadedAssetPack|null}) {
  const npcs=game.npcs??[];
  const patch=(id:string,value:Partial<AuthoredNpc>)=>onChange({...game,npcs:npcs.map(n=>n.id===id?{...n,...value}:n)});
  return <article className="editor-panel"><h2>NPCs & Händler</h2>
    <button onClick={()=>onChange({...game,npcs:[...npcs,{id:crypto.randomUUID(),name:'Neuer NPC',dialogue:'Willkommen.'}]})}>NPC hinzufügen</button>
    <label>Startgold<input type="number" min="0" step="1" value={game.startingGold??0} onChange={e=>onChange({...game,startingGold:Math.max(0,Math.floor(Number(e.target.value)))})}/></label>
    {npcs.map(npc=><div className="author-block" key={npc.id}>
      <label>Name<input value={npc.name} onChange={e=>patch(npc.id,{name:e.target.value})}/></label>
      <label>Dialog<textarea value={npc.dialogue} onChange={e=>patch(npc.id,{dialogue:e.target.value})}/></label>
      <label>Grafik<select value={npc.assetId??''} onChange={e=>patch(npc.id,{assetId:e.target.value||undefined})}><option value="">Platzhalter</option>{pack?.discoveredAssets?.filter(a=>/PEOPLE|GUARD|DRUIDE|AVEUGLE|BUSTE/i.test(a.path)).map(a=><option key={a.id} value={a.id}>{a.path}</option>)}</select></label>
      <label className="check-row"><input type="checkbox" checked={!!npc.stock} onChange={e=>patch(npc.id,{stock:e.target.checked?[]:undefined})}/> Händler</label>
      {npc.stock && <><h3>Waren</h3>{npc.stock.map((stock,index)=><div className="inline-fields" key={index}>
        <label>Gegenstand<select value={stock.itemId} onChange={e=>patch(npc.id,{stock:npc.stock!.map((s,i)=>i===index?{...s,itemId:e.target.value}:s)})}>{game.items.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Preis<input type="number" min="0" step="1" value={stock.price} onChange={e=>patch(npc.id,{stock:npc.stock!.map((s,i)=>i===index?{...s,price:Math.max(0,Math.floor(Number(e.target.value)))}:s)})}/></label>
        <label>Anzahl<input type="number" min="0" step="1" value={stock.quantity} onChange={e=>patch(npc.id,{stock:npc.stock!.map((s,i)=>i===index?{...s,quantity:Math.max(0,Math.floor(Number(e.target.value)))}:s)})}/></label>
        <button onClick={()=>patch(npc.id,{stock:npc.stock!.filter((_,i)=>i!==index)})}>Ware entfernen</button>
      </div>)}<button disabled={!game.items.length} onClick={()=>patch(npc.id,{stock:[...npc.stock!,{itemId:game.items[0]!.id,price:10,quantity:1}]})}>Ware hinzufügen</button></>}
      <button onClick={()=>onChange({...game,npcs:npcs.filter(n=>n.id!==npc.id),locations:game.locations.map(l=>({...l,npcIds:l.npcIds?.filter(id=>id!==npc.id)}))})}>NPC entfernen</button>
    </div>)}
  </article>;
}
