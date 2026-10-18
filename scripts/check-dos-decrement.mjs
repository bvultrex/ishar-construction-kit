import assert from 'node:assert/strict';
import {stepOriginalDosPhysicalScript as step} from '../src/lib/ishar/original-dos-physical-script.ts';
const ss=0x1c0b,g=ss*16,r={ds:0x4000,es:0x5000,si:0x100,bp:0x200,dx:7,cx:9};
for(const opcode of [43,44,45])for(const value of [0,1]){
 const m=new Uint8Array(0x100000),v=new DataView(m.buffer),width=opcode-42;
 const code=[opcode,0xfe];if(width>1)code.push(0xff);if(width===3)code.push(0x7f);code.push(18,0x80);m.set(code,0x40100);
 m[0x50280]=value;v.setUint16(g+0xc58,123,true);v.setUint16(g+0xc5c,456,true);const before=m.slice(),next=step(m,ss,r);
 assert.deepEqual(m,before);assert.equal(next.memory[0x50280],value===0?255:0);
 assert.equal(next.registers.si,value===0?(0x101+width-2)&65535:0x101+width+2);
 assert.equal(next.registers.dx,65535);assert.equal(next.registers.cx,9);
 const out=new DataView(next.memory.buffer);assert.equal(out.getUint16(g+0xc58,true),456);assert.equal(out.getUint16(g+0xc5c,true),123);
}
const bad=new Uint8Array(0x100000);bad.set([43,0,255],0x40100);const before=bad.slice();assert.throws(()=>step(bad,ss,r),/not reconstructed/);assert.deepEqual(bad,before);
console.log('Decrement typed zero/fallthrough, branch widths, ignored third delta byte, buffer swaps and atomic rejection passed');
