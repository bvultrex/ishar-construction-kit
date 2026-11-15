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
