import {readFileSync} from 'node:fs';
import {stopOriginalDosTimer} from '../src/lib/ishar/original-dos-timer-stop.ts';
import {popOriginalDosAudioPending} from '../src/lib/ishar/original-dos-audio-pending.ts';
import {prepareOriginalDosTimerInstall,completeOriginalDosTimerInstall} from '../src/lib/ishar/original-dos-timer-install.ts';
const memory=readFileSync(process.argv[2]),cases=[];
for(const count of [1,6])for(const speed of [1,10,20])for(const repeatWord of [1,32768])for(const port61 of [0,255]){
 const queue=Array.from({length:count},(_,i)=>({priority:130+i,speed,repeatWord,segment:0x4000,offset:0x100+i*256}));
 const stopped=stopOriginalDosTimer({active:1,pending:count,savedDivisor:55,vectorOffset:0x1234,vectorSegment:0x5678,port61,interruptsEnabled:true});
 const popped=popOriginalDosAudioPending(queue),entry=popped.current;
 // Original resume passes stored speed directly as BL, without the other path's -1.
 const prepared=prepareOriginalDosTimerInstall(memory.subarray(0x18eb8,0x18f22),entry.segment,entry.offset,entry.repeatWord,memory[0x18e11+entry.speed],0x4567);
 const completed=completeOriginalDosTimerInstall(prepared.bytes,0x1000,2,101,port61&252);
 cases.push({queue,port61,expected:{queue:popped.queue,current:entry,bytes:Buffer.from(completed.bytes).toString('base64'),ports:[...stopped.ports,...completed.ports],vector:prepared.vector}});
}
console.log(JSON.stringify(cases));
