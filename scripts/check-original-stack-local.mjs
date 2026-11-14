import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {join,resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {dosAlisIntegerOperandEnd} from '../src/lib/ishar/original-alis-operand-layout.ts';
import {deriveIshar2SaveLayout,patchIshar2SavedMain} from '../src/lib/ishar/ishar2-save-layout.ts';
import {takeOriginalStackItem,receiveOriginalStackItem} from '../src/lib/ishar/original-stack-runtime.ts';
const root=resolve(process.env.ISHAR2_DIR??'');assert.ok(process.env.ISHAR2_DIR,'ISHAR2_DIR required');
const raw=new Uint8Array(readFileSync(join(root,'FRISE.IO'))),hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(hash(raw),'27117c124caf904a31568f5c58f615946083dd3429c02ade1dc1e17552cc2b64');
const image=readAlisModule(raw).image;
assert.equal(image[0x2cbb],31);assert.equal(dosAlisIntegerOperandEnd(image,0x2cbc),0x2d4f,'long click-region expression is one complete operand');
// Encode the two full-stack assignments from the independently stated contract.
const heldIndex=[0x20,0x16,0x2d,0x56,0,59],sourceIndex=[0x12,0x5e,0x40,...heldIndex];
const heldStore=[0x38,...heldIndex,0x3a,0x26,0xbc,0x4b],sourceStore=[0x38,...sourceIndex,0x3a,0x26,0xd4,0x4b];
const whole=[30,0x38,...sourceIndex,0x26,0xd4,0x4b,0x3a,...heldStore];
assert.deepEqual([...image.slice(0x2d53,0x2d53+whole.length)],whole);
const clear=[30,0,0,...sourceStore];assert.deepEqual([...image.slice(0x2d6d,0x2d6d+clear.length)],clear);
const single=[30,0,1,...heldStore];assert.deepEqual([...image.slice(0x2d82,0x2d82+single.length)],single);
const decrement=[33,0,1,...sourceStore];assert.deepEqual([...image.slice(0x2d90,0x2d90+decrement.length)],decrement);
const layout=await deriveIshar2SaveLayout(new Uint8Array(readFileSync(join(root,'IO.IO'))));assert.equal(layout.fields.find(f=>f.memoryAddress===0x4bd4).fileOffset,7629);
const original=new Uint8Array(readFileSync(join(root,'START.SAV'))),input=patchIshar2SavedMain(original,layout,[
 {address:0x2d8e,width:2,value:-50},{address:0x4bd4+9,width:1,value:6},
 {address:0x2d8e+30+18,width:2,value:-50},{address:0x4bd4+20+9,width:1,value:8},
]);
const picked=takeOriginalStackItem(input,0,0),partial=receiveOriginalStackItem(picked.bytes,-50,picked.quantity,1);assert.equal(partial.remaining,4);
const received=receiveOriginalStackItem(partial.bytes,-50,partial.remaining,2);assert.equal(received.remaining,0);
const expected=patchIshar2SavedMain(input,layout,[{address:0x2d8e,width:2,value:0},{address:0x4bd4+9,width:1,value:0},{address:0x4bd4+20+9,width:1,value:10},{address:0x2d8e+60,width:2,value:-50},{address:0x4bd4+40+9,width:1,value:4}]);
assert.deepEqual(received.bytes,expected);assert.deepEqual(new Uint8Array(readFileSync(join(root,'START.SAV'))),original);
const out=resolve(process.env.ISHAR_PRIVATE_OUTPUT??'../analysis-output');for(const forbidden of [root,resolve('.')]){const rel=relative(forbidden,out);assert.ok(rel&& (rel.startsWith('..')||isAbsolute(rel)),'Private output must be outside repository/originals');}
const dir=mkdtempSync(join(out,'stack-transfer-'));writeFileSync(join(dir,'INPUT.SAV'),input,{flag:'wx'});writeFileSync(join(dir,'EXPECTED.SAV'),expected,{flag:'wx'});writeFileSync(join(dir,'report.json'),JSON.stringify({sourceSha256:hash(original),inputSha256:hash(input),expectedSha256:hash(expected),controlledInput:true,remainingAfterFirstRecipient:4,limits:'Complete pickup assignment bytes and IO mapping verified; controlled host quantity conservation/readback. Browser and native execution remain separate.'},null,2));
console.log('Full/single pickup assignments and long-expression boundary verified against FRISE; partial receipt matches original IO writer. Private case: '+dir);
