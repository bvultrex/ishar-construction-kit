import assert from 'node:assert/strict';
import {ISHAR2_IO_SHA256,readIshar2SavedMain,patchIshar2SavedMain} from '../src/lib/ishar/ishar2-save-layout.ts';
// Own generated data; no game resource is bundled with this regression test.
const fields=[{fileOffset:0,fileBytes:2,memoryAddress:0x6f6,memoryBytes:1,space:'local',storage:'be16-byte',readPc:0,writePc:0},{fileOffset:2,fileBytes:2,memoryAddress:0x2ab4,memoryBytes:1,space:'main',storage:'be16-byte',readPc:0,writePc:0},{fileOffset:4,fileBytes:2,memoryAddress:0x4c38,memoryBytes:2,space:'main',storage:'be16-word',readPc:0,writePc:0},{fileOffset:6,fileBytes:8353,memoryAddress:0x100,memoryBytes:8353,space:'main',storage:'block',readPc:0,writePc:0}];
const layout={game:'ishar2',ioSha256:ISHAR2_IO_SHA256,size:8359,fields};
const source=Uint8Array.from({length:8359},(_,i)=>i*19&255);source[0]=0;source[1]=2;source[2]=0x71;source[3]=0xff;const before=source.slice();
assert.equal(readIshar2SavedMain(source,layout).get(0x2ab4),255);
assert.deepEqual(patchIshar2SavedMain(source,layout,[{address:0x2ab4,width:1,value:-1}]),source,'no-op preserves noncanonical unused scalar high byte');
let target=patchIshar2SavedMain(source,layout,[{address:0x2ab4,width:1,value:128}]);assert.deepEqual([...target.slice(2,4)],[255,128]);
target=patchIshar2SavedMain(source,layout,[{address:0x2ab4,width:1,value:7}]);assert.deepEqual([...target.slice(2,4)],[0,7]);
target=patchIshar2SavedMain(source,layout,[{address:0x4c38,width:2,value:-123}]);assert.deepEqual([...target.slice(4,6)],[255,133]);
for(let i=0;i<source.length;i++)if(i!==4&&i!==5)assert.equal(target[i],source[i]);
assert.deepEqual(source,before);
for(const write of [null,{}, {address:-1,width:1,value:0},{address:0x4c38,width:0,value:0},{address:0x4c38,width:2,value:65536},{address:0x4c38,width:2,value:-32769},{address:0x4c39,width:2,value:0}])assert.throws(()=>patchIshar2SavedMain(source,layout,[write]));
assert.throws(()=>readIshar2SavedMain(source.slice(1),layout));assert.throws(()=>readIshar2SavedMain(source,{...layout,ioSha256:'x'}));
assert.deepEqual(source,before,'failure leaves original untouched');
console.log('Save MAIN patch: own fixture, scalar sign extension, no-op high-byte preservation, normalized word endian, unmapped/invalid writes and source immutability passed.');
