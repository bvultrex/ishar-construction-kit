import assert from 'node:assert/strict';
import {originalEaffTerrainDelta} from '../src/lib/ishar/original-eaff-terrain.ts';
import {originalEaffPerspective} from '../src/lib/ishar/original-eaff-perspective.ts';
const data=new Uint8Array(10800),view={row:20,col:30},actor={row:21,col:30};
data[5400+20*60+30]=7;data[5400+21*60+30]=10;
assert.equal(originalEaffTerrainDelta(data,view,actor),3);assert.equal(originalEaffTerrainDelta(data,actor,view),-3);
data[5400+20*60+30]=128;data[5400+21*60+30]=127;assert.equal(originalEaffTerrainDelta(data,view,actor),-1,'difference wraps at signed8 store');
const wrapped=new Uint8Array(10820);wrapped.set(data,10);assert.equal(originalEaffTerrainDelta(wrapped.subarray(10,10810),view,actor),-1);
assert.throws(()=>originalEaffTerrainDelta(data.subarray(0,5400),view,actor));assert.throws(()=>originalEaffTerrainDelta(data,view,{row:90,col:0}),/outside/);
console.log('Terrain delta: second-layer stride, signed values, byte wrap, byteOffset and invalid input guards passed.');
if(process.env.ISHAR2_DIR&&process.env.ISHAR_ACTOR_LISTINGS){
 const {readFileSync}=await import('node:fs');const {createHash}=await import('node:crypto');
 const {readAlisModule}=await import('../src/lib/ishar/alis-module.ts');const {readAlisArrayDeclaration}=await import('../src/lib/ishar/original-alis-arrays.ts');
 const root=process.env.ISHAR2_DIR,main=readAlisModule(readFileSync(`${root}/MAIN.IO`)).image,eaff=readAlisModule(readFileSync(`${root}/EAFF.IO`)).image;
 assert.deepEqual(readAlisArrayDeclaration(main,0x60),{address:0x80,elementBytes:1,strides:[60]});assert.deepEqual(readAlisArrayDeclaration(main,0x67),{address:0x159c,elementBytes:1,strides:[60]});
 assert.equal(Buffer.from(main.subarray(0x3cd0,0x3cda)).toString('hex'),'7780001815779c151815','exact original two CONT block reads');
 assert.equal(Buffer.from(eaff.subarray(0x302,0x32e)).toString('hex'),'1e381eb42a401eb52a269c153a12261e38121628123440121628f034269c153a12251e3812255812263a1227','exact height lookup and difference');
 const cont=new Uint8Array(readFileSync(`${root}/CONT4.FIC`)),before=cont.slice(),listing=readFileSync(`${process.env.ISHAR_ACTOR_LISTINGS}/EAFF.IO.asm`,'utf8');
 let pairs=0,changedHeight=0;for(let row=0;row<89;row++)for(let col=0;col<60;col++){
  const a={row,col},b={row:row+1,col},delta=originalEaffTerrainDelta(cont,a,b),expected=((cont[5400+(row+1)*60+col]-cont[5400+row*60+col]+128)&255)-128;assert.equal(delta,expected);
  const perspective=originalEaffPerspective(listing,{map:4,distance:1,lateral:0,heightDelta:delta});
  assert.equal(perspective.height,-25+(Math.abs(delta)===1?45*delta:0));pairs++;if(perspective.height!==-25)changedHeight++;
 }
 assert.deepEqual(cont,before);console.log(`CONT4 SHA256 ${createHash('sha256').update(cont).digest('hex')}; ${pairs} adjacent pairs -> original height lookup -> EAFF perspective checked (${changedHeight} nonzero corrections). No DOS execution.`);
 const {importCont,setGridCell,exportCont}=await import('../src/lib/ishar/cont-grid.ts');
 const imported=importCont(cont,'CONT4.FIC',createHash('sha256').update(cont).digest('hex'));assert.equal(imported.ok,true);
 let editedPair=false;
 for(let row=0;row<89&&!editedPair;row++)for(let col=0;col<60&&!editedPair;col++){
  const a={row,col},b={row:row+1,col};if(Math.abs(originalEaffTerrainDelta(cont,a,b))!==1)continue;
  const rawPlayer=cont[5400+row*60+col],edited=exportCont(setGridCell(imported.grid,'B',b.row,b.col,rawPlayer));
  assert.deepEqual([...edited.keys()].filter(i=>edited[i]!==cont[i]),[5400+b.row*60+b.col]);
  assert.equal(originalEaffTerrainDelta(edited,a,b),0);assert.equal(originalEaffPerspective(listing,{map:4,distance:1,lateral:0,heightDelta:originalEaffTerrainDelta(edited,a,b)}).height,-25);
  assert.notEqual(originalEaffPerspective(listing,{map:4,distance:1,lateral:0,heightDelta:originalEaffTerrainDelta(cont,a,b)}).height,-25);editedPair=true;
 }
 assert.ok(editedPair);assert.deepEqual(cont,before);console.log('Existing CONT codec: one B-cell edit -> export -> changed original EAFF height correction verified, all remaining file bytes preserved.');
}
