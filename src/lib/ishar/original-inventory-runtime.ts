import {readOriginalCarrier,ORIGINAL_COMMERCE_OFFSETS} from './original-commerce.ts';

/** FRISE02c0f/02dbb: Code9 has no stack conversion or armour contribution.
 * The caller must own an empty cursor. Other codes need their separate branches.
 * Extraction has no invented recipient-HP gate; the portrait receive gate is separate.
 */
export function takeOriginalInventoryItem(bytes:Uint8Array,carrier:number,slot:number) {
  const person=readOriginalCarrier(bytes,carrier);
  if(!person.present||!Number.isInteger(slot)||slot<0||slot>10||person.slots[slot]!==9)return null;
  const copy=Uint8Array.from(bytes);
  new DataView(copy.buffer).setInt16(ORIGINAL_COMMERCE_OFFSETS.inventory+carrier*30+slot*2,0,false);
  return {bytes:copy,id:9 as const};
}
