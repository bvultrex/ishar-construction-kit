import {createHash} from 'node:crypto';
import {openOriginalDosFile} from '../src/lib/ishar/original-dos-file-open.ts';
const cases=[];
const scenarios=[
 {find:[{ax:0,carry:false}],open:[{ax:5,carry:false}],create:{ax:6,carry:false},seek:{ax:12,dx:34,carry:false}},
 {find:[{ax:18,carry:true}],open:[{ax:5,carry:false}],create:{ax:6,carry:false},seek:{ax:12,dx:34,carry:false}},
 {find:[{ax:0,carry:false}],open:[{ax:2,carry:true},{ax:7,carry:false}],create:{ax:6,carry:false},seek:{ax:12,dx:34,carry:false}},
 {find:[{ax:18,carry:true}],open:[{ax:2,carry:true}],create:{ax:8,carry:true},seek:{ax:12,dx:34,carry:false}},
 {find:[{ax:0,carry:false}],open:[{ax:5,carry:false}],create:{ax:6,carry:false},seek:{ax:5,dx:99,carry:true}},
 {find:[{ax:18,carry:true},{ax:0,carry:false}],open:[{ax:5,carry:false}],create:{ax:6,carry:false},seek:{ax:12,dx:34,carry:false}},
 {find:[{ax:0x800,carry:false}],open:[{ax:5,carry:false}],create:{ax:6,carry:false},seek:{ax:12,dx:34,carry:false}},
];
for(const ax of [0,3,0x200,0x400,0x600,0x800,0xa00,0xc00,0xe00,0xf03])for(const flag of [0,1,2,255])for(const scenario of scenarios){
 const globals=new Uint8Array(65536).fill(0x5a);globals.set([flag,2,5],0x289b);const counts={};
 const input={ax,bx:0x1234,cx:0x2345,dx:0x100,ds:0x4000},next=openOriginalDosFile(globals,input,request=>{const op=request.operation,index=counts[op]??0;counts[op]=index+1;const values=scenario[op==='find-first'?'find':op];return Array.isArray(values)?values[Math.min(index,values.length-1)]:values;});
 const {memory,...expected}=next;cases.push({input,flag,scenario,expected:{...expected,globalsHash:createHash('sha256').update(memory.subarray(0,0x28c0)).digest('hex')}});
}
console.log(JSON.stringify(cases));
