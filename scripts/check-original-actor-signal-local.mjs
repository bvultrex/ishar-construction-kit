import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {originalActorSignal} from '../src/lib/ishar/original-actor-signal.ts';
import {savedMainMemory} from '../src/lib/ishar/original-actor-frame.ts';
import {readAlisArrayDeclaration} from '../src/lib/ishar/original-alis-arrays.ts';
const root=process.env.ISHAR2_DIR,listings=process.env.ISHAR_ACTOR_LISTINGS;
if(!root||!listings)throw Error('ISHAR2_DIR and ISHAR_ACTOR_LISTINGS required');
const source=readFileSync(join(root,'EATT.IO'));
assert.equal(createHash('sha256').update(source).digest('hex'),'d5ef72a5b25eabb50e89a9142ef8acf176f9023c82e694bfe8a06290ba7b14ec');
const module=readAlisModule(new Uint8Array(source));
let checked=0;
for(const line of readFileSync(join(listings,'EATT.IO.asm'),'utf8').split(/\r?\n/)){
 const match=line.match(/^\s*([0-9a-f]{5})\s+([0-9a-f]+)\s/);if(!match)continue;
 const at=parseInt(match[1],16);if(at<0x188||at>0x552)continue;
 const prefix=Buffer.from(match[2],'hex');assert.deepEqual(Buffer.from(module.image.slice(at,at+prefix.length)),prefix,`listing prefix at ${match[1]}`);checked++;
}
assert.ok(checked>65);
const main=readAlisModule(new Uint8Array(readFileSync(join(root,'MAIN.IO'))));
assert.deepEqual(readAlisArrayDeclaration(main.image,0x1a5),{address:0x426e,elementBytes:1,strides:[3]});
assert.deepEqual(readAlisArrayDeclaration(main.image,0x9b),{address:0x2d8e,elementBytes:2,strides:[30]});
console.log(`${checked} EATT instruction prefixes match hash-bound original; MAIN cdim byte strides 3/30 verified. Static evidence only, no execution equivalence claim.`);

const save=new Uint8Array(readFileSync(join(root,'START.SAV'))),before=save.slice();
const memory=savedMainMemory(readFileSync(join(listings,'IO.IO.asm'),'utf8'),save),memoryBefore=new Map(memory);
const arrays=new Map([0x1a5,0x9b].map(at=>{const d=readAlisArrayDeclaration(main.image,at);return [d.address,d];}));
const outcomes={};
for(let id=50;id<110;id++){const result=originalActorSignal(memory,id,arrays);outcomes[result.outcome]=(outcomes[result.outcome]??0)+1;}
assert.deepEqual(memory,memoryBefore);assert.deepEqual(save,before);
console.log('Isolated routine evaluated for 60 START.SAV slots without mutation: '+JSON.stringify(outcomes)+'. Entry preconditions deliberately not applied; these are not predicted in-game interactions.');
