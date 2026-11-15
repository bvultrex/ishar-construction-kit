import assert from 'node:assert/strict';
import {originalGerDepPostMoveReset,originalEdpltCrowdReservation,originalFriseCrowdDeathRelease} from '../src/lib/ishar/original-crowd-lifecycle.ts';
assert.deepEqual(originalGerDepPostMoveReset().map(w=>w.address),[0x4b80,0x4b81,0x4b82,0x4aa9,0x4aad,0x4ab5]);
for(const slots of [[0,0,0],[53,0,54],[0,53,54],[53,54,0],[53,54,55]]){
 const expected=slots.includes(54)?[]:[1,0,2].filter(i=>slots[i]===0).slice(0,1).map(i=>({address:0x4b80+i,width:1,value:54}));
 const before=slots.slice();assert.deepEqual(originalEdpltCrowdReservation(slots,54),expected);assert.deepEqual(slots,before);
}
for(const hp of [-32768,-1,0,1,32767])for(const slot of [-1,0,1,2])for(const context of [-1,0,1])assert.deepEqual(originalFriseCrowdDeathRelease(hp,slot,context),hp<=0&&slot>=0&&context===0?[{address:0x4b80+slot,width:1,value:0}]:[]);
assert.throws(()=>originalFriseCrowdDeathRelease(0,3,0));assert.throws(()=>originalEdpltCrowdReservation([0,0],53));
console.log('Crowd lifecycle: six post-movement reset writes, EDPLT duplicate/free/full slots, 60 death-release combinations and input guards passed.');
if(process.env.ISHAR2_DIR){
 const {readFileSync}=await import('node:fs');const {createHash}=await import('node:crypto');
 const {readAlisModule}=await import('../src/lib/ishar/alis-module.ts');
 for(const [name,at,end,expected] of [
  ['GERDEP',0x13d5,0x1411,'1e00003800003a26804b1e00003800013a26804b1e00003800023a26804b1e00003800053a26a44a1e00003800093a26a44a1e00003800113a26a44a'],
  ['FRISE',0x579e,0x57bd,'1f381265500000400868014a000042363a140a00001e00003812653a26804b'],
 ]){
  const raw=readFileSync(`${process.env.ISHAR2_DIR}/${name}.IO`),image=readAlisModule(raw).image;
  assert.equal(Buffer.from(image.subarray(at,end)).toString('hex'),expected);
  console.log(`${name} original block verified; SHA256 ${createHash('sha256').update(raw).digest('hex')}`);
 }
}

if(process.env.ISHAR2_DIR){
 const {readFileSync}=await import('node:fs');const {readAlisModule}=await import('../src/lib/ishar/alis-module.ts');
 const {deriveIshar2SaveLayout,readIshar2SavedMain,patchIshar2SavedMain}=await import('../src/lib/ishar/ishar2-save-layout.ts');
 const root=process.env.ISHAR2_DIR,source=new Uint8Array(readFileSync(`${root}/START.SAV`)),before=source.slice(),layout=await deriveIshar2SaveLayout(readFileSync(`${root}/IO.IO`));
 const occupied=patchIshar2SavedMain(source,layout,[53,54,55].map((value,i)=>({address:0x4b80+i,width:1,value}))),occupiedMemory=readIshar2SavedMain(occupied,layout);
 assert.deepEqual([0,1,2].map(i=>occupiedMemory.get(0x4b80+i)),[53,54,55]);
 const reset=patchIshar2SavedMain(occupied,layout,originalGerDepPostMoveReset()),resetMemory=readIshar2SavedMain(reset,layout);
 for(const w of originalGerDepPostMoveReset())assert.equal(resetMemory.get(w.address),0);
 for(const [address,value] of occupiedMemory)if(!originalGerDepPostMoveReset().some(w=>w.address===address))assert.equal(resetMemory.get(address),value);
 const reserve=originalEdpltCrowdReservation([0,0,0],54),assigned=patchIshar2SavedMain(reset,layout,reserve);
 assert.equal(readIshar2SavedMain(assigned,layout).get(0x4b81),54);
 const released=patchIshar2SavedMain(assigned,layout,originalFriseCrowdDeathRelease(0,1,0));assert.equal(readIshar2SavedMain(released,layout).get(0x4b81),0);assert.deepEqual(source,before);
 if(process.env.ISHAR_ACTOR_LISTINGS){
  const image=readAlisModule(readFileSync(`${root}/EDPLT.IO`)).image,listing=readFileSync(`${process.env.ISHAR_ACTOR_LISTINGS}/EDPLT.IO.asm`,'utf8');let n=0;
  for(const line of listing.split(/\r?\n/)){const m=line.match(/^\s*([\da-f]{5})\s+([\da-f]+)\s/);if(!m)continue;const at=parseInt(m[1],16);if(at<0x290||at>0x30a)continue;const p=Buffer.from(m[2],'hex');assert.deepEqual(Buffer.from(image.subarray(at,at+p.length)),p);n++;}
  assert.equal(n,19);console.log(`${n} EDPLT crowd reservation instruction prefixes match original.`);
 }
 console.log('Original SAV copy: occupied slots -> six-byte reset -> EDPLT reservation -> FRISE release, preserving all other MAIN bytes and original file buffer. No DOS execution claim.');
}
