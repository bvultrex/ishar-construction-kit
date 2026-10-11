import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readOriginalMerchants, subtractOriginalPrice } from '../src/lib/ishar/original-merchants.ts';
for(const [balance,price,expected] of [
  [[2,0],[1,800],[0,200]], [[1,0],[1,1],null],
  [[2,0],[1,0],[1,0]], [[0,999],[0,999],[0,0]],
]) assert.deepEqual(subtractOriginalPrice(balance,price),expected);
assert.throws(()=>subtractOriginalPrice([1,1000],[0,1]));
assert.throws(()=>readOriginalMerchants('not a supported listing'));
const targets=Array.from({length:17},(_,i)=>`${i+1}:L_${i===5?'008b0':'0129c'}`);
targets[0]='1:L_008b0';
const fixture=`  00884  aa cswitch2 odirb(0x0c), {${targets.join(', ')}}
L_008b0:
  008b0 aa cstore oimmb(-61), ->seval(oimmb(0) opushacc oimmb(0),sdirti(0x28))
  008bc aa cstore oimmb(1), ->seval(oimmb(0) opushacc oimmb(1),sdirti(0x28))
  008c8 aa cstore oimmw(800), ->seval(oimmb(0) opushacc oimmb(2),sdirti(0x28))
  00969 aa cjmp24 L_0129c
L_0129c:
  0129c aa cret
`;
const merchants=readOriginalMerchants(fixture);
assert.equal(merchants.length,17);
assert.deepEqual(merchants[0].slots[0].fields,[-61,1,800,1]);
assert.deepEqual(merchants[0].slots,merchants[5].slots);
assert.deepEqual(merchants[6].slots[0].fields,[0,0,0,1]);
assert.equal(merchants[0].slots[0].addresses[2],'0x008c8');
if(process.env.ISHAR_MERCHANT_LISTING) {
  const original=readOriginalMerchants(readFileSync(process.env.ISHAR_MERCHANT_LISTING,'utf8'));
  assert.equal(original.length,17);
  assert.deepEqual(original[0].slots[0].fields,[-61,1,800,1]);
  assert.deepEqual(original[0].slots,original[5].slots);
  assert.ok(original.flatMap(m=>m.slots).some(s=>s.fields[3]>1));
}
console.log('Original merchant dispatch, source addresses, defaults, shared stock and price borrowing passed.');
