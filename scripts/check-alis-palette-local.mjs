import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {readAlisModule,writeAlisModule} from '../src/lib/ishar/alis-module.ts';
import {describeAlisPalettes,editAlisPalette,extractAlisIndexedImages,vgaDac} from '../src/lib/ishar/alis-assets.ts';
for(const env of ['ISHAR1_DIR','ISHAR2_DIR']){
 const root=process.env[env];if(!root)throw Error(`${env} required`);
 let modules=0,colors=0;
 const encodings={};
 for(const name of (await readdir(root)).filter(name=>/\.IO$/i.test(name)).sort()){
  const original=new Uint8Array(await readFile(join(root,name))),before=original.slice(),module=readAlisModule(original),palettes=describeAlisPalettes(module.image);
  if(!palettes.length)continue;modules++;
  for(const palette of palettes){
   encodings[palette.encoding]=(encodings[palette.encoding]??0)+1;
   const rgb=[...palette.colors[0]];rgb[0]=(rgb[0]+(palette.maxChannel===255?4:1))%(palette.maxChannel+1);
   const edited=editAlisPalette(module.image,palette.entryIndex,palette.firstColor,rgb);
   const allow=palette.encoding==='dos-rgb'?[palette.dataOffset+2]:[palette.dataOffset];
   for(let at=0;at<edited.length;at++)if(!allow.includes(at))assert.equal(edited[at],module.image[at],name+': unrelated image byte changed');
   const encoded=writeAlisModule(module,edited),back=readAlisModule(encoded);assert.deepEqual(back.image,edited,name+': module write/readback');
   const extracted=extractAlisIndexedImages(back.image,name,true).palettes.find(item=>item.entryIndex===palette.entryIndex);assert.ok(extracted);
   assert.deepEqual([...extracted.palette.slice(palette.firstColor*3,palette.firstColor*3+3)],rgb.map(value=>palette.encoding==='dos-rgb'?vgaDac(value):value<<5));
   colors++;
  }
  assert.deepEqual(original,before,'original source buffer unchanged');
 }
 assert.ok(colors,`${env}: at least one original palette must be checked`);
 console.log(`${env}: ${modules} modules, ${colors} palette edits validated through original-format re-encode and display decoder; encodings ${JSON.stringify(encodings)}.`);
}
