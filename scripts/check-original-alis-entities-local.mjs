import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {readDosAlisVmSpecs} from '../src/lib/ishar/original-alis-vm-specs.ts';
import {readDosAlisForms} from '../src/lib/ishar/original-alis-forms.ts';
import {DosAlisEntities} from '../src/lib/ishar/original-alis-entities.ts';
import {originalEntityFormHit} from '../src/lib/ishar/original-entity-hit.ts';
for(const env of ['ISHAR1_DIR','ISHAR2_DIR']){
 const root=process.env[env];if(!root)throw Error(`${env} required`);const original=new Uint8Array(readFileSync(join(root,'MAIN.IO'))),before=original.slice(),module=readAlisModule(original),specs=readDosAlisVmSpecs(original);
 assert.equal(specs.moduleSlots,60);assert.equal(specs.entitySlots,50);assert.equal(specs.rawAllocationUnits,500);
 const table=new DosAlisEntities(specs.entitySlots,{id:module.header.id,vramBytes:module.header.vramBytes});
 for(let i=1;i<50;i++)assert.equal(table.spawn(0,{id:3,vramBytes:42}),i*6);
 assert.equal(table.spawn(0,{id:3,vramBytes:42}),-1);assert.deepEqual(table.ordered().map(e=>e.handle),[0,...Array.from({length:49},(_,i)=>(49-i)*6)]);assert.deepEqual(original,before);
 console.log(`${env}: native MAIN specs ${JSON.stringify(specs)}; explicit entity capacity/order checks passed (reference semantics, not original execution).`);
}
const root=process.env.ISHAR2_DIR,read=name=>readAlisModule(new Uint8Array(readFileSync(join(root,name+'.IO')))),main=read('MAIN'),mouse=read('SOURIS'),golem=read('GOLEM1');
const table=new DosAlisEntities(50,{id:0,vramBytes:main.header.vramBytes}),mouseHandle=table.spawn(0,{id:mouse.header.id,vramBytes:mouse.header.vramBytes}),golemHandle=table.spawn(0,{id:golem.header.id,vramBytes:golem.header.vramBytes});
table.writeWord(mouseHandle,0,128);table.writeWord(mouseHandle,4,122);table.writeWord(golemHandle,2,93);table.writeWord(golemHandle,4,-42);table.writeByte(golemHandle,12,35);table.writeByte(golemHandle,13,53);table.setForm(golemHandle,0);
const forms=new Map([[mouse.header.id,readDosAlisForms(mouse.image)],[golem.header.id,readDosAlisForms(golem.image)]]),hit=originalEntityFormHit(table,mouseHandle,0,forms,32767);
assert.equal(hit.entityId,golemHandle);assert.equal(table.readByte(hit.entityId,13),53);assert.notEqual(golemHandle,53);assert.deepEqual(table.findClass(mouseHandle,35),[golemHandle]);
console.log('Native SOURIS/GOLEM form resources: live handle resolves via parameter 0x0d to actor 53. Test initialization is explicit; no canonical entity placement claimed.');
// Use the actual actor listing's active form/position to update the live entity.
import {firstActorFrame,savedMainMemory} from '../src/lib/ishar/original-actor-frame.ts';
import {applyOriginalActorEntityFrame} from '../src/lib/ishar/original-actor-entity.ts';
const listingRoot=process.env.ISHAR_ACTOR_LISTINGS;if(!listingRoot)throw Error('ISHAR_ACTOR_LISTINGS required');
const loader=readFileSync(join(listingRoot,'IO.IO.asm'),'utf8'),save=new Uint8Array(readFileSync(join(root,'START.SAV'))),memory=savedMainMemory(loader,save),listing=readFileSync(join(listingRoot,'GOLEM1.IO.asm'),'utf8');
const nativeFrameBefore=firstActorFrame(listing,memory,{0:0,2:93,4:-42,12:35*256+53})[0];assert.equal(nativeFrameBefore.form,undefined,'original START state does not activate GOLEM form');
memory.set(0x43ba+53,255); // explicit controlled negative-state fixture, source SAV untouched
const nativeFrame=firstActorFrame(listing,memory,{0:0,2:93,4:-42,12:35*256+53})[0];assert.equal(nativeFrame.form,0);
const frame={...nativeFrame,actorId:53,module:'GOLEM1.IO'};applyOriginalActorEntityFrame(table,golemHandle,frame);
assert.equal(originalEntityFormHit(table,mouseHandle,0,forms,32767).entityId,golemHandle);
const snapshot=table.snapshot(golemHandle);assert.throws(()=>applyOriginalActorEntityFrame(table,golemHandle,{...frame,actorId:54}),/binding/);assert.deepEqual(table.snapshot(golemHandle),snapshot);
applyOriginalActorEntityFrame(table,golemHandle,{...frame,form:undefined});assert.equal(originalEntityFormHit(table,mouseHandle,0,forms,32767),null,'inactive visual loses its hit form');
console.log('Actual GOLEM1 script frame -> class-35 live entity -> SOURIS resource hit verified; mismatch rejected without mutation and deleted form no longer hit.');
