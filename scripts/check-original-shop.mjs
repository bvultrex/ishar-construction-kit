import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {originalShopEntry} from '../src/lib/ishar/original-shop-entry.ts';
import {readOriginalItemResources} from '../src/lib/ishar/original-merchants.ts';
assert.deepEqual(originalShopEntry(-18),{kind:'merchant',selector:1});
assert.deepEqual(originalShopEntry(34),{kind:'merchant',selector:17});
assert.deepEqual(originalShopEntry(-18,3),{kind:'closed'});
assert.deepEqual(originalShopEntry(-1,3),{kind:'tavern',selector:0});
for(const code of [0,16,40,50])assert.equal(originalShopEntry(code),null);
const listing='  0009b ff cswitch2 odirb(0x0c), {-61:L_00100, -60:L_00100}\nL_00100:\n  00100 ff cput oimmb(27)\n';
assert.deepEqual(readOriginalItemResources(listing),{'-61':27,'-60':27});
if(process.env.ISHAR_OBJECT_LISTING){const resources=readOriginalItemResources(readFileSync(process.env.ISHAR_OBJECT_LISTING,'utf8'));assert.ok(Object.keys(resources).length>70);assert.ok(Number.isInteger(resources[-61]));}
console.log('Original shop dispatch, night closure and literal item sprite mapping passed.');
