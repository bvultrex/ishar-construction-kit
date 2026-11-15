import assert from 'node:assert/strict';
import {packSilmA1} from '../src/lib/ishar/silm-write.ts';
import {unpackSilm} from '../src/lib/ishar/silm-pack.ts';
const patterns=[Uint8Array.of(1),Uint8Array.of(7,7),Uint8Array.of(1,2,1,2,1),new Uint8Array(200000),Uint8Array.from({length:100000},(_,i)=>i%251)];
let state=12345;const random=Uint8Array.from({length:200000},()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state>>>24;});patterns.push(random);
for(const input of patterns){
 const before=input.slice();
 for(const main of [false,true]){
  const envelope=new Uint8Array(main?22:6);envelope[3]=0xa1;envelope[4]=main?0:1;
  if(main)for(let i=6;i<22;i++)envelope[i]=i;
  const encoded=packSilmA1(input,envelope),decoded=unpackSilm(encoded);
  assert.ok(decoded?.data,decoded?.note);assert.deepEqual(decoded.data,input);assert.equal(decoded.header.isMain,main);
  assert.deepEqual(encoded,packSilmA1(input,envelope),'deterministic compression');
  assert.deepEqual(encoded.subarray(4,envelope.length),envelope.subarray(4),'VM specs and check preserved');
 }
 assert.deepEqual(input,before);
}
assert.throws(()=>packSilmA1(new Uint8Array()),/size/);
assert.throws(()=>packSilmA1(Uint8Array.of(1),new Uint8Array(7)),/envelope/);
assert.throws(()=>packSilmA1(Uint8Array.of(1),new Uint8Array(6)),/marker/);
console.log('A1 writer: literal/copy/overlap/long-run/random patterns, MAIN VM specs, determinism and readback passed.');

// A de Bruijn sequence contains every pair once: a deliberate input beyond
// this encoder's 32K-window/64K-literal strategy, which must fail explicitly.
const sequence=[],a=new Uint16Array(3);
function db(t,p){if(t>2){if(2%p===0)for(let j=1;j<=p;j++)sequence.push(a[j]);}else{a[t]=a[t-p];db(t+1,p);for(let j=a[t-p]+1;j<256;j++){a[t]=j;db(t+1,t);}}}
db(1,1);
const boundary=Uint8Array.from(sequence);
assert.equal(boundary.length,65536);
const maxDistance=Uint8Array.from([...sequence.slice(0,32768),...sequence.slice(0,8)]);
assert.deepEqual(unpackSilm(packSilmA1(maxDistance)).data,maxDistance,'maximum emitted 15-bit distance is valid');
assert.deepEqual(unpackSilm(packSilmA1(boundary)).data,boundary,'65536 literals use the exact 16-bit count boundary');
const unsupportedPattern=Uint8Array.from([...sequence,...sequence.slice(0,4)]);
assert.throws(()=>packSilmA1(unsupportedPattern),/unsupported input pattern/);
console.log('Unsupported literal-window pattern rejected explicitly, without alternate-format fallback.');
