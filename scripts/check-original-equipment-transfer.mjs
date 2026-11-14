import assert from 'node:assert/strict';
import {takeOriginalEquipmentItem,placeOriginalEquipmentItem} from '../src/lib/ishar/original-equipment-runtime.ts';
import {readOriginalCarrier} from '../src/lib/ishar/original-commerce.ts';
const base=Uint8Array.from({length:8359},(_,i)=>(i*29)&255),view=new DataView(base.buffer);view.setUint16(0,2);base.fill(0,1036,1186);base.fill(1,1276,1281);
for(let c=0;c<5;c++)view.setInt16(996+c*2,1);
let cases=0;
for(let c=0;c<5;c++)for(let incoming=-89;incoming<=-82;incoming++)for(const old of [null,-89,-88,-87,-86,-85,-84,-83,-82]){
 const bytes=base.slice();bytes[1336+c]=20;const at=1036+c*30+24;if(old!==null)new DataView(bytes.buffer).setInt16(at,old+1,false);
 const before=bytes.slice(),placed=placeOriginalEquipmentItem(bytes,incoming,c,12);assert.ok(placed);assert.deepEqual(bytes,before);assert.equal(placed.held,old);
 assert.equal(readOriginalCarrier(placed.bytes,c).slots[12],incoming+1);
 const expected=(20+(incoming%2?-({[-89]:-4,[-87]:-3,[-85]:-2,[-83]:-1}[incoming]??0):0)-(old!==null&&old%2?-({[-89]:-4,[-87]:-3,[-85]:-2,[-83]:-1}[old]??0):0))&255;
 assert.equal(placed.bytes[1336+c],expected);
 const taken=takeOriginalEquipmentItem(placed.bytes,c,12);assert.equal(taken.id,incoming);assert.equal(readOriginalCarrier(taken.bytes,c).slots[12],0);
 for(let i=0;i<bytes.length;i++)if(![at,at+1,1336+c].includes(i))assert.equal(placed.bytes[i],bytes[i]);
 cases++;
}
for(const id of [-90,-81,-49,9,0])assert.equal(placeOriginalEquipmentItem(base,id,0,12),null);
for(const slot of [9,10,11,13,14])assert.equal(placeOriginalEquipmentItem(base,-89,0,slot),null);
const invalid=base.slice();new DataView(invalid.buffer).setInt16(1060,-60);assert.equal(takeOriginalEquipmentItem(invalid,0,12),null);assert.equal(placeOriginalEquipmentItem(invalid,-89,0,12),null);
console.log(`${cases} stat-independent slot12 equipment placements/swaps and reverse extractions preserve unrelated bytes; other categories fail closed.`);
