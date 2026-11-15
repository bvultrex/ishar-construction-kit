import assert from 'node:assert/strict';
import {stepOriginalDosPhysicalScript as step} from '../src/lib/ishar/original-dos-physical-script.ts';
const ss=0x1c0b,g=ss*16,r={ds:0x4000,es:0x5000,si:0x100,bp:0x800,dx:12,cx:34};
const m=new Uint8Array(0x100000),v=new DataView(m.buffer);v.setUint16(g+0xbf6,0x200,true);m.set([71,0,1],0x40100);
const before=m.slice(),selected=step(m,ss,r);assert.deepEqual(m,before);assert.equal(new DataView(selected.memory.buffer).getUint16(0x507ea,true),0x100);assert.equal(selected.registers.dx,12);assert.equal(selected.registers.cx,34);
for(const opcode of [192,193,194]){
 const mem=selected.memory.slice();mem.set([opcode,0,255,2,0xcd,0xab],0x40100);const next=step(mem,ss,r),out=new DataView(next.memory.buffer),record=opcode===192?0x50300:0x50200,offset=opcode===192?10:opcode===193?14:18;
 assert.equal(out.getUint16(record+offset,true),65535);assert.equal(out.getUint16(record+offset+2,true),0xabcd);assert.equal(next.memory[record],0x80);assert.equal(next.registers.dx,65535);assert.equal(next.registers.cx,0xabcd);
 const empty=mem.slice();new DataView(empty.buffer).setUint16(0x507ea,0,true);const ignored=step(empty,ss,r);assert.deepEqual(ignored.memory,empty);assert.equal(ignored.registers.si,0x106);
 mem[0x40101]=255;const bad=mem.slice();assert.throws(()=>step(mem,ss,r),/not reconstructed/);assert.deepEqual(mem,bad);
}
console.log('Object selection, distinct original192/193/194 addressing, null-selection operand consumption and atomic rejection passed');
