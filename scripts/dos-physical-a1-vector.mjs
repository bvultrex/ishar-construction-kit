import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {decodeOriginalDosPhysicalA1} from '../src/lib/ishar/original-dos-physical-a1.ts';
let text='';for await(const chunk of process.stdin)text+=chunk;
const q=JSON.parse(text),source=new Uint8Array(Buffer.from(q.memory,'base64')),packed=Buffer.from(q.packed,'base64');let position=6;
const before=source.slice(),lengths=[];
const result=decodeOriginalDosPhysicalA1(source,q.ss,q.registers,request=>{
 const data=new Uint8Array(packed.subarray(position,position+request.cx));position+=data.length;
 lengths.push(data.length);
 return {ax:data.length,carry:false,data};
});
assert.deepEqual(source,before);assert.deepEqual(lengths,[8000,6414]);
assert.equal(result.outputWrites,40638);assert.equal(result.entry,0x795c);
result.memory.fill(0,0x1c0b0+0x780,0x1c0b0+0x7e6);
console.log(JSON.stringify({registers:result.registers,events:result.events,hash:createHash('sha256').update(result.memory).digest('hex'),reads:result.reads,outputWrites:result.outputWrites,endSegment:result.endSegment,endOffset:result.endOffset}));
