import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {ISHAR1_MAIN_SHA256,deriveIshar1SaveLayout,readIshar1SavedMain,patchIshar1SavedMain} from '../src/lib/ishar/ishar1-save-layout.ts';
const fields=[];let end=0;
for(let i=0;i<107;i++){
 const length=i===106?5216-end:i<2?2:1;
 fields.push({fileOffset:end,fileBytes:length,memoryAddress:i===106?0x3000:0x1000+i*4,memoryBytes:i===0?1:length,storage:i<2?'be16':'opaque',writePc:0,readPc:0});end+=length;
}
const layout={game:'ishar1',mainSha256:ISHAR1_MAIN_SHA256,size:5216,fields},source=Uint8Array.from({length:5216},(_,i)=>(i*37+19)&255),before=source.slice();
const memory=readIshar1SavedMain(source,layout);
assert.equal(memory.get(0x1000),source[1]);assert.equal(memory.get(0x1004),source[2]);
assert.deepEqual(patchIshar1SavedMain(source,layout,[...memory].map(([address,value])=>({address,width:1,value}))),source,'all saved-byte no-op preserves noncanonical scalar high byte');
const changed=patchIshar1SavedMain(source,layout,[{address:0x1000,width:1,value:128}]);
assert.equal(changed[0],255);assert.equal(changed[1],128);assert.deepEqual(changed.subarray(2),source.subarray(2));
const positive=patchIshar1SavedMain(source,layout,[{address:0x1000,width:1,value:127}]);assert.equal(positive[0],0);assert.equal(positive[1],127);
const word=patchIshar1SavedMain(source,layout,[{address:0x1004,width:2,value:-2}]);assert.deepEqual([...word.subarray(2,4)],[255,254]);
for(const writes of [[{address:0x1000,width:2,value:100}],[{address:0,width:1,value:1}],[{address:0x1004,width:1,value:256}],[{address:0x1004,width:3,value:0}],[null]])assert.throws(()=>patchIshar1SavedMain(source,layout,writes));
for(const bad of [{...layout,fields:fields.slice(1)},{...layout,mainSha256:'wrong'},{...layout,fields:fields.map((f,i)=>i===1?{...f,memoryAddress:0x1000}:f)}])assert.throws(()=>patchIshar1SavedMain(source,bad,[]));
assert.throws(()=>readIshar1SavedMain(new Uint8Array(5215),layout));assert.deepEqual(source,before);
console.log('Ishar1 surgical writer: byte/word/block writes, signed-byte expansion, no-op preservation and atomic invalid-input rejection passed.');
if(process.env.ISHAR1_DIR){
 const root=process.env.ISHAR1_DIR,l=await deriveIshar1SaveLayout(new Uint8Array(readFileSync(join(root,'MAIN.IO'))));let count=0,edits=0;
 for(const name of readdirSync(root).filter(n=>/\.sav$/i.test(n))){
  const path=join(root,name),bytes=new Uint8Array(readFileSync(path)),original=bytes.slice(),m=readIshar1SavedMain(bytes,l);
  assert.deepEqual(patchIshar1SavedMain(bytes,l,[...m].map(([address,value])=>({address,width:1,value}))),bytes);
  for(const field of l.fields){
   const value=(m.get(field.memoryAddress)+1)&255,next=patchIshar1SavedMain(bytes,l,[{address:field.memoryAddress,width:1,value}]);
   const target=field.fileOffset+(field.storage==='be16'&&field.memoryBytes===1?1:0),allowed=new Set([target]);if(field.storage==='be16'&&field.memoryBytes===1)allowed.add(field.fileOffset);
   bytes.forEach((v,i)=>{if(!allowed.has(i))assert.equal(next[i],v,'unrelated SAV byte changed');});
   assert.equal(readIshar1SavedMain(next,l).get(field.memoryAddress),value);edits++;
  }
  assert.deepEqual(bytes,original);assert.deepEqual(new Uint8Array(readFileSync(path)),original);count++;
 }
 assert.ok(count);console.log(`${count} original saves: all-mapped no-op exact, ${edits} targeted field edits preserve other bytes. No original EXE execution claim.`);
}
