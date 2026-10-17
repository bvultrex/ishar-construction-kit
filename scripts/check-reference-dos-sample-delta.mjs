import assert from 'node:assert/strict';
import {expandReferenceDosSampleDelta} from '../src/lib/ishar/reference-dos-sample-delta.ts';
assert.deepEqual([...expandReferenceDosSampleDelta(Uint8Array.of(128,0x08,0xf7),22)],[128,94,95,129,128,0,0]);
assert.deepEqual([...expandReferenceDosSampleDelta(Uint8Array.of(0,0x00),20)],[0,222,188,0,0]);
assert.throws(()=>expandReferenceDosSampleDelta(Uint8Array.of(1),20),/Truncated/);
assert.throws(()=>expandReferenceDosSampleDelta(new Uint8Array(),17),/length/);
// Exhaustive byte patterns against separately expressed signed accumulator arithmetic.
const table=[-34,-21,-13,-8,-5,-3,-2,-1,1,2,3,5,8,13,21,34];
for(let start=0;start<256;start++)for(let code=0;code<256;code++){
 const signed=start<128?start:start-256,a=((signed+table[Math.floor(code/16)])%256+256)%256,b=((a+table[code%16])%256+256)%256;
 assert.deepEqual([...expandReferenceDosSampleDelta(Uint8Array.of(start,code),20)],[start,a,b,0,0]);
}
if(process.env.ISHAR1_DIR&&process.env.ISHAR2_DIR){
 const {readdirSync,readFileSync}=await import('node:fs');const {readAlisModule}=await import('../src/lib/ishar/alis-module.ts');const {readAlisSoundDirectory}=await import('../src/lib/ishar/original-alis-sounds.ts');
 for(const key of ['ISHAR1_DIR','ISHAR2_DIR']){
  let decoded=0;const failures=[];
  for(const name of readdirSync(process.env[key]).filter(n=>/\.io$/i.test(n))){
   const raw=readFileSync(`${process.env[key]}/${name}`),module=readAlisModule(raw),image=module.image,before=image.slice();
   for(const e of readAlisSoundDirectory(image))if(e.sampleHeader?.packing===1&&raw[3]!==0){
    try{const out=expandReferenceDosSampleDelta(image.subarray(e.offset+16),e.sampleHeader.declaredLength);assert.equal(out.length,2*Math.floor((e.sampleHeader.declaredLength-16)/2)+1);decoded++;}
    catch(error){failures.push({name,index:e.index,error:error.message});}
   }
   assert.deepEqual(image,before);
  }
  assert.deepEqual(failures,[]);console.log(`${key}: ${decoded} marked sample streams expanded; no type-2 normalization or native playback claim.`);
 }
}
console.log('65,536 nibble/seed patterns, wraparound, marker bytes and rejection checks passed.');
