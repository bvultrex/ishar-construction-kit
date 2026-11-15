import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {patchOriginalSaveView} from '../src/lib/ishar/original-save-view.ts';
import {readActorSave} from '../src/lib/ishar/save-actors.ts';
import {deriveIshar2SaveLayout,patchIshar2SavedMain} from '../src/lib/ishar/ishar2-save-layout.ts';
const source=Uint8Array.from({length:8359},(_,i)=>i*37&255);source[0]=0;source[1]=2;
const before=source.slice(),allowed=new Set([2,3,4,5,6,7,8,9,18,19]);
const views=[{row:20,col:29,facing:1,map:1,scene:99},{row:0,col:255,facing:4,map:255,scene:128}];
function verify(bytes,view){
 const copy=patchOriginalSaveView(bytes,view),decoded=readActorSave(copy);
 for(const key of Object.keys(view))assert.equal(decoded[key],view[key]);
 for(let i=0;i<bytes.length;i++)if(!allowed.has(i))assert.equal(copy[i],bytes[i],`unrelated byte ${i}`);
 assert.deepEqual(patchOriginalSaveView(copy,view),copy);
 return copy;
}
for(const view of views)verify(source,view);
assert.deepEqual(source,before);
const wrapper=new Uint8Array(8400);wrapper.set(source,13);assert.deepEqual(patchOriginalSaveView(wrapper.subarray(13,8372),views[0]),patchOriginalSaveView(source,views[0]));
const noncanonical=source.slice();for(const at of [2,4,6,8,18])noncanonical[at]=0x6a;
const decoded=readActorSave(noncanonical);decoded.facing=1;decoded.map=1;
const normalized=patchOriginalSaveView(noncanonical,decoded);
for(const at of [2,4,18])assert.equal(normalized[at],0x6a,'unchanged low byte preserves high byte');
for(const patch of [{facing:0},{facing:5},{map:0},{row:-1},{col:256},{scene:1.5}])assert.throws(()=>patchOriginalSaveView(source,{...views[0],...patch}));
assert.throws(()=>patchOriginalSaveView(source.subarray(0,8000),views[0]));
if(process.env.ISHAR2_DIR){
 const root=process.env.ISHAR2_DIR,layout=await deriveIshar2SaveLayout(new Uint8Array(readFileSync(join(root,'IO.IO'))));
 const fields=[[2,0x2ab4,'row'],[4,0x2ab5,'col'],[6,0x2ab6,'facing'],[8,0x2d18,'map'],[18,0x4ef2,'scene']];
 for(const [offset,address] of fields){const field=layout.fields.find(f=>f.fileOffset===offset);assert.equal(field.memoryAddress,address);assert.equal(field.storage,'be16-byte');}
 let count=0;
 for(const name of readdirSync(root).filter(n=>/\.SAV$/i.test(n))){
  const bytes=new Uint8Array(readFileSync(join(root,name)));if(!readActorSave(bytes))continue;
  for(const view of views){const copy=verify(bytes,view);assert.deepEqual(copy,patchIshar2SavedMain(bytes,layout,fields.map(([,address,key])=>({address,width:1,value:view[key]}))));count++;}
  assert.deepEqual(bytes,new Uint8Array(readFileSync(join(root,name))));
 }
 console.log(`${count} local camera exports agree byte-for-byte with the hash-bound IO writer; source files unchanged.`);
}
console.log('Camera export/reload, byte-scalar encoding, boundaries, subarrays and unrelated bytes passed. Original EXE execution remains separate.');
