import {allocateOriginalDosMemory} from '../src/lib/ishar/original-dos-memory-allocate.ts';
import {releaseOriginalDosMemory} from '../src/lib/ishar/original-dos-memory-release.ts';
const cases=[];
for(const size of [0,1,15,16,17,31,32,65518,65519,65520,65521,65535])for(const frontier of [0,4096,16384,65535])for(const floor of [0,4096,16384,65535]){
 const expected=allocateOriginalDosMemory(size,frontier,floor);
 cases.push({size,frontier,floor,expected,released:expected.success?releaseOriginalDosMemory(expected.handle,expected.frontier,expected.headerWord):null});
}
console.log(JSON.stringify(cases));
