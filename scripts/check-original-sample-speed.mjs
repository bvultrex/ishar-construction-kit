import assert from 'node:assert/strict';
import {editAlisSampleSpeed,readAlisSoundDirectory} from '../src/lib/ishar/original-alis-sounds.ts';
const image=new Uint8Array(80),v=new DataView(image.buffer);v.setUint16(2,22,true);v.setUint32(14,24,true);v.setUint32(36,20,true);v.setUint16(40,2,true);v.setUint32(44,12,true);v.setUint32(48,8,true);image[56]=1;image[57]=10;
const result=editAlisSampleSpeed(image,0,12);assert.deepEqual(result.affectedIndices,[0,1]);assert.equal(result.offset,57);assert.equal(image[57],10);assert.equal(result.image[57],12);
const buffer=Buffer.from(image),snapshot=Buffer.from(buffer);editAlisSampleSpeed(buffer,0,99);assert.deepEqual(buffer,snapshot,'Buffer input must not alias edits');
for(const n of [-1,256,NaN])assert.throws(()=>editAlisSampleSpeed(image,0,n),/Invalid/);
assert.throws(()=>editAlisSampleSpeed(image,2,10),/header/);
if(process.env.ISHAR1_DIR&&process.env.ISHAR2_DIR){
 const {readdirSync,readFileSync}=await import('node:fs');const {readAlisModule,writeAlisModule}=await import('../src/lib/ishar/alis-module.ts');
 for(const key of ['ISHAR1_DIR','ISHAR2_DIR']){
  let edits=0,modules=0;
  for(const name of readdirSync(process.env[key]).filter(n=>/\.io$/i.test(n))){
   const raw=readFileSync(`${process.env[key]}/${name}`),module=readAlisModule(raw),before=module.image.slice();let touched=false;
   for(const entry of readAlisSoundDirectory(before))if(entry.sampleHeader){
    const speed=(entry.sampleHeader.speed+1)&255,edit=editAlisSampleSpeed(before,entry.index,speed);
    assert.deepEqual([...edit.image.keys()].filter(i=>edit.image[i]!==before[i]),[entry.offset+1]);
    const packed=writeAlisModule(module,edit.image),readback=readAlisModule(packed);assert.deepEqual(readback.image,edit.image);
    assert.equal(readAlisSoundDirectory(readback.image)[entry.index].sampleHeader.speed,speed);
    const restored=editAlisSampleSpeed(readback.image,entry.index,entry.sampleHeader.speed);assert.deepEqual(restored.image,before);
    assert.deepEqual(Buffer.from(writeAlisModule(module,restored.image)),raw);edits++;touched=true;
   }
   assert.deepEqual(module.image,before);if(touched)modules++;
  }
  console.log(`${key}: ${edits} single-byte sample edits in ${modules} modules packed/read back/restored; originals read-only.`);
 }
}
console.log('Sample speed edit: alias reporting, byte preservation, guards and input isolation passed. Native mod execution still unverified.');
