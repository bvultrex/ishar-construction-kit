import assert from 'node:assert/strict';
import {stepOriginalDosPhysicalScript as step} from '../src/lib/ishar/original-dos-physical-script.ts';
const ss=0x1c0b,g=ss*16,r={ds:0x4000,es:ss,si:0x100,bp:0x200,dx:12,cx:34};
for(const opcode of [186,191]){
 const m=new Uint8Array(0x100000),v=new DataView(m.buffer),first=opcode===186?0xba8:0xc02,second=opcode===186?0xba0:0xc04,third=opcode===186?0xba2:0xc06,last=opcode===186?0xba6:0xc0e;
 const offset=at=>[(at-0x200)&255,(at-0x200)>>>8],code=[opcode,2,255,127,8,...offset(first),8,...offset(second),6,...offset(third)];
 if(opcode===186){v.setUint16(g+0xba4,0xa5a5,true);code.push(8,...offset(0xba4));}
 else v.setUint16(g+0xc0e,0xa5a5,true);
 m.set(code,0x40100);const before=m.slice(),next=step(m,ss,r),out=new DataView(next.memory.buffer);
 assert.deepEqual(m,before);assert.equal(out.getUint16(g+first,true),32767);assert.equal(out.getUint16(g+second,true),32767);assert.equal(next.registers.cx,opcode===186?65535:32767);
 if(opcode===186){assert.equal(out.getUint16(g+last,true),0xa5ff);assert.equal(next.registers.dx,0xa5ff);}else{assert.equal(out.getUint16(g+third,true),32767);assert.equal(out.getUint16(g+last,true),0xa5ff);assert.equal(next.registers.dx,65535);}
 m[0x40104]=255;const bad=m.slice();assert.throws(()=>step(m,ss,r),/not reconstructed/);assert.deepEqual(m,bad);
}
console.log('Physical186/191 sequential aliased reads, word/byte preservation and atomic rejection passed');
