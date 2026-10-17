import assert from 'node:assert/strict';
import {prepareReferenceSamplePlay as play} from '../src/lib/ishar/reference-sample-play.ts';
import {importReferenceDosSample} from '../src/lib/ishar/reference-dos-sample-import.ts';
const resource=new Uint8Array(20),view=new DataView(resource.buffer);resource[0]=1;resource[1]=12;view.setUint32(2,20,true);resource.set([1,2,3,0],16);
const command={priority:90,volume:127,loops:257,speed:0},before=resource.slice();
const result=play(resource,command,[-128,-128,-128,-128],127);
assert.deepEqual(result,{kind:'play',channel:0,priority:90,frequency:12000,volume:127,loops:1,played:0,length:4,samples:Uint8Array.of(1,2,3,0)});
result.samples[0]=99;assert.deepEqual(resource,before);
assert.equal(play(resource,{...command,speed:21},[-128,-128,-128],127).frequency,10000);
assert.deepEqual(play(resource,command,[100,100,100],127),{kind:'rejected-priority'});
assert.deepEqual(play(Uint8Array.of(4),command,[-128,-128,-128],127),{kind:'ignored-type',type:4});
assert.throws(()=>play(resource.slice(0,18),command,[-128,-128,-128],127),/length/);
if(process.env.ISHAR2_DIR){
 const {readFileSync}=await import('node:fs');const {readAlisModule}=await import('../src/lib/ishar/alis-module.ts');const {readAlisSoundDirectory}=await import('../src/lib/ishar/original-alis-sounds.ts');
 const raw=readFileSync(`${process.env.ISHAR2_DIR}/TROUBA3.IO`),module=readAlisModule(raw),entry=readAlisSoundDirectory(module.image)[0];
 const imported=importReferenceDosSample(module.image.subarray(entry.offset),raw[3],20);
 const plan=play(imported.bytes,{priority:90,volume:127,loops:1,speed:10},[-128,-128,-128,-128],127);
 assert.equal(plan.kind,'play');assert.equal(plan.frequency,10000);assert.equal(plan.length,imported.length);assert.deepEqual(plan.samples,imported.samples);
 console.log(`Original TROUBA3 resource 0: prepared ${plan.length} sample bytes at reference 10000 Hz; no audio output/native equivalence claimed.`);
}
console.log('Prepared sample play: header speed fallback, priority rejection, stored loop width, type filtering and copy isolation passed.');
