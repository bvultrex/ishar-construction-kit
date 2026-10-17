// Optional local evidence check. Original data and disassembly stay outside Git.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { importCont, cellWalkable } from '../src/lib/ishar/cont-grid.ts';
import { outdoorView } from '../src/lib/ishar/outdoor-grid-view.ts';

const { ISHAR2_DIR, ALIS_RESEARCH_DIR, PYTHON_EXE } = process.env;
assert.ok(ISHAR2_DIR && ALIS_RESEARCH_DIR && PYTHON_EXE, 'Set ISHAR2_DIR, ALIS_RESEARCH_DIR and PYTHON_EXE');
const bytes=readFileSync(join(ISHAR2_DIR,'CONT2.FIC'));
const imported=importCont(bytes,'CONT2.FIC','local');
assert.ok(imported.ok); const grid=imported.grid;
assert.equal(grid.game,'ishar2'); assert.equal(grid.rows,90); assert.equal(grid.cols,60);
const cells=[];
for(let r=7;r<83;r++) for(let c=7;c<53;c++) if(cellWalkable(grid,r,c)) cells.push({r,c});
const samples=[{r:25,c:40},{r:28,c:34},...Array.from({length:24},(_,i)=>cells[Math.floor(i*(cells.length-1)/23)])];
const directions=['east','south','west','north'];
const queries=samples.flatMap(p=>directions.map((f,i)=>({...p,f:i+1,direction:f})));
const dir=mkdtempSync(join(tmpdir(),'ishar-cont2-audit-'));
try {
  const input=join(dir,'input.json');
  writeFileSync(input,JSON.stringify({A:[...bytes.subarray(0,5400)],B:[...bytes.subarray(5400)],queries}));
  const program=`import json,sys,pathlib
root=pathlib.Path(sys.argv[1]); sys.path.insert(0,str(root/'tools'))
from alis_interp import Script,VM,s8
g=json.load(open(sys.argv[2])); sc=Script(str(root/'ARBO.asm')); out=[]
for q in g['queries']:
 main={0x2ab4:q['r'],0x2ab5:q['c'],0x2ab6:q['f'],0x2d18:2,0x4ef2:35}
 main[('T',0x0080)]={i:s8(v) for i,v in enumerate(g['A'])}
 main[('T',0x159c)]={i:s8(v) for i,v in enumerate(g['B'])}
 vm=VM(sc,main,{0x0080:(90,60),0x159c:(90,60)}); vm.run('L_0003c')
 draws=[d for d in vm.out if 'sprite' in d and d['z']>=99]
 out.append([[d['x'],d['y'],d['z'],d['sprite'],d['mirror']] for d in sorted(draws,key=lambda d:-d['z'])])
print(json.dumps(out))`;
  const reference=JSON.parse(execFileSync(PYTHON_EXE,['-c',program,ALIS_RESEARCH_DIR,input],{encoding:'utf8',maxBuffer:16*1024*1024}));
  let draws=0;
  for(let i=0;i<queries.length;i++){
    const q=queries[i];
    const actual=outdoorView(grid,q.r,q.c,q.direction).filter(s=>s.script==='ARBO').map(s=>[s.x,s.y,s.z,s.index,s.mirror]);
    assert.deepEqual(actual,reference[i],`ARBO ${q.r}/${q.c}, original facing ${q.f}`);draws+=actual.length;
  }
  console.log(`${queries.length} CONT2 views, ${draws} ARBO draw placements match original-script execution (z >= 99). Not a pixel/palette/overlay comparison.`);
} finally { rmSync(dir,{recursive:true,force:true}); }
