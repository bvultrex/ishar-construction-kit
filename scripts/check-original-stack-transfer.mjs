import assert from 'node:assert/strict';
import {takeOriginalStackItem,receiveOriginalStackItem} from '../src/lib/ishar/original-stack-runtime.ts';
import {readOriginalCarrier,ORIGINAL_COMMERCE_OFFSETS as o} from '../src/lib/ishar/original-commerce.ts';
const base=Uint8Array.from({length:8359},(_,i)=>i*31&255),w=new DataView(base.buffer);w.setUint16(0,2);base.fill(1,o.classes,o.classes+5);base.fill(0,o.inventory,o.inventory+150);base.fill(0,o.stacks,o.stacks+100);for(let c=0;c<5;c++)w.setInt16(o.hitPoints+c*2,1);
let cases=0;
for(let id=-59;id<=-49;id++)for(let source=0;source<5;source++)for(const single of [false,true])for(const count of [1,3,id===-49?20:10])for(const existing of [0,8,id===-49?20:10]){
 const target=(source+1)%5,bytes=base.slice(),words=new DataView(bytes.buffer),limit=id===-49?20:10,index=id+59;
 words.setInt16(o.inventory+source*30,id);bytes[o.stacks+source*20+index]=count;
 if(existing){words.setInt16(o.inventory+target*30+18,id);bytes[o.stacks+target*20+index]=existing;}
 const before=bytes.slice(),picked=takeOriginalStackItem(bytes,source,0,single);assert.deepEqual(bytes,before);assert.equal(picked.quantity,single?1:count);
 assert.equal(readOriginalCarrier(picked.bytes,source).stacks[index],single?count-1:0);
 assert.equal(readOriginalCarrier(picked.bytes,source).slots[0],single&&count>1?id:0);
 const received=receiveOriginalStackItem(picked.bytes,id,picked.quantity,target);
 if(existing===limit){assert.equal(received,null);continue;}
 assert.ok(received);assert.equal(received.slot,existing?9:0);assert.equal(received.accepted,Math.min(picked.quantity,limit-existing));
 const total=readOriginalCarrier(received.bytes,source).stacks[index]+readOriginalCarrier(received.bytes,target).stacks[index]+received.remaining;assert.equal(total,count+existing,'quantity conserved including cursor remainder');
 const allowed=new Set([o.inventory+target*30+received.slot*2,o.inventory+target*30+received.slot*2+1,o.stacks+target*20+index]);
 for(let at=0;at<bytes.length;at++)if(!allowed.has(at))assert.equal(received.bytes[at],picked.bytes[at]);
 if(received.remaining){const final=receiveOriginalStackItem(received.bytes,id,received.remaining,(source+2)%5);assert.equal(final.remaining,0);}
 cases++;
}
const full=base.slice(),f=new DataView(full.buffer);f.setInt16(o.inventory,-50);full[o.stacks+9]=5;for(let s=0;s<9;s++)f.setInt16(o.inventory+30+s*2,-61);
const held=takeOriginalStackItem(full,0,0);assert.equal(receiveOriginalStackItem(held.bytes,-50,held.quantity,1),null);
for(const quantity of [0,-1,11,1.5])assert.equal(receiveOriginalStackItem(base,-50,quantity,1),null);
const dead=base.slice();new DataView(dead.buffer).setInt16(o.hitPoints+2,0);assert.equal(receiveOriginalStackItem(dead,-50,1,1),null);
assert.equal(takeOriginalStackItem(base,0,0),null);
console.log(`${cases} stack paths: whole/single pickup, existing hand stacks, caps10/20, pending overflow, no gold/foreign writes, blocked full/dead recipients and quantity conservation passed.`);
