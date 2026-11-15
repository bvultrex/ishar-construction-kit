import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {importCont} from '../src/lib/ishar/cont-grid.ts';
import {emptyProject,projectJson} from '../src/lib/ishar/project.ts';
import {beginOriginalTavernMeal,finishOriginalTavernMeal} from '../src/lib/ishar/original-tavern.ts';
import {patchOriginalSaveView} from '../src/lib/ishar/original-save-view.ts';

const root=process.env.ISHAR2_DIR;assert.ok(root,'ISHAR2_DIR required');
const output=resolve(process.argv[2]??'../analysis-output/tavern-browser-2026-11-15');mkdirSync(output,{recursive:true});
const cont=new Uint8Array(readFileSync(join(root,'CONT3.FIC'))),save=new Uint8Array(readFileSync(join(root,'S.SAV')));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const imported=importCont(cont,'CONT3.FIC',sha(cont));assert.equal(imported.ok,true);
assert.equal(save.length,8359);assert.equal(new DataView(save.buffer).getUint16(0,false),2);
const input=save.slice(),inputView=new DataView(input.buffer);assert.equal(inputView.getUint16(2,false),17);assert.equal(inputView.getUint16(4,false),56);assert.equal(inputView.getUint16(6,false),3);assert.equal(inputView.getUint16(8,false),3);
const project=emptyProject('Ishar 2 Tavern Browser Acceptance');
project.game={...project.game,startLocationId:'tavern-approach',startFacing:'west',levels:[{id:'cont3',name:'CONT3 Tavern Test',kind:'outdoor',tilesetId:'ishar2-out3',grid:imported.grid}],locations:[{id:'tavern-approach',name:'Tavern approach',description:'Controlled browser acceptance at row17 col56.',x:3,y:17,levelId:'cont3',exits:[],itemIds:[],sceneKind:'outdoor',ending:true}],portals:[],items:[],encounters:[],doors:[],quests:[],npcs:[]};
let expected=beginOriginalTavernMeal(input,2);assert.equal(expected.ok,true);expected=finishOriginalTavernMeal(expected.bytes,2);assert.equal(expected.ok,true);const outputSave=patchOriginalSaveView(expected.bytes,{row:17,col:56,facing:3,map:3,scene:inputView.getUint16(18,false)});
writeFileSync(join(output,'tavern-project.ishar-ck-project.json'),projectJson(project));writeFileSync(join(output,'INPUT.SAV'),input);writeFileSync(join(output,'EXPECTED.SAV'),outputSave);
writeFileSync(join(output,'fixture.json'),JSON.stringify({source:{cont:'CONT3.FIC',contSha256:sha(cont),save:'S.SAV',saveSha256:sha(save)},controlledPatch:null,inputSha256:sha(input),expectedSha256:sha(outputSave),expected:{row:17,col:56,facing:3,map:3,tavern:2,price:580,hour:16,day:2,ticks:0,gold:41730,food:[100,100,100,100,100]}},null,2));
const actualArg=process.argv.find(value=>value.startsWith('--actual='))?.slice(9),reloadArg=process.argv.find(value=>value.startsWith('--reload='))?.slice(9);
if(actualArg||reloadArg){
 assert.ok(actualArg&&reloadArg,'--actual and --reload must be supplied together');
 const actual=new Uint8Array(readFileSync(actualArg)),reload=new Uint8Array(readFileSync(reloadArg));
 assert.deepEqual(actual,outputSave,'browser export differs from independent expectation');assert.deepEqual(reload,outputSave,'reload export differs from independent expectation');
 writeFileSync(join(output,'browser-check.json'),JSON.stringify({build:'0c414d6cf98ddecfe6d0e4701278533331020ae0',inputSha256:sha(input),expectedSha256:sha(outputSave),browserExportSha256:sha(actual),reloadExportSha256:sha(reload),ui:{entry:'CONT3 row17 col56, two left turns, forward',offerPrice:580,preMessageGold:42310,preMessageFood:[82,97,93,82,93],messageExportDisabled:true,postMessageGold:41730,postMessageFood:[100,100,100,100,100],exitFacing:3},byteExact:true},null,2));
}
console.log(JSON.stringify({output,inputSha256:sha(input),expectedSha256:sha(outputSave)},null,2));
