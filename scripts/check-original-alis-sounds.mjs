import assert from 'node:assert/strict';
import {readAlisSoundDirectory} from '../src/lib/ishar/original-alis-sounds.ts';
const bytes=new Uint8Array(96),v=new DataView(bytes.buffer);v.setUint16(2,22,true);v.setUint32(14,24,true);v.setUint32(36,20,true);v.setUint16(40,2,true);
v.setUint32(44,12,true);v.setUint32(48,24,true);bytes[56]=1;bytes[57]=10;v.setUint32(58,48,true);bytes[62]=1;v.setUint32(68,7,true);bytes[72]=99;
const before=bytes.slice(),entries=readAlisSoundDirectory(bytes);
assert.deepEqual(entries,[{index:0,tableEntry:44,offset:56,type:1,sampleHeader:{speed:10,declaredLength:48,packing:1,loopField:7}},{index:1,tableEntry:48,offset:72,type:99}]);
assert.deepEqual(bytes,before);entries[0].sampleHeader.speed=99;assert.equal(bytes[57],10);
v.setUint32(44,0xffffffff,true);assert.throws(()=>readAlisSoundDirectory(bytes),/outside image/);
if(process.env.ISHAR1_DIR&&process.env.ISHAR2_DIR){
 const {readdirSync,readFileSync}=await import('node:fs');const {createHash}=await import('node:crypto');const {readAlisModule}=await import('../src/lib/ishar/alis-module.ts');
 for(const profile of ['ISHAR1_DIR','ISHAR2_DIR']){
  const root=process.env[profile],histogram={},packing={},records=[];let modules=0;
  for(const name of readdirSync(root).filter(n=>/\.io$/i.test(n))){
   const raw=readFileSync(`${root}/${name}`),original=raw.slice(),module=readAlisModule(raw),entries=readAlisSoundDirectory(module.image);modules++;
   // Independent direct table-address check, retaining duplicates and unknown types.
   const view=new DataView(module.image.buffer,module.image.byteOffset,module.image.byteLength),r=module.header.resourceOffset;
   assert.equal(entries.length,r?view.getUint16(r+16,true):0);
   for(const e of entries){assert.equal(e.offset,e.tableEntry+view.getUint32(e.tableEntry,true));histogram[e.type]=(histogram[e.type]??0)+1;if(e.sampleHeader)packing[e.sampleHeader.packing]=(packing[e.sampleHeader.packing]??0)+1;}
   assert.deepEqual(raw,original);if(entries.length)records.push({name,sha256:createHash('sha256').update(raw).digest('hex'),count:entries.length});
  }
  console.log(JSON.stringify({profile,modules,histogram,packing,records}));
 }
}
console.log('Static sound directory: references, header fields, unknown types, bounds and source preservation passed. No PCM decoding/playback claim.');
