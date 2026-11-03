import assert from 'node:assert/strict';
import {normalizeReferenceDosSample} from '../src/lib/ishar/reference-dos-sample-normalize.ts';
const input=Uint8Array.from({length:128},(_,i)=>i),view=new DataView(input.buffer);input[0]=2;input[1]=10;view.setUint32(2,96,true);view.setUint32(12,32,true);
const before=input.slice(),out=normalizeReferenceDosSample(input,20);
assert.equal(out.length,64);assert.equal(out.loopField,16);assert.equal(out.speed,10);
assert.deepEqual(out.bytes.slice(48,79),input.slice(56,87));assert.equal(out.bytes[79],0);
assert.deepEqual(input,before);assert.equal(out.bytes[80],input[80]);
const old=normalizeReferenceDosSample(input,19);assert.equal(old.bytes[79],input[79]);
view.setUint32(12,0,true);assert.equal(normalizeReferenceDosSample(input,20).loopField,0);
input[0]=1;view.setUint32(2,128,true);const type1=normalizeReferenceDosSample(input,20);assert.equal(type1.length,112);assert.equal(type1.bytes[127],0);
assert.throws(()=>normalizeReferenceDosSample(input.slice(0,30),20),/range/);
assert.throws(()=>normalizeReferenceDosSample(input,NaN),/version/);
if(process.env.ISHAR1_DIR&&process.env.ISHAR2_DIR){
 const {readdirSync,readFileSync}=await import('node:fs');const {createHash}=await import('node:crypto');const {readAlisModule}=await import('../src/lib/ishar/alis-module.ts');const {readAlisSoundDirectory}=await import('../src/lib/ishar/original-alis-sounds.ts');
 for(const key of ['ISHAR1_DIR','ISHAR2_DIR']){
  let checked=0;const failures=[];
  for(const name of readdirSync(process.env[key]).filter(n=>/\.io$/i.test(n))){
   const raw=readFileSync(`${process.env[key]}/${name}`),image=readAlisModule(raw).image;
   for(const e of readAlisSoundDirectory(image))if(e.sampleHeader&&(e.sampleHeader.packing!==1||raw[3]===0)){
    try{const result=normalizeReferenceDosSample(image.subarray(e.offset),20);assert.equal(result.samples.length,result.length);checked++;}
    catch(error){failures.push({name,index:e.index,message:error.message});assert.equal(createHash('sha256').update(raw).digest('hex'),'fa35da163339385cc8fb95b5469bc5fb52e8d31a803f84854da5c89d7196c229');}
   }
  }
  console.log(JSON.stringify({profile:key,checked,failures}));assert.deepEqual(failures,[{name:'BLANCPC.IO',index:0,message:'Prepared sample range outside buffer'}]);
 }
}
console.log('PC invdigit reconstruction: overlap move, version gate, type-1/2 lengths, loop fields and copy isolation passed.');
