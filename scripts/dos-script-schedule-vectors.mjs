import {createHash} from 'node:crypto';
import {prepareOriginalDosScriptDispatch} from '../src/lib/ishar/original-dos-script-schedule.ts';
const cases=[];
for(const flag of [0,1,128,130,255])for(const active of [0,1,128,255])for(const delay of [0,1,2,255])for(const scan of [0,16]){
 const memory=new Uint8Array(65536).fill(0xa5),module=new Uint8Array(65536),v=new DataView(memory.buffer);
 const bp=0x200;memory[bp-36]=flag;memory[bp-4]=active;memory[bp-1]=delay;
 for(const [at,value] of [[-20,0x100],[-18,0x4000],[-8,0x1234],[-6,0x4000]])v.setUint16(bp+at,value,true);
 new DataView(module.buffer).setUint16(0x10a,scan,true);
 const result=prepareOriginalDosScriptDispatch(memory,module,bp,0x4000,0x3333),{memory:out,...expected}=result;
 cases.push({flag,active,delay,scan,expected:{...expected,memorySha256:createHash('sha256').update(out).digest('hex')}});
}
console.log(JSON.stringify(cases));
