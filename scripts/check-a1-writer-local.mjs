import assert from 'node:assert/strict';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {readAlisModule,writeAlisModule} from '../src/lib/ishar/alis-module.ts';
import {sha256} from '../src/lib/ishar/cont-patch.ts';
import {separateAnalysisOutput} from './inventory-originals.mjs';
const roots=[process.env.ISHAR1_DIR,process.env.ISHAR2_DIR],requested=process.argv[2];
if(roots.some(root=>!root)||!requested)throw Error('ISHAR1_DIR, ISHAR2_DIR and separate new output directory required');
const output=await separateAnalysisOutput(roots,requested);
await mkdir(dirname(output),{recursive:true});await mkdir(output);
for(const [index,game] of ['ishar1','ishar2'].entries()){
 const root=roots[index],target=join(output,game),modules=[];await mkdir(target);
 for(const name of (await readdir(root)).filter(name=>/\.IO$/i.test(name)).sort()){
  const source=new Uint8Array(await readFile(join(root,name))),before=source.slice(),module=readAlisModule(source);
  assert.deepEqual(writeAlisModule(module),source,'no-op must preserve compressed bytes');
  const edited=module.image.slice();edited[edited.length-1]^=1;
  const encoded=writeAlisModule(module,edited),readback=readAlisModule(encoded);
  assert.deepEqual(readback.image,edited,name+': modified image readback');
  assert.equal(readback.encoding,module.encoding,'pack mode preserved');
  assert.deepEqual(encoded.subarray(4,module.envelopeBytes),source.subarray(4,module.envelopeBytes),'VM specs/check preserved');
  assert.deepEqual(source,before,'original buffer untouched');
  assert.deepEqual(encoded,writeAlisModule(module,edited),'deterministic writer');
  await writeFile(join(target,name),encoded,{flag:'wx'});
  modules.push({name,originalSha256:await sha256(source),sourceBytes:encoded.length,sourceSha256:await sha256(encoded),imageBytes:edited.length,imageSha256:await sha256(edited),encoding:readback.encoding,noOpRoundtrip:true});
 }
 await writeFile(join(output,game+'-alis-modules.json'),JSON.stringify({game,claim:'one-byte image modification for codec testing only; not tested in original execution',modules},null,2)+'\n',{flag:'wx'});
 console.log(`${game}: ${modules.length} one-byte image edits encoded/read back; private outputs in ${target}`);
}
