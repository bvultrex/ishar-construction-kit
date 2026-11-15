import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareOriginalDosSharedScheduler as prepare} from '../src/lib/ishar/original-dos-shared-scheduler.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const es of [0x1c0b,0x1c0c,0x20ee,0x3000])for(const bp of [0x280,0xc19+36,0xbfa])for(const flag of [0,128,130])for(const active of [0,128])for(const delay of [1,2])for(const scan of [0,16])for(const reload of [false,true]){
 const m=source.slice(),c=es*16,v=new DataView(m.buffer);v.setUint16(c+0x100,bp,true);
 for(const [at,value] of [[-20,0x100],[-18,0x5000],[-8,0x1234],[-6,0x5000]])v.setUint16(c+bp+at,value,true);
 m[c+bp-36]=flag;m[c+bp-4]=active;m[c+bp-1]=delay;v.setUint16(0x5010a,scan,true);
 const input={bp,si:0x100,bx:0,ds:0x5000},before=m.slice(),{memory,...expected}=prepare(m,0x1c0b,es,input,reload);if(!m.every((x,i)=>x===before[i]))throw Error('Scheduler mutated source');memory.fill(0,0x1c0b0+0xfec0,0x1c0b0+0xff00);
 cases.push({es,bp,flag,active,delay,scan,reload,input,expected,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
