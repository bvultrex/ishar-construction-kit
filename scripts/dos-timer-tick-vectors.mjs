import {readFileSync} from 'node:fs';
import {prepareOriginalDosTimerInstall,completeOriginalDosTimerInstall} from '../src/lib/ishar/original-dos-timer-install.ts';
import {stepOriginalDosTimerTick} from '../src/lib/ishar/original-dos-timer-tick.ts';
const memory=readFileSync(process.argv[2]),template=memory.subarray(0x18eb8,0x18f22),cases=[];
for(const high of [0,85,170,255])for(const sample of [0,1,255])for(const counter of [0,1,2,32769])for(const timerCountdown of [0,55,66,65535])for(const timerStep of [55,66])for(const timerReload of [1,0x4567,65535]){
 const installed=prepareOriginalDosTimerInstall(template,0x4000,0x100,1,170,timerReload),complete=completeOriginalDosTimerInstall(installed.bytes,0x1000,2,101,0);
 const state={operandAX:(high<<8)|32,samplePointer:0x300,counter,restartPointer:0x180,timerCountdown,timerStep,timerReload};
 const stub=complete.bytes,v=new DataView(stub.buffer);for(const [at,n] of [[2,state.operandAX],[12,state.samplePointer],[96,counter],[100,timerStep],[102,timerCountdown]])v.setUint16(at,n,true);
 cases.push({state,sample,stub:Buffer.from(stub).toString('base64'),expected:stepOriginalDosTimerTick(state,()=>sample)});
}
console.log(JSON.stringify(cases));
