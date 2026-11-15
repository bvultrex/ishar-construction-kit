import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { extractAlisIndexedImages } from '../src/lib/ishar/alis-assets.ts';
import { unpackSilm } from '../src/lib/ishar/silm-pack.ts';

function bitmap(format) {
  const bytes = new Uint8Array(64);
  const view = new DataView(bytes.buffer);
  view.setUint32(14, 24, true);
  view.setUint32(24, 8, true);
  view.setUint16(28, 1, true);
  view.setUint32(32, 8, true);
  bytes[40] = format;
  view.setUint16(42, 1, true); // two pixels wide, one high
  bytes[47] = 10; // header metadata must not become the DOS colour key
  bytes.set([0, 10], 48);
  return extractAlisIndexedImages(bytes, 'fixture.IO', true).images[0];
}
assert.equal(bitmap(0x14).transparentIndex, 0);
assert.deepEqual([...bitmap(0x14).pixels], [0, 10]);
assert.equal(bitmap(0x16).transparentIndex, undefined, 'Opaque bitmaps retain index zero');
assert.equal(bitmap(0x1c).transparentIndex, undefined, 'Terrain retains index zero');
const path = process.env.ISHAR2_DIR && `${process.env.ISHAR2_DIR}/VDEC1.IO`;
if (path && existsSync(path)) {
  const images = extractAlisIndexedImages(unpackSilm(readFileSync(path)).data, 'VDEC1.IO', true).images;
  const sign = images.find(image => image.entryIndex === 9);
  assert.equal(sign.transparentIndex, 0);
  assert.equal(sign.pixels.filter(pixel => pixel === 0).length, 109);
  assert.ok(sign.pixels.some(pixel => pixel !== 0), 'Sign artwork remains visible');
}
console.log('DOS sprite transparency checks passed');
if(process.env.ISHAR2_DIR){
  const path=`${process.env.ISHAR2_DIR}/OBJET.IO`;
  if(existsSync(path)){
    const images=extractAlisIndexedImages(unpackSilm(readFileSync(path)).data,'OBJET.IO',true).images;
    for(const index of [115,116,117]){
      const image=images.find(i=>i.entryIndex===index);
      assert.notEqual(image.transparentIndex,undefined);
      assert.ok(image.pixels.some(p=>p===image.transparentIndex));
      assert.ok(image.pixels.some(p=>p!==image.transparentIndex));
    }
  }
}
