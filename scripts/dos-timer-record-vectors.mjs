import {stepOriginalDosTimerRecord} from '../src/lib/ishar/original-dos-timer-record.ts';
const cases=[];
for(const flag of [0,127,128,255])for(const count of [0,1,2,65535])for(const first of [0,1,32767,32768,65535])for(const delta of [0,1,32767,32768,65535])for(const second of [0,32767,65535]){
 const source=Uint8Array.from({length:16},(_,i)=>i*7+3),v=new DataView(source.buffer);
 source[2]=flag;for(const [at,n] of [[4,count],[6,first],[8,delta],[10,second],[12,delta]])v.setUint16(at,n,true);
 const result=stepOriginalDosTimerRecord(source);
 cases.push({source:[...source],bytes:[...result.bytes],deviceCall:result.deviceCall});
}
console.log(JSON.stringify(cases));
