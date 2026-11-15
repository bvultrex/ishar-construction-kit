import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
const root=process.env.ISHAR2_DIR,listings=process.env.ISHAR_ACTOR_LISTINGS;
if(!root||!listings)throw Error('ISHAR2_DIR and ISHAR_ACTOR_LISTINGS required');
const source=readFileSync(join(root,'FRISE.IO'));
assert.equal(createHash('sha256').update(source).digest('hex'),'27117c124caf904a31568f5c58f615946083dd3429c02ade1dc1e17552cc2b64');
const module=readAlisModule(new Uint8Array(source));let count=0;
for(const line of readFileSync(join(listings,'FRISE.IO.asm'),'utf8').split(/\r?\n/)){
 const m=line.match(/^\s*([0-9a-f]{5})\s+([0-9a-f]+)\s/);if(!m)continue;
 const at=parseInt(m[1],16);if(!((at>=0x46ac&&at<=0x4756)||(at>=0x6865&&at<=0x693d)))continue;
 const prefix=Buffer.from(m[2],'hex');assert.deepEqual(Buffer.from(module.image.slice(at,at+prefix.length)),prefix,m[1]);count++;
}
assert.ok(count>40);console.log(`${count} FRISE instruction prefixes match the hash-bound original NPC gold/acknowledgement and arithmetic paths. No original execution claim.`);
