import {isOriginalSave,ORIGINAL_COMMERCE_OFFSETS as offsets} from './original-commerce.ts';

/** TAVERNE 0062e..0069d: after a confirmed meal, every occupied party slot
 * gains 40 food, capped at 100. Payment and the delayed confirmation sequence
 * are deliberately separate until their multi-payer ordering is fully bound.
 */
export function feedOriginalTavernParty(bytes:Uint8Array):Uint8Array {
 if(!isOriginalSave(bytes))throw Error('Ungültiger Ishar-2-Spielstand.');
 const copy=bytes.slice();
 for(let carrier=0;carrier<5;carrier++)if(copy[offsets.classes+carrier]!==255){
  const current=copy[offsets.food+carrier]!;
  copy[offsets.food+carrier]=current>60?100:Math.min(100,current+40);
 }
 return copy;
}
