import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {separateAnalysisOutput} from './inventory-originals.mjs';
import {readAlisModule,writeAlisModule} from '../src/lib/ishar/alis-module.ts';
import {readDosAlisBranch,editDosAlisBranchTarget} from '../src/lib/ishar/original-alis-branch.ts';
const reports=[],kinds={cjsr:'call',cjmp:'jump',cbz:'zero',cbnz:'nonzero',cbeq:'notEqual',cbne:'equal',cstart:'resume'};
for(const [game,rootEnv,listEnv] of [['ishar1','ISHAR1_DIR','ISHAR1_LISTINGS'],['ishar2','ISHAR2_DIR','ISHAR_ACTOR_LISTINGS']]){
 const root=process.env[rootEnv],dir=process.env[listEnv];if(!root||!dir)throw Error(`${rootEnv} and ${listEnv} required`);
 let branches=0,modules=0,negative24=0;const failures=[],moduleEvidence=[];
 for(const file of readdirSync(dir).filter(n=>n.endsWith('.IO.asm')).sort()){
  const bytes=new Uint8Array(readFileSync(join(root,file.slice(0,-4)))),module=readAlisModule(bytes),image=module.image;let count=0,copyEditChecked=false;
  for(const line of readFileSync(join(dir,file),'utf8').split(/\r?\n/)){
   const m=line.match(/^\s*([\da-f]{5})\s+([\da-f]+)\s+(c(?:jsr|jmp|bz|bnz|beq|bne|start))(8|16|24)\s+L_([\da-f]+)/);if(!m)continue;
   try{const at=parseInt(m[1],16),b=readDosAlisBranch(image,at);assert.equal(b.kind,kinds[m[3]]);assert.equal(b.width,+m[4]/8);assert.equal(b.target,parseInt(m[5],16));assert.deepEqual(editDosAlisBranchTarget(image,at,b.target),image);
    if(!copyEditChecked&&b.next<image.length){const edited=editDosAlisBranchTarget(image,at,b.next);assert.deepEqual(readAlisModule(writeAlisModule(module,edited)).image,edited);assert.deepEqual(writeAlisModule(module,editDosAlisBranchTarget(edited,at,b.target)),bytes);copyEditChecked=true;}
    if(b.width===3&&b.displacement<0)negative24++;branches++;count++;
   }catch(error){failures.push({file,address:m[1],error:String(error).slice(0,200)});}
  }
  if(count)modules++;
  moduleEvidence.push({file:file.slice(0,-4),sourceBytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),branches:count,copyEditChecked});
 }
 console.log(JSON.stringify({game,modules,branches,negative24,failures},null,2));if(failures.length)process.exitCode=1;
 reports.push({game,claim:'listed direct branch structural audit; not complete control flow or native execution',modules,branches,negative24,failures,moduleEvidence});
}
if(process.argv[2]){const output=await separateAnalysisOutput([process.env.ISHAR1_DIR,process.env.ISHAR2_DIR],process.argv[2]);await mkdir(output,{recursive:true});await writeFile(join(output,'branch-profiles.json'),JSON.stringify(reports,null,2)+'\n',{flag:'wx'});}
