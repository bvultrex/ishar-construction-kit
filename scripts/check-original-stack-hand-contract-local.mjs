import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
const root=process.env.ISHAR2_DIR;assert.ok(root,'ISHAR2_DIR required');
const raw=new Uint8Array(readFileSync(join(root,'FRISE.IO')));
assert.equal(createHash('sha256').update(raw).digest('hex'),'27117c124caf904a31568f5c58f615946083dd3429c02ade1dc1e17552cc2b64');
const image=readAlisModule(raw).image;
const prefix=(at,hex)=>assert.equal(Buffer.from(image.slice(at,at+hex.length/2)).toString('hex'),hex,at.toString(16));
const branch=(at,opcode,target)=>{assert.equal(image[at],opcode);let delta=image[at+1]|image[at+2]<<8|image[at+3]<<16;if(delta&0x800000)delta-=0x1000000;assert.equal(at+4+delta,target);};
branch(0x2e2e,7,0x3580);branch(0x2e32,7,0x3b98);
branch(0x2f15,20,0x3012);branch(0x316e,10,0x3348);
prefix(0x3161,'1f3806830126bc4b3a'); // any cursor count still positive -> no swap
prefix(0x3212,'1e38125e4008000156003b26'); // old stack quantity to cursor
prefix(0x322c,'1e000038125e400800015600'); // old carrier quantity cleared
prefix(0x326b,'1e000038125e4012123a288e'); // existing incoming stack -> empty selected slot
branch(0x3278,10,0x32d8);
prefix(0x328b,'1e20162d38125e4012123a28');
prefix(0x330c,'1e08000120162d'); // old code becomes held code
prefix(0x35fb,'203820162d56003b26bc4b3a');
prefix(0x3615,'1e00003820162d56003b3a26');
prefix(0x363e,'21121a3820162d56003b3a26');
prefix(0x364c,'1e06830138125e4020162d56');
console.log('Original stack-hand control flow bound: quantity transfer precedes swap guard, old-stack cursor exchange and duplicate-slot suppression verified statically. No product/native acceptance.');
