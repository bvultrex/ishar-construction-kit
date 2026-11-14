import {readOriginalCarrier,ORIGINAL_COMMERCE_OFFSETS as offsets} from './original-commerce.ts';
export const originalStackCode=(id:number)=>Number.isInteger(id)&&id>=-59&&id<=-49;
const limit=(id:number)=>id===-49?20:10;
/** FRISE02d53..02dbb: complete stack or one unit; held quantities are transient.
 * Only valid positive stack counts are accepted; malformed counters fail closed.
 */
export function takeOriginalStackItem(bytes:Uint8Array,carrier:number,slot:number,single=false){
 const person=readOriginalCarrier(bytes,carrier),id=person.slots[slot];
 if(!person.present||!Number.isInteger(slot)||slot<0||slot>10||id===undefined||!originalStackCode(id))return null;
 const count=person.stacks[id+59]!;if(count<1||count>limit(id))return null;
 const quantity=single?1:count,remaining=count-quantity,copy=Uint8Array.from(bytes);
 copy[offsets.stacks+carrier*20+id+59]=remaining;
 if(!remaining)new DataView(copy.buffer).setInt16(offsets.inventory+carrier*30+slot*2,0,false);
 return {bytes:copy,id,quantity};
}
/** FRISE03bef +03580: portrait receipt searches matching slots0..10, otherwise
 * first free backpack0..8. Overflow remains held, unlike purchased bundles.
 * No hand swap, source lookup, gold charge or invented saved cursor fields.
 */
export function receiveOriginalStackItem(bytes:Uint8Array,id:number,quantity:number,carrier:number){
 const person=readOriginalCarrier(bytes,carrier);
 if(!person.present||person.hp<=0||!originalStackCode(id)||!Number.isInteger(quantity)||quantity<1||quantity>limit(id))return null;
 let slot=person.slots.slice(0,11).indexOf(id);if(slot<0)slot=person.slots.slice(0,9).indexOf(0);if(slot<0)return null;
 const count=person.stacks[id+59]!;if(count>limit(id))return null;
 const accepted=Math.min(quantity,limit(id)-count);if(!accepted)return null;
 const copy=Uint8Array.from(bytes);new DataView(copy.buffer).setInt16(offsets.inventory+carrier*30+slot*2,id,false);
 copy[offsets.stacks+carrier*20+id+59]=count+accepted;
 return {bytes:copy,id,accepted,remaining:quantity-accepted,slot};
}
