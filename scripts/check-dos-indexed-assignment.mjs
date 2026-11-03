import assert from 'node:assert/strict';
import {assignOriginalDosIndexedValue as assign} from '../src/lib/ishar/original-dos-indexed-assignment.ts';
const memory=new Uint8Array(0x100000),view=new DataView(memory.buffer),g=0x1c0b0;
const registers={ds:0x4000,es:0x5000,si:0x100,bp:0x200,dx:0x3456};
memory.set([0,0x92,56,0,3,58,14,0,8],0x40100);view.setUint16(g+0xc58,0x802,true);view.setUint16(g+0xc5c,0xa02,true);
const before=memory.slice(),result=assign(memory,0x1c0b,registers);
assert.equal(result.memory[0x50a03],0x92);assert.equal(result.registers.dx,0xff92);assert.equal(result.registers.cx,0x3456);assert.deepEqual(memory,before);
assert.equal(new DataView(result.memory.buffer).getUint16(g+0xc58,true),0xa02);
// Unsupported results do not expose the partial internal pointer swap or operand stack.
memory[0x40106]=34;const unsupported=memory.slice();assert.throws(()=>assign(memory,0x1c0b,registers),/result tag34/);assert.deepEqual(memory,unsupported);
memory.set([56],0x40100);memory.fill(64,0x40101,0x41110);const looping=memory.slice();assert.throws(()=>assign(memory,0x1c0b,registers),/host bound/);assert.deepEqual(memory,looping);
assert.throws(()=>assign(new Uint8Array(1),0,registers),/1MiB/);
assert.throws(()=>assign(memory,0x1c0b,{...registers,ds:65535}),/outside/);
console.log('Indexed assignment signed value, scratch swap, source protection and unsupported/bounded paths passed');
