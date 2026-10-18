import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {originalActorAiGate} from '../src/lib/ishar/original-actor-ai.ts';
import {savedMainMemory} from '../src/lib/ishar/original-actor-frame.ts';
const id=53,main=new Map();
const byte=(at,v)=>main.set(at,v&255),word=(at,v)=>{byte(at,v>>8);byte(at+1,v);};
byte(0x449a+id,3);byte(0x4ef2,3);word(0x36ac+id*2,40);
for(const at of [0x3946,0x3a24,0x3b02])word(at+id*2,0);
byte(0x43ba+id,0);byte(0x3cbe+id,11);byte(0x2d18,1);
byte(0x2ab4,45);byte(0x2ab5,47);word(0x3412+id*2,45);word(0x34f0+id*2,46);
assert.equal(originalActorAiGate(main,id,false).branch,'near');
assert.equal(originalActorAiGate(main,id,true).reason,'Gruppe bewegt sich');
byte(0x449a+id,4);assert.equal(originalActorAiGate(main,id,false).reason,'Anderes Gebiet');byte(0x449a+id,3);
word(0x36ac+id*2,0);assert.equal(originalActorAiGate(main,id,false).reason,'Keine Lebenspunkte');
word(0x36ac+id*2,-1);assert.equal(originalActorAiGate(main,id,false).branch,'near','native HP branch tests nonzero');
for(const at of [0x3946,0x3a24]){word(at+id*2,1);assert.equal(originalActorAiGate(main,id,false).branch,'blocked');word(at+id*2,0);}
word(0x3b02+id*2,1);assert.equal(originalActorAiGate(main,id,false).branch,'special');word(0x3b02+id*2,0);
byte(0x43ba+id,-1);byte(0x3cbe+id,9);assert.equal(originalActorAiGate(main,id,false).reason,'Sonderroutine 0x00e6d');byte(0x43ba+id,0);
word(0x3412+id*2,44);assert.equal(originalActorAiGate(main,id,false).branch,'outside','diagonal does not use near-axis branch');
word(0x3412+id*2,45);byte(0x2d18,2);assert.equal(originalActorAiGate(main,id,false).branch,'outside','other maps require same cell for this branch');
assert.throws(()=>originalActorAiGate(new Map(),id,false),/Missing MAIN/);
assert.throws(()=>originalActorAiGate(main,49,false),/Invalid original actor/);
if(process.env.ISHAR_ACTOR_LISTINGS&&process.env.ISHAR2_DIR){
 const bytes=new Uint8Array(readFileSync(join(process.env.ISHAR2_DIR,'START.SAV'))),before=bytes.slice();
 const loader=readFileSync(join(process.env.ISHAR_ACTOR_LISTINGS,'IO.IO.asm'),'utf8'),memory=savedMainMemory(loader,bytes);
 for(let actor=50;actor<110;actor++)assert.ok(originalActorAiGate(memory,actor,false).reason);
 assert.deepEqual(bytes,before);
 console.log('All 60 original save actor gates decoded without mutation.');
}
console.log('Original EATT entry gates, status order, special cases, axis/range and missing-state rejection passed.');
