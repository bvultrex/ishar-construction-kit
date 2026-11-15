import {completeOriginalDosTimerInstall as complete} from '../src/lib/ishar/original-dos-timer-install.ts';
const cases=[];
for(const systemType of [0,2,7])for(const setting of [0,100,101,151,32767,32768,65535])for(const port61 of [0,1,2,3,252,255]){
 const expected=complete(new Uint8Array(106).fill(165),0x1000,systemType,setting,port61);
 cases.push({systemType,setting,port61,expected:{...expected,bytes:Buffer.from(expected.bytes).toString('base64')}});
}
console.log(JSON.stringify(cases));
