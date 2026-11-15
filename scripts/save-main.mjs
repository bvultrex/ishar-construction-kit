import {readFile,writeFile,mkdir,realpath} from 'node:fs/promises';
import {dirname} from 'node:path';
import {deriveIshar2SaveLayout,readIshar2SavedMain,patchIshar2SavedMain} from '../src/lib/ishar/ishar2-save-layout.ts';
import {sha256} from '../src/lib/ishar/cont-patch.ts';
import {separateAnalysisOutput} from './inventory-originals.mjs';
const [command,ioPath,savePath,writesPath,outputPath]=process.argv.slice(2);
if(!['inspect','patch'].includes(command)||!ioPath||!savePath)throw Error('Usage: save-main.mjs inspect <original IO.IO> <save.SAV> | patch <original IO.IO> <save.SAV> <writes.json> <new output.SAV>');
const ioPhysical=await realpath(ioPath),savePhysical=await realpath(savePath);
const layout=await deriveIshar2SaveLayout(new Uint8Array(await readFile(ioPhysical))),source=new Uint8Array(await readFile(savePhysical)),memory=readIshar2SavedMain(source,layout);
const metadata={game:layout.game,ioSha256:layout.ioSha256,sourceSha256:await sha256(source),savedMainBytes:memory.size,fieldCount:layout.fields.length};
if(command==='inspect')console.log(JSON.stringify({...metadata,fields:layout.fields},null,2));
else{
 if(!writesPath||!outputPath)throw Error('Writes JSON and new output required');
 const writes=JSON.parse(await readFile(writesPath,'utf8'));if(!Array.isArray(writes))throw Error('Writes must be an array of {address,width,value}');
 const output=await separateAnalysisOutput([dirname(ioPhysical),dirname(savePhysical)],outputPath),patched=patchIshar2SavedMain(source,layout,writes);
 await mkdir(dirname(output),{recursive:true});await writeFile(output,patched,{flag:'wx'});
 const stored=new Uint8Array(await readFile(output));if(await sha256(stored)!==await sha256(patched))throw Error('Save output readback mismatch');
 const changedOffsets=[];for(let i=0;i<stored.length;i++)if(stored[i]!==source[i])changedOffsets.push(i);
 console.log(JSON.stringify({...metadata,targetSha256:await sha256(stored),changedOffsets,verification:'original-I/O-layout and file-readback only; not tested in original execution'},null,2));
}
