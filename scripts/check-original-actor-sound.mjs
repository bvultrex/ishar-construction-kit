import assert from 'node:assert/strict';
import {actorAnimationSteps,savedMainMemory} from '../src/lib/ishar/original-actor-frame.ts';
const listing=`00018  9d csound oimmw(256), oimmw(-1), oimmw(383), oimmw(-1), (oimmb(10) opushacc oimmb(5) ornd oadd(opile))
00019  9e cmsound oimmb(2), oimmb(3), oimmb(4), oimmb(5), oimmb(0)
00020  a1 cdelsound
00021  48 cput oimmb(10)
00022  42 cstop`;
const events=[],bounds=[];
const steps=actorAnimationSteps(listing,new Map(),{}, {sound:e=>events.push(e),random:bound=>{bounds.push(bound);return 2;}});
assert.equal(steps.next().value[0].index,10,'execution continues after explicit stop intent');
assert.deepEqual(bounds,[5]);
assert.deepEqual(events,[{kind:'play',source:'local',index:0,priority:255,volume:127,loops:65535,speed:12},{kind:'play',source:'main',index:2,priority:3,volume:4,loops:5,speed:0},{kind:'stop'}]);
assert.throws(()=>actorAnimationSteps(listing,new Map(),{}).next(),/sound adapter required/);
for(const args of ['oimmb(0)','oimmb(0), oimmb(1), oimmb(2), oimmb(3), (oimmb(4)','oimmb(0),,oimmb(2),oimmb(3),oimmb(4)']){
 assert.throws(()=>actorAnimationSteps(`00018  9d csound ${args}`,new Map(),{},{sound:()=>assert.fail('malformed command dispatched')}).next(),/Invalid sound operands/);
}
if(process.env.ISHAR2_DIR&&process.env.ISHAR_ACTOR_LISTINGS){
 const {readFileSync}=await import('node:fs');const {readAlisModule}=await import('../src/lib/ishar/alis-module.ts');
 const dir=process.env.ISHAR_ACTOR_LISTINGS,root=process.env.ISHAR2_DIR;
 const script=readFileSync(`${dir}/TROUBA3.IO.asm`,'utf8'),image=readAlisModule(readFileSync(`${root}/TROUBA3.IO`)).image;
 // Complete sound instruction, including expression tail omitted by listing byte column.
 assert.equal(Buffer.from(image.subarray(0x88,0x9b)).toString('hex'),'9d0000005a007f000138000a4000056456363a');
 const memory=savedMainMemory(readFileSync(`${dir}/IO.IO.asm`,'utf8'),readFileSync(`${root}/START.SAV`));memory.set(0x2ab7,0);
 const observed=[],rng=[];
 const run=actorAnimationSteps(script,memory,{0:0,2:93,4:-42,12:35*256+53,18:256},{random:bound=>{rng.push(bound);return 0;},sound:e=>observed.push(e)});
 run.next();assert.deepEqual(observed,[{kind:'play',source:'local',index:0,priority:90,volume:127,loops:1,speed:10}]);assert.deepEqual(rng,[5]);
 console.log('Original TROUBA3 complete sound instruction and bounded startup verified.');
}
console.log('Sound command intents, operand widths/order and fail-closed guards passed; no playback claim.');




