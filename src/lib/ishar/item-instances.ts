import type { AuthoredGame } from './types.ts';

/** Reconcile legacy lists by definition and occurrence, preserving surviving
 * copy identities across insertion, removal and reordering. */
export function reconcileItemPlacements(previousIds:string[], previousPlacements:string[], nextIds:string[], createId=()=>crypto.randomUUID()):string[] {
  const available=new Map<string,string[]>();
  previousIds.forEach((id,index)=>{
    const placement=previousPlacements[index];
    if(placement) available.set(id,[...(available.get(id)??[]),placement]);
  });
  return nextIds.map(id=>available.get(id)?.shift() ?? createId());
}

/** Stable runtime instances for legacy location.itemIds. The authored project is
 * not rewritten; definition IDs remain valid for keys and asset assignments. */
export function instantiateLocationItems(game:AuthoredGame):AuthoredGame {
  const definitions=new Map(game.items.map(item=>[item.id,item]));
  const items=[...game.items];
  const occupied=new Set(items.map(item=>item.id));
  const locations=game.locations.map(location=>({...location,itemIds:location.itemIds.map((id,index)=>{
    const definition=definitions.get(id);
    if(!definition || definition.definitionId) return id;
    const base=`placed:${JSON.stringify([location.levelId??'level-1',location.id,location.itemPlacementIds?.[index]??index,id])}`;
    let instanceId=base;
    while(occupied.has(instanceId)) instanceId+='~';
    occupied.add(instanceId);
    items.push({...definition,id:instanceId,definitionId:id});
    return instanceId;
  })}));
  return {...game,items,locations};
}

export function inventoryHasDefinition(game:AuthoredGame,inventory:string[],definitionId:string):boolean {
  return inventory.some(id=>id===definitionId || game.items.find(item=>item.id===id)?.definitionId===definitionId);
}
