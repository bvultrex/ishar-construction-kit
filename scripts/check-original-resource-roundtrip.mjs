import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {importCont,exportCont,setGridCell} from '../src/lib/ishar/cont-grid.ts';
let checked=0;
for(const [game,key] of [['ishar1','ISHAR1_DIR'],['ishar2','ISHAR2_DIR']]){
 const root=process.env[key];if(!root)throw Error(`${key} required: this audit must not silently skip a game`);
 const names=readdirSync(root).filter(name=>/^CONT\d+\.FIC$/i.test(name)).sort();
 assert.ok(names.length,`${game}: original CONT files required`);
 for(const name of names){
  const source=new Uint8Array(readFileSync(join(root,name))),before=source.slice(),hash=createHash('sha256').update(source).digest('hex');
  const parsed=importCont(source,name,hash);assert.ok(parsed.ok,`${game}/${name}: ${parsed.error??''}`);
  assert.equal(parsed.grid.game,game);assert.deepEqual(exportCont(parsed.grid),source,'unmodified roundtrip');
  const changed=(source[0]+1)&255,edited=exportCont(setGridCell(parsed.grid,'A',0,0,changed));
  assert.equal(edited[0],changed);assert.deepEqual(edited.subarray(1),source.subarray(1),'unknown bytes and second layer preserved');
  const restored=exportCont(setGridCell(parsed.grid,'A',0,0,source[0]));assert.deepEqual(restored,source);
  assert.deepEqual(source,before,'source buffer remains immutable');checked++;
  console.log(`${game}/${name}: ${source.length} bytes SHA256 ${hash} roundtrip/edit preservation OK`);
 }
}
console.log(`${checked} original CONT resources verified across both games; no files written.`);
