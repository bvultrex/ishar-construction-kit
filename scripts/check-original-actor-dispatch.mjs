import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readOriginalActorDispatch,actorScriptCandidates} from '../src/lib/ishar/original-actor-dispatch.ts';
const fixture=`  00629 aa cswitch2 odirb(0x16), {50:L_0063a, 51:L_00648, 52:L_00656}
  00664 aa cswitch2 (odirb(0x16) omaintc(0x3d2e)), {9:L_006e8, 10:L_006e8, 13:L_00986}
L_0063a:
  0063f aa clive 0x0023, ->sdirw(0x2c)
  00644 aa cjmp24 L_00660
L_00648:
  0064d aa clive 0x0088, ->sdirw(0x2c)
  00652 aa cjmp24 L_00660
L_00656:
  0065b aa clive 0x008b, ->sdirw(0x2c)
  00660 aa cjmp24 L_00986
L_006e8:
  006ed aa clive 0x0025, ->sdirw(0x2c)
  006f2 aa cjmp24 L_00986
L_00986:
`;
const parsed=readOriginalActorDispatch(fixture);
assert.deepEqual(actorScriptCandidates(parsed,{id:50,type:9}).scriptIds,[0x23]);
assert.deepEqual(actorScriptCandidates(parsed,{id:53,type:10}).scriptIds,[0x25]);
assert.deepEqual(actorScriptCandidates(parsed,{id:53,type:13}).scriptIds,[]);
assert.equal(actorScriptCandidates(parsed,{id:53,type:200}),null);
assert.throws(()=>readOriginalActorDispatch('unsupported'));
if(process.env.ISHAR_EAFF_LISTING){
 const original=readOriginalActorDispatch(readFileSync(process.env.ISHAR_EAFF_LISTING,'utf8'));
 assert.equal(original.types.length,58);
 assert.deepEqual(original.specialSlots.map(row=>row.scriptIds),[[0x23],[0x88],[0x8b]]);
 assert.deepEqual(actorScriptCandidates(original,{id:53,type:9}).scriptIds,[0x25]);
}
console.log('Original EAFF special slots, shared types, empty/unknown dispatch passed.');
