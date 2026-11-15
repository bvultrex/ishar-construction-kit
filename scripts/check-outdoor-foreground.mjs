import assert from 'node:assert/strict';
import {importCont,setGridCell} from '../src/lib/ishar/cont-grid.ts';
import {outdoorView} from '../src/lib/ishar/outdoor-grid-view.ts';
let grid=importCont(new Uint8Array(10800),'CONT3.FIC','synthetic').grid;
grid=setGridCell(grid,'A',45,30,12);
for(const direction of ['east','west']){
  const sprites=outdoorView(grid,45,30,direction,{sceneType:23});
  assert.ok(sprites.some(s=>s.module==='VARCHE.IO' && s.index===24 && s.z===94 && s.r===45 && s.c===30),`near arch retained for original N/S (${direction})`);
  assert.ok(sprites.every((s,i)=>i===0 || sprites[i-1].z>=s.z),'far-to-near sort');
}
console.log('CONT3 near arches survive the foreground filter in both N/S views.');
