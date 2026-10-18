import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {enumerateOriginalDosContexts} from '../src/lib/ishar/original-dos-context-list.ts';
const cases=[];
for(const length of [0,1,2,3,16,127])for(const table of [0x100,0xff00])for(const high of [false,true]){
 const context=new Uint8Array(65536),globals=new Uint8Array(65536).fill(0xa5),put=(buf,at,v)=>{buf[at&65535]=v&255;buf[(at+1)&65535]=v>>>8;};
 put(globals,0xbd2,table);const slots=Array.from({length},(_,i)=>(high?0x8000:6)+i*6);
 let slot=0;for(const next of slots){put(context,table+slot+4,next);slot=next;}put(context,table+slot+4,0);
 const originalContext=context.slice(),originalGlobals=globals.slice(),result=enumerateOriginalDosContexts(context,globals);
 assert.deepEqual(context,originalContext);assert.deepEqual(globals,originalGlobals);
 cases.push({length,table,high,slots,expected:{value:result.value,di:result.di,bx:result.bx,hash:createHash('sha256').update(result.memory.subarray(0,0x2200)).digest('hex')}});
}
const cyclic=new Uint8Array(65536),zeroGlobals=new Uint8Array(65536);cyclic[4]=6;cyclic[10]=6;
assert.throws(()=>enumerateOriginalDosContexts(cyclic,zeroGlobals),/Cyclic/);
const excessive=new Uint8Array(65536);for(let i=0;i<128;i++){const at=i===0?4:i*6+4;excessive[at]=(i+1)*6&255;excessive[at+1]=((i+1)*6)>>>8;}
assert.throws(()=>enumerateOriginalDosContexts(excessive,zeroGlobals),/127-entry/);
console.log(JSON.stringify(cases));
