import {readFile,writeFile,mkdir,realpath,lstat} from 'node:fs/promises';
import {resolve,join,dirname,basename,relative,isAbsolute} from 'node:path';
import {inventoryInstallation} from './inventory-originals.mjs';
import {sha256} from '../src/lib/ishar/cont-patch.ts';
async function physical(path){path=resolve(path);try{return await realpath(path);}catch(error){if(error.code!=='ENOENT')throw error;return join(await physical(dirname(path)),basename(path));}}
const within=(root,path)=>{const rel=relative(root,path);return !rel||(!rel.startsWith('..')&&!isAbsolute(rel));};
/** One resource replacement in a new, fully inventoried installation copy.
 * prepare validates/encodes before output creation. No merging or in-place patch.
 */
export async function exportOriginalModCopy(installation,resourceName,game,prepare,output){
 installation=await realpath(installation);output=await physical(output);
 if(within(installation,output)||within(output,installation))throw Error('Output must be separate from original installation');
 try{await lstat(output);throw Error('Output already exists; choose a new directory');}catch(error){if(error.code!=='ENOENT')throw error;}
 const inventory=await inventoryInstallation(installation,game);
 if(inventory.files.some(file=>file.path.toLowerCase()==='ishar-ck-mod-manifest.json'))throw Error('Installation already contains an export manifest; use the pristine source installation');
 if(inventory.excluded.length)throw Error('Installation contains links/special files; make an explicit regular-file working copy first');
 const resource=inventory.files.find(file=>file.path.toUpperCase()===String(resourceName).toUpperCase());
 if(!resource)throw Error('Patch resource not found at installation root');
 const original=new Uint8Array(await readFile(join(installation,resource.path)));
 if(await sha256(original)!==resource.sha256)throw Error('Source changed before validation');
 const {bytes:modified,metadata}=await prepare(original);
 if(!(modified instanceof Uint8Array))throw Error('Prepared resource must be bytes');
 const targetSha256=await sha256(modified);
 await mkdir(dirname(output),{recursive:true});await mkdir(output);
 for(const file of inventory.files){
  const input=join(installation,file.path);
  if((await lstat(input)).isSymbolicLink())throw Error('Source changed to link during export');
  const bytes=await readFile(input);if(await sha256(bytes)!==file.sha256)throw Error(`Source changed during export: ${file.path}`);
  const target=join(output,file.path);await mkdir(dirname(target),{recursive:true});await writeFile(target,file.path===resource.path?modified:bytes,{flag:'wx'});
 }
 for(const file of inventory.files){
  const expected=file.path===resource.path?targetSha256:file.sha256;
  if(await sha256(new Uint8Array(await readFile(join(output,file.path))))!==expected)throw Error(`Export readback mismatch: ${file.path}`);
 }
 if((await inventoryInstallation(installation,game)).profileSha256!==inventory.profileSha256)throw Error('Source installation changed during export');
 const report={...metadata,game,sourceProfileSha256:inventory.profileSha256,verification:'prepared-not-tested-in-original',changedFiles:[resource.path]};
 await writeFile(join(output,'ishar-ck-mod-manifest.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 return report;
}
