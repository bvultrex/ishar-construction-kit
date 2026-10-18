import assert from 'node:assert/strict';
import {writeOriginalDosPhysicalScriptBlock as physical,writeOriginalDosScriptBlock as separate} from '../src/lib/ishar/original-dos-script-block.ts';
for(const count of [0,1,2,255]){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer);v.setUint16(0x40100,0x300,true);memory[0x40102]=count;memory[0x40103]=0x79;
 for(let n=0;n<count*2;n++)memory[0x40104+n]=(n*37+11)&255;
 const before=memory.slice(),actual=physical(memory,0x4000,0x5000,0x100,0x400),expected=separate(memory.slice(0x40000,0x50000),memory.slice(0x50000,0x60000),0x100,0x400);
 assert.deepEqual(actual.memory.slice(0x50000,0x60000),expected.memory);assert.equal(actual.si,expected.si);assert.deepEqual(memory,before);
}
const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer);v.setUint16(0x40100,0x105,true);memory[0x40102]=255;
assert.throws(()=>physical(memory,0x4000,0x5000,0x100,0),/outside/);
assert.throws(()=>physical(memory,0x4000,0x5000,65535,0),/outside/);
assert.throws(()=>physical(memory,65535,0x5000,0x100,0),/outside/);
assert.throws(()=>physical(new Uint8Array(1),0,0,0,0),/1MiB/);
console.log('Shared-memory block agrees with existing disjoint helper; source and segment guards passed');
