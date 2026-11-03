import {stopOriginalDosTimer as stop} from '../src/lib/ishar/original-dos-timer-stop.ts';
const cases=[];
for(const active of [0,1,255])for(const pending of [0,1])for(const port61 of [0,3,255])for(const savedDivisor of [55,43981])for(const interruptsEnabled of [false,true]){
 const input={active,pending,port61,savedDivisor,interruptsEnabled,vectorOffset:0x1234,vectorSegment:0x5678};cases.push({input,expected:stop(input)});
}
console.log(JSON.stringify(cases));
