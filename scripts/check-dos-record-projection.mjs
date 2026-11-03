import assert from 'node:assert/strict';
import {projectOriginalDosRecord as project} from '../src/lib/ishar/original-dos-record-projection.ts';
const ss=0x1c0b,g=ss*16,m=new Uint8Array(0x100000),v=new DataView(m.buffer),w=(at,value)=>v.setUint16(at,value,true);
w(g+0xbf6,0x200);w(0x71002,0x100);w(0x71012,0x100);w(0x71014,0x6000);w(0x71016,100);w(0x71018,20);w(0x7101a,5);m[0x50324]=1;m[0x5031c]=1;m[0x5031d]=255;w(0x5030a,17);w(0x5030c,23);w(0x60100,0x700);m[0x60800]=1;w(0x60802,20);w(0x60804,10);
const before=m.slice(),next=project(m,ss,0x7000,0x5000,0x1000),out=new DataView(next.memory.buffer);assert.deepEqual(m,before);assert.equal(out.getUint16(g+0xc62,true),57);assert.equal(out.getUint16(g+0xc64,true),25);assert.equal(out.getUint16(g+0xc66,true),20);assert.deepEqual(next.resource,{segment:0x6080,offset:0});
m[0x5031d]=1;w(0x71016,32767);w(0x71018,1);w(0x7101a,1);const fault=m.slice();assert.throws(()=>project(m,ss,0x7000,0x5000,0x1000),/INT0/);assert.deepEqual(m,fault);
console.log('Projection coordinate transform, scale/bounds, resolved resource and atomic signed-divide fault passed');
