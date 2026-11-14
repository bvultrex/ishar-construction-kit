import {readSaveWorldItems,worldItemViewCandidate} from './save-world-items.ts';
import {readOriginalCarrier,ORIGINAL_COMMERCE_OFFSETS} from './original-commerce.ts';
export interface OriginalGroundView {row:number;col:number;facing:number;map:number;scene:number}
/** Hoth's original-EXE probes (26 for9,24 for10), CONT1 center/depth0 only.
 * Closed pixel intervals have width/height = extent+1, independent of bitmap.
 * Other positions do not inherit unmeasured boundaries.
 */
export function originalGroundPickupBounds(sprite:{id:number;pickable:boolean;x:number;y:number}){
  if(!sprite.pickable||sprite.x!==0||sprite.y!==-42)return null;
  if(sprite.id===9)return {x:116,y:104,width:26,height:20};
  if(sprite.id===10)return {x:122,y:101,width:14,height:19};
  return null;
}
/** AFFOBJ projection and OBJET 0x003ad/0x003db. Map 1 skips the occlusion routine.
 * Code 9 enters inventory; code 10 is converted to gold by FRISE 0032b/04825.
 * Other codes remain disabled until their additional branches are ported.
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
/** SOURIS00904..009f0: supported positive objects return to the front cell on
 * CONT1 and acquire the current facing. Caller owns the held-object state and
 * collision gate; this does not infer a held item from an empty world slot.
 */
export function dropOriginalGround(bytes:Uint8Array,view:OriginalGroundView,id:number) {
  if(![9,10].includes(id)||view.map!==1||![1,2,3,4].includes(view.facing)||
    ![view.row,view.col].every(n=>Number.isInteger(n)&&n>=0&&n<=255))return null;
  // Never overwrite an already placed object or silently duplicate it.
  if(bytes.length!==8359||bytes[0]!==0||bytes[1]!==2||bytes[336+id]!==0||bytes[536+id]!==0||bytes[736+id]!==0)return null;
  const copy=Uint8Array.from(bytes);
  const dr=view.facing===2?1:view.facing===4?-1:0,dc=view.facing===3?1:view.facing===1?-1:0;
  copy[336+id]=(view.row+dr)&255;copy[536+id]=(view.col+dc)&255;copy[736+id]=view.map;
  copy[8039+id]=view.facing;
  return copy;
}
/** FRISE007C9 requires signed HP>0 and a present character before portrait pickup. */
export function receiveOriginalGround(bytes:Uint8Array,id:number,carrier:number,handSlot?:9|10) {
  if(![9,10].includes(id))return null;
  const person=readOriginalCarrier(bytes,carrier);if(!person.present||person.hp<=0)return null;
  if(id===10){
    // FRISE 04825 -> 06865: signed word additions, then carry only if units>999.
    // MAIN 4c94/4c96 (SAV14/16) hold the pending gold amount. This branch runs
    // before backpack lookup, so even a full backpack can receive the gold.
    const copy=Uint8Array.from(bytes),words=new DataView(copy.buffer);
    const signed=(n:number)=>(n<<16)>>16;
    let units=signed(words.getInt16(1026+carrier*2,false)+words.getInt16(16,false));
    let thousands=signed(words.getInt16(1006+carrier*2,false)+words.getInt16(14,false));
    if(units>999){thousands=signed(thousands+Math.trunc(units/1000));units%=1000;}
    words.setInt16(1026+carrier*2,units,false);words.setInt16(1006+carrier*2,thousands,false);
    words.setInt16(14,0,false);words.setInt16(16,0,false);
    return copy;
  }
  // FRISE02f5a permits code9 in a free hand slot; armour(9)=0.
  // Occupied-slot swaps remain a separate branch, never silently overwrite.
  if(handSlot!==undefined&&handSlot!==9&&handSlot!==10)return null;
  const slot=handSlot??person.slots.slice(0,9).indexOf(0);if(slot<0||person.slots[slot]!==0)return null;
  const copy=Uint8Array.from(bytes);
  new DataView(copy.buffer).setInt16(ORIGINAL_COMMERCE_OFFSETS.inventory+carrier*30+slot*2,id,false);
  return copy;
}
