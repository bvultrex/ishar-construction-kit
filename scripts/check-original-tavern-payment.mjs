import assert from 'node:assert/strict';
import {beginOriginalTavernMeal,finishOriginalTavernMeal,originalTavernMealPrice,payOriginalTavernMeal,ORIGINAL_TIME_OFFSETS as time} from '../src/lib/ishar/original-tavern.ts';
import {ORIGINAL_COMMERCE_OFFSETS as offsets} from '../src/lib/ishar/original-commerce.ts';

const make=(entries,hp=1)=>{const bytes=new Uint8Array(8359);bytes[1]=2;bytes.fill(255,offsets.classes,offsets.classes+5);const view=new DataView(bytes.buffer);for(const [c,t,e] of entries){bytes[offsets.classes+c]=c;view.setUint16(offsets.goldThousands+c*2,t,false);view.setUint16(offsets.goldRemainder+c*2,e,false);view.setInt16(offsets.hitPoints+c*2,hp,false);}return bytes;};
const gold=(bytes,c)=>{const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);return [view.getUint16(offsets.goldThousands+c*2,false),view.getUint16(offsets.goldRemainder+c*2,false)];};
const run=(entries,t,expected)=>{const source=make(entries),before=source.slice(),result=payOriginalTavernMeal(source,t);assert.equal(result.ok,true);assert.deepEqual(source,before);for(let c=0;c<5;c++)assert.deepEqual(gold(result.bytes,c),expected[c]??[0,0]);for(let i=0;i<source.length;i++)if(source[i]!==result.bytes[i])assert.ok((i>=offsets.goldThousands&&i<offsets.goldThousands+10)||(i>=offsets.goldRemainder&&i<offsets.goldRemainder+10),`foreign write ${i}`);return result;};

assert.deepEqual(Array.from({length:15},(_,t)=>originalTavernMealPrice(t)),[500,540,580,620,660,700,740,780,820,860,900,940,980,1020,1060]);
run([[0,1,0],[1,0,900],[2,2,500],[3,0,300]],2,[[0,855],[0,755],[2,355],[0,155]]);
run([[0,0,600],[2,1,0],[3,0,400]],2,[[0,406],[0,0],[0,807],[0,207]]);
run([[0,0,100],[1,0,800],[2,0,50],[3,1,0]],0,[[0,0],[0,575],[0,0],[0,875]]);
run([[0,3,100],[1,0,900]],14,[[2,570],[0,370]]);
const poor=make([[0,0,200],[1,0,300]]),poorBefore=poor.slice(),failed=payOriginalTavernMeal(poor,2);assert.deepEqual(failed,{ok:false,reason:'insufficient-gold',price:580});assert.deepEqual(poor,poorBefore);

let cases=0;
for(let seed=0;seed<500;seed++)for(let t=0;t<15;t++){
 const entries=[];for(let c=0;c<5;c++)if((seed+c*3)%7!==0){const value=(seed*811+c*379+t*43)%5000;entries.push([c,Math.trunc(value/1000),value%1000]);}
 const source=make(entries),price=originalTavernMealPrice(t),total=entries.reduce((sum,e)=>sum+e[1]*1000+e[2],0),result=payOriginalTavernMeal(source,t);
 assert.equal(result.ok,total>=price);
 if(result.ok){const after=entries.reduce((sum,[c])=>{const [thousands,remainder]=gold(result.bytes,c);return sum+thousands*1000+remainder;},0);assert.equal(total-after,price);assert.equal(result.paid.reduce((a,b)=>a+b,0),price);}
 cases++;
}
const wrapped=new Uint8Array(8373),sub=make([[0,1,0],[2,0,500]]);wrapped.set(sub,7);const outerBefore=wrapped.slice(),subResult=payOriginalTavernMeal(wrapped.subarray(7,8366),2);assert.equal(subResult.ok,true);assert.deepEqual(wrapped,outerBefore);
assert.throws(()=>payOriginalTavernMeal(sub,-1));assert.throws(()=>payOriginalTavernMeal(sub,15));const invalid=sub.slice();invalid[1]=1;assert.throws(()=>payOriginalTavernMeal(invalid,2));const abnormal=sub.slice();new DataView(abnormal.buffer).setUint16(offsets.goldRemainder,1000,false);assert.throws(()=>payOriginalTavernMeal(abnormal,2),/normalisiert/);
const timed=make([[0,1,0],[1,0,900]]),timedView=new DataView(timed.buffer);timedView.setUint16(time.hour,15,false);timedView.setUint16(time.day,2,false);timedView.setUint16(time.ticks,123,false);timedView.setInt16(offsets.hitPoints,1,false);timed[offsets.food]=60;
const begun=beginOriginalTavernMeal(timed,2);assert.equal(begun.ok,true);assert.deepEqual(gold(begun.bytes,0),[1,0]);assert.equal(new DataView(begun.bytes.buffer).getUint16(time.hour,false),16);assert.equal(new DataView(begun.bytes.buffer).getUint16(time.ticks,false),999);
const finished=finishOriginalTavernMeal(begun.bytes,2);assert.equal(finished.ok,true);const finishedView=new DataView(finished.bytes.buffer);assert.equal(finishedView.getUint16(time.hour,false),17);assert.equal(finishedView.getUint16(time.day,false),2);assert.equal(finishedView.getUint16(time.ticks,false),0);assert.equal(finished.bytes[offsets.food],100);assert.equal(gold(finished.bytes,0)[0]*1000+gold(finished.bytes,0)[1]+gold(finished.bytes,1)[1],1320);
const midnight=make([[0,2,0]]),midnightView=new DataView(midnight.buffer);midnightView.setUint16(time.hour,23,false);midnightView.setUint16(time.day,9,false);const midnightBegin=beginOriginalTavernMeal(midnight,0);assert.equal(midnightBegin.ok,true);const midnightEnd=finishOriginalTavernMeal(midnightBegin.bytes,0);assert.equal(midnightEnd.ok,true);assert.equal(new DataView(midnightEnd.bytes.buffer).getUint16(time.hour,false),1);assert.equal(new DataView(midnightEnd.bytes.buffer).getUint16(time.day,false),10);
console.log(`${cases} tavern payment cases plus five contract examples verify price, two-pass slot-order payment, insufficient funds, isolation and input immutability.`);
