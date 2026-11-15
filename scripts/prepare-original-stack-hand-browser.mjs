import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
const [sourceArg,outputArg]=process.argv.slice(2);assert.ok(sourceArg&&outputArg,'Usage: node scripts/prepare-original-stack-hand-browser.mjs SOURCE.SAV OUTPUT_DIR');
const source=new Uint8Array(readFileSync(resolve(sourceArg)));assert.equal(source.length,8359);assert.deepEqual([...source.slice(0,2)],[0,2]);
const output=resolve(outputArg);mkdirSync(output,{recursive:true});
const input=source.slice(),view=new DataView(input.buffer);input.fill(0,1036,1186);input.fill(0,7629,7729);
const slot=(bytes,c,s,id)=>new DataView(bytes.buffer).setInt16(1036+c*30+s*2,id,false);
const count=(bytes,c,id,n)=>bytes[7629+c*20+id+59]=n;
// Partial case: C5 holds -50x6. C1 already has -50x8 and code9 in hand9.
slot(input,0,0,-50);count(input,0,-50,8);slot(input,0,9,9);
slot(input,4,0,-50);count(input,4,-50,6);
// Reverse swap: C3 has code9; C2 hand9 holds -49x20.
slot(input,1,9,-49);count(input,1,-49,20);slot(input,2,0,9);
const expected=input.slice();
// C5 whole take; two accepted by C1 while code9 remains; four to C4 backpack.
slot(expected,4,0,0);count(expected,4,-50,0);count(expected,0,-50,10);slot(expected,3,0,-50);count(expected,3,-50,4);
// C3 code9 swaps with C2 hand stack; old -49x20 then goes to C4 slot1.
slot(expected,2,0,0);slot(expected,1,9,9);count(expected,1,-49,0);slot(expected,3,1,-49);count(expected,3,-49,20);
writeFileSync(join(output,'INPUT.SAV'),input,{flag:'wx'});writeFileSync(join(output,'EXPECTED.SAV'),expected,{flag:'wx'});
console.log(output);
