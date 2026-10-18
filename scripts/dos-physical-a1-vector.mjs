import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {decodeOriginalDosPhysicalA1} from '../src/lib/ishar/original-dos-physical-a1.ts';
import {closeOriginalDosDecodedModule} from '../src/lib/ishar/original-dos-module-close.ts';
import {prepareOriginalDosPhysicalModuleRegistration} from '../src/lib/ishar/original-dos-physical-module-register.ts';
import {returnOriginalDosEmptyModule} from '../src/lib/ishar/original-dos-empty-module-return.ts';
import {loadOriginalDosCompressedModule} from '../src/lib/ishar/original-dos-compressed-module-load.ts';
let text='';for await(const chunk of process.stdin)text+=chunk;
const q=JSON.parse(text),source=new Uint8Array(Buffer.from(q.memory,'base64')),packed=Buffer.from(q.packed,'base64');let position=6;
if(q.openPhase){
 const before=source.slice(),loaded=loadOriginalDosCompressedModule(source,q.ss,q.registers,new Uint8Array(packed.subarray(0,6)),42,r=>{
  if(r.operation==='close')return {ax:0,carry:false};
  assert.equal(r.operation,'read');const data=new Uint8Array(packed.subarray(position,position+r.cx));position+=data.length;return {ax:data.length,carry:false,data};
 });
 assert.deepEqual(source,before);loaded.memory.fill(0,0x1c0b0+0x780,0x1c0b0+0x7e6);
 console.log(JSON.stringify({registers:loaded.registers,events:loaded.events,hash:createHash('sha256').update(loaded.memory).digest('hex'),reads:loaded.reads,outputWrites:loaded.outputWrites,endSegment:loaded.endSegment,endOffset:loaded.endOffset}));
 process.exit(0);
}
const before=source.slice(),lengths=[];
const result=decodeOriginalDosPhysicalA1(source,q.ss,q.registers,request=>{
 const data=new Uint8Array(packed.subarray(position,position+request.cx));position+=data.length;
 lengths.push(data.length);
 return {ax:data.length,carry:false,data};
});
assert.deepEqual(source,before);assert.deepEqual(lengths,[8000,6414]);
assert.equal(result.outputWrites,40638);assert.equal(result.entry,0x795c);
const tail=q.closePhase?closeOriginalDosDecodedModule(result.memory,q.ss,result.registers,request=>{assert.equal(request.operation,'close');return {ax:0,carry:false};}):result;
const registry=q.registerPhase?prepareOriginalDosPhysicalModuleRegistration(tail.memory,q.ss,tail.registers):tail;
const final=q.returnPhase?returnOriginalDosEmptyModule(registry.memory,q.ss,tail.registers):registry;
final.memory.fill(0,0x1c0b0+0x780,0x1c0b0+0x7e6);
console.log(JSON.stringify({registers:final.registers,events:q.closePhase?[...result.events,...tail.events]:result.events,hash:createHash('sha256').update(final.memory).digest('hex'),reads:result.reads,outputWrites:result.outputWrites,endSegment:result.endSegment,endOffset:result.endOffset}));
