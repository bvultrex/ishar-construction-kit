import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {initializeOriginalDosPhysicalEmsStartup as initialize} from '../src/lib/ishar/original-dos-physical-ems-startup.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const failure of ['signature','query','allocate',0,1,2,3,'none'])for(const biosKiB of [0,640])for(const pageFrame of [0,0xe000])for(const handle of [0,0x1234])for(const flags of [[0,0,0],[0,1,0],[0,1,1],[1,1,1]]){
 const m=source.slice(),v=new DataView(m.buffer);m.set(source.slice(0x10b10,0x10b18),0x4000a);if(failure==='signature')m[0x4000a]^=255;
 for(const [at,value] of [[0x10b1a,0x1111],[0x10b18,0x2222],[0x10b1c,0xffff]])v.setUint16(at,value,true);
 for(const [i,at] of [0x2898,0x2892,0x2896].entries())m[0x1c0b0+at]=flags[i];
 const mapStatuses=[0,0,0,0];if(typeof failure==='number')mapStatuses[failure]=128;
 const replies={biosKiB,pageFrame,handle,vectorSegment:0x4000,queryStatus:failure==='query'?128:0,allocateStatus:failure==='allocate'?255:0,mapStatuses,directionFlag:false},before=m.slice(),{memory,...result}=initialize(m,0x1c0b,replies);
 if(!m.every((x,i)=>x===before[i]))throw Error('EMS startup mutated source');memory.fill(0,0x1c0b0+0xfeea,0x1c0b0+0xff00);cases.push({failure,flags,replies,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
