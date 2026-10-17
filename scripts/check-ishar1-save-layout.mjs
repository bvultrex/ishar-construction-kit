import {readAlisModule,writeAlisModule} from '../src/lib/ishar/alis-module.ts';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {deriveIshar1SaveLayout,inspectIshar1Save} from '../src/lib/ishar/ishar1-save-layout.ts';
const root=process.env.ISHAR1_DIR;
if(!root)throw Error('ISHAR1_DIR required; original-layout verification must not silently skip');
const main=new Uint8Array(readFileSync(join(root,'MAIN.IO'))),layout=await deriveIshar1SaveLayout(main);
assert.equal(layout.fields.length,107);assert.equal(layout.fields.at(-1).fileOffset+layout.fields.at(-1).fileBytes,5216);
assert.deepEqual(layout.fields.slice(0,5).map(field=>field.memoryAddress),[0x421f,0x137c,0x137d,0x137e,0x1508]);
const nativeModule=readAlisModule(main),edit=nativeModule.image.slice();edit[25]^=1;
assert.deepEqual(writeAlisModule(nativeModule),main);
assert.deepEqual(readAlisModule(writeAlisModule(nativeModule,edit)).image,edit,'packed MAIN edit roundtrip');
const names=readdirSync(root).filter(name=>/\.SAV$/i.test(name));assert.ok(names.length);
for(const name of names){
 const bytes=new Uint8Array(readFileSync(join(root,name))),before=bytes.slice(),fields=inspectIshar1Save(bytes,layout),roundtrip=new Uint8Array(bytes.length),view=new DataView(roundtrip.buffer);
 for(const field of fields){if(field.storage==='be16')view.setUint16(field.fileOffset,field.value,false);else roundtrip.set(field.value,field.fileOffset);}
 assert.deepEqual(roundtrip,bytes,name+': decoded fields preserve every saved byte');assert.deepEqual(bytes,before);
}
await assert.rejects(deriveIshar1SaveLayout(new Uint8Array(100)),/Unverified/);
assert.throws(()=>inspectIshar1Save(new Uint8Array(5215),layout),/size/);
console.log(`Ishar-1 MAIN reader/writer agree: 107 fields, 5216 bytes; ${names.length} local saves inspected and byte-exactly reconstructed. Block semantics remain opaque.`);
