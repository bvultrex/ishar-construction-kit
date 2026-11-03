import { subtractOriginalPrice } from './original-merchants.ts';

/** IO.IO sequential save loader; MAIN dimensions: inventory stride 30, stacks stride 20. */
export const ORIGINAL_COMMERCE_OFFSETS={goldThousands:1006,goldRemainder:1026,inventory:1036,classes:1276,stacks:7629} as const;
export interface OriginalPurchase { objectCode:number; price:[number,number]; quantity:number }
export function isOriginalSave(bytes:Uint8Array) {
  return bytes.length===8359 && new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint16(0,false)===2;
}
export function readOriginalCarrier(bytes:Uint8Array,carrier:number) {
  if(!isOriginalSave(bytes)||!Number.isInteger(carrier)||carrier<0||carrier>=5) throw new Error('Ungültiger Originalsave oder Charakter.');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),o=ORIGINAL_COMMERCE_OFFSETS;
  return {present:bytes[o.classes+carrier]!==255,
    money:[view.getUint16(o.goldThousands+carrier*2,false),view.getUint16(o.goldRemainder+carrier*2,false)] as [number,number],
    slots:Array.from({length:15},(_,i)=>view.getInt16(o.inventory+carrier*30+i*2,false)),
    stacks:Array.from(bytes.subarray(o.stacks+carrier*20,o.stacks+carrier*20+20))};
}
/** MARCHAND 0x004b8–0x005c0, 0x00693 and 0x00775.
 * Called on recipient click, not on stock selection. Produces a save copy.
 * Stock is not decremented: the original purchase path has no stock write.
 */
export function receiveOriginalPurchase(bytes:Uint8Array,purchase:OriginalPurchase,carrier:number) {
  const person=readOriginalCarrier(bytes,carrier);
  if(!person.present) return {ok:false as const,reason:'empty-character' as const};
  if(!Number.isInteger(purchase.objectCode)||purchase.objectCode>=0||purchase.objectCode< -89 ||
    !Number.isInteger(purchase.quantity)||purchase.quantity<1||purchase.quantity>255) throw new Error('Ungültige Originalware.');
  const money=subtractOriginalPrice(person.money,purchase.price);
  if(!money) return {ok:false as const,reason:'insufficient-gold' as const};
  const stackable=purchase.objectCode>=-59 && purchase.objectCode<=-49;
  // Existing stack lookup includes slots 0..10; new objects use backpack slots 0..8.
  let slot=stackable?person.slots.slice(0,11).indexOf(purchase.objectCode):-1;
  if(slot<0) slot=person.slots.slice(0,9).indexOf(0);
  if(slot<0) return {ok:false as const,reason:'full-backpack' as const};
  const stackIndex=purchase.objectCode+59;
  const limit=purchase.objectCode===-49?20:10;
  const count=stackable?person.stacks[stackIndex]!:0;
  const accepted=stackable?Math.min(purchase.quantity,Math.max(0,limit-count)):1;
  if(!accepted) return {ok:false as const,reason:'full-stack' as const};
  const copy=Uint8Array.from(bytes),view=new DataView(copy.buffer),o=ORIGINAL_COMMERCE_OFFSETS;
  view.setInt16(o.inventory+carrier*30+slot*2,purchase.objectCode,false);
  if(stackable) copy[o.stacks+carrier*20+stackIndex]=count+accepted;
  // Original charges the bundle price even when only part of its quantity fits.
  view.setUint16(o.goldThousands+carrier*2,money[0],false);
  view.setUint16(o.goldRemainder+carrier*2,money[1],false);
  return {ok:true as const,bytes:copy,slot,accepted,discarded:stackable?purchase.quantity-accepted:0};
}
