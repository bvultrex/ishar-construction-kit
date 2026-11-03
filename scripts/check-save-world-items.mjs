import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readSaveWorldItems,worldItemViewCandidate,originalSaveBlockLayout} from '../src/lib/ishar/save-world-items.ts';
const bytes=new Uint8Array(8359);new DataView(bytes.buffer).setUint16(0,2);
bytes[336+9]=20;bytes[536+9]=29;bytes[736+9]=1;bytes[8039+9]=1;
const items=readSaveWorldItems(bytes),item=items[9],view={row:20,col:30,facing:1,map:1,scene:1};
assert.equal(items.length,200);assert.deepEqual(item,{id:9,row:20,col:29,scene:1,facing:1});
assert.deepEqual(worldItemViewCandidate(view,item),{distance:1,lateral:0});
for(const [facing,row,col] of [[1,20,29],[2,21,30],[3,20,31],[4,19,30]])assert.equal(worldItemViewCandidate({...view,facing},{...item,row,col}).distance,1);
assert.equal(worldItemViewCandidate(view,{...item,col:24}).distance,6);
assert.equal(worldItemViewCandidate(view,{...item,col:23}),null);
assert.equal(worldItemViewCandidate(view,{...item,id:111}),null);
assert.equal(worldItemViewCandidate({...view,map:2},{...item,facing:3}),null);
assert.equal(worldItemViewCandidate(view,{...item,scene:2}),null);
if(process.env.ISHAR_IO_LISTING){
 const blocks=originalSaveBlockLayout(readFileSync(process.env.ISHAR_IO_LISTING,'utf8'));
 for(const [memory,offset] of [[0x2aba,336],[0x2d68,1006],[0x2d8e,1036],[0x3d2e,4911],[0x449a,6781],[0x4bd4,7629],[0x50c8,8039]])assert.equal(blocks.find(b=>b.memory===memory).offset,offset);
}
if(process.env.ISHAR2_DIR)assert.equal(readSaveWorldItems(readFileSync(`${process.env.ISHAR2_DIR}/START.SAV`)).length,200);
console.log('Original ground-item tables, scene/facing cones and IO save block offsets passed.');
