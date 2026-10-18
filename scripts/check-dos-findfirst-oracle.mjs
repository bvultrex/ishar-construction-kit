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
const result={schema:'dos-findfirst-oracle-report-v1',reference:'local DOSBox installation; owned COM and owned fixture files only',runtime,cases:rows,limits:'Observed emulator behavior, not universal DOS semantics or proof of the Ishar active DTA. Enumeration order and opaque21-byte search state remain unmodeled.'};
assert.throws(()=>readDosFindFirstDta(new Uint8Array(42)),/43-byte/);assert.throws(()=>writeDosFindFirstDta(new Uint8Array(43),{name:new Uint8Array(13).fill(65)}),/filename/);assert.throws(()=>writeDosFindFirstDta(new Uint8Array(43),{size:-1}),/size/);
const opaque=Uint8Array.from({length:43},(_,i)=>(i*37+11)&255);assert.equal(readDosFindFirstDta(opaque).nameTerminated,false);assert.deepEqual(writeDosFindFirstDta(opaque),opaque);const renamed=writeDosFindFirstDta(opaque,{name:new Uint8Array([65,46,65,79])});assert.deepEqual(renamed.slice(0,30),opaque.slice(0,30));assert.deepEqual(Array.from(readDosFindFirstDta(renamed).name),[65,46,65,79]);
if(process.argv[3])writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
