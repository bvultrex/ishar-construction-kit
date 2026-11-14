import {readOriginalCarrier,ORIGINAL_COMMERCE_OFFSETS as offsets} from './original-commerce.ts';
import {originalItemArmour} from './original-inventory-runtime.ts';
export const ORIGINAL_PROVEN_EQUIPMENT_SLOT=12 as const;
export const originalProvenEquipmentCode=(id:number)=>Number.isInteger(id)&&id>=-89&&id<=-82;

/** FRISE026cf..02963: the stat-independent equipment category for slot12.
 * Equipped storage is cursor/item code +1; extraction reverses that transform.
 * Other equipment categories have stat/special-effect branches and stay closed.
 */
export function takeOriginalEquipmentItem(bytes:Uint8Array,carrier:number,slot:number){
 const person=readOriginalCarrier(bytes,carrier);if(!person.present||slot!==ORIGINAL_PROVEN_EQUIPMENT_SLOT)return null;
 const stored=person.slots[slot],id=stored===undefined?0:stored-1;if(stored===0||!originalProvenEquipmentCode(id))return null;
 const copy=bytes.slice();new DataView(copy.buffer).setInt16(offsets.inventory+carrier*30+slot*2,0,false);
 copy[offsets.armour+carrier]=(copy[offsets.armour+carrier]!-originalItemArmour(id))&255;
 return {bytes:copy,id,slot};
}

export function placeOriginalEquipmentItem(bytes:Uint8Array,id:number,carrier:number,slot:number){
 const person=readOriginalCarrier(bytes,carrier);if(!person.present||slot!==ORIGINAL_PROVEN_EQUIPMENT_SLOT||!originalProvenEquipmentCode(id))return null;
 const stored=person.slots[slot];if(stored===undefined)return null;
 const old=stored===0?null:stored-1;if(old!==null&&!originalProvenEquipmentCode(old))return null;
 const copy=bytes.slice();new DataView(copy.buffer).setInt16(offsets.inventory+carrier*30+slot*2,id+1,false);
 copy[offsets.armour+carrier]=(copy[offsets.armour+carrier]!+originalItemArmour(id)-(old===null?0:originalItemArmour(old)))&255;
 return {bytes:copy,held:old,slot};
}
