import {createHash} from 'node:crypto';
import {runOriginalDosFileIo} from '../src/lib/ishar/original-dos-file-io.ts';
const cases=[],hash=b=>createHash('sha256').update(b).digest('hex');
for(const operation of ['read','write','close'])for(const alias of [false,true])for(const flag of [0,1,2,255])for(const handle of [0,5,65535])for(const count of operation==='close'?[8]:[0,1,8,256])for(const offset of [0x100,0xbbd])for(const reply of [{ax:0,carry:false},{ax:1,carry:false},{ax:65535,carry:false},{ax:5,carry:true},{ax:7,carry:true,partial:true}]){
 const globals=new Uint8Array(65536).fill(0x5a),segment=alias?globals:new Uint8Array(65536).fill(0xa5);globals[0xbbe]=handle&255;globals[0xbbf]=handle>>>8;globals[0x289b]=flag;globals[0x289c]=2;
 const response={ax:reply.ax,carry:reply.carry};if(operation==='read'){const length=reply.carry?(reply.partial?Math.min(2,count):0):Math.min(reply.ax,count);response.data=Uint8Array.from({length},(_,i)=>i&255);}
 const input={ax:0x1234,bx:0x3456,cx:count,dx:offset,ds:alias?0x1c0b:0x4000},next=runOriginalDosFileIo(globals,segment,input,operation,()=>response,alias);
 const events=next.events.map(e=>'data'in e?{...e,data:Array.from(e.data)}:e);
 cases.push({operation,alias,flag,handle,count,offset,reply,input,expected:{registers:next.registers,events,error:next.error,carry:next.carry,stackDelta:next.stackDelta,segmentHash:hash(next.memory.subarray(0,alias?0x28c0:65536)),globalsHash:hash(next.globals.subarray(0,0x28c0))}});
}
console.log(JSON.stringify(cases));
