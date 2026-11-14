import assert from 'node:assert/strict';
import {originalGroundSprites,pickOriginalGround,receiveOriginalGround} from '../src/lib/ishar/original-ground-runtime.ts';
const bytes=new Uint8Array(8359),words=new DataView(bytes.buffer);
words.setUint16(0,2);words.setInt16(996,10);bytes.fill(255,1276,1281);bytes[1276]=1;
bytes[345]=20;bytes[545]=29;bytes[745]=1;
const view={row:20,col:30,facing:1,map:1,scene:99};
assert.deepEqual(originalGroundSprites(bytes,view),[{id:9,index:115,x:0,y:-42,z:89,pickable:true}]);
assert.equal(originalGroundSprites(bytes,{...view,col:31})[0].index,116);
assert.equal(originalGroundSprites(bytes,{...view,col:32})[0].index,117);
assert.equal(pickOriginalGround(bytes,{...view,col:31},9),null);
assert.deepEqual(originalGroundSprites(bytes,{...view,map:2}),[]);
const picked=pickOriginalGround(bytes,view,9);
assert.equal(bytes[345],20);assert.equal(picked[345],0);assert.equal(picked[545],0);assert.equal(picked[745],0);
assert.deepEqual(originalGroundSprites(picked,view),[]);
const received=receiveOriginalGround(picked,9,0);
assert.equal(new DataView(received.buffer).getInt16(1036),9);
assert.equal(new DataView(picked.buffer).getInt16(1036),0);
assert.equal(receiveOriginalGround(picked,9,1),null);
for(const hp of [0,-1,-32768]){
 const dead=picked.slice();new DataView(dead.buffer).setInt16(996,hp,false);const before=dead.slice();
 assert.equal(receiveOriginalGround(dead,9,0),null);assert.deepEqual(dead,before);
 assert.equal(receiveOriginalGround(dead,10,0),null);assert.deepEqual(dead,before);
}
const framed=new Uint8Array(8380);framed.set(picked,7);assert.deepEqual(receiveOriginalGround(framed.subarray(7,8366),9,0),receiveOriginalGround(picked,9,0));
for(let slot=0;slot<9;slot++)new DataView(picked.buffer).setInt16(1036+slot*2,-1);
assert.equal(receiveOriginalGround(picked,9,0),null);
assert.equal(receiveOriginalGround(bytes,11,0),null);
// Object10 bypasses inventory and transfers the pending signed-word gold pair.
for(const [balance,pending,expected] of [
 [[40,200],[2,900],[43,100]],[[0,999],[0,1],[1,0]],
 [[32767,0],[1,0],[-32768,0]],[[0,32767],[0,1],[0,-32768]],
 [[4,0],[0,-1],[4,-1]],[[1,900],[0,2500],[4,400]],
]){
 const gold=picked.slice(),w=new DataView(gold.buffer);w.setInt16(1006,balance[0]);w.setInt16(1026,balance[1]);w.setInt16(14,pending[0]);w.setInt16(16,pending[1]);
 const before=gold.slice(),result=receiveOriginalGround(gold,10,0),r=new DataView(result.buffer);
 assert.equal(r.getInt16(1006),expected[0]);assert.equal(r.getInt16(1026),expected[1]);
 assert.equal(r.getInt16(14),0);assert.equal(r.getInt16(16),0);
 for(let at=0;at<gold.length;at++)if(![14,15,16,17,1006,1007,1026,1027].includes(at))assert.equal(result[at],gold[at]);
 assert.deepEqual(gold,before);
}
console.log('Original ground projection, map/scene distinction, pickup and immutable recipient writes passed.');
