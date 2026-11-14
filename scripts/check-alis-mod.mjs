import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {packSilmA1} from '../src/lib/ishar/silm-write.ts';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {exportAlisMod} from './alis-mod.mjs';
const base=await mkdtemp(join(tmpdir(),'ishar-alis-mod-'));
for(const game of ['ishar1','ishar2'])for(const encoding of ['raw','a1']){
 const name=game+'-'+encoding,root=join(base,name),out=join(base,name+'-copy');await mkdir(root);
 const image=new Uint8Array(32),v=new DataView(image.buffer);v.setUint16(0,4,true);v.setUint16(2,22,true);v.setUint32(14,26,true);image[31]=55;
 let bytes;
 if(encoding==='a1')bytes=packSilmA1(image);
 else {bytes=new Uint8Array(38);new DataView(bytes.buffer).setUint32(0,38,true);bytes[4]=4;bytes.set(image,6);}
 await writeFile(join(root,'TEST.IO'),bytes);await mkdir(join(root,'data'));await writeFile(join(root,'data','UNKNOWN.DAT'),new Uint8Array([2,4,9]));
 const changed=image.slice();changed[31]=99;
 await assert.rejects(exportAlisMod(root,game,'../TEST.IO',changed,join(base,name+'-bad-path')),/basename/);
 await assert.rejects(exportAlisMod(root,game,'TEST.IO',changed,join(root,'bad')),/separate/);await assert.rejects(access(join(root,'bad')));
 const invalid=join(base,name+'-invalid');await assert.rejects(exportAlisMod(root,game,'TEST.IO',changed.slice(0,24),invalid),/resizing/);await assert.rejects(access(invalid));
 const report=await exportAlisMod(root,game,'test.io',changed,out);
 assert.equal(report.verification,'prepared-not-tested-in-original');assert.equal(report.game,game);assert.deepEqual(report.changedImageOffsets,[31]);assert.deepEqual(report.changedFiles,['TEST.IO']);
 assert.deepEqual(readAlisModule(new Uint8Array(await readFile(join(out,'TEST.IO')))).image,changed);
 assert.deepEqual(new Uint8Array(await readFile(join(root,'TEST.IO'))),bytes);
 assert.deepEqual(await readFile(join(out,'data','UNKNOWN.DAT')),await readFile(join(root,'data','UNKNOWN.DAT')));
 assert.equal(JSON.parse(await readFile(join(out,'ishar-ck-mod-manifest.json'),'utf8')).targetSha256,report.targetSha256);
 await assert.rejects(exportAlisMod(root,game,'TEST.IO',changed,out),/already exists/);
 await assert.rejects(exportAlisMod(out,game,'TEST.IO',changed,join(base,name+'-nested')),/manifest/);
 const noop=join(base,name+'-noop');await exportAlisMod(root,game,'TEST.IO',image,noop);assert.deepEqual(new Uint8Array(await readFile(join(noop,'TEST.IO'))),bytes);
}
console.log('Both declared games and raw/A1 encodings: separate clone, exact module readback, unknown files, immutable originals, no-op preservation, malformed-image/path and overwrite guards passed.');
