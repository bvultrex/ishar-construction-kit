import assert from 'node:assert/strict';
import {readFileSync,readdirSync,mkdtempSync,writeFileSync} from 'node:fs';
import {join,resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {originalGroundSprites,pickOriginalGround,receiveOriginalGround} from '../src/lib/ishar/original-ground-runtime.ts';
import {readSaveWorldItems} from '../src/lib/ishar/save-world-items.ts';
import {importCont,cellWalkable} from '../src/lib/ishar/cont-grid.ts';
import {readOriginalCarrier} from '../src/lib/ishar/original-commerce.ts';
import {deriveIshar2SaveLayout,readIshar2SavedMain} from '../src/lib/ishar/ishar2-save-layout.ts';
const root=resolve(process.env.ISHAR2_DIR??'');
assert.ok(process.env.ISHAR2_DIR,'ISHAR2_DIR required');
const outputRoot=resolve(process.env.ISHAR_PRIVATE_OUTPUT??'../analysis-output');
const within=(base,path)=>{const rel=relative(base,path);return rel===''||(!rel.startsWith('..')&&!isAbsolute(rel));};
assert.ok(!within(root,outputRoot)&&!within(resolve('.'),outputRoot),'Output must stay outside original installation and repository');
const output=mkdtempSync(join(outputRoot,'ground-roundtrip-'));
const layout=await deriveIshar2SaveLayout(new Uint8Array(readFileSync(join(root,'IO.IO'))));
const reports=[];const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const name of readdirSync(root).filter(name=>/\.sav$/i.test(name))){
 const path=join(root,name),original=new Uint8Array(readFileSync(path)),source=original.slice();
 if(process.argv.includes('--controlled-placement')&&name.toUpperCase()==='START.SAV'){
  const cont=new Uint8Array(readFileSync(join(root,'CONT1.FIC'))),parsed=importCont(cont,'CONT1.FIC',hash(cont));assert.ok(parsed.ok);
  let camera;for(let r=1;r<parsed.grid.rows-1&&!camera;r++)for(let c=2;c<parsed.grid.cols-1&&!camera;c++)if(cellWalkable(parsed.grid,r,c)&&cellWalkable(parsed.grid,r,c-1))camera={row:r,col:c};
  const object=process.argv.includes('--controlled-gold')?10:9;
  assert.ok(camera);source[336+object]=camera.row;source[536+object]=camera.col-1;source[736+object]=1;
  const words=new DataView(source.buffer);words.setUint16(2,camera.row);words.setUint16(4,camera.col);words.setUint16(6,1);words.setUint16(8,1);
  if(object===10){words.setInt16(14,1);words.setInt16(16,900);} // explicitly documented private gold input
 }
 const inputPatches=[];original.forEach((value,index)=>{if(value!==source[index])inputPatches.push({offset:index,before:value,after:source[index]});});
 const items=readSaveWorldItems(source);if(!items)continue;
 for(const item of items.filter(item=>[9,10].includes(item.id)&&item.scene===1&&item.col<255)){
  // Controlled camera relative to an existing unmodified item; not an original gameplay trace.
  const view={row:item.row,col:item.col+1,facing:1,map:1,scene:0};
  assert.ok(originalGroundSprites(source,view).some(sprite=>sprite.id===item.id&&sprite.pickable));
  const picked=pickOriginalGround(source,view,item.id);assert.ok(picked);
  assert.ok(!originalGroundSprites(picked,view).some(sprite=>sprite.id===item.id));
  const carrier=Array.from({length:5},(_,i)=>i).find(i=>{const person=readOriginalCarrier(source,i);return person.present&&person.hp>0&&(item.id===10||person.slots.slice(0,9).includes(0));});
  if(carrier===undefined)continue;
  const slot=readOriginalCarrier(source,carrier).slots.slice(0,9).indexOf(0);
  const received=receiveOriginalGround(picked,item.id,carrier);assert.ok(received);
  const allowed=new Set([336+item.id,536+item.id,736+item.id,...(item.id===10?[14,15,16,17,1006+carrier*2,1007+carrier*2,1026+carrier*2,1027+carrier*2]:[1036+carrier*30+slot*2,1037+carrier*30+slot*2])]);
  const changed=[];source.forEach((value,index)=>{if(value!==received[index]){assert.ok(allowed.has(index),`Unexpected byte write ${index}`);changed.push(index);}});
  if(inputPatches.length)writeFileSync(join(output,`${name}-${item.id}-controlled-input.SAV`),source,{flag:'wx'});
  const file=join(output,`${name}-${item.id}-received.SAV`);writeFileSync(file,received,{flag:'wx'});
  const reloaded=new Uint8Array(readFileSync(file));assert.deepEqual(reloaded,received);
  if(item.id===9)assert.equal(readOriginalCarrier(reloaded,carrier).slots[slot],item.id);
  else {assert.deepEqual(readOriginalCarrier(reloaded,carrier).slots,readOriginalCarrier(source,carrier).slots);assert.deepEqual(reloaded.slice(14,18),new Uint8Array(4));}
  assert.ok(!originalGroundSprites(reloaded,view).some(sprite=>sprite.id===item.id));
  const savedMain=readIshar2SavedMain(reloaded,layout);
  if(item.id===9)assert.equal(((savedMain.get(0x2d8e+carrier*30+slot*2)??0)<<8)|(savedMain.get(0x2d8f+carrier*30+slot*2)??0),item.id);
  else for(const address of [0x4c94,0x4c95,0x4c96,0x4c97])assert.equal(savedMain.get(address),0);
  assert.deepEqual(new Uint8Array(readFileSync(path)),original);
  reports.push({source:name,controlledPlacement:inputPatches.length>0,inputPatches,originalSha256:hash(original),sha256:hash(source),object:item.id,carrier,slot,changedOffsets:changed,exportSha256:hash(reloaded)});
 }
}
assert.ok(reports.length,'No eligible original item/recipient fixtures found');
writeFileSync(join(output,'report.json'),JSON.stringify({limits:'Original-save copies; any controlled placement/player-position patches explicitly recorded in cases. Controlled camera, host inventory operation, disk export/readback and original IO layout readback. Not original EXE execution or browser proof.',cases:reports},null,2));
console.log(`Original-item disk roundtrip and IO-layout readback: ${reports.length} cases passed. Private artifacts: ${output}`);
