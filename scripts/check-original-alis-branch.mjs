import assert from 'node:assert/strict';
import {readDosAlisBranch,originalAlisBranchTaken,editDosAlisBranchTarget} from '../src/lib/ishar/original-alis-branch.ts';
for(const base of [5,8,0x12,0x15,0x18,0x1b,0x30])for(let width=1;width<=3;width++){
 const bytes=new Uint8Array(400),offset=200;bytes[offset]=base+width-1;
 const branch=readDosAlisBranch(bytes,offset);assert.equal(branch.target,offset+1+width);
 const target=width===3?250:100,edited=editDosAlisBranchTarget(bytes,offset,target);assert.equal(readDosAlisBranch(edited,offset).target,target);assert.deepEqual(editDosAlisBranchTarget(edited,offset,branch.target),bytes);
 if(width===3)assert.throws(()=>editDosAlisBranchTarget(bytes,offset,100),/native verification/);
 for(const d6 of [-32768,0,32767])for(const d7 of [-32768,0,32767])assert.equal(originalAlisBranchTaken(branch,d6,d7),base===0x12?d7===0:base===0x15?d7!==0:base===0x18?d7!==d6:base===0x1b?d7===d6:true);
}
assert.throws(()=>readDosAlisBranch(Uint8Array.from([7,0,0]),0),/Truncated/);assert.throws(()=>readDosAlisBranch(Uint8Array.from([0]),0),/Unsupported/);
console.log('Direct ALIS branches: 21 opcode/width combinations, signed displacements, inverted beq/bne reference conditions, lossless edits and malformed input passed.');
