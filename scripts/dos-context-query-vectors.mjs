import {createHash} from 'node:crypto';
import {findOriginalDosContextsByModule} from '../src/lib/ishar/original-dos-context-query.ts';
import {storeOriginalDosScriptResult} from '../src/lib/ishar/original-dos-script-result.ts';
import assert from 'node:assert/strict';
const hash=v=>createHash('sha256').update(v).digest('hex'),cases=[];
for(const length of [0,1,2,4,16])for(const id of [0,1,65535])for(const mode of [0,1,255])for(const pattern of ['all','alternate','none'])for(const bp of [0x600,0x1000])for(const tag of [6,8,18,20])for(const high of [false,true]){
 const context=new Uint8Array(65536),globals=new Uint8Array(65536).fill(0xa5),put=(buf,at,v)=>{buf[at&65535]=v&255;buf[(at+1)&65535]=v>>>8;},nodes=[];
 put(globals,0xbd2,0x100);globals[0xc96]=mode;
 for(let i=0;i<=length;i++){const slot=i===0?0:high?0x8000+(i-1)*6:i*6,nextSlot=i===length?0:high?0x8000+i*6:(i+1)*6,pointer=0x1000+i*0x40,nodeId=pattern==='none'||pattern==='alternate'&&i%2?(id+1)&65535:id;nodes.push({slot,pointer,id:nodeId});put(context,0x100+slot,pointer);put(context,0x100+slot+4,nextSlot);put(context,pointer-0x10,nodeId);}
 const source=context.slice(),oldGlobals=globals.slice(),query=findOriginalDosContextsByModule(context,globals,bp,id),script=new Uint8Array(65536);script.set([tag,32,0],0x103);
 const next=storeOriginalDosScriptResult(script,context,query.memory,0x103,bp,query.value);assert.deepEqual(context,source);assert.deepEqual(globals,oldGlobals);
 cases.push({id,mode,bp,tag,nodes,expected:{si:next.si,dx:query.value,cx:query.cx,contextHash:hash(next.memory),globalsHash:hash(next.globals.subarray(0,0x2200))}});
}
console.log(JSON.stringify(cases));
