import assert from 'node:assert/strict';import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {resolve,join} from 'node:path';
const [sourceArg,outputArg]=process.argv.slice(2);assert.ok(sourceArg&&outputArg,'Usage: node scripts/prepare-original-equipment-browser.mjs SOURCE.SAV OUTPUT_DIR');
const source=new Uint8Array(readFileSync(resolve(sourceArg)));assert.equal(source.length,8359);assert.deepEqual([...source.slice(0,2)],[0,2]);
const output=resolve(outputArg);mkdirSync(output,{recursive:true});const input=source.slice();input.fill(0,1036,1186);input.fill(0,1336,1341);
const slot=(bytes,c,s,id)=>new DataView(bytes.buffer).setInt16(1036+c*30+s*2,id,false);
slot(input,0,0,-89);slot(input,1,12,-86);input[1337]=3;
const swapped=input.slice();slot(swapped,0,0,0);slot(swapped,1,12,-88);swapped[1337]=4;slot(swapped,2,12,-86);swapped[1338]=3;
const returned=swapped.slice();slot(returned,2,12,0);returned[1338]=0;slot(returned,0,0,-87);
writeFileSync(join(output,'INPUT.SAV'),input,{flag:'wx'});writeFileSync(join(output,'EXPECTED-SWAP.SAV'),swapped,{flag:'wx'});writeFileSync(join(output,'EXPECTED-RETURN.SAV'),returned,{flag:'wx'});console.log(output);
