import assert from 'node:assert/strict';
import {readDosAlisSwitch,selectDosAlisSwitch,editDosAlisSwitchTarget} from '../src/lib/ishar/original-alis-switch.ts';
const bytes=new Uint8Array(80),v=new DataView(bytes.buffer);bytes[2]=0x2f;bytes[5]=2;v.setInt16(6,1,true);
for(let i=0;i<3;i++)v.setUint16(8+i*2,30-(10+i*2),true);
const dense=readDosAlisSwitch(bytes,2,5);assert.deepEqual(dense.cases,[{value:-1,target:30},{value:0,target:30},{value:1,target:30}]);assert.equal(dense.tableEnd,14);assert.equal(selectDosAlisSwitch(dense,0),30);assert.equal(selectDosAlisSwitch(dense,2),14);
const changed=editDosAlisSwitchTarget(bytes,2,5,0,40);assert.equal(selectDosAlisSwitch(readDosAlisSwitch(changed,2,5),0),40);assert.equal(bytes[10],18);assert.deepEqual(editDosAlisSwitchTarget(bytes,2,5,0,30),bytes);
assert.throws(()=>editDosAlisSwitchTarget(bytes,2,5,0,2),/cannot be encoded/);assert.throws(()=>editDosAlisSwitchTarget(bytes,2,5,99,40),/Unknown/);
bytes[20]=0x2e;bytes[24]=1;bytes[25]=255; // odd count end requires skipped padding byte
v.setInt16(26,-10,true);v.setUint16(28,10,true);v.setInt16(30,100,true);v.setUint16(32,12,true);
const sparse=readDosAlisSwitch(bytes,20,24);assert.deepEqual(sparse.cases,[{value:-10,target:40},{value:100,target:46}]);assert.equal(selectDosAlisSwitch(sparse,99),34);
assert.throws(()=>readDosAlisSwitch(bytes.subarray(0,33),20,24),/Truncated/);
v.setInt16(30,-10,true);assert.throws(()=>readDosAlisSwitch(bytes,20,24),/duplicate/);v.setInt16(30,100,true);
v.setUint16(32,65535,true);assert.throws(()=>readDosAlisSwitch(bytes,20,24),/outside/);
assert.throws(()=>selectDosAlisSwitch(dense,65535));assert.throws(()=>readDosAlisSwitch(bytes,0,3));
console.log('DOS switches: alignment/padding, signed sparse values, dense bias, relative targets, default path and malformed tables passed.');
if(process.env.ISHAR2_DIR&&process.env.ISHAR_ACTOR_LISTINGS){
 const {readFileSync}=await import('node:fs');const {readAlisModule}=await import('../src/lib/ishar/alis-module.ts');
 const image=readAlisModule(readFileSync(`${process.env.ISHAR2_DIR}/EAFF.IO`)).image,listing=readFileSync(`${process.env.ISHAR_ACTOR_LISTINGS}/EAFF.IO.asm`,'utf8');
 const ends=new Map([[0x60,4],[0x2ea,4],[0x37c,3],[0x465,3],[0x629,3],[0x664,8],[0x9e9,6],[0xa03,6],[0xa2d,6],[0xa67,6],[0xab1,6],[0xb2b,6]]);
 let tables=0,cases=0;
 for(const line of listing.split(/\r?\n/)){
  const m=line.match(/^\s*([\da-f]{5})\s+[\da-f]+\s+cswitch[12]\s+.*\{(.*)\}/);if(!m)continue;
  const at=parseInt(m[1],16),length=ends.get(at);assert.ok(length,'explicitly checked operand end');
  const table=readDosAlisSwitch(image,at,at+length),expected=[...m[2].matchAll(/(-?\d+):L_([\da-f]+)/g)].map(x=>({value:+x[1],target:parseInt(x[2],16)}));
  assert.deepEqual(table.cases,expected,`full table at ${m[1]}`);
  for(const entry of table.cases){
   const target=table.cases.at(-1).target,edited=editDosAlisSwitchTarget(image,at,at+length,entry.value,target);
   assert.equal(selectDosAlisSwitch(readDosAlisSwitch(edited,at,at+length),entry.value),target);
   assert.deepEqual(editDosAlisSwitchTarget(edited,at,at+length,entry.value,entry.target),image,'restoring target preserves every image byte');
  }
  for(let input=-32768;input<=32767;input++)assert.equal(selectDosAlisSwitch(table,input),expected.find(c=>c.value===input)?.target??table.tableEnd);
  tables++;cases+=table.cases.length;
 }
 assert.equal(tables,12);console.log(`Original EAFF: all ${tables} complete switch tables (${cases} cases) match listings; all 65536 inputs per table checked. Not native execution.`);
}
