import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {completeOriginalDosTimerStartup as complete} from '../src/lib/ishar/original-dos-startup-timer-irq.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const handler of [0xd6d,0xd98])for(const thirdAt of [0,39,79,40000])for(const secondAt of [0,thirdAt]){
 const m=source.slice(),v=new DataView(m.buffer),g=0x1c0b0;v.setUint16(32,handler,true);v.setUint16(34,0x1000,true);v.setUint16(0x10bf8,16283,true);v.setUint16(g+0xc9f,0xbeef,true);v.setUint16(g+0xfefe,0x8ff,true);
 for(const [at,value] of [[0x2898,0],[0x2896,0],[0xc9a,0],[0xc97,4],[0xc98,4],[0xcd8,0],[0xcc5,0],[0xcb1,255],[0x1dfd,0],[0x1e0d,0],[0x1e1d,0]])m[g+at]=value;m[0x19414]=0;
 const replies={secondAt,thirdAt,retraceReads:[[0,8],[8],[0,0,8]]},before=m.slice(),{memory,...result}=complete(m,0x1c0b,replies);if(!m.every((x,i)=>x===before[i]))throw Error('IRQ completion mutated source');
 memory.fill(0,g+0xfee4,g+0xff00);cases.push({handler,replies,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
