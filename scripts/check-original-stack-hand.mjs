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
const reserved=base.slice();put(reserved,0,9,-125);assert.equal(placeOriginalHandItem(reserved,{id:-50,quantity:1},0,9),null);
console.log(`${cases} stack hand cases plus partial/full existing-stack transfers, reverse swaps, armour and two-hand interactions passed. Native and UI acceptance separate.`);
