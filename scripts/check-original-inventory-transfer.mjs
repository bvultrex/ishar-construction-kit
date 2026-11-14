import assert from 'node:assert/strict';
import {takeOriginalInventoryItem,placeOriginalInventoryItem} from '../src/lib/ishar/original-inventory-runtime.ts';
import {receiveOriginalGround} from '../src/lib/ishar/original-ground-runtime.ts';
import {readOriginalCarrier} from '../src/lib/ishar/original-commerce.ts';
const base=Uint8Array.from({length:8359},(_,i)=>(i*37)&255),w=new DataView(base.buffer);w.setUint16(0,2);
base.fill(0,1036,1186);base.fill(1,1276,1281);for(let c=0;c<5;c++)w.setInt16(996+c*2,1);
let cases=0;
for(let source=0;source<5;source++)for(let slot=0;slot<11;slot++)for(let target=0;target<5;target++)for(const hand of [undefined,9,10]){
 const bytes=base.slice(),word=new DataView(bytes.buffer);word.setInt16(1036+source*30+slot*2,9);
 const before=bytes.slice(),taken=takeOriginalInventoryItem(bytes,source,slot);assert.equal(taken.id,9);assert.deepEqual(bytes,before);
 const sourceAt=1036+source*30+slot*2;
 for(let i=0;i<bytes.length;i++)assert.equal(taken.bytes[i],i===sourceAt||i===sourceAt+1?0:bytes[i]);
 const received=receiveOriginalGround(taken.bytes,9,target,hand);assert.ok(received);
 assert.deepEqual(placeOriginalInventoryItem(taken.bytes,9,target,hand).bytes,received);
 assert.equal(readOriginalCarrier(received,target).slots[hand??0],9);
 assert.equal(Array.from({length:5},(_,c)=>readOriginalCarrier(received,c).slots.filter(code=>code===9).length).reduce((a,b)=>a+b),1);
 const targetAt=1036+target*30+(hand??0)*2;
 for(let i=0;i<received.length;i++)if(i!==targetAt&&i!==targetAt+1)assert.equal(received[i],taken.bytes[i]);
 cases++;
}
for(const code of [0,10,-1,-49,-125]){const bytes=base.slice();new DataView(bytes.buffer).setInt16(1036,code);assert.equal(takeOriginalInventoryItem(bytes,0,0),null);}
for(const slot of [-1,11,14,1.5])assert.equal(takeOriginalInventoryItem(base,0,slot),null);
for(const hand of [9,10]){
 const occupied=base.slice();new DataView(occupied.buffer).setInt16(1036+hand*2,-125);const before=occupied.slice();
 assert.equal(receiveOriginalGround(occupied,9,0,hand),null);assert.deepEqual(occupied,before);
 const dead=base.slice();new DataView(dead.buffer).setInt16(996,0);assert.equal(receiveOriginalGround(dead,9,0,hand),null);
}
const deadSource=base.slice(),d=new DataView(deadSource.buffer);d.setInt16(996,0);d.setInt16(1036,9);
assert.ok(takeOriginalInventoryItem(deadSource,0,0),'slot extraction does not apply portrait recipient gate');
deadSource[1276]=255;assert.equal(takeOriginalInventoryItem(deadSource,0,0),null);
const wrapped=new Uint8Array(8400);wrapped.set(deadSource,7);assert.equal(takeOriginalInventoryItem(wrapped.subarray(7,8366),0,0),null);
// Independent contract examples distinguish plain hand writes from the original
// swap's narrower AND predicate (-29..-26), especially -25 and -89.
for(const [incoming,old,expectedArmour] of [[9,-25,20],[9,-29,14],[-25,9,20],[-29,9,26],[-29,-28,23],[-89,9,20],[-89,0,24],[-25,0,24]]){
 const bytes=base.slice();bytes[1336]=20;new DataView(bytes.buffer).setInt16(1056,old);
 const before=bytes.slice(),result=placeOriginalInventoryItem(bytes,incoming,0,10);assert.ok(result);
 assert.equal(readOriginalCarrier(result.bytes,0).slots[10],incoming);assert.equal(result.held,old===0?null:old);
 assert.equal(result.bytes[1336],expectedArmour);assert.deepEqual(bytes,before);
 for(let i=0;i<bytes.length;i++)if(![1056,1057,1336].includes(i))assert.equal(result.bytes[i],bytes[i]);
}
const armourSource=base.slice();armourSource[1336]=2;new DataView(armourSource.buffer).setInt16(1056,-25);
assert.equal(takeOriginalInventoryItem(armourSource,0,10).bytes[1336],254,'byte subtraction wraps without clamping');
const blocked=base.slice();new DataView(blocked.buffer).setInt16(1056,-125);assert.equal(placeOriginalInventoryItem(blocked,9,0,10),null);
new DataView(blocked.buffer).setInt16(1056,-104);assert.equal(placeOriginalInventoryItem(blocked,9,0,10),null,'weapons require the separate two-hand branch');
new DataView(blocked.buffer).setInt16(1056,-49);assert.equal(placeOriginalInventoryItem(blocked,9,0,10),null,'stacks require separate cursor quantities');
console.log(`${cases} code9 inventory/hand transfer paths preserve one item and all unrelated bytes; unsupported objects, busy hands and invalid/dead recipients rejected.`);
