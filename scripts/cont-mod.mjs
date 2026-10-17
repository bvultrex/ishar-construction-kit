import {readFile,writeFile,mkdir,realpath,lstat} from 'node:fs/promises';
import {resolve,join,dirname,basename,relative,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createContPatch,applyContPatch,sha256} from '../src/lib/ishar/cont-patch.ts';
import {inventoryInstallation} from './inventory-originals.mjs';
async function physical(path){path=resolve(path);try{return await realpath(path);}catch(error){if(error.code!=='ENOENT')throw error;return join(await physical(dirname(path)),basename(path));}}
const within=(root,path)=>{const rel=relative(root,path);return !rel||(!rel.startsWith('..')&&!isAbsolute(rel));};
/** Clone to a new directory, applying a fully validated patch only to the copy. */
export async function exportContMod(installation,patch,output){
 installation=await realpath(installation);output=await physical(output);
 if(within(installation,output)||within(output,installation))throw Error('Output must be separate from original installation');
 try{await lstat(output);throw Error('Output already exists; choose a new directory');}catch(error){if(error.code!=='ENOENT')throw error;}
 // Resolve filenames through the inventory, never through untrusted patch paths.
 const inventory=await inventoryInstallation(installation,patch?.game);
 if(inventory.files.some(file=>file.path.toLowerCase()==='ishar-ck-mod-manifest.json'))throw Error('Installation already contains an export manifest; use the pristine source installation');
 if(inventory.excluded.length)throw Error('Installation contains links/special files; make an explicit regular-file working copy first');
 const resource=inventory.files.find(file=>file.path.toUpperCase()===String(patch?.resource).toUpperCase());
 if(!resource)throw Error('Patch resource not found at installation root');
 const original=new Uint8Array(await readFile(join(installation,resource.path))),modified=await applyContPatch(original,patch);
 // Validate completely before creating any output. Existing directories never merge.
 await mkdir(dirname(output),{recursive:true});await mkdir(output);
 for(const file of inventory.files){
  const input=join(installation,file.path);
  if((await lstat(input)).isSymbolicLink())throw Error('Source changed to link during export');
  const bytes=await readFile(input);
  if(await sha256(bytes)!==file.sha256)throw Error(`Source changed during export: ${file.path}`);
  const target=join(output,file.path);await mkdir(dirname(target),{recursive:true});
  await writeFile(target,file.path===resource.path?modified:bytes,{flag:'wx'});
 }
 const report={format:'ishar-ck-mod-export',version:1,game:patch.game,sourceProfileSha256:inventory.profileSha256,patch,verification:'prepared-not-tested-in-original',changedFiles:[resource.path]};
 // Read back every output file and verify the patch is the ONLY binary change.
 for(const file of inventory.files){
  const expected=file.path===resource.path?patch.targetSha256:file.sha256;
  if(await sha256(new Uint8Array(await readFile(join(output,file.path))))!==expected)throw Error(`Export readback mismatch: ${file.path}`);
 }
 await writeFile(join(output,'ishar-ck-mod-manifest.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [command,...args]=process.argv.slice(2);
 if(command==='diff'){
  const [source,edited,output]=args;if(!source||!edited||!output)throw Error('diff <original CONT> <edited CONT> <new patch.json>');
  const patch=await createContPatch(new Uint8Array(await readFile(source)),new Uint8Array(await readFile(edited)),basename(source));
  // Metadata export must also stay outside the original installation directory.
  if(within(dirname(await realpath(source)),await physical(output)))throw Error('Patch output must be outside original directory');
  await writeFile(output,JSON.stringify(patch,null,2)+'\n',{flag:'wx'});console.log(`${patch.edits.length} byte changes; source ${patch.sourceSha256}`);
 }else if(command==='apply'){
  const [root,patchFile,output]=args;if(!root||!patchFile||!output)throw Error('apply <original installation> <patch.json> <new output directory>');
  const report=await exportContMod(root,JSON.parse(await readFile(patchFile,'utf8')),output);console.log(JSON.stringify(report));
 }else throw Error('Usage: node scripts/cont-mod.mjs diff|apply ...');
}
