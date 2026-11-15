import {readFile,writeFile,mkdir,realpath} from 'node:fs/promises';
import {resolve,join,dirname,basename,relative,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createContPatch,applyContPatch} from '../src/lib/ishar/cont-patch.ts';
import {exportOriginalModCopy} from './original-mod-copy.mjs';
async function physical(path){path=resolve(path);try{return await realpath(path);}catch(error){if(error.code!=='ENOENT')throw error;return join(await physical(dirname(path)),basename(path));}}
const within=(root,path)=>{const rel=relative(root,path);return !rel||(!rel.startsWith('..')&&!isAbsolute(rel));};
/** Validate the complete CONT patch before creating a separate installation copy. */
export async function exportContMod(installation,patch,output){
 return exportOriginalModCopy(installation,patch?.resource,patch?.game,async original=>({
  bytes:await applyContPatch(original,patch),metadata:{format:'ishar-ck-mod-export',version:1,patch},
 }),output);
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
