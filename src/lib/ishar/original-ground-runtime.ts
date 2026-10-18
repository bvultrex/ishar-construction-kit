import {readSaveWorldItems,worldItemViewCandidate} from './save-world-items.ts';
import {readOriginalCarrier,ORIGINAL_COMMERCE_OFFSETS} from './original-commerce.ts';
export interface OriginalGroundView {row:number;col:number;facing:number;map:number;scene:number}
/** AFFOBJ projection and OBJET 0x003ad/0x003db. Map 1 skips the occlusion routine.
 * These two object codes have no quest/stack conversion on pickup. Other codes
 * remain disabled until their additional script branches are ported.
 */
export function originalGroundSprites(bytes:Uint8Array,view:OriginalGroundView) {
  if(view.map!==1)return [];
  const frames=[{xStep:192,y:-42},{xStep:92,y:-25},{xStep:60,y:-12}];
  return (readSaveWorldItems(bytes)??[]).flatMap(item=>{
    if(![9,10].includes(item.id))return [];
    const relative=worldItemViewCandidate(view,item);if(!relative)return [];
    const depth=relative.distance-1,frame=frames[depth];if(!frame)return [];
    return [{id:item.id,index:(item.id===9?115:90)+depth,x:relative.lateral*frame.xStep,y:frame.y,z:relative.distance*99-10,pickable:depth===0}];
  }).sort((a,b)=>b.z-a.z);
}
export function pickOriginalGround(bytes:Uint8Array,view:OriginalGroundView,id:number) {
  if(!originalGroundSprites(bytes,view).some(s=>s.id===id&&s.pickable))return null;
  const picked=Uint8Array.from(bytes);
  // SOURIS 0x004a6–0x004ba removes all three ground fields upon selection.
  picked[336+id]=0;picked[536+id]=0;picked[736+id]=0;
  return picked;
}
export function receiveOriginalGround(bytes:Uint8Array,id:number,carrier:number) {
  if(![9,10].includes(id))return null;
  const person=readOriginalCarrier(bytes,carrier);if(!person.present)return null;
  const slot=person.slots.slice(0,9).indexOf(0);if(slot<0)return null;
  const copy=Uint8Array.from(bytes);
  new DataView(copy.buffer).setInt16(ORIGINAL_COMMERCE_OFFSETS.inventory+carrier*30+slot*2,id,false);
  return copy;
}
