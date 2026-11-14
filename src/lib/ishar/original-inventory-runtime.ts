import {readOriginalCarrier,ORIGINAL_COMMERCE_OFFSETS} from './original-commerce.ts';
import {originalStackCode} from './original-stack-runtime.ts';

/** Nonstack codes without FRISE's separate two-handed weapon branch. */
export const simpleOriginalInventoryCode=(code:number)=>Number.isInteger(code)&&(code===9||(code>=-89&&code<=-60)||(code>=-29&&code<=-25));
const armour:Record<number,number>={[-89]:4,[-87]:3,[-85]:2,[-83]:1,[-79]:1,[-77]:6,[-75]:2,[-71]:12,[-69]:9,[-67]:7,[-65]:5,[-63]:3,[-61]:2,[-29]:6,[-28]:3,[-27]:2,[-26]:1,[-25]:4};
export const originalItemArmour=(code:number)=>armour[code]??0;

/** FRISE0032b precedes007e3: gold bypasses the transient T4f0a handpanel. */
export function originalPortraitItemDestination(id:number,handPanelOpen:boolean){
  if(id===10)return 'gold' as const;
  if(simpleOriginalInventoryCode(id)||originalStackCode(id))return handPanelOpen?'hand-panel' as const:'backpack' as const;
  return null;
}

/** FRISE02c0f/02dbb: nonstack slot extraction, armour subtraction for hands.
 * The caller must own an empty cursor. Other codes need their separate branches.
 * Extraction has no invented recipient-HP gate; the portrait receive gate is separate.
 */
export function takeOriginalInventoryItem(bytes:Uint8Array,carrier:number,slot:number) {
  const person=readOriginalCarrier(bytes,carrier);
  const id=person.slots[slot];
  if(!person.present||!Number.isInteger(slot)||slot<0||slot>10||id===undefined||!simpleOriginalInventoryCode(id))return null;
  const copy=Uint8Array.from(bytes);
  new DataView(copy.buffer).setInt16(ORIGINAL_COMMERCE_OFFSETS.inventory+carrier*30+slot*2,0,false);
  if(slot>=9)copy[1336+carrier]=(copy[1336+carrier]!-originalItemArmour(id))&255;
  return {bytes:copy,id};
}

/** FRISE02f5a/03012..03347, supported nonstack codes only. An occupied hand
 * swaps its old code onto the cursor. Preserve the original AND condition in
 * the swap branch: only -29..-26 affect armour there, unlike plain placement.
 * Caller owns cursor state; stack counters/cursor entities are not fabricated.
 */
export function placeOriginalInventoryItem(bytes:Uint8Array,id:number,carrier:number,handSlot?:9|10){
  const person=readOriginalCarrier(bytes,carrier);
  if(!person.present||person.hp<=0||!simpleOriginalInventoryCode(id)||handSlot!==undefined&&handSlot!==9&&handSlot!==10)return null;
  const slot=handSlot??person.slots.slice(0,9).indexOf(0);if(slot<0)return null;
  const old=person.slots[slot]!;
  if(old!==0&&(handSlot===undefined||!simpleOriginalInventoryCode(old)))return null;
  const copy=Uint8Array.from(bytes);
  new DataView(copy.buffer).setInt16(ORIGINAL_COMMERCE_OFFSETS.inventory+carrier*30+slot*2,id,false);
  if(handSlot!==undefined){
    const swapArmour=(code:number)=>code>=-29&&code<=-26?originalItemArmour(code):0;
    const delta=old===0?originalItemArmour(id):swapArmour(id)-swapArmour(old);
    copy[1336+carrier]=(copy[1336+carrier]!+delta)&255;
  }
  return {bytes:copy,held:old===0?null:old,slot};
}
