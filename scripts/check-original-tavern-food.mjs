import assert from 'node:assert/strict';
import {feedOriginalTavernParty} from '../src/lib/ishar/original-tavern.ts';
import {ORIGINAL_COMMERCE_OFFSETS as offsets} from '../src/lib/ishar/original-commerce.ts';

const expected=value=>value>60?100:Math.min(100,value+40);
let cases=0;
for(const presentMask of [0,1,3,21,31])for(const values of [[0,20,60,61,100],[255,1,59,99,42]]){
 const bytes=Uint8Array.from({length:8359},(_,i)=>i*29+7&255);bytes[0]=0;bytes[1]=2;
 for(let c=0;c<5;c++){bytes[offsets.classes+c]=(presentMask>>c&1)?c:255;bytes[offsets.food+c]=values[c];}
 const before=bytes.slice(),result=feedOriginalTavernParty(bytes);assert.deepEqual(bytes,before);
 for(let c=0;c<5;c++)assert.equal(result[offsets.food+c],presentMask>>c&1?expected(values[c]):values[c]);
 for(let i=0;i<bytes.length;i++)if(i<offsets.food||i>=offsets.food+5)assert.equal(result[i],bytes[i],`unrelated byte ${i}`);
 cases++;
}
const wrapped=new Uint8Array(8370);const source=new Uint8Array(8359);source[1]=2;source[offsets.classes]=0;source[offsets.food]=60;wrapped.set(source,7);
assert.deepEqual(feedOriginalTavernParty(wrapped.subarray(7,8366)),feedOriginalTavernParty(source));
assert.throws(()=>feedOriginalTavernParty(source.subarray(0,8000)));
console.log(`${cases} tavern food cases preserve empty party slots, cap occupied members at 100 and leave unrelated bytes unchanged.`);
