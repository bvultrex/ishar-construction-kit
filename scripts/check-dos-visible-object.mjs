import assert from 'node:assert/strict';
import {prepareOriginalDosVisibleObject as prepare} from '../src/lib/ishar/original-dos-visible-object.ts';
const ss=0x1c0b,g=ss*16,r={ds:0x4000,es:0x5000,si:0x100,bp:0x200,dx:12,cx:0x300},m=new Uint8Array(0x100000),v=new DataView(m.buffer),w=(at,value)=>v.setUint16(at,value,true);
w(g+0xbea,0x7000);w(g+0xb18,0x300);w(0x70306,0x1000);w(0x71006,0x1200);m[0x71200]=255;w(0x7121e,17);
const before=m.slice(),ordinary=prepare(m,ss,r,0x800);assert.deepEqual(m,before);assert.equal(ordinary.di,0x1200);assert.equal(ordinary.visited,2);assert.equal(ordinary.phase,'new-record');assert.equal(new DataView(ordinary.memory.buffer).getUint16(g+0xb22,true),17);
m[0x50800]=128;w(0x50816,100);w(0x5082a,65535);const dirty=prepare(m,ss,r,0x800);assert.equal(dirty.phase,'changed-record');assert.equal(dirty.marked,1);assert.equal(new DataView(dirty.memory.buffer).getUint16(0x50816,true),99);assert.equal(dirty.memory[0x50800],0);
m[0x50800]=0;m[0x50801]=16;assert.equal(prepare(m,ss,r,0x800).phase,'clip');m[0x50801]=0;w(0x71006,0x1000);const cycle=m.slice();assert.throws(()=>prepare(m,ss,r,0x800),/cycle/);assert.deepEqual(m,cycle);
console.log('Visible object dirty deltas, zero-record skip, state dispatch, clip boundary and atomic cycle rejection passed');
