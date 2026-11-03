import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareOriginalDosTimerStartup as prepare} from '../src/lib/ishar/original-dos-timer-startup.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const systemType of [0,7])for(const pitCounterWord of [0,0x8000,65335,65535])for(const retraceReads of [[0,8,0,8],[8,0,0,8,8,0,0,8]]){
 const m=source.slice();new DataView(m.buffer).setUint16(0x1c0b0+0x2894,systemType,true);const replies={vectorOffset:0x1234,vectorSegment:0x7000,pitCounterWord,retraceReads,noInterrupts:true},before=m.slice(),{memory,...result}=prepare(m,0x1c0b,replies);
 if(!m.every((x,i)=>x===before[i]))throw Error('Timer prefix mutated source');memory.fill(0,0x1c0b0+0xfefc,0x1c0b0+0xff00);cases.push({systemType,replies,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
