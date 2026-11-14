import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {join} from 'node:path';import {createHash} from 'node:crypto';import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
const root=process.env.ISHAR2_DIR;assert.ok(root,'ISHAR2_DIR required');const raw=readFileSync(join(root,'FRISE.IO'));assert.equal(createHash('sha256').update(raw).digest('hex'),'27117c124caf904a31568f5c58f615946083dd3429c02ade1dc1e17552cc2b64');const image=readAlisModule(raw).image;
const prefix=(at,hex)=>assert.equal(Buffer.from(image.slice(at,at+hex.length/2)).toString('hex'),hex,at.toString(16));
prefix(0x26fe,'1f382078005202a9003a');prefix(0x272c,'1e000c1212'); // screen band -> slot12
prefix(0x27d2,'1f3820162d5000a74020162d');prefix(0x27e8,'1e000c1212'); // -89..-82 -> slot12
prefix(0x275a,'1e380800015800013a2a8a01');prefix(0x277f,'1e380800015800013a20162d'); // old stored-1 to entity/cursor
prefix(0x278b,'1e00003812144012123a288e');prefix(0x2798,'07861700');prefix(0x279c,'2112513812143a260e2f'); // clear, armour(old cursor code) subtract
prefix(0x294c,'1f3820162d5200a74020162d');prefix(0x29b4,'1e3820162d5600013a381214'); // validate and store incoming+1
prefix(0x29cf,'074f1500');prefix(0x29d3,'2012513812143a260e2f'); // armour(incoming) add
console.log('Original stat-independent equipment slot12 bound to range, ±1 storage transform and armour calls. No UI/native claim.');
