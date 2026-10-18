import assert from 'node:assert/strict';
import {initializeOriginalDosResourceRuntime} from '../src/lib/ishar/original-dos-resource-initialize.ts';
const memory=new Uint8Array(0x100000),ss=0x1c0b,v=new DataView(memory.buffer);v.setUint16(ss*16+0xbe2,0x6000,true);v.setUint16(ss*16+0xbe6,0x6200,true);const before=memory.slice();
const next=initializeOriginalDosResourceRuntime(memory,ss,0x5000);assert.deepEqual(memory,before);assert.notEqual(next.memory,memory);assert.equal(next.tableRecords,1);assert.equal(next.memory[ss*16+0xcb1],255);assert.equal(next.memory[ss*16+0xba0],255);
const edge=memory.slice();new DataView(edge.buffer).setUint16(ss*16+0xbd2,0xfffb,true);assert.throws(()=>initializeOriginalDosResourceRuntime(edge,ss,0x5000),/bounded real-mode/);assert.equal(new DataView(edge.buffer).getUint16(ss*16+0xbd2,true),0xfffb);
const beyond=memory.slice();new DataView(beyond.buffer).setUint16(ss*16+0xbd2,0x100,true);assert.throws(()=>initializeOriginalDosResourceRuntime(beyond,ss,0xffff),/bounded real-mode/);
assert.throws(()=>initializeOriginalDosResourceRuntime(new Uint8Array(65536),ss,0x5000),/1MiB/);
console.log('MAIN initializer: immutable source, minimal do-while table, straddling words and physical address boundary rejection passed.');
