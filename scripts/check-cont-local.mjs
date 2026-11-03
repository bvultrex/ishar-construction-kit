// LOCAL ONLY: byte-exact CONT round-trip against the user's own Ishar 2 files.
// Usage: ISHAR2_DIR=/path/to/Ishar2 node scripts/check-cont-local.mjs
// Reads originals outside the repo, writes nothing. Skips when ISHAR2_DIR is unset.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { importCont, exportCont, cellA, cellB, doorNumber, edgeSides, trapAt } from '../src/lib/ishar/cont-grid.ts';
const dir=process.env.ISHAR2_DIR;
if(!dir){console.log('ISHAR2_DIR not set – local CONT round-trip skipped');process.exit(0);}
for(let n=1;n<=7;n++){
  const file=join(dir,`CONT${n}.FIC`);
  if(!existsSync(file)){console.log(`CONT${n}.FIC missing`);continue;}
  const bytes=new Uint8Array(readFileSync(file));
  const sha=createHash('sha256').update(bytes).digest('hex');
  const r=importCont(bytes,file,sha); assert.equal(r.ok,true);
  const back=createHash('sha256').update(exportCont(r.grid)).digest('hex');
  assert.equal(back,sha,`CONT${n} round-trip`);
  let walls=0,doors=0,doorsOnEdge=0,traps=0;
  for(let y=0;y<r.grid.rows;y++) for(let x=0;x<r.grid.cols;x++){
    if(cellA(r.grid,y,x)===-1) walls++;
    if(doorNumber(cellB(r.grid,y,x))!==undefined){doors++; if(edgeSides(cellA(r.grid,y,x)).length) doorsOnEdge++;}
    if(trapAt(r.grid,y,x)) traps++;
  }
  console.log(`CONT${n} sha256 ${sha} round-trip OK · walls ${walls} · door cells ${doors} (on edge codes ${doorsOnEdge}) · traps ${traps}`);
}
