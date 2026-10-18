import {stopOriginalDosCapturedAudioDevice} from '../src/lib/ishar/original-dos-audio-device-stop.ts';
const cases=[];
for(let index=0;index<8;index++)for(const divisor of [1,65535])for(const port21 of [0,255])for(const port61 of [0,3,255])for(const interruptsEnabled of [false,true])cases.push({index,divisor,port21,port61,interruptsEnabled,expected:stopOriginalDosCapturedAudioDevice(index,divisor,0x3456,0x4567,port21,port61,interruptsEnabled)});
console.log(JSON.stringify(cases));
