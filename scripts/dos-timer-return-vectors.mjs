import {planOriginalDosTimerReturn} from '../src/lib/ishar/original-dos-timer-return.ts';
const cases=[];
for(let counter=0;counter<256;counter++)for(const reload of [0,1,255])for(const inhibit of [0,1])for(const mode of [0,1,2,255])cases.push({counter,reload,inhibit,mode,expected:planOriginalDosTimerReturn(counter,reload,inhibit,mode)});
console.log(JSON.stringify(cases));
