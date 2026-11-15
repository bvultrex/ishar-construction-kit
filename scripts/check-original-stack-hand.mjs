import assert from 'node:assert/strict';
import {placeOriginalHandItem} from '../src/lib/ishar/original-hand-runtime.ts';
import {readOriginalCarrier} from '../src/lib/ishar/original-commerce.ts';
const base=new Uint8Array(8359);new DataView(base.buffer).setUint16(0,2);
for(let c=0;c<5;c++)new DataView(base.buffer).setInt16(996+c*2,1);
const put=(b,c,slot,id)=>new DataView(b.buffer).setInt16(1036+c*30+slot*2,id);
const count=(b,c,id,n)=>b[7629+c*20+id+59]=n;
let cases=0;
for(let c=0;c<5;c++)for(const hand of [9,10])for(let id=-59;id<=-49;id++)for(const old of [0,9,-29,-25,-60,-114,-59,-49]){
 const cap=id===-49?20:10,b=base.slice();put(b,c,hand,old);b[1336+c]=20;
 if(old>=-59&&old<=-49)count(b,c,old,3);
 const input=b.slice(),result=placeOriginalHandItem(b,{id,quantity:6},c,hand);assert.ok(result);assert.deepEqual(b,input);
 const person=readOriginalCarrier(result.bytes,c);assert.equal(person.stacks[id+59]+(result.held?.id===id?result.held.quantity??0:0),(old===id?3:0)+6);
 assert.ok(person.stacks[id+59]<=cap);
 if(old!==0&&old!==id){assert.equal(result.held.id,old);assert.equal(result.held.quantity,old>=-59&&old<=-49?3:undefined);}
 if(old>=-59&&old<=-49&&old!==id)assert.equal(person.stacks[old+59],0);
 assert.equal(person.armour,old===-29?14:20);
 for(let i=0;i<b.length;i++)if(![1036+c*30+hand*2,1037+c*30+hand*2,1336+c,7629+c*20+id+59,7629+c*20+old+59].includes(i))assert.equal(result.bytes[i],b[i]);
 cases++;
}
// Existing stack elsewhere: partial transfer leaves the hand in place.
const partial=base.slice();put(partial,0,0,-50);count(partial,0,-50,8);put(partial,0,9,9);
const part=placeOriginalHandItem(partial,{id:-50,quantity:6},0,9);
assert.equal(part.accepted,2);assert.deepEqual(part.held,{id:-50,quantity:4});assert.equal(readOriginalCarrier(part.bytes,0).slots[9],9);assert.equal(part.swapped,false);
// Complete transfer moves old item to cursor but does not duplicate existing stack.
count(partial,0,-50,2);const whole=placeOriginalHandItem(partial,{id:-50,quantity:6},0,9);
assert.deepEqual(whole.held,{id:9});assert.equal(readOriginalCarrier(whole.bytes,0).slots[9],0);assert.equal(readOriginalCarrier(whole.bytes,0).stacks[9],8);
// Nonstack replaces stack: full old quantity follows cursor; narrow swap armour.
const oldStack=base.slice();put(oldStack,0,9,-49);count(oldStack,0,-49,20);
for(const [id,armour] of [[-29,6],[-25,0],[9,0]]){const r=placeOriginalHandItem(oldStack,{id},0,9);assert.deepEqual(r.held,{id:-49,quantity:20});assert.equal(r.bytes[1336],armour);assert.equal(r.bytes[7639],0);}
const profile={types:Array(27).fill(2)};
const weapon=placeOriginalHandItem(oldStack,{id:-114},0,9,profile);assert.equal(readOriginalCarrier(weapon.bytes,0).slots[10],-125);assert.deepEqual(weapon.held,{id:-49,quantity:20});
put(oldStack,0,10,9);assert.equal(placeOriginalHandItem(oldStack,{id:-114},0,9,profile),null);
assert.equal(placeOriginalHandItem(base,{id:-50,quantity:0},0,9),null);
const reserved=base.slice();put(reserved,0,9,-125);
const reservedFull=placeOriginalHandItem(reserved,{id:-50,quantity:1},0,9);
assert.equal(readOriginalCarrier(reservedFull.bytes,0).slots[9],-125);assert.equal(readOriginalCarrier(reservedFull.bytes,0).stacks[9],1);
assert.deepEqual(reservedFull.held,{id:-50,quantity:0});assert.equal(reservedFull.accepted,1);assert.equal(reservedFull.swapped,false);
put(reserved,0,0,-50);count(reserved,0,-50,9);const reservedRest=placeOriginalHandItem(reserved,{id:-50,quantity:3},0,9);
assert.equal(readOriginalCarrier(reservedRest.bytes,0).slots[9],-125);assert.equal(readOriginalCarrier(reservedRest.bytes,0).stacks[9],10);
assert.deepEqual(reservedRest.held,{id:-50,quantity:2});assert.equal(reservedRest.accepted,1);
// Slot16 converts -59..-51 into the two persistent effect words without
// changing the slot or carrier counters. -50/-49 remain untouched on cursor.
for(const [id,at,multiplier] of [[-59,12,1000],[-58,12,100],[-57,12,10],[-56,12,1],[-55,10,1000],[-54,10,100],[-53,10,10],[-52,10,1]]){
 const b=base.slice();put(b,0,9,16);new DataView(b.buffer).setInt16(at,32000,false);const before=b.slice();
 const r=placeOriginalHandItem(b,{id,quantity:3},0,9);assert.equal(r.accepted,3);assert.equal(r.held,null);assert.equal(new DataView(r.bytes.buffer).getInt16(at,false),(32000+3*multiplier+0x8000)%0x10000-0x8000);assert.equal(readOriginalCarrier(r.bytes,0).slots[9],16);assert.deepEqual(b,before);
}
{const b=base.slice();put(b,0,9,16);new DataView(b.buffer).setInt16(10,1234,false);const r=placeOriginalHandItem(b,{id:-51,quantity:7},0,9);assert.equal(new DataView(r.bytes.buffer).getInt16(10,false),-1);assert.equal(r.held,null);}
for(const id of [-50,-49]){const b=base.slice();put(b,0,9,16);const r=placeOriginalHandItem(b,{id,quantity:4},0,9);assert.deepEqual(r.bytes,b);assert.deepEqual(r.held,{id,quantity:4});assert.equal(r.accepted,0);}
console.log(`${cases} stack hand cases plus slot16 effects, reserved-target early writes, reverse swaps, armour and two-hand interactions passed. Native acceptance remains separate.`);
