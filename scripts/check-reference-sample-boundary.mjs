import assert from 'node:assert/strict';
import {referenceSampleBoundary as step} from '../src/lib/ishar/reference-sample-boundary.ts';
for(let loops=0;loops<=255;loops++){
 assert.deepEqual(step(10,10,loops),{kind:'continue',index:10,loops});
 const result=step(11,10,loops);
 if(loops>1)assert.deepEqual(result,{kind:'restart',index:0,loops:loops-1,played:0,accumulator:0});
 else assert.deepEqual(result,{kind:'stop',index:11,loops,type:'none',priority:-128});
}
assert.equal(step(999,10,2).index,0,'overshoot discarded on repeat');
assert.throws(()=>step(0xffffffff,0xffffffff,1),/wrapped/);
assert.throws(()=>step(-1,10,1),/state/);assert.throws(()=>step(0,10,65536),/state/);
let loops=3,restarts=0;
for(let i=0;i<3;i++){const result=step(5,4,loops);if(result.kind==='restart'){loops=result.loops;restarts++;}else assert.equal(result.kind,'stop');}
assert.equal(restarts,2);
console.log('Reference sample boundary: all stored u8 loop counts, length+1 stop, restart reset and overshoot discard passed. No renderer/native mixer claim.');
