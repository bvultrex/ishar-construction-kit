import {stepOriginalDosCursorSync} from '../src/lib/ishar/original-dos-cursor-sync.ts';
const cases=[];
for(const operation of ['acquire','release'])for(const mode of [0,1,255])for(let guard=0;guard<256;guard++)for(const interruptsEnabled of [false,true])cases.push({operation,mode,guard,interruptsEnabled,expected:stepOriginalDosCursorSync(operation,mode,guard,interruptsEnabled)});
console.log(JSON.stringify(cases));
