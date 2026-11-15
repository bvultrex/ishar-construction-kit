import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {DosAlisEntities} from '../src/lib/ishar/original-alis-entities.ts';
import {initializeOriginalEaffActor} from '../src/lib/ishar/original-eaff-placement.ts';
const t=new DosAlisEntities(3,{id:0,vramBytes:46}),h=t.spawn(0,{id:37,vramBytes:20});
const input={baseX:128,depth:93,height:-42,lateral:7,divisor:3,actorId:53};
assert.equal(initializeOriginalEaffActor(t,h,input),true);assert.equal(t.readWord(h,0),151);assert.equal(t.readWord(h,2),92);assert.equal(t.readWord(h,4),65536-42);assert.equal(t.readByte(h,13),53);assert.equal(t.readByte(h,12),35);assert.equal(t.readByte(h,9),38);assert.equal(t.snapshot(h).form,-1);
initializeOriginalEaffActor(t,h,{...input,baseX:32760,lateral:2,divisor:1,depth:-32768});assert.equal(t.readWord(h,0),32780);assert.equal(t.readWord(h,2),32767);
initializeOriginalEaffActor(t,h,{...input,lateral:-7});assert.equal(t.readWord(h,0),105,'division truncates toward zero');
const before=t.snapshot(h);assert.throws(()=>initializeOriginalEaffActor(t,h,{...input,divisor:0}),/Zero divisor/);assert.deepEqual(t.snapshot(h),before);
assert.throws(()=>initializeOriginalEaffActor(t,h,{...input,actorId:256}));assert.deepEqual(t.snapshot(h),before);
assert.equal(initializeOriginalEaffActor(t,-1,{...input,divisor:0}),false,'failed clive skips stores');
if(process.env.ISHAR2_DIR){
 const image=readAlisModule(readFileSync(`${process.env.ISHAR2_DIR}/EAFF.IO`)).image;
 const expected='1f38142c4c00ff3a144200001e38141040141a5e000a5c141e56363a2c2c0000001e38140e5800013a2c2c0002001e14122c2c0004001e12162a2c000d001e00232a2c000c001e00262a2c00090011';
 assert.equal(Buffer.from(image.subarray(0x99a,0x9e9)).toString('hex'),expected);
 console.log('EAFF original placement block bytes verified.');
}
console.log('EAFF placement: six stores, truncation, signed overflow, failed spawn and atomic rejection passed; no native execution claim.');
const {applyOriginalActorEntityFrame}=await import('../src/lib/ishar/original-actor-entity.ts');
const {originalEaffStructuralCleanup}=await import('../src/lib/ishar/original-eaff-cleanup.ts');
initializeOriginalEaffActor(t,h,input);
applyOriginalActorEntityFrame(t,h,{actorId:53,module:'GOLEM1',index:0,x:152,y:-42,z:92,mirror:true,form:0});
assert.equal(t.snapshot(h).form,0);assert.deepEqual(originalEaffStructuralCleanup(t,0),[h]);
const reused=t.spawn(0,{id:37,vramBytes:20});assert.equal(reused,h);assert.equal(t.snapshot(h).form,-1);assert.equal(t.readByte(h,13),0);
assert.throws(()=>applyOriginalActorEntityFrame(t,h,{actorId:53,module:'GOLEM1',index:0,x:152,y:-42,z:92,mirror:true,form:0}),/binding mismatch/);
console.log('Placement -> actor frame -> cleanup -> reused handle rejects stale actor binding.');
