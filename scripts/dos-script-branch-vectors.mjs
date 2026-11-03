import {createHash} from 'node:crypto';
import {branchOriginalDosScript} from '../src/lib/ishar/original-dos-script-branch.ts';
const cases=[];
for(let opcode=5;opcode<=10;opcode++)for(const value of ((opcode-5)%3===0?Array.from({length:256},(_,i)=>i):[0,1,127,128,255,32767,32768,65535]))for(const stack of [0,16]){
 const script=new Uint8Array(65536),context=new Uint8Array(65536).fill(0xa5);script[0x100]=opcode;script[0x101]=value&255;script[0x102]=value>>>8;new DataView(context.buffer).setUint16(0x1f6,stack,true);
 const {memory,...expected}=branchOriginalDosScript(script,context,opcode,0x101,0x200);
 cases.push({opcode,value,stack,expected:{...expected,memorySha256:createHash('sha256').update(memory).digest('hex')}});
}
console.log(JSON.stringify(cases));
