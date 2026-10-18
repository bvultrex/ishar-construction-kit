import assert from 'node:assert/strict';
import {prepareOriginalDosMainScheduler as prepare} from '../src/lib/ishar/original-dos-main-scheduler.ts';
const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),global=0x1c0b0,context=0x30000;
v.setUint16(global+0xbd2,0x100,true);
// A raw null slot is not replaced with a fabricated root.
let before=memory.slice(),result=prepare(memory,0x1c0b,0x3000,0x4000);
assert.equal(result.bp,0);assert.equal(result.phase,'skip');assert.equal(result.stackDelta,0);assert.deepEqual(memory,before);
// The existing stored context is selected; its saved script pointer/segment win.
v.setUint16(context+0x100,0x280,true);memory[context+0x280-36]=2;memory[context+0x280-4]=255;memory[context+0x280-1]=1;
v.setUint16(context+0x280-8,24,true);v.setUint16(context+0x280-6,0x5000,true);
memory[context+0x280]=0x79;memory[context+0x286]=0x45;
before=memory.slice();result=prepare(memory,0x1c0b,0x3000,0x4000);
assert.equal(result.bp,0x280);assert.equal(result.si,24);assert.equal(result.ds,0x5000);assert.equal(result.bx,0);assert.equal(result.phase,'main');assert.equal(result.stackDelta,-2);
assert.equal(result.memory[context+0x280-4],1);assert.equal(result.memory[context+0x280-1],0);
const out=new DataView(result.memory.buffer);assert.equal(out.getUint16(global+0xbfa,true),0x79);assert.equal(out.getUint16(global+0xc00,true),0x45);
assert.equal(out.getUint16(global+0xc58,true),0x802);assert.equal(out.getUint16(global+0xc5a,true),0x902);assert.equal(out.getUint16(global+0xc5c,true),0xa02);assert.equal(out.getUint16(global+0xc80,true),0x1e7e);
assert.deepEqual(memory,before);
assert.doesNotThrow(()=>prepare(memory,0x3000,0x3000,0x4000));
assert.throws(()=>prepare(memory,0x1c0b,0xffff,0x4000),/bounded real-mode window/);
v.setUint16(global+0xbd2,0xffff,true);assert.throws(()=>prepare(memory,0x1c0b,0x3000,0x4000),/bounded real-mode window/);
console.log('MAIN scheduler stored root, raw null, snapshot, string buffers and guarded windows passed');
