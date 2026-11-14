import assert from 'node:assert/strict';
import {takeOriginalInventoryItem,placeOriginalInventoryItem} from '../src/lib/ishar/original-inventory-runtime.ts';
import {readOriginalCarrier} from '../src/lib/ishar/original-commerce.ts';
// Synthetic types exercise both branches without embedding original PARAM data.
const profile={types:Array.from({length:27},(_,i)=>i%2?12:11)};
let cases=0;
for(let carrier=0;carrier<5;carrier++)for(const hand of [9,10])for(let code=-116;code<=-90;code++){
 const bytes=new Uint8Array(8359),w=new DataView(bytes.buffer);w.setUint16(0,2);w.setInt16(996+carrier*2,1);bytes[1336+carrier]=42;
 const other=hand===9?10:9,at=1036+carrier*30,word=(b,slot,value)=>new DataView(b.buffer).setInt16(at+slot*2,value);
 const two=profile.types[code+116]%10===2;
 assert.ok(placeOriginalInventoryItem(bytes,code,carrier),'backpack needs no weapon metadata');
 assert.equal(placeOriginalInventoryItem(bytes,code,carrier,hand),null,'hand placement requires metadata');
 const before=bytes.slice(),placed=placeOriginalInventoryItem(bytes,code,carrier,hand,profile);assert.ok(placed);assert.deepEqual(bytes,before);
 const slots=readOriginalCarrier(placed.bytes,carrier).slots;assert.equal(slots[hand],code);assert.equal(slots[other],two?-125:0);
 assert.deepEqual(takeOriginalInventoryItem(placed.bytes,carrier,hand).bytes,bytes,'take releases reservation and preserves all other bytes');
 const replaced=placeOriginalInventoryItem(placed.bytes,9,carrier,hand);assert.equal(replaced.held,code);assert.equal(readOriginalCarrier(replaced.bytes,carrier).slots[other],0);
 for(let i=0;i<bytes.length;i++)if(i<at+18||i>at+21)assert.equal(placed.bytes[i],bytes[i],'only the two hand words change');
 const busy=bytes.slice();word(busy,other,9);const snapshot=busy.slice();
 const result=placeOriginalInventoryItem(busy,code,carrier,hand,profile);assert.equal(result===null,two);assert.deepEqual(busy,snapshot);
 const reserved=bytes.slice();word(reserved,hand,-125);assert.equal(takeOriginalInventoryItem(reserved,carrier,hand),null);assert.equal(placeOriginalInventoryItem(reserved,code,carrier,hand,profile),null);
 const old=bytes.slice();word(old,hand,-115);word(old,other,-125);
 const swap=placeOriginalInventoryItem(old,code,carrier,hand,profile);assert.equal(swap.held,-115);assert.equal(readOriginalCarrier(swap.bytes,carrier).slots[other],two?-125:0);
 cases++;
}
console.log(`${cases} weapon/hand cases: metadata gate, reservation/release, swaps, occupied opposite hand, immutable input and unrelated bytes checked.`);
