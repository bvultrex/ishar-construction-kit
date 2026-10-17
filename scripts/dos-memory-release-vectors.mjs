import {releaseOriginalDosMemory} from '../src/lib/ishar/original-dos-memory-release.ts';
const cases=[];
for(const handle of [0,1,4096,65535])for(const match of [false,true])for(const headerWord of [0,1,65535]){
 const frontier=match?(handle-1)&65535:((handle-1)^5)&65535;
 cases.push({handle,frontier,headerWord,expected:releaseOriginalDosMemory(handle,frontier,headerWord)});
}
console.log(JSON.stringify(cases));
