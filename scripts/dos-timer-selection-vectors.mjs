import {selectOriginalDosTimerRecord} from '../src/lib/ishar/original-dos-timer-selection.ts';
const cases=[];
// Each possible byte in each lane, crossed with signed boundaries and ties.
for(let lane=0;lane<3;lane++)for(let value=0;value<256;value++)for(const other of [0,1,127,128,129,255]){
 const values=[other,other,other];values[lane]=value;
 cases.push({values,selected:selectOriginalDosTimerRecord(values)});
}
console.log(JSON.stringify(cases));
