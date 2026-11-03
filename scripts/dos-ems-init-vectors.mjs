import {planOriginalDosEmsInit,planOriginalDosEmsRelease} from '../src/lib/ishar/original-dos-ems-init.ts';
import {planOriginalDosBiosEmsMemory} from '../src/lib/ishar/original-dos-memory-layout.ts';
const cases=[];
for(const failure of ['signature','query1','query128','allocate',0,1,2,3,'none'])for(const frame of [0,0xe000])for(const handle of [0,0x1234]){
 const signature=failure!=='signature',query=failure==='query1'?1:failure==='query128'?128:0,allocate=failure==='allocate'?255:0,maps=[0,0,0,0];if(typeof failure==='number')maps[failure]=128;
 const expected=planOriginalDosEmsInit(signature,query,frame,allocate,handle,maps,0x1111,0x2222);
 cases.push({signature,query,allocate,maps,frame,handle,expected,release:planOriginalDosEmsRelease(expected.active,expected.savedHandle)});
}
const startup=process.argv.includes('--startup');
console.log(JSON.stringify(startup?cases.flatMap(c=>[0,640].flatMap(bios=>[[0,0,0],[0,1,0],[0,1,1],[1,1,1]].map(([graphics,performance,mode])=>({...c,bios,graphics,performance,mode,layout:planOriginalDosBiosEmsMemory(bios,c.expected.ax,graphics,performance,mode)})))):cases));
