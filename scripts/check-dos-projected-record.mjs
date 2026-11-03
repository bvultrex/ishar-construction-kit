import assert from 'node:assert/strict';
import {finishOriginalDosProjectedRecord as finish,retireOriginalDosProjectedRecord as retire} from '../src/lib/ishar/original-dos-projected-record.ts';
import {prepareOriginalDosObjectBatch as batch} from '../src/lib/ishar/original-dos-object-batch.ts';
const ss=0x1c0b,g=ss*16,r={ds:0x7000,es:0x5000,si:0x100,bp:0x200,dx:12,cx:0x300},m=new Uint8Array(0x100000),v=new DataView(m.buffer),w=(at,value)=>v.setUint16(at,value,true);
for(const [at,value] of [[0xc5e,0x100],[0xc60,0x6000],[0xc62,10],[0xc64,20],[0xc66,5],[0xc2c,32767],[0xc2e,32767],[0xc30,32768],[0xc32,32768],[0xbec,0x2000]])w(g+at,value);
w(0x60100,0x100);m[0x60200]=1;w(0x60202,4);w(0x60204,6);w(0x70306,0x1000);w(0x71006,0x1200);w(0x71210,5);m[0x71000]=255;
const before=m.slice(),fresh=finish(m,ss,r,0x300,0x1000),fv=new DataView(fresh.memory.buffer);assert.deepEqual(m,before);assert.equal(fv.getUint16(0x70306,true),0x1000);assert.equal(fv.getUint16(g+0xc2c,true),10);assert.equal(fv.getUint16(g+0xc30,true),14);assert.equal(fv.getUint16(g+0xc32,true),26);assert.equal(fresh.di,0x300);
m[0x71000]=2;const changed=finish(m,ss,r,0x300,0x1000),cv=new DataView(changed.memory.buffer);assert.equal(cv.getUint16(0x70306,true),0x1200);assert.equal(cv.getUint16(0x71206,true),0x1000);
w(0x71206,0x1200);const cycle=m.slice();assert.throws(()=>finish(m,ss,r,0x300,0x1000),/cycle/);assert.deepEqual(m,cycle);w(0x71206,0);const retired=retire(m,ss,r.ds,0x300,0x1000);assert.equal(new DataView(retired.memory.buffer).getUint16(g+0xbec,true),0x1000);
const scene=new Uint8Array(0x100000),sv=new DataView(scene.buffer),sw=(at,value)=>sv.setUint16(at,value,true);
sw(g+0xbf6,0x200);sw(g+0xbea,0x7000);sw(g+0xb18,0x200);sw(g+0xbec,0x2000);scene[0x5031d]=255;scene[0x50324]=1;sw(0x50302,0x200);sw(0x70206,0x1000);sw(0x60100,0x100);scene[0x60200]=1;sw(0x60202,4);sw(0x60204,6);
for(const [i,status] of [255,1].entries()){const at=0x71000+i*0x100;scene[at]=status;for(const [offset,value] of [[2,0x100],[6,i?0:0x1100],[8,0x100],[10,0x6000],[12,10],[14,10],[16,1],[18,0x100],[20,0x6000],[22,100],[24,20],[26,5]])sw(at+offset,value);}
const sceneBefore=scene.slice(),prepared=batch(scene,ss,{...r,ds:0x4000,cx:0x200},0x300);assert.deepEqual(scene,sceneBefore);assert.equal(prepared.phase,'pixels');assert.equal(prepared.projected,1);assert.equal(prepared.retired,1);assert.equal(prepared.entry,0x4168);
console.log('Projected bounds, original tie ordering, free list, atomic cycle rejection and mixed-status batch passed');
