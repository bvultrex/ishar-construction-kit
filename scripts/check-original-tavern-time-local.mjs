import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';

const root=process.env.ISHAR2_DIR;assert.ok(root,'ISHAR2_DIR required');
const raw=new Uint8Array(readFileSync(join(root,'MAIN.IO')));
assert.equal(createHash('sha256').update(raw).digest('hex'),'bfab5e9175931dbb1c2c51f0576092ef423e0bf950579340c8a1715e8cf8db95');
const image=readAlisModule(raw).image;
const prefix=(at,hex)=>assert.equal(Buffer.from(image.slice(at,at+hex.length/2)).toString('hex'),hex,at.toString(16));
prefix(0x3ff,'1f38785202d0073a14410000'); // omodel < 2000 branch
prefix(0x417,'1e02580208cc4f'); // slow model: 600 ticks/hour
prefix(0x4a7,'1e02e80308cc4f'); // DOS model 2000..2999: 1000 ticks/hour
prefix(0x3faa,'20000108ca4f'); // increment saved tick word
prefix(0x3fb0,'1f3808ca4f5008cc4f3a14a0000020000108c64f1e000008ca4f'); // threshold, hour +1, tick reset
prefix(0x3fca,'1f3808c64f5000183a140c000020000108c84f21001808c64f'); // day rollover at hour 24
console.log('Local MAIN binds the DOS 1000-tick branch and saved tick/hour/day rollover. DOS omodel selection is a separate reported native proof.');
