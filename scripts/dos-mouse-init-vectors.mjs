import {planOriginalDosMouseInit} from '../src/lib/ishar/original-dos-mouse-init.ts';
const cases=[];
for(let mode=0;mode<256;mode++)for(const blocked of [0,1,255])for(const resetAX of [0,1,65535]){
 cases.push({mode,blocked,resetAX,expected:planOriginalDosMouseInit(blocked,mode,resetAX,0x8120,0x3456,0x4567,0x1000)});
}
console.log(JSON.stringify(cases));
