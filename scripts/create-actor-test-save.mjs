import {readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import {importCont,cellA,cellB} from '../src/lib/ishar/cont-grid.ts';
import {inferIrvanScene,irvanSceneAfterStep} from '../src/lib/ishar/scene-state.ts';
import {readActorSave,actorViewCandidate} from '../src/lib/ishar/save-actors.ts';
const root=process.env.ISHAR2_DIR,output=process.argv[2];
if(!root||!output)throw Error('Usage: ISHAR2_DIR=<game folder> node scripts/create-actor-test-save.mjs <output.SAV>');
const source=join(root,'START.SAV');
assert.notEqual(resolve(output),resolve(source),'Never overwrite the original START.SAV');
const bytes=new Uint8Array(readFileSync(source));
assert.ok(readActorSave(bytes),'Supported original save required');
const parsed=importCont(new Uint8Array(readFileSync(join(root,'CONT1.FIC'))),'CONT1.FIC','local-test');
assert.ok(parsed.ok);const grid=parsed.grid;
const start={row:45,col:47},scene=inferIrvanScene(start.row,start.col),actors=[[51,0,44,46],[53,9,45,46],[54,11,46,46]];
const safe=(r,c)=>r>=0&&c>=0&&r<90&&c<60&&cellA(grid,r,c)>=0&&cellA(grid,r,c)<=6&&cellB(grid,r,c)===0;
assert.ok(safe(start.row,start.col));
const occupied=new Set(actors.map(([, ,r,c])=>r+','+c)),seen=new Set([start.row+','+start.col]),queue=[[start.row,start.col]];
// Routes exclude actor cells too, so a fixture actor cannot hide a required path.
for(let i=0;i<queue.length;i++)for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
 const [r,c]=queue[i],nr=r+dr,nc=c+dc,key=nr+','+nc;
 if(safe(nr,nc)&&!occupied.has(key)&&!seen.has(key)){seen.add(key);queue.push([nr,nc]);}
}
for(const [id,,r,c] of actors){
 assert.ok(safe(r,c),`Actor ${id} must stand on an ordinary passable cell`);
 for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const nr=r+dr,nc=c+dc,key=nr+','+nc;
  assert.ok(safe(nr,nc),`Actor ${id}: passable adjacent cell ${key}`);
  assert.equal(irvanSceneAfterStep(nr,nc,scene),scene,'Approach must retain actor scene');
  assert.ok(seen.has(key)||occupied.has(key),`Actor ${id}: adjacent approach reachable ${key}`);
 }
}
const view=new DataView(bytes.buffer),word=(at,v)=>view.setUint16(at,v,false);
word(2,start.row);word(4,start.col);word(6,1);word(8,1);word(18,scene);
for(let id=50;id<110;id++)word(3261+id*2,0);
for(const [id,type,r,c] of actors){word(2601+id*2,r);word(2821+id*2,c);word(3041+id*2,3);word(3261+id*2,40);bytes[4911+id]=type;bytes[6781+id]=scene;}
const save=readActorSave(bytes);
for(const actor of save.actors.filter(a=>a.hp>0))assert.ok(actorViewCandidate(save,actor),'All three actors visible at start');
writeFileSync(output,bytes);
console.log(`Reachable CONT1 test save: start 45/47 N; NPC 44/46, golem 45/46, wizard 46/46. ${seen.size} safe approach cells checked.`);
