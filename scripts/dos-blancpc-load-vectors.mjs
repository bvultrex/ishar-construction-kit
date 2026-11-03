import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {initializeOriginalDosBlancpc as load} from '../src/lib/ishar/original-dos-blancpc-load.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),file=new Uint8Array(readFileSync(process.argv[3])),cases=[];
if(file.length!==2100||createHash('sha256').update(file).digest('hex')!=='fa35da163339385cc8fb95b5469bc5fb52e8d31a803f84854da5c89d7196c229')throw Error('Unsupported BLANCPC file');
for(const resource of [0x1fa6,0x3000,0x5000])for(const fallback of [0,1])for(const scenario of ['success','retry','open-fail','read-fail','close-fail','short']){
 const m=source.slice(),v=new DataView(m.buffer);v.setUint16(0x1c0b0+0x28a2,resource,true);m[0x1c0b0+0x289b]=fallback;m[0x1c0b0+0x289c]=2;m[0x1c0b0+0x289d]=3;
 for(let i=0;i<0x1500;i++)m[resource*16+i]=(i*13+17)&255;
 const bad=scenario==='open-fail',retry=scenario==='retry',replies={opens:[{ax:bad||retry?2:5,carry:bad||retry},{ax:bad?2:5,carry:bad}],read:{ax:scenario==='read-fail'?5:scenario==='short'?100:file.length,carry:scenario==='read-fail',data:scenario==='read-fail'?undefined:scenario==='short'?file.slice(0,100):file},close:{ax:scenario==='close-fail'?6:0,carry:scenario==='close-fail'}},before=m.slice(),{memory,...result}=load(m,0x1c0b,replies);
 if(!m.every((x,i)=>x===before[i]))throw Error('Loader mutated source');memory.fill(0,0x1c0b0+0xfec0,0x1c0b0+0xff00);cases.push({resource,fallback,scenario,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
