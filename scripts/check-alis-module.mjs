import assert from 'node:assert/strict';
import {readAlisModule,writeAlisModule,readAlisImageHeader} from '../src/lib/ishar/alis-module.ts';
function raw(main=false){
 const envelope=main?22:6,bytes=new Uint8Array(envelope+32),view=new DataView(bytes.buffer);
 view.setUint32(0,bytes.length,true);view.setUint16(4,main?0:1,true);
 // Test-only synthetic module: valid image header and preserved unknown data.
 const image=new DataView(bytes.buffer,envelope);image.setUint16(0,main?0:4,true);
 image.setUint16(2,22,true);image.setUint32(14,26,true);image.setUint16(20,16,true);
 image.setUint16(18,0xcafe,true);bytes[envelope+24]=0x44;bytes[bytes.length-1]=0xab;
 if(main)for(let i=6;i<22;i++)bytes[i]=i;
 return bytes;
}
for(const main of [false,true]){
 const bytes=raw(main),before=bytes.slice(),module=readAlisModule(bytes);
 assert.equal(module.encoding,'dos-raw');assert.equal(module.isMain,main);assert.equal(module.header.entry,24);
 assert.deepEqual(writeAlisModule(module),bytes,'byte-exact no-op');
 const edit=module.image.slice();edit[31]=123;
 const written=writeAlisModule(module,edit),expected=bytes.slice();expected[expected.length-1]=123;
 assert.deepEqual(written,expected,'only requested image byte changed; envelope and unknown fields survive');
 assert.deepEqual(bytes,before,'input not mutated');
 assert.throws(()=>writeAlisModule(module,new Uint8Array(40)),/resizing/);
 const bad=bytes.slice();new DataView(bad.buffer).setUint32(0,0xffffff,true);
 assert.throws(()=>readAlisModule(bad),/size/);
 const short=bytes.slice(0,-1);assert.throws(()=>readAlisModule(short),/size mismatch/);
 for(const address of [2,6,10,14]){
  const image=module.image.slice(),v=new DataView(image.buffer);
  if(address===2)v.setUint16(address,0xffff,true);else v.setUint32(address,0xffffffff,true);
  assert.throws(()=>readAlisImageHeader(image),/outside image/);
 }
}
assert.throws(()=>readAlisModule(new Uint8Array(5)),/truncated/);
assert.throws(()=>readAlisImageHeader(new Uint8Array(23)),/truncated/);
const unsupported=raw();unsupported[3]=0x81;assert.throws(()=>readAlisModule(unsupported),/Unsupported/);
console.log('ALIS raw/main envelopes, header bounds, unknown-byte preservation, no-op/raw edits and explicit unsupported-mode rejection passed.');
