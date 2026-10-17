import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {originalEaffPerspective} from '../src/lib/ishar/original-eaff-perspective.ts';
const dir=process.env.ISHAR_ACTOR_LISTINGS;if(!dir)throw Error('ISHAR_ACTOR_LISTINGS required');
const listing=readFileSync(`${dir}/EAFF.IO.asm`,'utf8');
const rows=[[-42,192,10],[-25,92,21],[-12,60,32],[-7,44,44],[-4,34,56],[-2,28,69],[-1,24,80]];
let cases=0;
for(let map=1;map<=7;map++)for(let distance=0;distance<6;distance++)for(let lateral=-distance;lateral<=distance;lateral++){
 const key=distance+([2,3,4,5,6,7].includes(map)?1:0),r=rows[key-1],expected={baseX:r?(lateral*r[1]||0):1,height:r?r[0]:1,divisor:r?r[2]:10,depth:key*99-(map===3||map===4?0:5)};
 assert.deepEqual(originalEaffPerspective(listing,{map,distance,lateral,heightDelta:0}),expected);cases++;
}
const factors=[[],[45],[23,34],[14,19,27],[10,12,16,20],[7,8,10,14,18,22,26]];
for(let distance=0;distance<6;distance++)for(let delta=-8;delta<=8;delta++){
 const base=originalEaffPerspective(listing,{map:4,distance,lateral:1,heightDelta:0}),factor=factors[distance][Math.abs(delta)-1]??0;
 assert.deepEqual(originalEaffPerspective(listing,{map:4,distance,lateral:1,heightDelta:delta}),{...base,height:base.height+delta*factor});cases++;
}
assert.throws(()=>originalEaffPerspective(listing,{map:4,distance:2,lateral:0}),/height delta/);
assert.throws(()=>originalEaffPerspective('bad',{map:1,distance:2,lateral:0}),/Missing/);
if(process.env.ISHAR2_DIR){
 const image=readAlisModule(readFileSync(`${process.env.ISHAR2_DIR}/EAFF.IO`)).image;let n=0;
 for(const line of listing.split(/\r?\n/)){const m=line.match(/^\s*([\da-f]{5})\s+([\da-f]+)\s/);if(!m)continue;const at=parseInt(m[1],16);if(!((at>=0x37c&&at<0x4c8)||(at>=0x9e9&&at<=0xba4)))continue;const p=Buffer.from(m[2],'hex');assert.deepEqual(Buffer.from(image.subarray(at,at+p.length)),p);n++;}
 console.log(`${n} EAFF perspective/height instruction prefixes match original IO; no native execution claim.`);
}
console.log(`${cases} perspective cases checked against explicit expected distance and height coefficients, including map-specific depth and required terrain input.`);

