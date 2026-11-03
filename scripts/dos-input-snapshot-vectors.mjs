import {readOriginalDosInputSnapshot} from '../src/lib/ishar/original-dos-input-snapshot.ts';
const cases=[];
for(let mode=0;mode<256;mode++)for(const blocked of [0,1,255])for(const x of [0,1,32767,32768,65535]){
 const y=65535-x,state=(x^0xa55a)&65535;
 cases.push({mode,blocked,x,y,state,expected:readOriginalDosInputSnapshot(blocked,mode,x,y,state)});
}
console.log(JSON.stringify(cases));
