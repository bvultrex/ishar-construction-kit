import assert from 'node:assert/strict';
import {createOriginalDosScriptObject as create} from '../src/lib/ishar/original-dos-script-object.ts';
const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),ss=0x1c0b,g=ss*16;
const registers={ds:0x4000,es:0x5000,si:0x100,bx:0x1234,di:0x5678,dx:0x9abc};
v.setUint16(0x40100,0x100,true);v.setUint16(g+0xbf6,0x200,true);
// Empty pool still performs native context stores before raising error10.
let before=memory.slice(),result=create(memory,ss,registers);
assert.equal(result.error,10);assert.equal(result.stackDelta,-6);assert.equal(result.registers.si,0x123);assert.equal(result.memory[0x50300],0x40);assert.deepEqual(memory,before);
// A cycle is not silently repaired or treated as an empty list.
v.setUint16(g+0xbea,0x6000,true);v.setUint16(g+0xbec,0x300,true);v.setUint16(g+0xc16,0x20,true);v.setUint16(0x50224,0x20,true);
before=memory.slice();assert.throws(()=>create(memory,ss,registers),/host step bound/);assert.deepEqual(memory,before);
assert.throws(()=>create(new Uint8Array(2),ss,registers),/1MiB/);
assert.throws(()=>create(memory,ss,{...registers,si:65535}),/outside/);
assert.throws(()=>create(memory,ss,{...registers,ds:65535}),/outside/);
console.log('Opcode70 source preservation, partial error effects, cycle and memory guards passed');
