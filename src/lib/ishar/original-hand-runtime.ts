import {readOriginalCarrier,ORIGINAL_COMMERCE_OFFSETS as offsets} from './original-commerce.ts';
import {originalStackCode} from './original-stack-runtime.ts';
import {placeOriginalInventoryItem,transferableOriginalInventoryCode,originalItemArmour} from './original-inventory-runtime.ts';
import {originalWeaponCode,originalWeaponTwoHanded,type OriginalWeaponProfile} from './original-weapon-profile.ts';
export interface OriginalHeldItem {id:number;quantity?:number}
const limit=(id:number)=>id===-49?20:10;
const swapArmour=(id:number)=>id>=-29&&id<=-26?originalItemArmour(id):0;

/** FRISE02e20..03348. Supported inventory codes; reserved target/effect16
 * and malformed stack states remain outside this adapter's accepted inputs.
 * A partial quantity transfer can succeed without exchanging the slot.
 */
export function placeOriginalHandItem(bytes:Uint8Array,held:OriginalHeldItem,carrier:number,slot:9|10,profile?:OriginalWeaponProfile){
 const person=readOriginalCarrier(bytes,carrier),id=held.id,old=person.slots[slot];
 const incomingStack=originalStackCode(id),oldStack=old!==undefined&&originalStackCode(old);
 if(!person.present||person.hp<=0||(slot!==9&&slot!==10)||old===undefined)return null;
 if(!incomingStack&&!transferableOriginalInventoryCode(id))return null;
 if(old!==0&&!oldStack&&!transferableOriginalInventoryCode(old))return null;
 if(incomingStack?(!Number.isInteger(held.quantity)||held.quantity!<1||held.quantity!>limit(id)):held.quantity!==undefined)return null;
 if(!incomingStack&&!oldStack){
  const result=placeOriginalInventoryItem(bytes,id,carrier,slot,profile);
  return result?{bytes:result.bytes,held:result.held===null?null:{id:result.held} as OriginalHeldItem,accepted:0,swapped:old!==0}:null;
 }
 // Each stack has one character-wide counter. Reject inconsistent slot/counter
 // combinations instead of silently repairing them during a hand operation.
 for(const code of new Set([...(incomingStack?[id]:[]),...(oldStack?[old]:[])])){
  const count=person.stacks[code+59]!,slots=person.slots.slice(0,11).filter(value=>value===code).length;
  if(count>limit(code)||slots>1||(slots===0?count!==0:count===0))return null;
 }
 const two=originalWeaponCode(id)?(profile?originalWeaponTwoHanded(profile,id):null):false;
 if(two===null)return null;
 const other=slot===9?10:9;
 if(two&&person.slots[other]!==0&&person.slots[other]!==-125)return null;
 const copy=Uint8Array.from(bytes),view=new DataView(copy.buffer);
 const writeSlot=(index:number,value:number)=>view.setInt16(offsets.inventory+carrier*30+index*2,value,false);
 let remaining=held.quantity??0,accepted=0;
 if(incomingStack){
  const count=person.stacks[id+59]!;accepted=Math.min(remaining,limit(id)-count);remaining-=accepted;
  copy[offsets.stacks+carrier*20+id+59]=count+accepted;
 }
 if(two||person.slots[other]===-125)writeSlot(other,two?-125:0);
 const existing=incomingStack&&person.slots.slice(0,11).includes(id);
 if(old===0||old===id&&incomingStack){
  if(!existing)writeSlot(slot,id);
  return {bytes:copy,held:remaining?{id,quantity:remaining}:null,accepted,swapped:false};
 }
 // 03161: retain the old hand code when the incoming cursor still has units.
 if(remaining)return {bytes:copy,held:{id,quantity:remaining},accepted,swapped:false};
 const nextHeld:OriginalHeldItem={id:old};
 if(oldStack){nextHeld.quantity=person.stacks[old+59]!;copy[offsets.stacks+carrier*20+old+59]=0;}
 writeSlot(slot,existing?0:id);
 copy[offsets.armour+carrier]=(copy[offsets.armour+carrier]!+swapArmour(id)-swapArmour(old))&255;
 return {bytes:copy,held:nextHeld,accepted,swapped:true};
}
