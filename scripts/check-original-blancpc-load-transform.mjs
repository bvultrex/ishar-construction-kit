import assert from 'node:assert/strict';
import {transformOriginalBlancpcLoadWindow as transform} from '../src/lib/ishar/original-blancpc-load-transform.ts';
for(let value=0;value<256;value++){
 const source=Buffer.alloc(2560,value),before=Buffer.from(source),result=transform(source);
 assert.deepEqual(Buffer.from(result.subarray(0,116)),source.subarray(0,116));
 const sub=(value+224)%256,signed=sub<128?sub:sub-256,expected=value===0?0:Math.floor(signed/4)+32;
 assert.ok(result.subarray(116).every(b=>b===expected));assert.deepEqual(source,before);
}
for(const size of [0,2046,2559,2561])assert.throws(()=>transform(new Uint8Array(size)),/explicit/);
if(process.env.ISHAR_DOS_CAPTURE_ROOT){
 const {readFileSync}=await import('node:fs');const {createHash}=await import('node:crypto');
 for(const profile of ['ishar1','ishar2']){
  const bytes=readFileSync(`${process.env.ISHAR_DOS_CAPTURE_ROOT}/dos-first-interrupt-${profile}-2026-10-17/memory.bin`);
  assert.equal(createHash('sha256').update(bytes.subarray(0x106b2,0x1072d)).digest('hex'),'d031882b006baf6b472f7ad030b92ff9651f73c6ba0155e4db34e4d233b960db');
  assert.equal(bytes.subarray(0x106a7,0x106b2).toString('ascii'),'blancpc.io\0');
 }
 console.log('Both captured native loader blocks and BLANCPC filename binding verified.');
}
console.log('Native BLANCPC loader transform: all 256 byte values, unchanged prefix, signed shifts, zero sentinel, source isolation and full-window guard passed.');
