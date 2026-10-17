import {stopOriginalDosAudioClock} from '../src/lib/ishar/original-dos-audio-clock-stop.ts';
const cases=[];
for(const deviceByte of [0,1,255])for(const divisor of [0,1,65535])for(let port21=0;port21<256;port21++)for(const interruptsEnabled of [false,true]){
 const offset=0x3400+port21,segment=0x4500+port21;
 cases.push({deviceByte,divisor,port21,interruptsEnabled,offset,segment,expected:stopOriginalDosAudioClock(deviceByte,divisor,offset,segment,port21,interruptsEnabled)});
}
console.log(JSON.stringify(cases));
