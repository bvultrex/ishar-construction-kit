import assert from 'node:assert/strict';
import {readIshar2DosPaletteSettings} from '../src/lib/ishar/original-actor-palette.ts';
const image=new Uint8Array(0x500);image.set([0x1e,2,0x2c,1,6,0xa2,0x51],0x4ae);image.set([0x1e,0,1,6,0xa1,0x51],0x4bb);
assert.deepEqual(readIshar2DosPaletteSettings(image),{enabled:1,duration:44});assert.throws(()=>readIshar2DosPaletteSettings(new Uint8Array(10)));
if(process.env.ISHAR2_DIR&&process.env.ISHAR_ACTOR_LISTINGS){
 const {readFileSync}=await import('node:fs');const {createHash}=await import('node:crypto');const {readAlisModule}=await import('../src/lib/ishar/alis-module.ts');
 const {actorAnimationSteps,savedMainMemory,originalActorRandom}=await import('../src/lib/ishar/original-actor-frame.ts');
 const root=process.env.ISHAR2_DIR,dir=process.env.ISHAR_ACTOR_LISTINGS,mainBytes=readFileSync(`${root}/MAIN.IO`),main=readAlisModule(mainBytes).image;
 assert.equal(createHash('sha256').update(mainBytes).digest('hex'),'bfab5e9175931dbb1c2c51f0576092ef423e0bf950579340c8a1715e8cf8db95');
 assert.equal(Buffer.from(main.subarray(0x4ae,0x4bb)).toString('hex'),'1e022c0106a2511e000306c251');assert.equal(Buffer.from(main.subarray(0x4bb,0x4c1)).toString('hex'),'1e000106a151');
 const settings=readIshar2DosPaletteSettings(main),memory=savedMainMemory(readFileSync(`${dir}/IO.IO.asm`,'utf8'),readFileSync(`${root}/START.SAV`)),listing=readFileSync(`${dir}/LEZARD1.IO.asm`,'utf8');
 const {describeAlisPalettes}=await import('../src/lib/ishar/alis-assets.ts');
 const palettes=describeAlisPalettes(readAlisModule(readFileSync(`${root}/LEZARD1.IO`)).image);for(const index of [34,35,36])assert.ok(palettes.some(p=>p.entryIndex===index),'transition refers to original palette');
 assert.equal(memory.has(0x51a1),false);assert.ok(memory.has(0x519f),'light phase actually saved');
 for(const [phase,index] of [[1,34],[2,35],[3,36]]){
  const copy=new Map(memory);copy.set(0x51a1,settings.enabled);copy.set(0x51a2,settings.duration);copy.set(0x519f,phase);copy.set(0x3d2e+53,31);copy.set(0x2ab7,0);
  const events=[],steps=actorAnimationSteps(listing,copy,{0:0,2:93,4:-42,12:35*256+53},{random:originalActorRandom(0),palette:event=>events.push(event)});
  assert.ok(steps.next().value.length>0);assert.deepEqual(events,[{kind:'transition',index,duration:44}]);
  assert.throws(()=>actorAnimationSteps(listing,copy,{0:0,2:93,4:-42,12:35*256+53},{random:originalActorRandom(0)}).next(),/palette transition adapter required/);
 }
 assert.equal(memory.has(0x51a1),false);console.log('Hash-bound MAIN settings and original LEZARD startup: three light phases emit palette transition intents; no fade renderer/native execution claimed.');
}
console.log('Palette settings: original byte truncation and malformed input rejection passed.');
