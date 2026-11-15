import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DosAlisEntities} from '../src/lib/ishar/original-alis-entities.ts';
import {originalEaffStructuralCleanup} from '../src/lib/ishar/original-eaff-cleanup.ts';
const t=new DosAlisEntities(7,{id:0,vramBytes:20});
const caller=t.spawn(0,{id:13,vramBytes:46}),a=t.spawn(caller,{id:37,vramBytes:20}),child=t.spawn(a,{id:9,vramBytes:20}),b=t.spawn(caller,{id:44,vramBytes:20}),other=t.spawn(0,{id:37,vramBytes:20});
t.writeByte(a,12,35);t.writeByte(b,12,35);t.writeByte(other,12,34);t.writeByte(0,12,35);
assert.deepEqual(originalEaffStructuralCleanup(t,caller),[b,a]);
assert.deepEqual(t.ordered().map(e=>e.handle),[0,other,caller,child]);
assert.deepEqual(originalEaffStructuralCleanup(t,caller),[]);
assert.equal(t.spawn(caller,{id:1,vramBytes:20}),a);
assert.equal(t.spawn(caller,{id:2,vramBytes:20}),b);
t.writeByte(caller,12,35);const before=t.ordered();assert.throws(()=>originalEaffStructuralCleanup(t,caller),/caller/);assert.deepEqual(t.ordered(),before);
if(process.env.ISHAR_ACTOR_LISTINGS){
 const listing=readFileSync(`${process.env.ISHAR_ACTOR_LISTINGS}/EAFF.IO.asm`,'utf8');
 for(const [address,bytes] of [['0003a','9c142c'],['0003d','1f38142c4c00ff3a'],['00045','14170000'],['00049','1f382a2c000c004a00233a'],['00054','14030000'],['00058','41142c'],['0005b','57142c'],['0005e','08dd']])assert.match(listing,new RegExp(`^  ${address}  ${bytes}\\s`,'m'));
 console.log('Local EAFF listing: cleanup instruction bytes and branch offsets verified. Listing evidence, not DOS execution.');
}
console.log('EAFF structural cleanup: class filtering, snapshot traversal, root exclusion, surviving successors, removal order, handle reuse and unsupported self-stop guard passed.');
if(process.env.ISHAR2_DIR){
 const {readAlisModule}=await import('../src/lib/ishar/alis-module.ts');
 const {createHash}=await import('node:crypto');
 const bytes=readFileSync(`${process.env.ISHAR2_DIR}/EAFF.IO`),module=readAlisModule(bytes);
 assert.equal(module.header.id,13);
 assert.equal(Buffer.from(module.image.subarray(0x3a,0x60)).toString('hex'),'9c142c1f38142c4c00ff3a141700001f382a2c000c004a00233a1403000041142c57142c08dd');
 console.log(`Original EAFF.IO cleanup block matched directly; SHA256 ${createHash('sha256').update(bytes).digest('hex')}`);
}
