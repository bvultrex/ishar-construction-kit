import assert from 'node:assert/strict';
import {addOriginalGold,debitOriginalGold,originalNpcGoldTransfer} from '../src/lib/ishar/original-npc-gold.ts';
for(const balance of [0,1,17,999,1000,1001,1999,2000,999999])for(const amount of [0,1,17,999,1000,1001,1999]){
 const pair=n=>[Math.floor(n/1000),n%1000];
 assert.deepEqual(addOriginalGold(pair(balance),pair(amount)),pair(balance+amount));
 const back=debitOriginalGold(pair(balance),pair(amount));assert.equal(back.insufficient,balance<amount);assert.deepEqual(back.gold,pair(balance<amount?balance:balance-amount));
}
assert.deepEqual(addOriginalGold([32767,999],[0,1]),[-32768,0],'signed word carry wraps');
assert.deepEqual(addOriginalGold([0,32767],[0,1]),[0,-32768],'remainder wraps before normalization');
const id=53,main=new Map(),put=(at,n)=>{main.set(at,(n>>8)&255);main.set(at+1,n&255);};
put(0x2d68,2);put(0x2d80,0);put(0x378a+id*2,0);put(0x3868+id*2,999);
const before=new Map(main),trace=originalNpcGoldTransfer(main,0,id,[1,1]);assert.deepEqual(main,before);
assert.deepEqual(trace,{insufficient:false,operations:[{address:0x2d80,width:2,value:999},{address:0x2d68,width:2,value:0},{address:0x378a+id*2,width:2,value:2},{address:0x3868+id*2,width:2,value:0},{address:0x442a+id,width:1,value:1}]});
put(0x2d68,0);const failed=originalNpcGoldTransfer(main,0,id,[1,1]);assert.equal(failed.insufficient,true);assert.equal(failed.operations.length,5,'isolated original subroutine credits/acknowledges even if debit reports failure');
assert.deepEqual(originalNpcGoldTransfer(new Map(),0,id,[0,0]),{operations:[],insufficient:false});
assert.throws(()=>originalNpcGoldTransfer(new Map(),0,id,[0,1]),/MAIN/);assert.throws(()=>originalNpcGoldTransfer(main,5,id,[1,0]),/Invalid/);
console.log('Original FRISE gold: carry/borrow, exact multiples, insufficient balance, signed16 overflow, NPC write order/acknowledgement and immutable MAIN passed.');
// Reconstructed FRISE writes feed the reconstructed EATT acknowledgement path.
const {originalActorSignal}=await import('../src/lib/ishar/original-actor-signal.ts');
put(0x2d68,2);put(0x2d80,0);put(0x378a+id*2,0);put(0x3868+id*2,0);
main.set(0x43ba+id,1);main.set(0x48f4+id,1);main.set(0x442a+id,255);main.set(0x3fce+id,1);
const next=new Map(main);for(const op of originalNpcGoldTransfer(main,0,id,[1,0]).operations){next.set(op.address,op.width===2?(op.value>>8)&255:op.value&255);if(op.width===2)next.set(op.address+1,op.value&255);}
assert.deepEqual(originalActorSignal(next,id,new Map()),{outcome:'updated',operations:[{kind:'spawn',moduleId:18,parameterOffset:13,value:-1},{kind:'write',address:0x4964+id,width:1,value:1}]});
console.log('FRISE gold-to-EATT acknowledgement path passed as a reconstructed trace; not a native execution test.');
