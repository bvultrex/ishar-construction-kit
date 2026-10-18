import {createHash} from 'node:crypto';
import {activateOriginalDosScriptContext} from '../src/lib/ishar/original-dos-context-active.ts';
import assert from 'node:assert/strict';
const hash=v=>createHash('sha256').update(v).digest('hex'),cases=[];
for(const tag of [0,2,6,8])for(const value of ([0,6].includes(tag)?Array.from({length:256},(_,i)=>i):[0,1,127,128,255,32767,32768,65535]))for(const pointer of [0,0x800,65535])for(const table of [0x100,0x1000]){
 const context=new Uint8Array(65536).fill(0xa5),globals=new Uint8Array(65536).fill(0xa5),script=new Uint8Array(65536),put=(buf,at,v)=>{buf[at&65535]=v&255;buf[(at+1)&65535]=v>>>8;};
 put(globals,0xbd2,table);const dx=[0,6].includes(tag)&&value>=128?value+65280:value;put(context,table+dx,pointer);put(context,0x620,value);
 const raw=tag<6?value:32;script.set([tag,raw&255,raw>>>8],0x101);const oldContext=context.slice(),oldGlobals=globals.slice(),result=activateOriginalDosScriptContext(script,context,globals,0x101,0x600);
 assert.deepEqual(context,oldContext);assert.deepEqual(globals,oldGlobals);
 cases.push({tag,value,pointer,table,raw,expected:{si:result.si,dx:result.dx,contextHash:hash(result.memory)}});
}
console.log(JSON.stringify(cases));
