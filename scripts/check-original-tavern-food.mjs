import assert from 'node:assert/strict';
import {feedOriginalTavernParty} from '../src/lib/ishar/original-tavern.ts';
import {ORIGINAL_COMMERCE_OFFSETS as offsets} from '../src/lib/ishar/original-commerce.ts';

// Explicit boundary bands, independently stated in raw save-byte form.
const expected=value=>value<=60?value+40:value<=127?100:value<=215?value+40:value-216;
let cases=0;
for(const hp of [-32768,-1,0,1,32767])for(const klass of [0,255])for(let food=0;food<256;food++){
 const bytes=Uint8Array.from({length:8359},(_,i)=>i*29+7&255);bytes[0]=0;bytes[1]=2;
 const view=new DataView(bytes.buffer);
 for(let c=0;c<5;c++){
  bytes[offsets.classes+c]=klass;bytes[offsets.food+c]=food;
  view.setInt16(offsets.hitPoints+c*2,hp,false);
 }
 const before=bytes.slice(),result=feedOriginalTavernParty(bytes);assert.deepEqual(bytes,before);
 const target=before.slice();
 for(let c=0;c<5;c++)target[offsets.food+c]=hp>0?expected(food):food;
 assert.deepEqual(result,target,`HP ${hp}, class ${klass}, food ${food}`);
 cases++;
}
// Mixed party proves each slot uses its own HP word, without a class gate.
const source=new Uint8Array(8359);source[1]=2;const sourceView=new DataView(source.buffer);
for(let c=0;c<5;c++){
 sourceView.setInt16(offsets.hitPoints+c*2,[1,0,-1,32767,-32768][c],false);
 source[offsets.classes+c]=[255,0,1,2,255][c];source[offsets.food+c]=[60,20,99,255,128][c];
}
assert.deepEqual([...feedOriginalTavernParty(source).slice(offsets.food,offsets.food+5)],[100,20,99,39,128]);
const wrapped=new Uint8Array(8373);wrapped.set(source,7);const before=wrapped.slice();
assert.deepEqual(feedOriginalTavernParty(wrapped.subarray(7,8366)),feedOriginalTavernParty(source));
assert.deepEqual(wrapped,before);
assert.throws(()=>feedOriginalTavernParty(source.subarray(0,8000)));
const invalid=source.slice();invalid[1]=1;assert.throws(()=>feedOriginalTavernParty(invalid));
console.log(`${cases} tavern food cases plus mixed-party/subarray checks verify HP gating, all signed food bytes, input immutability and unchanged foreign bytes.`);
