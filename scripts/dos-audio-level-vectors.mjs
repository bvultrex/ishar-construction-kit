import {setOriginalDosAudioLevel,getOriginalDosAudioLevel} from '../src/lib/ishar/original-dos-audio-envelope.ts';
import assert from 'node:assert/strict';
const cases=[];
for(let value=0;value<256;value++)for(const prior of [0,127,128,255]){
 const source={base:prior,skipFirst:3,first:123,firstDivisor:234,hold:345,last:456,lastDivisor:567,value:prior,operand:prior^255};
 const before={...source},state=setOriginalDosAudioLevel(source,value);assert.deepEqual(source,before);
 cases.push({value,source,state,read:getOriginalDosAudioLevel(state.value)});
}
const reads=Array.from({length:256},(_,value)=>({value,read:getOriginalDosAudioLevel(value)}));
console.log(JSON.stringify({cases,reads}));
