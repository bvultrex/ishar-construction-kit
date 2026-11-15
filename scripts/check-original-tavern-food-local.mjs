import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';

const root=process.env.ISHAR2_DIR;assert.ok(root,'ISHAR2_DIR required');
const raw=new Uint8Array(readFileSync(join(root,'TAVERNE.IO')));
assert.equal(createHash('sha256').update(raw).digest('hex'),'ea315973f2187950f7ac72a6c6db4565dd0fd67ede241d56e8a73175fa8bf804');
const image=readAlisModule(raw).image;
const prefix=(at,hex)=>assert.equal(Buffer.from(image.slice(at,at+hex.length/2)).toString('hex'),hex,at.toString(16));
prefix(0x62e,'1f3812124a00023a146700001e0000120e'); // meal variant gate, carrier loop starts
prefix(0x63f,'1f38120e285c2d5400003a14400000'); // signed HP word > 0, otherwise skip carrier
prefix(0x64e,'1f38120e26f62e54003c3a140e0000'); // signed food byte > 60
prefix(0x65d,'1e006438120e3a26f62e0a230000'); // food = 100
prefix(0x66b,'20002838120e3a26f62e'); // otherwise food += 40
prefix(0x675,'1f38120e26f62e5400643a140a0000'); // cap check > 100
prefix(0x68e,'200001120e1f38120e4e00043a15a2'); // next of five carriers
prefix(0x499,'1e209a4c14161e20984c14141e1211141807510700'); // payment setup after message close
prefix(0x4b8,'1e0000120e1f38120e269e2e4c00ff3a149b0000'); // pass 1, class != -1
prefix(0x515,'1e000038120e3a28682d1e000038120e3a28802d'); // poor payer writes T then E = 0
prefix(0x52d,'1e141638120e3a28682d1e141438120e3a28802d'); // share payer writes T then E
prefix(0x57c,'1e0000120e1f38120e269e2e4c00ff3a148b0000'); // pass 2, class != -1
prefix(0x5db,'1e000038120e3a28682d1e000038120e3a28802d'); // pass 2 poor payer writes T then E = 0
prefix(0x603,'1e141638120e3a28682d1e141438120e3a28802d'); // pass 2 covering payer writes T then E
prefix(0xb6f,'1e000012101f38141654141a3a1452000021'); // pair subtraction helper
prefix(0xbff,'1e3814144002e8034014165a14185e3656365c14183a'); // equal-share division helper
console.log('Original TAVERNE food and two-pass payment writes bound to the local module. UI timing/native multi-payer execution remain separate.');
