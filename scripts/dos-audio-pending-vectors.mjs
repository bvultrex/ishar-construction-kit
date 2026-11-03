import {pushOriginalDosAudioPending as push,popOriginalDosAudioPending as pop} from '../src/lib/ishar/original-dos-audio-pending.ts';
const cases=[];
for(const count of [0,1,5,6])for(const activeFlag of [0,1,2])for(const priority of [0,127,128,255])for(const next of [0,128,255]){
 const queue=Array.from({length:count},(_,i)=>({priority:i+130,speed:i+1,repeatWord:i+10,segment:0x2000+i,offset:0x100+i}));
 const current={priority,speed:13,repeatWord:257,segment:0x3000,offset:0x4321},incoming={priority:next,speed:10,repeatWord:3,segment:0x4000,offset:0x5678};
 const pushed=push(queue,activeFlag,current,incoming);cases.push({queue,activeFlag,current,incoming,pushed,popped:pop(pushed.queue)});
}
console.log(JSON.stringify(cases));
