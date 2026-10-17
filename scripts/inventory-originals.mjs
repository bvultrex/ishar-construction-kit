import {createHash} from 'node:crypto';
import {readdir,readFile,lstat,mkdir,writeFile,realpath} from 'node:fs/promises';
import {resolve,relative,join,extname,isAbsolute,dirname,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function physical(path){
 path=resolve(path);try{return await realpath(path);}catch(error){if(error.code!=='ENOENT')throw error;return join(await physical(dirname(path)),basename(path));}
}
const within=(root,path)=>{const rel=relative(root,path);return !rel||(!rel.startsWith('..')&&!isAbsolute(rel));};
/** Read-only inventory: filenames/lengths/hashes only; never follows symlinks. */
export async function inventoryInstallation(root,game){
 root=await realpath(root);if(!(await lstat(root)).isDirectory())throw Error('Installation must be a directory');const files=[],excluded=[];
 async function walk(dir){
  const names=(await readdir(dir)).sort();
  for(const name of names){
   const path=join(dir,name),stat=await lstat(path),rel=relative(root,path).replaceAll('\\','/');
   if(stat.isSymbolicLink()){excluded.push({path:rel,reason:'symbolic-link'});continue;}
   if(stat.isDirectory()){await walk(path);continue;}
   if(!stat.isFile()){excluded.push({path:rel,reason:'not-regular-file'});continue;}
   const bytes=await readFile(path);
   files.push({path:rel,size:bytes.length,sha256:sha(bytes),extension:extname(name).toUpperCase(),...(bytes[0]===77&&bytes[1]===90?{executableSignature:'MZ'}:{})});
  }
 }
 await walk(root);
 const extensions={};for(const file of files){const key=file.extension||'(none)';extensions[key]=(extensions[key]??0)+1;}
 return {schemaVersion:1,game,profileSha256:sha(JSON.stringify(files)),version:'unidentified: hash profile only',language:'unverified',platform:files.some(f=>f.executableSignature==='MZ')?'DOS-compatible MZ executable present; exact target unverified':'unverified',fileCount:files.length,totalBytes:files.reduce((sum,f)=>sum+f.size,0),extensions,files,excluded};
}
export async function separateAnalysisOutput(roots,output){
 output=await physical(output);
 for(const root of roots)if(within(await realpath(root),output))throw Error('Output must be outside original installations');
 return output;
}
export async function writeInventory(installations,output){
 output=await separateAnalysisOutput(installations.map(item=>item.root),output);
 const reports=[];for(const {root,game} of installations)reports.push(await inventoryInstallation(root,game));
 await mkdir(output,{recursive:true});
 for(const report of reports){
  const target=join(output,report.game+'-inventory.json'),body=JSON.stringify(report,null,2)+'\n';
  try{await writeFile(target,body,{flag:'wx'});}catch(error){if(error.code!=='EEXIST'||await readFile(target,'utf8')!==body)throw error;}
 }
 return reports;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [ishar1,ishar2,output]=process.argv.slice(2);
 if(!ishar1||!ishar2||!output)throw Error('Usage: node scripts/inventory-originals.mjs <Ishar1-dir> <Ishar2-dir> <separate-output-dir>');
 const reports=await writeInventory([{root:ishar1,game:'ishar1'},{root:ishar2,game:'ishar2'}],output);
 for(const report of reports)console.log(JSON.stringify({game:report.game,files:report.fileCount,bytes:report.totalBytes,profile:report.profileSha256,extensions:report.extensions}));
}
