import assert from 'node:assert/strict';
import {importReferenceDosSample} from '../src/lib/ishar/reference-dos-sample-import.ts';
const sample=new Uint8Array(128).fill(77),v=new DataView(sample.buffer);sample[0]=2;sample[1]=10;sample[6]=1;v.setUint32(2,96,true);v.setUint32(12,32,true);
const before=sample.slice(),result=importReferenceDosSample(sample,161,20);
assert.equal(result.length,62);assert.equal(result.loopField,16);assert.equal(result.samples.at(-1),0);
assert.deepEqual(sample,before);assert.equal(result.bytes[86],255);assert.equal(result.bytes[93],255);
assert.equal(importReferenceDosSample(sample,0,20).length,64,'pack byte zero bypasses expansion');
assert.throws(()=>importReferenceDosSample(sample,-1,20),/pack byte/);
if(process.env.ISHAR1_DIR&&process.env.ISHAR2_DIR){
 const {readdirSync,readFileSync}=await import('node:fs');const {createHash}=await import('node:crypto');const {readAlisModule}=await import('../src/lib/ishar/alis-module.ts');const {readAlisSoundDirectory}=await import('../src/lib/ishar/original-alis-sounds.ts');
 for(const key of ['ISHAR1_DIR','ISHAR2_DIR']){
  let checked=0;const failures=[];
  for(const name of readdirSync(process.env[key]).filter(n=>/\.io$/i.test(n))){
   const raw=readFileSync(`${process.env[key]}/${name}`),image=readAlisModule(raw).image,before=image.slice();
   for(const e of readAlisSoundDirectory(image))if(e.sampleHeader){
    try{const out=importReferenceDosSample(image.subarray(e.offset),raw[3],20);assert.equal(out.samples.length,out.length);checked++;}
    catch(error){failures.push({name,index:e.index,error:error.message});assert.equal(createHash('sha256').update(raw).digest('hex'),'fa35da163339385cc8fb95b5469bc5fb52e8d31a803f84854da5c89d7196c229');}
   }
   assert.deepEqual(image,before);
  }
  console.log(JSON.stringify({profile:key,checked,failures}));assert.equal(failures.length,1);
 }
}
console.log('Composed PC reference sample import, pack gate, type-2 marker writes, length changes and source isolation passed.');
