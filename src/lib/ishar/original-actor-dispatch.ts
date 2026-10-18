import type { SaveActor } from './save-actors.ts';
export interface ActorDispatch { key:number; entry:string; scriptIds:number[]; conditional:boolean }
export interface OriginalActorDispatch { specialSlots:ActorDispatch[]; types:ActorDispatch[] }
/** EAFF dispatch import: preserve conditional cases instead of inventing a default sprite. */
export function readOriginalActorDispatch(listing:string):OriginalActorDispatch {
  const lines=listing.split(/\r?\n/);
  function table(address:string) {
    const dispatch=lines.find(line=>new RegExp(`^\\s*${address}\\s`).test(line)&&line.includes('cswitch2'));
    if(!dispatch) throw new Error(`EAFF: Dispatch ${address} fehlt.`);
    return [...dispatch.matchAll(/(\d+):L_([0-9a-f]+)/g)].map(([,key,entry])=>{
      const start=lines.findIndex(line=>line===`L_${entry}:`);
      if(start<0)throw new Error(`EAFF: Routine ${entry} fehlt.`);
      const body:string[]=[],pending=[start+1],visited=new Set<number>();
      while(pending.length) {
        const index=pending.pop()!;
        if(index>=lines.length||visited.has(index))continue;
        visited.add(index);
        const line=lines[index]!;
        if(/^L_(?:00986|00660):/.test(line))continue;
        body.push(line);
        const branch=line.match(/\b(cjmp|cbnz|cbz)(?:8|16|24)\b.*L_([0-9a-f]+)/);
        if(branch) {
          if(!['00986','00660'].includes(branch[2]!)) {
            const target=lines.findIndex(candidate=>candidate===`L_${branch[2]}:`);
            if(target<0)throw new Error(`EAFF: Sprungziel ${branch[2]} fehlt.`);
            pending.push(target);
          }
          if(branch[1]==='cjmp')continue;
        }
        if(/\bcret\b/.test(line))continue;
        pending.push(index+1);
      }
      const scriptIds=[...new Set([...body.join('\n').matchAll(/\bclive\s+0x([0-9a-f]+)/g)].map(m=>parseInt(m[1]!,16)))];
      return {key:+key!,entry:`0x${entry}`,scriptIds,conditional:body.some(line=>/\bcb[n]?z(?:8|16|24)\b/.test(line))};
    });
  }
  return {specialSlots:table('00629'),types:table('00664')};
}
export function actorScriptCandidates(dispatch:OriginalActorDispatch,actor:SaveActor) {
  return (actor.id<53?dispatch.specialSlots.find(row=>row.key===actor.id):dispatch.types.find(row=>row.key===actor.type))??null;
}
