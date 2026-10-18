import assert from 'node:assert/strict';
import {prepareOriginalDosMainDecode} from '../src/lib/ishar/original-dos-main-decode.ts';
const globals=new Uint8Array(65536),v=new DataView(globals.buffer);v.setUint16(0x2480,21,true);v.setUint16(0x2482,0xa101,true);v.setUint16(0xbca,0x5000,true);v.setUint16(0xbc8,7,true);
const before=globals.slice(),packed=prepareOriginalDosMainDecode(globals);assert.equal(packed.entry,0x79e9);assert.equal(packed.memory[0xb57],0xa0);assert.deepEqual(packed.registers,{ax:1,cx:65535,dx:7,ds:0x5000});assert.equal(packed.stackDelta,-2);assert.deepEqual(globals,before);
v.setUint16(0x2482,0x0105,true);const alternate=prepareOriginalDosMainDecode(globals);assert.equal(alternate.entry,0x79a5);assert.equal(alternate.registers.ax,5);assert.equal(alternate.stackDelta,-6);assert.throws(()=>prepareOriginalDosMainDecode(new Uint8Array(65535)),/global segment/);
console.log('MAIN decoder caller: packed-bit removal, size underflow, actual branch/stack and immutable inputs passed.');
