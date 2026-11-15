import assert from 'node:assert/strict';
import {prepareOriginalDosResourceGraphics as convert} from '../src/lib/ishar/original-dos-resource-graphics.ts';
const memory=new Uint8Array(0x100000),view=new DataView(memory.buffer);
view.setUint16(0x4000e,0x1000,true); // Resource header at41000.
for(const count of [0,0x8001,0xffff]){
 view.setUint16(0x41004,count,true);
 const before=memory.slice(),result=convert(memory,0x1c0b,0x1000,0x4000,0);
 assert.equal(result.assets,0);assert.equal(result.groups,0);
 assert.deepEqual(memory,before);assert.equal(new DataView(result.memory.buffer).getUint16(0x1c0b0+0xb16,true),(count-1)&65535);
}
view.setUint16(0x41004,1,true);memory[0x1c0b0+0x2896]=1;
const before=memory.slice();assert.throws(()=>convert(memory,0x1c0b,0x1000,0x4000,0),/Alternate/);assert.deepEqual(memory,before);
assert.throws(()=>convert(new Uint8Array(2),0,0,0,0),/1MiB/);
assert.throws(()=>convert(memory,0,0,0x4000,0xfff1),/outside/);
console.log('Graphics empty/signed counts, unsupported mode, bounds and source preservation passed');
