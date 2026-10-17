import {readdirSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {readAlisSoundDirectory} from '../src/lib/ishar/original-alis-sounds.ts';
for(const [profile,root,listings] of [
 ['ishar1',process.env.ISHAR1_DIR,process.env.ISHAR1_LISTINGS],
 ['ishar2',process.env.ISHAR2_DIR,process.env.ISHAR_ACTOR_LISTINGS],
]){
 if(!root||!listings)throw Error(`Missing original/listing paths for ${profile}`);
 const report={profile,modules:0,listingModules:0,missingListings:[],counts:{csound:0,cmsound:0,cdelsound:0},mainSoundEntries:0,sites:[]};
 const available=new Set(readdirSync(listings));
 for(const name of readdirSync(root).filter(n=>/\.io$/i.test(n))){
  const raw=readFileSync(`${root}/${name}`),module=readAlisModule(raw);report.modules++;
  if(module.isMain)report.mainSoundEntries=readAlisSoundDirectory(module.image).length;
  if(!available.has(`${name}.asm`)){report.missingListings.push(name);continue;}
  report.listingModules++;
  const text=readFileSync(`${listings}/${name}.asm`,'utf8');
  for(const line of text.split(/\r?\n/)){
   const match=line.match(/^\s*([\da-f]{5})\s+([\da-f]+)\s+(csound|cmsound|cdelsound)\b\s*(.*)$/);if(!match)continue;
   const [,address,hex,op,args]=match,offset=parseInt(address,16),prefix=Buffer.from(hex,'hex');
   assert.equal(module.image[offset],{csound:0x9d,cmsound:0x9e,cdelsound:0xa1}[op]);
   assert.deepEqual(Buffer.from(module.image.subarray(offset,offset+prefix.length)),prefix,'listing prefix must match original bytes');
   report.counts[op]++;report.sites.push({module:name,sha256:createHash('sha256').update(raw).digest('hex'),offset,op,args});
  }
 }
 console.log(JSON.stringify(report));
}
