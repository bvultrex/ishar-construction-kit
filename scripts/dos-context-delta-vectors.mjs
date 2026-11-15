import {createHash} from 'node:crypto';
import {applyOriginalDosContextDelta} from '../src/lib/ishar/original-dos-context-delta.ts';
const cases=[];
for(const current of [[0,0,0],[1,0,0],[0,65535,0],[0,0,32768],[65535,32768,1]])for(const count of [0,1,3])for(const state of [0,1,255]){
 const objects=new Uint8Array(65536).fill(0xa5),view=new DataView(objects.buffer);
 for(let i=0;i<count;i++){const at=0x100+i*0x100;objects[at]=state;view.setUint16(at+4,i+1<count?at+0x100:0,true);for(let axis=0;axis<3;axis++)view.setUint16(at+0x16+axis*2,(65535-i*17-axis)&65535,true);}
 const {memory,...expected}=applyOriginalDosContextDelta(objects,current,[0,0,0],count?0x100:0);
 cases.push({current,count,state,expected:{...expected,memorySha256:createHash('sha256').update(memory).digest('hex')}});
}
console.log(JSON.stringify(cases));
