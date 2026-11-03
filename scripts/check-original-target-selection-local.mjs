import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
const root=process.env.ISHAR2_DIR,listings=process.env.ISHAR_ACTOR_LISTINGS;if(!root||!listings)throw Error('ISHAR2_DIR and ISHAR_ACTOR_LISTINGS required');
for(const [name,hash,lo,hi] of [['SOURIS','78df7c73f880466303867b63dd5e20897777802b0595c64935b9f4462354f9d3',0x781,0x7ac],['FRISE','27117c124caf904a31568f5c58f615946083dd3429c02ade1dc1e17552cc2b64',0x1fa5,0x2035]]){
 const original=readFileSync(join(root,name+'.IO'));assert.equal(createHash('sha256').update(original).digest('hex'),hash);const image=readAlisModule(new Uint8Array(original)).image;let count=0;
 for(const line of readFileSync(join(listings,name+'.IO.asm'),'utf8').split(/\r?\n/)){
  const m=line.match(/^\s*([\da-f]{5})\s+([\da-f]+)\s/);if(!m)continue;const at=parseInt(m[1],16);if(at<lo||at>hi)continue;
  const prefix=Buffer.from(m[2],'hex');assert.deepEqual(Buffer.from(image.slice(at,at+prefix.length)),prefix);count++;
 }
 assert.ok(count>=7);console.log(`${name}: ${count} selection instruction prefixes match hash-bound original. Static evidence, not native execution.`);
}
