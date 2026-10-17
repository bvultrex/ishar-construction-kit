import {planOriginalDosResourceMemory} from '../src/lib/ishar/original-dos-resource-memory.ts';
const cases=[];
for(const base of [0,16384,65535])for(const low of [0,15,16,65535])for(const high of [0,1,15,16,65535])for(const frontier of [0,16384,65535])for(const offset of [0,0x1234])cases.push({base,low,high,frontier,offset,expected:planOriginalDosResourceMemory(base,low,high,frontier,offset)});
console.log(JSON.stringify(cases));
