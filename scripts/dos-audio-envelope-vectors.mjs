import {stepOriginalDosAudioEnvelope} from '../src/lib/ishar/original-dos-audio-envelope.ts';
import {stopOriginalDosFmRegisters} from '../src/lib/ishar/original-dos-fm-register.ts';
const cases=[];
const stopped=stopOriginalDosFmRegisters(new Uint8Array(256).fill(165));
for(const base of [0,1,127,255])for(const skipFirst of [0,1])for(const first of [0,1,65535])for(const hold of [0,1,32768])for(const last of [0,1,65535])for(const divisor of [255,65535]){
 const source={base,skipFirst,first,firstDivisor:divisor,hold,last,lastDivisor:divisor,value:17,operand:18},expected=stepOriginalDosAudioEnvelope(source);
 cases.push({source,expected,stopIo:expected.stopCall?stopped.io:[],stopShadow:expected.stopCall?[...stopped.shadow]:new Array(256).fill(165)});
}
console.log(JSON.stringify(cases));
