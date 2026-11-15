import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {separateAnalysisOutput} from './inventory-originals.mjs';
import {readAlisModule,writeAlisModule} from '../src/lib/ishar/alis-module.ts';
import {dosAlisIntegerOperandEnd} from '../src/lib/ishar/original-alis-operand-layout.ts';
import {readDosAlisSwitch,editDosAlisSwitchTarget} from '../src/lib/ishar/original-alis-switch.ts';
assert.equal(dosAlisIntegerOperandEnd(Uint8Array.from([0x38,0,0x3a,0x56,0,2,0x3a]),0),7,'literal 0x3a is not an expression terminator');
assert.throws(()=>dosAlisIntegerOperandEnd(Uint8Array.from([0x38,0,1]),0),/Unterminated/);
assert.throws(()=>dosAlisIntegerOperandEnd(Uint8Array.from([0x30,0,0,0,0]),0),/Unsupported/);
const reports=[];
for(const [game,rootEnv,listEnv] of [['ishar1','ISHAR1_DIR','ISHAR1_LISTINGS'],['ishar2','ISHAR2_DIR','ISHAR_ACTOR_LISTINGS']]){
 const root=process.env[rootEnv],dir=process.env[listEnv];if(!root||!dir)throw Error(`${rootEnv} and ${listEnv} required`);
 let modules=0,tables=0,cases=0;const failures=[],moduleEvidence=[];
 for(const file of readdirSync(dir).filter(n=>n.endsWith('.IO.asm')).sort()){
  const name=file.slice(0,-4),bytes=new Uint8Array(readFileSync(join(root,name))),module=readAlisModule(bytes),image=module.image,before=bytes.slice();let found=false,tableCount=0,caseCount=0;
  for(const line of readFileSync(join(dir,file),'utf8').split(/\r?\n/)){
   const m=line.match(/^\s*([\da-f]{5})\s+[\da-f]+\s+cswitch[12]\s+.*\{(.*)\}/);if(!m)continue;
   try{
    const at=parseInt(m[1],16),end=dosAlisIntegerOperandEnd(image,at+1),table=readDosAlisSwitch(image,at,end),expected=[...m[2].matchAll(/(-?\d+):L_([\da-f]+)/g)].map(x=>({value:+x[1],target:parseInt(x[2],16)}));
    assert.deepEqual(table.cases,expected,`${name} ${m[1]} complete table`);
    for(const entry of table.cases)assert.deepEqual(editDosAlisSwitchTarget(image,at,end,entry.value,entry.target),image,'no-op full image exact');
    assert.deepEqual(writeAlisModule(module,image),bytes,'no-op container exact');
    const edited=editDosAlisSwitchTarget(image,at,end,table.cases[0].value,table.tableEnd),packed=writeAlisModule(module,edited);
    assert.deepEqual(readAlisModule(packed).image,edited,'retargeted module decoded after packing');
    const restored=editDosAlisSwitchTarget(edited,at,end,table.cases[0].value,table.cases[0].target);
    assert.deepEqual(writeAlisModule(module,restored),bytes,'restored image yields byte-identical original container');
    tables++;cases+=table.cases.length;found=true;
    tableCount++;caseCount+=table.cases.length;
   }catch(error){failures.push({file:name,sha256:createHash('sha256').update(bytes).digest('hex'),address:m[1],error:String(error).slice(0,350)});}
  }
  assert.deepEqual(bytes,before);if(found)modules++;
  moduleEvidence.push({file:name,sourceBytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),tables:tableCount,cases:caseCount});
 }
 console.log(JSON.stringify({game,modulesWithSwitches:modules,tables,cases,failures},null,2));if(failures.length)process.exitCode=1;
 reports.push({game,claim:'structural switch-table/listing audit and packed-copy readback; not complete module decoding or DOS execution',modulesWithSwitches:modules,tables,cases,failures,moduleEvidence});
}
if(process.argv[2]){
 const output=await separateAnalysisOutput([process.env.ISHAR1_DIR,process.env.ISHAR2_DIR],process.argv[2]);await mkdir(output,{recursive:true});
 await writeFile(join(output,'switch-profiles.json'),JSON.stringify(reports,null,2)+'\n',{flag:'wx'});
}
