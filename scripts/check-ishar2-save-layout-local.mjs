import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {deriveIshar2SaveLayout,readIshar2SavedMain,patchIshar2SavedMain} from '../src/lib/ishar/ishar2-save-layout.ts';
import {savedMainMemory} from '../src/lib/ishar/original-actor-frame.ts';
import {originalNpcGoldTransfer} from '../src/lib/ishar/original-npc-gold.ts';
const root=process.env.ISHAR2_DIR,listings=process.env.ISHAR_ACTOR_LISTINGS;if(!root||!listings)throw Error('ISHAR2_DIR and ISHAR_ACTOR_LISTINGS required');
const io=new Uint8Array(readFileSync(join(root,'IO.IO'))),layout=await deriveIshar2SaveLayout(io),loader=readFileSync(join(listings,'IO.IO.asm'),'utf8');
assert.equal(layout.fields.length,141);assert.equal(layout.fields[1].memoryAddress,0x2ab4);
const bad=io.slice();bad[bad.length-1]^=1;await assert.rejects(()=>deriveIshar2SaveLayout(bad),/Unverified/);
let checked=0,rejected=0,changes=0;
for(const name of readdirSync(root).filter(name=>/\.sav$/i.test(name))){
 const source=new Uint8Array(readFileSync(join(root,name))),before=source.slice();
 if(source.length!==8359){assert.throws(()=>readIshar2SavedMain(source,layout),/header\/size/);rejected++;continue;}
 const memory=readIshar2SavedMain(source,layout),listingMemory=savedMainMemory(loader,source);assert.deepEqual(memory,listingMemory,name+': binary vs listing mapping');
 assert.deepEqual(patchIshar2SavedMain(source,layout,[]),source);
 assert.deepEqual(patchIshar2SavedMain(source,layout,[...memory].map(([address,value])=>({address,width:1,value}))),source,name+': all mapped no-op writes');
 for(const field of layout.fields.filter(f=>f.space==='main')){
  const address=field.memoryAddress,value=(memory.get(address)+1)&255,target=patchIshar2SavedMain(source,layout,[{address,width:1,value}]);
  const at=field.fileOffset+(field.storage==='be16-byte'?1:0),allowed=new Set([at]);if(field.storage==='be16-byte')allowed.add(field.fileOffset);
  for(let i=0;i<source.length;i++)if(!allowed.has(i))assert.equal(target[i],source[i],name+': unrelated byte');
  assert.equal(readIshar2SavedMain(target,layout).get(address),value);changes++;
 }
 assert.deepEqual(source,before);checked++;
}
const source=new Uint8Array(readFileSync(join(root,'START.SAV'))),memory=readIshar2SavedMain(source,layout),trace=originalNpcGoldTransfer(memory,0,53,[0,1]);
const result=patchIshar2SavedMain(source,layout,trace.operations),back=readIshar2SavedMain(result,layout);
for(const op of trace.operations){const value=op.width===1?back.get(op.address):(back.get(op.address)<<8)|back.get(op.address+1);assert.equal(value,op.value&(op.width===1?255:65535));}
assert.deepEqual(source,new Uint8Array(readFileSync(join(root,'START.SAV'))));
for(const writes of [[{address:0x2ab7,width:1,value:0}],[{address:0x2ab4,width:3,value:1}],[{address:0x2ab4,width:1,value:256}],[null]])assert.throws(()=>patchIshar2SavedMain(source,layout,writes));
assert.throws(()=>readIshar2SavedMain(source,{...layout,fields:layout.fields.slice(1)}),/layout/);
console.log(`${checked} original saves: binary/listing mappings equal, all-mapped no-op byte-identical; ${changes} targeted field edits preserve other bytes; ${rejected} foreign-size save rejected. NPC gold trace exported/read back without original mutation. No native game execution claim.`);
