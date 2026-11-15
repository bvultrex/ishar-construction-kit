import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {readAlisModule,writeAlisModule} from '../src/lib/ishar/alis-module.ts';
import {readOriginalWeaponProfile,originalWeaponTwoHanded} from '../src/lib/ishar/original-weapon-profile.ts';
const root=process.env.ISHAR2_DIR;assert.ok(root,'ISHAR2_DIR required');
const raw=new Uint8Array(readFileSync(join(root,'PARAM.IO')));
assert.equal(createHash('sha256').update(raw).digest('hex'),'d06a65de1362847058a823445a4639e00c5e6366ac6057ef02a47b4bee10c114');
const before=raw.slice(),profile=readOriginalWeaponProfile(raw);
assert.equal(profile.types.length,27);assert.deepEqual(raw,before);
assert.equal(profile.types.filter(type=>type%10===2).length,12);
for(let code=-116;code<=-90;code++)assert.equal(originalWeaponTwoHanded(profile,code),profile.types[code+116]%10===2);
for(const code of [-117,-89,9,NaN])assert.equal(originalWeaponTwoHanded(profile,code),null);
assert.equal(originalWeaponTwoHanded({types:[]},-116),null);
const friseRaw=new Uint8Array(readFileSync(join(root,'FRISE.IO')));
assert.equal(createHash('sha256').update(friseRaw).digest('hex'),'27117c124caf904a31568f5c58f615946083dd3429c02ade1dc1e17552cc2b64');
const frise=readAlisModule(friseRaw).image;
const prefix=(at,hex)=>assert.equal(Buffer.from(frise.slice(at,at+hex.length/2)).toString('hex'),hex);
prefix(0x2e32,'07620d00'); // placement calls sentinel release03b98
prefix(0x2c6d,'07270f00'); // extraction calls the same release
prefix(0x2ea1,'1e008338125e40000a3a288e'); // reserve hand10 with -125
prefix(0x2eea,'1e008338125e4000093a288e'); // reserve hand9 with -125
prefix(0x3bb8,'1e000038125e40000a3a288e'); // release hand10
prefix(0x3bde,'1e000038125e4000093a288e'); // release hand9
const module=readAlisModule(raw);
// Changing an instruction operand must fail closed, rather than infer a table.
const image=module.image.slice();image[0xf5d+8]=3;
assert.throws(()=>readOriginalWeaponProfile(writeAlisModule(module,image)),/Unsupported PARAM/);
console.log('Local PARAM profile: complete 27-record initializer validated, 12 two-hand classifications; malformed initializer rejected. No inventory/UI/native execution claim.');
