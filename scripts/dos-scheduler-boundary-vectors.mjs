import {createHash} from 'node:crypto';
import {prepareOriginalDosSchedulerBoundary} from '../src/lib/ishar/original-dos-scheduler-boundary.ts';
const hash=b=>createHash('sha256').update(b).digest('hex'),cases=[];
for(const entry of ['frame-return','context'])for(const root of [0,0x200])for(const flag of [0,128,130])for(const active of [0,1,128])for(const delay of [0,1,2])for(const scan of [0,16]){
 const context=new Uint8Array(65536).fill(0xa5),module=new Uint8Array(65536),globals=new Uint8Array(65536).fill(0x5a),bp=entry==='context'?0x200:root;
 const word=(buf,at,value)=>{buf[at&65535]=value&255;buf[(at+1)&65535]=value>>>8;};
 word(context,0x100,root);
 for(const [at,value] of [[-36,flag],[-4,active],[-1,delay]])context[(bp+at)&65535]=value;
 for(const [at,value] of [[-20,0x100],[-18,0x4000],[-8,0x1234],[-6,0x4000]])word(context,bp+at,value);
 word(module,0x10a,scan);
 const before=[context,module,globals].map(hash),registers={bp:0x200,si:0x100,bx:0,ds:0x4000},next=prepareOriginalDosSchedulerBoundary(context,module,globals,registers,entry);
 cases.push({entry,root,flag,active,delay,scan,registers,expected:{bp:next.bp,si:next.si,ds:next.ds,phase:next.phase,contextHash:hash(next.context),globalsHash:hash(next.globals.subarray(0,0x28c0))}});
 if([context,module,globals].some((buf,index)=>hash(buf)!==before[index]))throw Error('Scheduler preparation modified an input segment');
}
console.log(JSON.stringify(cases));
