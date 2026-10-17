import {stepOriginalDosAudioEnvelope} from '../src/lib/ishar/original-dos-audio-envelope.ts';
const cases=[];
for(const base of [0,1,127,255])for(const skipFirst of [0,1])for(const first of [0,1,65535])for(const hold of [0,1,32768])for(const last of [0,1,65535])for(const divisor of [255,65535]){
 const source={base,skipFirst,first,firstDivisor:divisor,hold,last,lastDivisor:divisor,value:17,operand:18};cases.push({source,expected:stepOriginalDosAudioEnvelope(source)});
}
console.log(JSON.stringify(cases));
