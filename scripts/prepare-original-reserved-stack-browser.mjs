import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';

const [sourceArg,outputArg]=process.argv.slice(2);
assert.ok(sourceArg&&outputArg,'Usage: node scripts/prepare-original-reserved-stack-browser.mjs SOURCE.SAV OUTPUT_DIR');
const source=new Uint8Array(readFileSync(resolve(sourceArg)));
assert.equal(source.length,8359);assert.deepEqual([...source.slice(0,2)],[0,2]);
const output=resolve(outputArg);mkdirSync(output,{recursive:true});
const input=source.slice();input.fill(0,1036,1186);input.fill(0,7629,7729);
const slot=(bytes,carrier,index,id)=>new DataView(bytes.buffer).setInt16(1036+carrier*30+index*2,id,false);
const count=(bytes,carrier,id,quantity)=>bytes[7629+carrier*20+id+59]=quantity;

// C1 supplies -50×3. C2 already owns -50×9 and has a two-hand sentinel in hand9.
slot(input,0,0,-50);count(input,0,-50,3);
slot(input,1,0,-50);count(input,1,-50,9);slot(input,1,9,-125);

// FRISE books one unit before rejecting the sentinel slot write. The remaining
// two units stay at the cursor and are then given to C3's backpack.
const expected=input.slice();slot(expected,0,0,0);count(expected,0,-50,0);
count(expected,1,-50,10);slot(expected,2,0,-50);count(expected,2,-50,2);

writeFileSync(join(output,'INPUT.SAV'),input,{flag:'wx'});
writeFileSync(join(output,'EXPECTED.SAV'),expected,{flag:'wx'});
console.log(output);
