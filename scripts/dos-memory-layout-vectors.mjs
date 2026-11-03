import {planOriginalDosStartupMemory} from '../src/lib/ishar/original-dos-memory-layout.ts';
const cases=[];
for(const upper of [0,1,40959,65535])for(const existing of [0,16384])for(const graphics of [0,1,255])for(const performance of [0,1,255])for(const mode of [0,1,255])cases.push({upper,existing,graphics,performance,mode,expected:planOriginalDosStartupMemory(upper,existing,graphics,performance,mode,0x1234)});
console.log(JSON.stringify(cases));
