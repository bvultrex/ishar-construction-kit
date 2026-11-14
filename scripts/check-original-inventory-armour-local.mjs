import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {deriveIshar2SaveLayout} from '../src/lib/ishar/ishar2-save-layout.ts';
import {originalItemArmour,placeOriginalInventoryItem,takeOriginalInventoryItem} from '../src/lib/ishar/original-inventory-runtime.ts';
const root=process.env.ISHAR2_DIR;assert.ok(root,'ISHAR2_DIR required');
const raw=new Uint8Array(readFileSync(join(root,'FRISE.IO')));
assert.equal(createHash('sha256').update(raw).digest('hex'),'27117c124caf904a31568f5c58f615946083dd3429c02ade1dc1e17552cc2b64');
const image=readAlisModule(raw).image,v=new DataView(image.buffer,image.byteOffset,image.byteLength);
// Decode the original cswitch1 table and each complete literal cstore leaf.
assert.deepEqual([...image.slice(0x3f22,0x3f26)],[46,32,0x16,0x2d]);
const count=v.getUint16(0x3f26,true)+1;assert.equal(count,18);const table=new Map();
for(let i=0;i<count;i++){
 const at=0x3f28+i*4,code=v.getInt16(at,true),target=at+4+v.getInt16(at+2,true);
 const leaf=image.slice(target,target+5);assert.equal(leaf[0],30);assert.equal(leaf[1],0);assert.equal(leaf[3],18);assert.equal(leaf[4],0x51);
 table.set(code,leaf[2]);assert.equal(originalItemArmour(code),leaf[2]);
}
assert.equal(table.size,18);assert.deepEqual([...image.slice(0x4016,0x401b)],[30,0,0,18,0x51]);
const layout=await deriveIshar2SaveLayout(new Uint8Array(readFileSync(join(root,'IO.IO'))));
assert.equal(layout.fields.find(f=>f.memoryAddress===0x2f0e).fileOffset,1336);
const bytes=new Uint8Array(8359),w=new DataView(bytes.buffer);w.setUint16(0,2);w.setInt16(996,1);bytes[1336]=20;
for(const [code,armour] of table){
 const placed=placeOriginalInventoryItem(bytes,code,0,10);assert.equal(placed.bytes[1336],(20+armour)&255);
 assert.deepEqual(takeOriginalInventoryItem(placed.bytes,0,10).bytes,bytes);
 for(const incoming of [9,-29,-25]){
  const swap=placeOriginalInventoryItem(placed.bytes,incoming,0,10);
  const oldDelta=code>=-29&&code<=-26?armour:0,newDelta=incoming===-29?table.get(-29):0;
  assert.equal(swap.bytes[1336],(20+armour+newDelta-oldDelta)&255);assert.equal(swap.held,code);
 }
}
console.log('18 original armour switch leaves and IO byte mapping verified; placement/extraction and 54 supported swaps preserve the original branch-specific armour behaviour. No native scheduling/EXE claim.');
