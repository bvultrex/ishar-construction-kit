import assert from 'node:assert/strict';
import {ReferenceDosPaletteTransition,referenceDosPaletteTarget} from '../src/lib/ishar/reference-dos-palette-transition.ts';
const initial=new Uint8Array(1024),target=new Uint8Array(1024);target[0]=255;target[1]=90;
const fade=new ReferenceDosPaletteTransition(initial);fade.start(target,3);assert.equal(fade.snapshot().palette[0],0);assert.equal(fade.tick().palette[0],0,'first eligible tick still at initial color');assert.equal(fade.tick().palette[0],85);assert.equal(fade.tick().palette[0],255,'remaining=1 copies target, matching reference branch');assert.equal(fade.snapshot().remaining,0);assert.equal(fade.tick().palette[0],255);
fade.start(initial,0);assert.deepEqual(fade.snapshot().palette,initial);fade.start(target,1);assert.equal(fade.tick().palette[0],255);
const snapshot=fade.snapshot();snapshot.palette[0]=0;assert.equal(fade.snapshot().palette[0],255);assert.equal(initial[0],0);assert.equal(target[0],255);
fade.start(initial,4);fade.tick();fade.tick();const midway=fade.snapshot().palette[0];fade.start(target,2);assert.equal(fade.snapshot().palette[0],midway);fade.tick();assert.equal(fade.tick().palette[0],255);
assert.throws(()=>fade.start(target,256));assert.throws(()=>new ReferenceDosPaletteTransition(new Uint8Array(3)));
console.log('Reference palette transition: counter schedule, final copy, immediate/one-step cases, interruption, snapshots and range guards passed.');
if(process.env.ISHAR2_DIR&&process.env.ISHAR_ACTOR_LISTINGS){
 const {readFileSync}=await import('node:fs');const {readAlisModule}=await import('../src/lib/ishar/alis-module.ts');
 const {actorAnimationSteps,savedMainMemory,originalActorRandom}=await import('../src/lib/ishar/original-actor-frame.ts');
 const {readIshar2DosPaletteSettings}=await import('../src/lib/ishar/original-actor-palette.ts');
 const root=process.env.ISHAR2_DIR,dir=process.env.ISHAR_ACTOR_LISTINGS,image=readAlisModule(readFileSync(`${root}/LEZARD1.IO`)).image,settings=readIshar2DosPaletteSettings(readAlisModule(readFileSync(`${root}/MAIN.IO`)).image);
 const base=savedMainMemory(readFileSync(`${dir}/IO.IO.asm`,'utf8'),readFileSync(`${root}/START.SAV`)),listing=readFileSync(`${dir}/LEZARD1.IO.asm`,'utf8');
 for(const phase of [1,2,3]){
  const memory=new Map(base);memory.set(0x51a1,settings.enabled);memory.set(0x51a2,settings.duration);memory.set(0x519f,phase);memory.set(0x3d2e+53,31);memory.set(0x2ab7,0);
  const transition=new ReferenceDosPaletteTransition(initial);let resolved;
  const steps=actorAnimationSteps(listing,memory,{0:0,2:93,4:-42,12:35*256+53},{random:originalActorRandom(0),palette:event=>{resolved=referenceDosPaletteTarget(image,event.index,initial);transition.start(resolved,event.duration??0);}});
  assert.ok(steps.next().value.length);assert.ok(resolved);for(let tick=0;tick<44;tick++)transition.tick();assert.deepEqual(transition.snapshot().palette,resolved);assert.equal(transition.snapshot().remaining,0);
 }
 console.log('Original LEZARD script -> palette resource -> 44 eligible reference ticks reaches target for all three phases; no DOS/frame-time/render proof.');
}
if(process.env.ISHAR1_DIR&&process.env.ISHAR2_DIR){
 const {readFileSync,readdirSync}=await import('node:fs');const {readAlisModule}=await import('../src/lib/ishar/alis-module.ts');const {describeAlisPalettes}=await import('../src/lib/ishar/alis-assets.ts');
 for(const [game,root] of [['ishar1',process.env.ISHAR1_DIR],['ishar2',process.env.ISHAR2_DIR]]){
  let palettes=0;for(const name of readdirSync(root).filter(n=>n.toUpperCase().endsWith('.IO'))){
   const image=readAlisModule(readFileSync(`${root}/${name}`)).image;
   for(const p of describeAlisPalettes(image)){
    const previous=Uint8Array.from({length:1024},(_,i)=>i&255),before=previous.slice(),expected=previous.slice();
    for(let i=0;i<p.colorCount;i++){const at=(p.firstColor+i)*4;
     if(p.encoding==='dos-packed16'){const a=image[p.dataOffset+i*2],b=image[p.dataOffset+i*2+1];expected.set([(a&7)<<5,((b>>4)<<5)&255,(b&7)<<5,0],at);}
     else expected.set(image.subarray(p.dataOffset+2+i*3,p.dataOffset+5+i*3),at);
    }
    assert.deepEqual(referenceDosPaletteTarget(image,p.entryIndex,previous),expected);assert.deepEqual(previous,before);palettes++;
   }
  }console.log(`${game}: ${palettes} original palette targets match raw reference decoding; untouched channels preserved.`);
 }
}
