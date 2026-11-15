import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {separateAnalysisOutput} from './inventory-originals.mjs';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {readOriginalActorDispatch} from '../src/lib/ishar/original-actor-dispatch.ts';
import {actorAnimationSteps,savedMainMemory,originalActorRandom,ORIGINAL_ACTOR_MODULES} from '../src/lib/ishar/original-actor-frame.ts';
import assert from 'node:assert/strict';
import {extractAlisIndexedImages} from '../src/lib/ishar/alis-assets.ts';
import {readDosAlisForms} from '../src/lib/ishar/original-alis-forms.ts';
const root=process.env.ISHAR2_DIR,dir=process.env.ISHAR_ACTOR_LISTINGS;if(!root||!dir)throw Error('ISHAR2_DIR and ISHAR_ACTOR_LISTINGS required');
const read=name=>readFileSync(join(dir,name+'.asm'),'utf8'),dispatch=readOriginalActorDispatch(read('EAFF.IO')),ids=new Set([...dispatch.specialSlots,...dispatch.types].flatMap(d=>d.scriptIds));
const resources=new Map();for(const name of readdirSync(root).filter(n=>n.toUpperCase().endsWith('.IO'))){const bytes=new Uint8Array(readFileSync(join(root,name))),module=readAlisModule(bytes);resources.set(module.header.id,{name,module,sha256:createHash('sha256').update(bytes).digest('hex')});}
const base=savedMainMemory(read('IO.IO'),new Uint8Array(readFileSync(join(root,'START.SAV'))));base.set(0x2ab7,0);
const results=[];
for(const id of [...ids].sort((a,b)=>a-b)){
 const resource=resources.get(id);if(!resource){results.push({id,error:'Missing module'});continue;}
 const {name}=resource;const listing=read(name),failures=new Set(),graphics=extractAlisIndexedImages(resource.module.image,name,true),forms=readDosAlisForms(resource.module.image),images=new Set(graphics.images.map(e=>e.entryIndex)),composites=new Map(graphics.composites.map(e=>[e.entryIndex,e]));let passed=0,draws=0,terminated=0;
 const drawable=(index,seen=new Set())=>{if(images.has(index))return true;if(seen.has(index))return false;const c=composites.get(index);if(!c)return false;const next=new Set(seen);next.add(index);return c.children.every(child=>drawable(child.entryIndex,next));};
 for(const state of [0,255])for(const depth of [93,192,291,390,489])for(const seed of [0,65535]){
  const memory=new Map(base);memory.set(0x43ba+53,state);
  try{const steps=actorAnimationSteps(listing,memory,{0:0,2:depth,4:-42,12:35*256+53},{random:originalActorRandom(seed)});
   for(let tick=0;tick<100;tick++){const frame=steps.next();if(frame.done){terminated++;break;}draws+=frame.value.length;
    for(const draw of frame.value){if(!drawable(draw.index))throw Error(`Undecoded draw resource ${draw.index}`);if(draw.form!==undefined&&draw.form>=forms.length)throw Error(`Missing form ${draw.form}`);}
   }
   passed++;
  }catch(error){failures.add(String(error));}
 }
 results.push({id,name,sha256:resource.sha256,passed,draws,terminated,failures:[...failures]});
}
const report={claim:'controlled isolated actor states, 5 depths, 2 seeds, 2 copied actor states, 100 yields maximum; not original placement/behavior or all events',results};
for(const name of ORIGINAL_ACTOR_MODULES){const result=results.find(r=>r.name===name);assert.ok(result,`Missing enabled actor ${name}`);assert.equal(result.passed,20,`${name} controlled scenarios`);assert.deepEqual(result.failures,[]);assert.ok(result.draws>0);assert.equal(result.terminated,0);}
console.log(JSON.stringify(report,null,2));
if(process.argv[2]){const output=await separateAnalysisOutput([root],process.argv[2]);await mkdir(output,{recursive:true});await writeFile(join(output,'actor-module-audit.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});}
