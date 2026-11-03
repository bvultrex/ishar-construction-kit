import {stepOriginalBlancpcInterrupt as step} from '../src/lib/ishar/original-blancpc-interrupt.ts';
const cases=[];
const add=(operandAX,samplePointer,counter,sample)=>{const state={operandAX,samplePointer,counter};cases.push({state,sample,expected:step(state,()=>sample)});};
for(let high=0;high<256;high++)for(const sample of [0,1,255])add((high<<8)|32,0x8000,1,sample);
for(const counter of [0,1,2,32767,32768,32769,65535])add(0xaa20,0x8000,counter,0);
add(0xaa20,65535,2,127);
console.log(JSON.stringify(cases));
