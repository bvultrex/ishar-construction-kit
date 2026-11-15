import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {readAlisModule,writeAlisModule} from '../src/lib/ishar/alis-module.ts';
import {readDosAlisForms,editDosAlisBox,originalAlisFormHits} from '../src/lib/ishar/original-alis-forms.ts';
for(const env of ['ISHAR1_DIR','ISHAR2_DIR']){
 const root=process.env[env];if(!root)throw Error(`${env} required`);let total=0,boxes=0,compounds=0;
 for(const name of readdirSync(root).filter(n=>/\.IO$/i.test(n))){
  const source=new Uint8Array(readFileSync(join(root,name))),before=source.slice(),module=readAlisModule(source),forms=readDosAlisForms(module.image);total+=forms.length;
  for(const form of forms){
   const entity={id:1,contextWord6:0,position:[0,0,0],mirror:false,form:form.index,forms};originalAlisFormHits(entity,[],65535); // resolve references/cycles, too
   if(form.kind==='compound'){compounds++;continue;}boxes++;
   assert.deepEqual(editDosAlisBox(module.image,form.index,form),module.image);
   const material=form.material^1,edited=editDosAlisBox(module.image,form.index,{...form,material});
   for(let i=0;i<edited.length;i++)if(i!==form.offset+2)assert.equal(edited[i],module.image[i],name+': unrelated byte');
   const back=readAlisModule(writeAlisModule(module,edited));assert.deepEqual(back.image,edited);assert.equal(readDosAlisForms(back.image)[form.index].material,material);
  }
  assert.deepEqual(source,before);
 }
 console.log(`${env}: ${total} forms (${boxes} boxes, ${compounds} compound); references resolved, unchanged resources exact, targeted material edits and A1 readback passed.`);
}
const read=name=>readDosAlisForms(readAlisModule(new Uint8Array(readFileSync(join(process.env.ISHAR2_DIR,name+'.IO')))).image);
const query={id:0,contextWord6:0,forms:read('SOURIS'),form:0,mirror:false,position:[128,0,122]},target={id:53,contextWord6:0,forms:read('GOLEM1'),form:0,mirror:false,position:[0,93,-42]};
assert.deepEqual(originalAlisFormHits(query,[target],32767),[{entityId:53,material:1}]);
assert.equal(originalAlisFormHits({...query,position:[154,0,122]},[target],32767).length,1);
assert.equal(originalAlisFormHits({...query,position:[155,0,122]},[target],32767).length,0);
console.log('Original SOURIS query form and GOLEM1 form match at center/edge and reject just outside. Resource geometry test, not native execution or browser-coordinate verification.');
// Compose native form hit and selection, keeping live entity handles separate
// from SAV actor slots. The entity->actor mapping is explicit test input.
import {beginOriginalTargetSelection,originalTargetSelectionStep,originalMouseSelectionWrites} from '../src/lib/ishar/original-target-selection.ts';
import {deriveIshar2SaveLayout,readIshar2SavedMain,patchIshar2SavedMain} from '../src/lib/ishar/ishar2-save-layout.ts';
import {originalNpcGoldTransfer} from '../src/lib/ishar/original-npc-gold.ts';
const liveTarget={...target,id:200},hit=originalAlisFormHits(query,[liveTarget],32767)[0];
const hitWrites=originalMouseSelectionWrites(hit);assert.equal(hitWrites[1].value,200);
const input={button:0,x:128,y:100,key:0,hitEntity:-2,hitMaterial:0};
let selection=originalTargetSelectionStep(beginOriginalTargetSelection(-1).state,input).state;
selection=originalTargetSelectionStep(selection,{...input,button:1,hitEntity:200,hitMaterial:1}).state;
selection=originalTargetSelectionStep(selection,{...input,button:0,hitEntity:200,hitMaterial:1}).state;assert.equal(selection.entity,200);assert.equal(selection.material,1);
const entityActor=new Map([[200,53]]),root=process.env.ISHAR2_DIR,layout=await deriveIshar2SaveLayout(new Uint8Array(readFileSync(join(root,'IO.IO')))),save=new Uint8Array(readFileSync(join(root,'START.SAV'))),memory=readIshar2SavedMain(save,layout);
const transfer=originalNpcGoldTransfer(memory,0,entityActor.get(selection.entity),[0,1]),copy=patchIshar2SavedMain(save,layout,transfer.operations);
assert.equal(readIshar2SavedMain(copy,layout).get(0x442a+53),1);assert.deepEqual(save,new Uint8Array(readFileSync(join(root,'START.SAV'))));
console.log('Native form -> SOURIS hit -> FRISE delayed selection -> explicit live-entity actor mapping -> NPC gold SAV copy composed successfully. No input coordinate, native scheduling or gameplay integration claim.');
