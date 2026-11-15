import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {evaluateOriginalAlisInteger as evaluate} from '../src/lib/ishar/original-alis-expression.ts';
import {originalActorRandom} from '../src/lib/ishar/original-actor-frame.ts';

// Private original resource + local listing required; no source bytes emitted.
const [game,resourcePath,listingPath]=process.argv.slice(2);
const profiles={
 ishar1:{sha:'3bd158963fdaf0f88517b03509002100159a7587c8e2486389314b8abc707e15',hit:0x6609,base:0x6721,damage:0x6760},
 ishar2:{sha:'27117c124caf904a31568f5c58f615946083dd3429c02ade1dc1e17552cc2b64',hit:0x5651,fist:0x56ef,damage:0x5707},
};
const profile=profiles[game];
if(!profile||!resourcePath||!listingPath)throw Error('Usage: ishar1|ishar2 FRISE.IO FRISE.IO.asm');
const bytes=new Uint8Array(await readFile(resourcePath));
assert.equal(createHash('sha256').update(bytes).digest('hex'),profile.sha,'Original resource profile');
const image=readAlisModule(bytes).image,listing=await readFile(listingPath,'utf8');
function expressionAt(address){
 const lines=listing.split(/\r?\n/).map(line=>line.match(/^\s*([\da-f]{5})\s+([\da-f]+)\s+cstore\s+(.+), ->slocw\(0x([\da-f]+)\)$/)).filter(m=>m&&parseInt(m[1],16)===address);
 assert.equal(lines.length,1,`Unique store at ${address.toString(16)}`);
 const m=lines[0],prefix=Buffer.from(m[2],'hex');
 assert.deepEqual(Buffer.from(image.subarray(address,address+prefix.length)),prefix,'Listing instruction prefix matches decoded original');
 return m[3];
}
const expressions=Object.fromEntries(Object.entries(profile).filter(([k])=>k!=='sha').map(([k,v])=>[k,expressionAt(v)]));
let cases=0;
for(const level of [1,10,22])for(const agi of [4,20])for(const food of [1,64,100])for(const con of [6,20,30])for(const armour of [0,16]){
 const local=new Map(),set=(at,value)=>local.set(at,value),read=(_space,at)=>{assert.ok(local.has(at),`Unspecified combat input ${at.toString(16)}`);return local.get(at);};
 const context={scan:0,read,table:()=>{throw Error('Unexpected combat table read');}};
 const strength=20,skill=81,targetAgi=15,distance=3,bonus=12,die=20,seed=cases&65535;
 if(game==='ishar1'){
  for(const [at,value] of [[0x134,level],[0x140,agi],[0x135,food],[0x153,targetAgi],[0x146,distance],[0x87,skill],[0x13e,strength],[0x14f,con],[0x138,bonus],[0x155,armour]])set(at,value);
  assert.equal(evaluate(expressions.hit,context),30+2*level+5*(Math.trunc(agi*food/80)-targetAgi)-distance+Math.trunc(skill/5));
  const base=Math.trunc((strength+2-con)/2);
  assert.equal(evaluate(expressions.base,context),base);
  set(0x13a,Math.max(0,base));
  const bound=Math.max(0,base),next=(seed*0x7ab7+0xf881)&65535;
  assert.equal(evaluate(expressions.damage,{...context,random:originalActorRandom(seed)}),bonus-armour+Math.floor(bound*next/65536)+1);
 }else{
  for(const [at,value] of [[0x160,level],[0x16c,agi],[0x161,food],[0x17f,targetAgi],[0x172,distance],[0x64,skill],[0x16a,strength],[0x17b,con],[0x181,armour],[0x164,die]])set(at,value);
  assert.equal(evaluate(expressions.hit,context),50+2*level+3*(Math.trunc(agi*food/80)-targetAgi)-Math.trunc(distance/2)+Math.trunc(skill/5));
  assert.equal(evaluate(expressions.fist,context),Math.trunc((strength-con)/2)-armour);
  const next=(seed*0x7ab7+0xf881)&65535;
  assert.equal(evaluate(expressions.damage,{...context,random:originalActorRandom(seed)}),Math.trunc((strength+2-con)/2)-armour+Math.floor(die*next/65536)+1);
 }
 cases++;
}
console.log(JSON.stringify({game,sourceSha256:profile.sha,cases,verified:'Original FRISE scalar hit and pre-clamp damage expressions; no target selection, writes, cooldown, scheduler or full battle claim'}));
