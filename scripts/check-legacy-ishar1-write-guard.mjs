import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deriveIshar1SaveLayout} from '../src/lib/ishar/ishar1-save-layout.ts';
import {ISHAR1_SAVE,ISHAR2_SAVE} from '../src/lib/ishar/save-maps.ts';
import {patchParty,writeField} from '../src/lib/ishar/save-codec.ts';
const bytes=new Uint8Array(5216),before=bytes.slice();
assert.throws(()=>patchParty(bytes,ISHAR1_SAVE,'be',[]),/Kandidatenlayout/);
assert.throws(()=>writeField(bytes,ISHAR1_SAVE,'hp',0,50,'be'),/Kandidatenlayout/);
assert.deepEqual(bytes,before);
assert.deepEqual(patchParty(new Uint8Array(8359),ISHAR2_SAVE,'be',[]).bytes,new Uint8Array(8359));
if(process.env.ISHAR1_DIR){
 const layout=await deriveIshar1SaveLayout(new Uint8Array(readFileSync(process.env.ISHAR1_DIR+'/MAIN.IO')));
 const vitality=layout.fields.find(field=>field.memoryAddress===0x1542);
 assert.equal(vitality.fileOffset,468);assert.notEqual(ISHAR1_SAVE.fields.hp.offset,vitality.fileOffset);
}
console.log('Legacy Ishar1 save patch rejected atomically; Ishar2 path retained. Optional local MAIN vitality mapping checked.');
