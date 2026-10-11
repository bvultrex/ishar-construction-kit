import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {firstActorFrame,actorAnimationSteps,savedMainMemory,originalActorFrames,createOriginalActorAnimation,originalActorRandom} from '../src/lib/ishar/original-actor-frame.ts';
const fixture=`
  00018 ff cjmp24 L_00030
  00020 ff cput oimmb(999)
  00030 ff cstore (odirw(0x02) odiv(oimmb(100))), ->sdirb(0x0e)
  00040 ff ceval (odirb(0x0d) omaintc(0x43ba) oegal(oimmb(0)))
  00050 ff cbz24 L_00080
  00060 ff cput (oimmb(28) oadd(odirb(0x0e)))
  00070 ff cstop
  00080 ff cput (oimmb(38) oadd(odirb(0x0e)))
  00090 ff cstop
`;
const memory=new Map([[0x43ba+53,0]]),initial={0:0,2:192,4:-25,12:35*256+53};
assert.equal(firstActorFrame(fixture,memory,initial)[0].index,29,'follows entry jump and distance branch');
memory.set(0x43ba+53,255);
assert.equal(firstActorFrame(fixture,memory,initial)[0].index,39,'signed actor state selects alternate original resource');
assert.throws(()=>firstActorFrame(fixture,new Map(),initial),/Unsaved MAIN/);
assert.throws(()=>firstActorFrame('  00018 ff csend oimmb(0)',memory,initial),/Unsupported opcode/);
assert.throws(()=>firstActorFrame('  00018 ff cjmp24 L_00018',memory,initial),/budget exceeded/);
assert.equal(firstActorFrame('  00018 ff cstop\n  00020 ff cput oimmb(2)',memory,initial).length,0);
if(process.env.ISHAR_ACTOR_LISTINGS&&process.env.ISHAR2_DIR){
  const root=process.env.ISHAR_ACTOR_LISTINGS,read=name=>readFileSync(join(root,name+'.asm'),'utf8');
  const bytes=new Uint8Array(readFileSync(join(process.env.ISHAR2_DIR,'START.SAV'))),before=bytes.slice();
  const main=savedMainMemory(read('IO.IO'),bytes);main.set(0x2ab7,0);
  assert.equal(main.get(0x2ab4),new DataView(bytes.buffer).getUint16(2,false));
  assert.equal(main.get(0x3d2e+53),bytes[4911+53]);
  assert.equal(firstActorFrame(read('GOLEM1.IO'),main,{0:0,2:93,4:-42,12:35*256+53})[0].index,28);
  assert.equal(firstActorFrame(read('WIZARD1.IO'),main,{0:0,2:192,4:-25,12:35*256+53})[0].index,16);
  assert.equal(firstActorFrame(read('AVEUGLE5.IO'),main,{0:0,2:291,4:-12,12:35*256+51})[0].index,6);
  for(const name of ['AVEUGLE5.IO','WIZARD1.IO']){
    const steps=actorAnimationSteps(read(name),main,{0:0,2:192,4:-25,12:35*256+53},{random:()=>0});
    const start=steps.next().value[0];
    if(name==='AVEUGLE5.IO')assert.equal(steps.next().value[0].x,0,'first idle countdown');
    assert.equal(steps.next().value[0].x,1,`${name}: original idle sway begins`);
    for(let tick=0;tick<5;tick++)assert.equal(steps.next().value[0].x,1);
    const back=steps.next().value[0];
    assert.equal(back.x,0,`${name}: original signed direction reverses after six ticks`);
    assert.equal(back.index,start.index,'idle movement retains distance resource');
  }

  const patch=bytes.slice(),view=new DataView(patch.buffer),word=(at,value)=>view.setUint16(at,value,false);
  for(let id=50;id<110;id++)word(3261+id*2,0);
  const camera={row:20,col:30,facing:1,map:1,scene:5};
  for(const [id,type,row,col] of [[51,0,20,29],[53,9,21,28]]){
    word(2601+id*2,row);word(2821+id*2,col);word(3041+id*2,3);word(3261+id*2,40);patch[4911+id]=type;patch[6781+id]=5;
  }
  const bundle={loader:read('IO.IO'),dispatch:read('EAFF.IO'),scripts:Object.fromEntries(['GOLEM1.IO','WIZARD1.IO','AVEUGLE5.IO'].map(name=>[name,read(name)]))};
  const frames=originalActorFrames(bundle,patch,camera).frames;
  assert.ok(frames.some(f=>f.actorId===51&&f.index===4));assert.ok(frames.some(f=>f.actorId===53&&f.index===29));
  assert.equal(originalActorFrames(bundle,patch,{...camera,map:2}).frames.length,0,'unported occlusion maps stay disabled');
  const runtime=createOriginalActorAnimation(bundle,patch,camera,1234),savedPatch=patch.slice();
  const initialFrame=runtime.snapshot();
  for(let tick=0;tick<100;tick++)runtime.advance();
  assert.equal(initialFrame.frames.length,2,'snapshot remains intact after advancing');
  assert.ok(runtime.snapshot().frames.some(frame=>frame.actorId===51),'NPC retained through idle loop');
  assert.deepEqual(patch,savedPatch,'animation never mutates source save');
  assert.equal(createOriginalActorAnimation(bundle,patch,{...camera,map:2},0).advance().frames.length,0);
  assert.deepEqual(bytes,before,'source save remains untouched');
  console.log('Actual IO loader, NPC and enemy scripts, distance resources and immutable save passed.');
}
console.log('First-frame branch execution, signed fields, unknown-state rejection and instruction budget passed.');

const animation=actorAnimationSteps(`
  00018 ff cput oimmb(7)
  00020 ff cstop
  00030 ff cadd oimmb(3), +>adirw(0x00)
  00040 ff cxinvon
  00050 ff cstop
  00060 ff cput oimmb(8)
  00070 ff cstop
  00080 ff cjmp24 L_00030
`,new Map(),{0:12,2:93,4:-42});
const first=animation.next().value;
assert.deepEqual(first,[{index:7,x:12,z:93,y:-42,mirror:false}]);
assert.deepEqual(animation.next().value,[{index:7,x:15,z:93,y:-42,mirror:true}]);
assert.equal(first[0].x,12,'previous snapshot remains immutable');
assert.deepEqual(animation.next().value,[{index:8,x:15,z:93,y:-42,mirror:true}],'cput replaces resource rather than accumulating stale frames');
assert.equal(animation.next().value[0].x,18,'local state survives yields and branches');
const randomListing='  00018 ff cstore (oimmb(100) ornd), ->sdirw(0x00)\n  00030 ff cput oimmb(1)\n  00040 ff cstop';
assert.throws(()=>actorAnimationSteps(randomListing,new Map(),{}).next(),/random source required/);
assert.equal(actorAnimationSteps(randomListing,new Map(),{},{random:bound=>bound-1}).next().value[0].x,99);
assert.throws(()=>actorAnimationSteps(randomListing,new Map(),{},{random:bound=>bound}).next(),/Invalid original random/);
console.log('Resumable actor state, sprite replacement, immutable snapshots and explicit random source passed.');

const dosRandom=originalActorRandom(0);
assert.equal(dosRandom(100),97,'zero seed wraps negative recurrence to 63617');
let seed=0n;
const reference=originalActorRandom(0);
for(let step=0;step<100;step++){
  seed=(seed*0x7ab7n-0x77fn+0x10000n)&0xffffn;
  assert.equal(reference(32767),Number((32767n*seed)>>16n));
}
assert.throws(()=>dosRandom(0),/Invalid random bound/);
console.log('DOS random recurrence and 100-step original actor session checks passed.');
