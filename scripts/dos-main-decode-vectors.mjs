import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readAlisModule,writeAlisModule} from '../src/lib/ishar/alis-module.ts';
const original=new Uint8Array(readFileSync(process.argv[2])),module=readAlisModule(original);
if(!module.isMain||module.encoding!=='dos-a1')throw Error('Expected A1 MAIN');
const edited=module.image.slice();edited[edited.length-1]^=1;
const streams=[['original',original],['edited-last-byte',writeAlisModule(module,edited)]];
console.log(JSON.stringify(streams.map(([name,bytes])=>({name,stream:Buffer.from(bytes).toString('base64'),size:readAlisModule(bytes).image.length,expectedSha256:createHash('sha256').update(readAlisModule(bytes).image).digest('hex')}))));
