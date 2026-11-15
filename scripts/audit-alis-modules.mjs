import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {separateAnalysisOutput} from './inventory-originals.mjs';
import {readAlisModule,writeAlisModule} from '../src/lib/ishar/alis-module.ts';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
let output=process.argv[2];if(!output)throw Error('Output report directory required');
output=await separateAnalysisOutput(['ISHAR1_DIR','ISHAR2_DIR'].map(name=>{if(!process.env[name])throw Error(`${name} required`);return process.env[name];}),output);
const reports=[];
for(const [game,env] of [['ishar1','ISHAR1_DIR'],['ishar2','ISHAR2_DIR']]){
 const root=process.env[env];if(!root)throw Error(`${env} is required; no silent skips`);
 const modules=[];
 for(const name of (await readdir(root)).filter(name=>name.toUpperCase().endsWith('.IO')).sort()){
  const bytes=new Uint8Array(await readFile(join(root,name)));
  try{
   const module=readAlisModule(bytes),back=writeAlisModule(module);
   if(hash(back)!==hash(bytes))throw Error('No-op writer changed original bytes');
   modules.push({name,sourceBytes:bytes.length,sourceSha256:hash(bytes),imageBytes:module.image.length,imageSha256:hash(module.image),encoding:module.encoding,isMain:module.isMain,header:module.header,noOpRoundtrip:true});
  }catch(error){modules.push({name,sourceBytes:bytes.length,sourceSha256:hash(bytes),error:String(error)});}
 }
 const report={schemaVersion:1,game,claim:'resource-envelope-and-image-header audit only; not complete decompilation',modules};
 reports.push(report);console.log(game,modules.length,'modules;',modules.filter(module=>module.error).length,'errors');
 for(const module of modules.filter(module=>module.error))console.log(module.name,module.error);
}
// Reports contain hashes/structure only. CLI output is local, exclusive creation.
await mkdir(resolve(output),{recursive:true});
for(const report of reports)await writeFile(join(resolve(output),report.game+'-alis-modules.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
if(reports.some(report=>report.modules.some(module=>module.error)))process.exitCode=1;
