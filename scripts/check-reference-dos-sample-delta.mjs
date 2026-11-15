import assert from 'node:assert/strict';
import {expandReferenceDosSampleDelta} from '../src/lib/ishar/reference-dos-sample-delta.ts';
assert.deepEqual([...expandReferenceDosSampleDelta(Uint8Array.of(128,0x08,0xf7),22)],[128,94,95,0,0]);
assert.deepEqual([...expandReferenceDosSampleDelta(Uint8Array.of(0,0x00),20)],[0,0,0]);
assert.throws(()=>expandReferenceDosSampleDelta(Uint8Array.of(1),20),/Truncated/);
assert.throws(()=>expandReferenceDosSampleDelta(new Uint8Array(),17),/length/);
// Exhaustive byte patterns against separately expressed signed accumulator arithmetic.
const table=[-34,-21,-13,-8,-5,-3,-2,-1,1,2,3,5,8,13,21,34];
// Literal pointer-index trace of C's smpptr0/smpptr2, independently of output formula.
for(let count=2;count<=64;count++){
 const input=Uint8Array.from({length:count},(_,i)=>(i*73+count*19)&255),memory=new Uint8Array(16+count*2+8).fill(0xa5);
 let value=input[0],ptr0=17,ptr2=ptr0;memory[ptr2-1]=value;
 for(let i=1;i<count;i++){
  ptr2=ptr0;memory[ptr2]=(value=(value+table[input[i]>>4])&255);
  memory[ptr2+1]=(value=(value+table[input[i]&15])&255);ptr0=ptr2+2;
 }
 memory[ptr2]=0;memory[ptr2+1]=0;
 const result=expandReferenceDosSampleDelta(input,16+count*2);
 assert.deepEqual(result,memory.slice(16,ptr2+2));
 assert.equal(memory[ptr2+2],0xa5,'markers overwrite rather than extend final pair');
}
for(let start=0;start<256;start++)for(let code=0;code<256;code++){
 const signed=start<128?start:start-256,a=((signed+table[Math.floor(code/16)])%256+256)%256,b=((a+table[code%16])%256+256)%256;
 assert.deepEqual([...expandReferenceDosSampleDelta(Uint8Array.of(start,code,0),22)],[start,a,b,0,0]);
}
if(process.env.ISHAR1_DIR&&process.env.ISHAR2_DIR){
 const {readdirSync,readFileSync}=await import('node:fs');const {readAlisModule}=await import('../src/lib/ishar/alis-module.ts');const {readAlisSoundDirectory}=await import('../src/lib/ishar/original-alis-sounds.ts');
 for(const key of ['ISHAR1_DIR','ISHAR2_DIR']){
  let decoded=0;const failures=[];
  for(const name of readdirSync(process.env[key]).filter(n=>/\.io$/i.test(n))){
   const raw=readFileSync(`${process.env[key]}/${name}`),module=readAlisModule(raw),image=module.image,before=image.slice();
   for(const e of readAlisSoundDirectory(image))if(e.sampleHeader?.packing===1&&raw[3]!==0){
    try{const out=expandReferenceDosSampleDelta(image.subarray(e.offset+16),e.sampleHeader.declaredLength);assert.equal(out.length,2*Math.floor((e.sampleHeader.declaredLength-16)/2)-1);decoded++;}
    catch(error){failures.push({name,index:e.index,error:error.message});}
   }
   assert.deepEqual(image,before);
  }
  assert.deepEqual(failures,[]);console.log(`${key}: ${decoded} marked sample streams expanded; no type-2 normalization or native playback claim.`);
 }
}
console.log('65,536 nibble/seed patterns, wraparound, marker bytes and rejection checks passed.');
