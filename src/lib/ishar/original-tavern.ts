import {isOriginalSave,ORIGINAL_COMMERCE_OFFSETS as offsets} from './original-commerce.ts';

/** TAVERNE 0062e..0069d: after a confirmed meal, every party slot with HP > 0
 * gains 40 food, capped at 100, using signed byte reads. Payment and the delayed confirmation sequence
 * are deliberately separate until their multi-payer ordering is fully bound.
 */
export function feedOriginalTavernParty(bytes:Uint8Array):Uint8Array {
 if(!isOriginalSave(bytes))throw Error('Ungültiger Ishar-2-Spielstand.');
 const copy=bytes.slice();
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 for(let carrier=0;carrier<5;carrier++)if(view.getInt16(offsets.hitPoints+carrier*2,false)>0){
  const current=view.getInt8(offsets.food+carrier);
  copy[offsets.food+carrier]=current>60?100:current+40;
 }
 return copy;
}

export function originalTavernMealPrice(tavern:number):number {
 if(!Number.isInteger(tavern)||tavern<0||tavern>14)throw Error('Ungültiger Tavernenparameter.');
 return 500+40*tavern;
}

/** TAVERNE 00499..0062b: payment after the meal message has been closed.
 * Occupied slots pay one equal integer share in slot order. Poor members pay
 * everything; a second pass covers division remainder and deficits. Time and
 * food stay separate because they occur on opposite sides of the delayed UI.
 */
export function payOriginalTavernMeal(bytes:Uint8Array,tavern:number) {
 if(!isOriginalSave(bytes))throw Error('Ungültiger Ishar-2-Spielstand.');
 const price=originalTavernMealPrice(tavern),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const carriers:number[]=[],money:number[]=[];
 for(let carrier=0;carrier<5;carrier++)if(bytes[offsets.classes+carrier]!==255){
  const thousands=view.getUint16(offsets.goldThousands+carrier*2,false);
  const remainder=view.getUint16(offsets.goldRemainder+carrier*2,false);
  if(remainder>999)throw Error('Nicht normalisierter Goldstand.');
  carriers.push(carrier);money.push(thousands*1000+remainder);
 }
 if(money.reduce((sum,value)=>sum+value,0)<price)return {ok:false as const,reason:'insufficient-gold' as const,price};
 const share=Math.trunc(price/carriers.length),paid=Array(5).fill(0) as number[];
 let debt=price;
 for(let index=0;index<carriers.length;index++){
  const amount=Math.min(money[index]!,share);money[index]-=amount;paid[carriers[index]!]!+=amount;debt-=amount;
 }
 for(let index=0;index<carriers.length&&debt>0;index++){
  const amount=Math.min(money[index]!,debt);money[index]-=amount;paid[carriers[index]!]!+=amount;debt-=amount;
 }
 const copy=bytes.slice(),out=new DataView(copy.buffer,copy.byteOffset,copy.byteLength);
 for(let index=0;index<carriers.length;index++){
  const carrier=carriers[index]!,value=money[index]!;
  out.setUint16(offsets.goldThousands+carrier*2,Math.trunc(value/1000),false);
  out.setUint16(offsets.goldRemainder+carrier*2,value%1000,false);
 }
 return {ok:true as const,bytes:copy,price,paid:paid as [number,number,number,number,number]};
}

export const ORIGINAL_TIME_OFFSETS={hour:44,day:46,ticks:48} as const;
export const ORIGINAL_DOS_TICKS_PER_HOUR=1000;

/** TAVERNE 00443/00449: OK advances one hour and primes the next MAIN tick.
 * The local DOS omodel is 2000..2004, hence MAIN selects 1000 ticks/hour.
 */
export function beginOriginalTavernMeal(bytes:Uint8Array,tavern:number) {
 const affordable=payOriginalTavernMeal(bytes,tavern);
 if(!affordable.ok)return affordable;
 const copy=bytes.slice(),view=new DataView(copy.buffer,copy.byteOffset,copy.byteLength);
 view.setUint16(ORIGINAL_TIME_OFFSETS.hour,(view.getUint16(ORIGINAL_TIME_OFFSETS.hour,false)+1)&0xffff,false);
 view.setUint16(ORIGINAL_TIME_OFFSETS.ticks,ORIGINAL_DOS_TICKS_PER_HOUR-1,false);
 return {ok:true as const,bytes:copy,price:affordable.price};
}

/** Close-message continuation: pay, feed, then model the first unpaused MAIN
 * clock tick before the returned play view can be exported.
 */
export function finishOriginalTavernMeal(bytes:Uint8Array,tavern:number) {
 const payment=payOriginalTavernMeal(bytes,tavern);
 if(!payment.ok)return payment;
 const copy=feedOriginalTavernParty(payment.bytes),view=new DataView(copy.buffer,copy.byteOffset,copy.byteLength);
 let ticks=view.getUint16(ORIGINAL_TIME_OFFSETS.ticks,false)+1;
 if(ticks>=ORIGINAL_DOS_TICKS_PER_HOUR){
  ticks=0;let hour=view.getUint16(ORIGINAL_TIME_OFFSETS.hour,false)+1;
  if(hour>=24){hour-=24;view.setUint16(ORIGINAL_TIME_OFFSETS.day,(view.getUint16(ORIGINAL_TIME_OFFSETS.day,false)+1)&0xffff,false);}
  view.setUint16(ORIGINAL_TIME_OFFSETS.hour,hour&0xffff,false);
 }
 view.setUint16(ORIGINAL_TIME_OFFSETS.ticks,ticks,false);
 return {...payment,bytes:copy};
}
