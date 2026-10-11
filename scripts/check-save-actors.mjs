import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readActorSave,actorViewCandidate} from '../src/lib/ishar/save-actors.ts';
const bytes=new Uint8Array(8359), view=new DataView(bytes.buffer);
const word=(at,value)=>view.setUint16(at,value,false);
word(0,2);word(2,20);word(4,30);word(6,1);word(8,1);word(18,5);
word(2601+100,20);word(2821+100,29);word(3041+100,3);word(3261+100,40);
bytes[4801+50]=99;bytes[4911+50]=12;bytes[5021+50]=88;bytes[6781+50]=5;
const before=bytes.slice(), save=readActorSave(bytes), actor=save.actors[0];
assert.deepEqual(actor,{id:50,row:20,col:29,facing:3,hp:40,type:12,scene:5});
assert.deepEqual(actorViewCandidate(save,actor),{distance:1,lateral:0,placementKey:99});
for(const [facing,row,col] of [[1,20,29],[2,21,30],[3,20,31],[4,19,30]]){
  assert.equal(actorViewCandidate({...save,facing},{...actor,row,col}).distance,1);
}
assert.equal(actorViewCandidate({...save,map:2},actor),null,'non-Irvan facing gate');
assert.equal(actorViewCandidate(save,{...actor,hp:0}),null);
const dead=bytes.slice();new DataView(dead.buffer).setInt16(3261+100,-1,false);
assert.equal(readActorSave(dead).actors[0].hp,-1,'EAFF reads signed HP, not 65535');
assert.equal(actorViewCandidate(readActorSave(dead),readActorSave(dead).actors[0]),null);
assert.equal(actorViewCandidate(save,{...actor,scene:6}),null);
assert.equal(actorViewCandidate(save,{...actor,col:24}),null,'distance six excluded');
assert.equal(actorViewCandidate(save,{...actor,row:22}),null,'outside cone');
assert.deepEqual(bytes,before,'reader does not modify save');
assert.equal(readActorSave(bytes.subarray(0,8000)),null);
const wrapped=new Uint8Array(8369);wrapped.set(bytes,7);
assert.deepEqual(readActorSave(wrapped.subarray(7,8366)),save,'honours byteOffset');
if(process.env.ISHAR2_DIR){
  const original=readActorSave(readFileSync(`${process.env.ISHAR2_DIR}/START.SAV`));
  assert.ok(original);assert.equal(original.actors.length,60);
  console.log('Local START.SAV decoded:',original.actors.filter(a=>a.hp>0).length,'living candidate slots');
}
console.log('Actor offsets, facing transforms, scene/range gates and read-only decoding passed.');
