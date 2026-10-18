import {createHash} from 'node:crypto';
import {runOriginalDosIdleFrame} from '../src/lib/ishar/original-dos-frame-idle.ts';
import {stepOriginalDosIdleTimerIrq} from '../src/lib/ishar/original-dos-idle-timer-irq.ts';
const hash=b=>createHash('sha256').update(b.subarray(0,0x3000)).digest('hex'),cases=[];
for(const [target,counter] of [[1,0],[2,0],[3,1],[255,254],[255,253],[0,0]]){
 let globals=new Uint8Array(65536);globals[0xc99]=target;globals[0xc9a]=counter;globals[0xc97]=2;globals[0xc98]=2;globals[0xcd8]=1;globals[0xc49]=255;globals[0xc4a]=1;
 const view=new DataView(globals.buffer);for(const [i,at] of [0xb88,0xb8a,0x1dcd,0x1dcf,0x1dd1,0x1dd3,0x1dd5].entries())view.setUint16(at,0x1234+i*17,true);
 const initial=Buffer.from(globals).toString('base64'),frames=[];
 let frame=runOriginalDosIdleFrame(globals,0);frames.push({phase:frame.phase,globals:hash(frame.memory)});globals=frame.memory;
 while(frame.phase==='wait'){
  globals=stepOriginalDosIdleTimerIrq(globals,0).memory;
  const irqGlobals=hash(globals);frame=runOriginalDosIdleFrame(globals,0);globals=frame.memory;
  frames.push({irqGlobals,phase:frame.phase,globals:hash(globals)});
 }
 cases.push({target,counter,initial,frames});
}
console.log(JSON.stringify(cases));
