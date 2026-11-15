import assert from 'node:assert/strict';
import {selectReferenceSampleChannel as choose} from '../src/lib/ishar/reference-sample-channel.ts';
assert.deepEqual(choose([-128,-128,-128,-128],90,10,127),{channel:0,priority:90,frequency:10000});
assert.equal(choose([-20,-20,-20,-20],90,10,127),null,'nonempty negative priorities resist nonnegative sound');
assert.equal(choose([100,101,102,103],90,10,127),null);
assert.equal(choose([90,-128,90,-128],90,10,127).channel,0,'equal priority wins before free channel');
assert.equal(choose([100,100,100,-128],90,10,127).channel,3);
assert.equal(choose([100,100,100],90,10,127),null,'explicit three-channel limit');
assert.equal(choose([-128,1,2,3],255,10,127).priority,-1);
for(let speed=0;speed<256;speed++)assert.equal(choose([-128,-128,-128],0,speed,127).frequency,(speed>=1&&speed<=20?speed:10)*1000);
// Different control structure: first exact match, otherwise stable ascending sort.
for(const state of [[-128,-1,90,100],[-2,-3,-4,-5],[127,127,127,127],[20,10,10,30],[-128,-128,-128,-128]])for(let raw=0;raw<256;raw++)for(const max of [127,255]){
 const priority=raw>=128?raw-256:raw,exact=state.indexOf(priority),candidate=exact>=0?exact:state.map((p,i)=>({p,i})).filter(x=>x.p<max).sort((a,b)=>a.p-b.p||a.i-b.i)[0]?.i;
 const lowest=candidate===undefined?max:state[candidate],blocked=(priority>=0&&lowest<0&&lowest!==-128)||priority<lowest;
 const actual=choose(state,raw,10,max);assert.equal(actual?.channel??null,blocked?null:candidate);
}
assert.throws(()=>choose([0,0],0,10,127),/channels/);assert.throws(()=>choose([0,0,0],256,10,127),/byte/);
console.log('Reference sample channel selection: equal-priority reuse, stable minimum, signed priorities, rejection and all speed bytes passed. No mixer/native audio claim.');
