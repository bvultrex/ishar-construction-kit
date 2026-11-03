import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {readAlisModule,writeAlisModule} from '../src/lib/ishar/alis-module.ts';
if(process.argv[3]==='--all'){
 const rows=[];
 for(const name of readdirSync(process.argv[2]).filter(name=>/\.IO$/i.test(name)).sort()){
  const bytes=new Uint8Array(readFileSync(join(process.argv[2],name))),module=readAlisModule(bytes);
  if(module.encoding!=='dos-a1')continue;
  rows.push({name,stream:Buffer.from(bytes).toString('base64'),expectedImage:Buffer.from(module.image).toString('base64'),envelopeBytes:module.envelopeBytes,size:module.image.length,expectedSha256:createHash('sha256').update(module.image).digest('hex'),sourceSha256:createHash('sha256').update(bytes).digest('hex')});
 }
 console.log(JSON.stringify(rows));
}else{
const original=new Uint8Array(readFileSync(process.argv[2])),module=readAlisModule(original);
if(!module.isMain||module.encoding!=='dos-a1')throw Error('Expected A1 MAIN');
const edited=module.image.slice();edited[edited.length-1]^=1;
const streams=[['original',original],['edited-last-byte',writeAlisModule(module,edited)]];
console.log(JSON.stringify(streams.map(([name,bytes])=>({name,stream:Buffer.from(bytes).toString('base64'),size:readAlisModule(bytes).image.length,expectedSha256:createHash('sha256').update(readAlisModule(bytes).image).digest('hex')}))));
}
