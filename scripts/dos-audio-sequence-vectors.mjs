import {readFileSync} from 'node:fs';
import {prepareOriginalDosTimerInstall,completeOriginalDosTimerInstall} from '../src/lib/ishar/original-dos-timer-install.ts';
import {stepOriginalDosTimerTick} from '../src/lib/ishar/original-dos-timer-tick.ts';
import {stopOriginalDosTimer} from '../src/lib/ishar/original-dos-timer-stop.ts';
const memory=readFileSync(process.argv[2]),cases=[];
for(const index of [0,8,19])for(const repeats of [1,2])for(const samples of [[0],[64,80,0]])for(const port61 of [3,255]){
 const high=memory[0x18e11+index],installed=prepareOriginalDosTimerInstall(memory.subarray(0x18eb8,0x18f22),0x4000,0x100,repeats,high,0x4567),complete=completeOriginalDosTimerInstall(installed.bytes,0x1000,2,101,port61);
 let state={operandAX:(high<<8)|32,samplePointer:0x180,counter:repeats,restartPointer:0x180,timerStep:55,timerCountdown:0x4567,timerReload:0x4567};
 const frames=[];
 for(let n=0;n<256;n++){
  const frame=stepOriginalDosTimerTick(state,offset=>{const value=samples[offset-0x180];if(value===undefined)throw Error('Sequence read outside sample');return value;});state=frame.state;
  if(frame.exit==='timer-chain')throw Error('Unexpected timer chain in bounded sequence');
  let ports=frame.ports;
  if(frame.exit==='sample-end'){const stopped=stopOriginalDosTimer({active:1,pending:0,savedDivisor:0x4567,vectorOffset:0x1234,vectorSegment:0x5678,port61,interruptsEnabled:false});ports=[...ports,...stopped.ports,{port:0x20,value:32}];}
  frames.push({state,ports,ended:frame.exit==='sample-end'});if(frame.exit==='sample-end')break;
 }
 if(!frames.at(-1).ended)throw Error('Sequence budget exhausted');
 cases.push({index,repeats,samples,port61,stub:Buffer.from(complete.bytes).toString('base64'),frames});
}
console.log(JSON.stringify(cases));
