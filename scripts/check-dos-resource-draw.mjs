import assert from 'node:assert/strict';
import {prepareOriginalDosResourceDraw as prepare} from '../src/lib/ishar/original-dos-resource-draw.ts';
const ss=0x1c0b,r={ds:0x4000,es:0x5000,si:0x101,bp:0x800,dx:12,cx:34},m=new Uint8Array(0x100000),v=new DataView(m.buffer),w=(at,x)=>v.setUint16(at,x,true);
m.set([0,0],0x40101);w(0x507ec,0x100);w(0x507ee,0x6000);w(0x6010e,0x100);w(0x60200,0x100);w(0x60300,0x100);m[0x60400]=1;
const before=m.slice(),record=prepare(m,ss,r,72);assert.deepEqual(m,before);assert.equal(record.phase,'record');assert.equal(record.registers.ds,0x6040);assert.equal(record.resourceOffset,0);assert.equal(record.registers.si,0x103);assert.equal(record.stackDelta,-10);
m[0x60400]=255;const empty=prepare(m,ss,r,72);assert.equal(empty.phase,'empty-compound');assert.equal(empty.entry,0x34af);assert.equal(empty.registers.cx,0);assert.equal(empty.pending.length,0);assert.equal(empty.memory[ss*16+0xc13],0);
m[0x60401]=1;const cycle=m.slice();assert.throws(()=>prepare(m,ss,r,72),/cycle/);assert.deepEqual(m,cycle);
m[0x40101]=255;const bad=m.slice();assert.throws(()=>prepare(m,ss,r,72),/not reconstructed/);assert.deepEqual(m,bad);
console.log('Draw lookup, empty-compound predecrement, preserved source and atomic recursive/operand rejection passed');
