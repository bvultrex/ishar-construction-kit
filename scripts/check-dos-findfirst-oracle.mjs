import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {readDosFindFirstDta,writeDosFindFirstDta} from '../src/lib/ishar/dos-findfirst-dta.ts';
const root=resolve(process.argv[2]),manifest=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8')),hash=b=>createHash('sha256').update(b).digest('hex'),rows=[];
assert.equal(manifest.schema,'owned-dos-findfirst-probe-v1');
for(const entry of manifest.cases){
 const program=readFileSync(join(root,entry.program));assert.equal(hash(program),entry.sha256);
 const bytes=new Uint8Array(readFileSync(join(root,entry.output)));assert.equal(bytes.length,102);const v=new DataView(bytes.buffer),raw=bytes.slice(16,59),before=bytes.slice(59),dta=readDosFindFirstDta(raw),carry=!!(v.getUint16(6,true)&1),name=Buffer.from(dta.name).toString('ascii');
 assert.equal(v.getUint16(0,true),0x80);assert.equal(v.getUint16(2,true),v.getUint16(12,true));assert.equal(v.getUint16(12,true),v.getUint16(14,true));assert.equal(v.getUint16(8,true),0);
 assert.deepEqual(writeDosFindFirstDta(raw),raw);const edited=writeDosFindFirstDta(raw,{size:4294967295});assert.deepEqual(edited.slice(0,26),raw.slice(0,26));assert.deepEqual(edited.slice(30),raw.slice(30));assert.equal(readDosFindFirstDta(edited).size,4294967295);
 if(['EXIST.AO','exist.ao','*.AO','EXIST.*'].includes(entry.pattern)){assert.equal(carry,false);assert.equal(name,'EXIST.AO');assert.equal(dta.size,manifest.fixtureBytes);assert.equal(dta.attributes,32);}
 else if(entry.pattern==='*.*'){assert.equal(carry,false);assert.ok(dta.nameTerminated&&name.length>0);}
 else if(entry.pattern===''){assert.equal(carry,true);assert.equal(v.getUint16(4,true),2);assert.deepEqual(raw,before);}
 else{assert.equal(carry,true);assert.equal(v.getUint16(4,true),18);assert.notDeepEqual(raw.slice(0,21),before.slice(0,21));}
 rows.push({pattern:entry.pattern,carry,ax:v.getUint16(4,true),cx:v.getUint16(8,true),defaultDtaOffset:0x80,name,size:dta.size,attributes:dta.attributes,dtaChanged:hash(raw)!==hash(before),opaqueSearchStateChanged:hash(raw.slice(0,21))!==hash(before.slice(0,21)),dtaSha256:hash(raw),losslessRoundTrip:true});
}
const runtime=existsSync(join(root,'runtime.json'))?JSON.parse(readFileSync(join(root,'runtime.json'),'utf8').replace(/^\uFEFF/,'')):null;
const enumerations=[];
for(const entry of manifest.enumerationCases??[]){
 assert.equal(hash(readFileSync(join(root,entry.program))),entry.sha256);const bytes=new Uint8Array(readFileSync(join(root,entry.output)));assert.equal(bytes.length,408);const steps=[];
 for(let index=0;index<4;index++){
  const record=bytes.slice(index*102,(index+1)*102),v=new DataView(record.buffer),raw=record.slice(16,59),before=record.slice(59),dta=readDosFindFirstDta(raw),carry=!!(v.getUint16(6,true)&1);
  assert.equal(v.getUint16(0,true),entry.expectedDtaOffset);assert.equal(v.getUint16(2,true),v.getUint16(12,true));assert.equal(v.getUint16(12,true),v.getUint16(14,true));assert.equal(v.getUint16(8,true),0);assert.deepEqual(writeDosFindFirstDta(raw),raw);
  if(index===0&&entry.customDta)assert.deepEqual(before,new Uint8Array(43).fill(0xcc));
  if(index>0){const previous=index===2&&entry.rewindDta?0:index-1;assert.deepEqual(before,bytes.slice(previous*102+16,previous*102+59));}
  if(carry)assert.equal(v.getUint16(4,true),18);else{assert.equal(dta.attributes,32);assert.ok(dta.nameTerminated);}
  steps.push({operation:index===0?'find-first':'find-next',carry,ax:v.getUint16(4,true),cx:v.getUint16(8,true),name:carry?null:Buffer.from(dta.name).toString('ascii'),size:carry?null:dta.size,dtaChanged:hash(raw)!==hash(before),searchStateChanged:hash(raw.slice(0,21))!==hash(before.slice(0,21)),dtaSha256:hash(raw),losslessRoundTrip:true});
 }
 const successes=steps.filter(s=>!s.carry);
 if(entry.pattern==='*.TST'){
  for(const step of successes)assert.equal(step.size,{'A.TST':1,'B.TST':2,'C.TST':3}[step.name]);
  if(entry.rewindDta){assert.equal(steps[0].carry,false);assert.equal(steps[1].carry,false);assert.equal(steps[2].carry,false);if(steps[2].name===steps[1].name){assert.equal(steps[3].carry,false);assert.equal(new Set(successes.map(s=>s.name)).size,3);}else{assert.equal(steps[3].carry,true);assert.equal(new Set(successes.map(s=>s.name)).size,3);}}
  else{assert.deepEqual(successes.map(s=>s.name).sort(),['A.TST','B.TST','C.TST']);assert.equal(successes.length,3);assert.equal(steps[3].carry,true);}
 }
 else if(entry.pattern==='A.TST'){assert.equal(successes.length,1);assert.equal(steps[0].name,'A.TST');assert.equal(steps[0].size,1);}
 else assert.equal(successes.length,0);
 enumerations.push({pattern:entry.pattern,customDta:entry.customDta,dtaOffset:entry.expectedDtaOffset,rewindDta:!!entry.rewindDta,rewindReplaysSecond:entry.rewindDta?steps[2].name===steps[1].name:null,steps});
}
const result={schema:'dos-findfirst-oracle-report-v1',reference:'local DOSBox installation; owned COM and owned fixture files only',runtime,cases:rows,enumerations,limits:'Observed emulator behavior, not universal DOS semantics or proof of the Ishar active DTA. Enumeration order and opaque21-byte search state remain unmodeled.'};
assert.throws(()=>readDosFindFirstDta(new Uint8Array(42)),/43-byte/);assert.throws(()=>writeDosFindFirstDta(new Uint8Array(43),{name:new Uint8Array(13).fill(65)}),/filename/);assert.throws(()=>writeDosFindFirstDta(new Uint8Array(43),{size:-1}),/size/);
const opaque=Uint8Array.from({length:43},(_,i)=>(i*37+11)&255);assert.equal(readDosFindFirstDta(opaque).nameTerminated,false);assert.deepEqual(writeDosFindFirstDta(opaque),opaque);const renamed=writeDosFindFirstDta(opaque,{name:new Uint8Array([65,46,65,79])});assert.deepEqual(renamed.slice(0,30),opaque.slice(0,30));assert.deepEqual(Array.from(readDosFindFirstDta(renamed).name),[65,46,65,79]);
if(process.argv[3])writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
