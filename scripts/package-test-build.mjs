import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,readdirSync,lstatSync,mkdirSync} from 'node:fs';
import {resolve,dirname,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import JSZip from 'jszip';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
if(git('status','--porcelain'))throw Error('Testpaket benötigt einen sauberen, committeten Quellstand.');
const commit=git('rev-parse','HEAD'),short=commit.slice(0,7);
// Build stamp and package provenance always use the same committed revision.
execFileSync(process.execPath,[join(root,'node_modules/vite/bin/vite.js'),'build'],{cwd:root,env:{...process.env,BUILD_SHA:short},stdio:'inherit'});
const output=resolve(root,'..',`testbuild-${short}`),archive=output+'.zip';
// No overwriting, merging stale build files or recursive deletion of prior packages.
mkdirSync(output);
const zip=new JSZip(),files=[];
function include(name){
 const source=join(root,name),stat=lstatSync(source);
 if(stat.isSymbolicLink())throw Error('Symlinks sind im Testpaket nicht erlaubt: '+name);
 if(stat.isDirectory()){for(const child of readdirSync(source).sort())include(join(name,child));return;}
 if(!stat.isFile())throw Error('Unbekannter Dateityp: '+name);
 const path=relative(root,source).replaceAll('\\','/'),bytes=readFileSync(source),target=join(output,path);
 mkdirSync(dirname(target),{recursive:true});writeFileSync(target,bytes,{flag:'wx'});zip.file(path,bytes);
 files.push({path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
// Explicit allowlist: no original installations, saves, listings or private evidence.
for(const name of ['dist','package.json','package-lock.json','scripts/serve-build.mjs','README_TEST_BUILD.txt','TEST_BUILD_CHANGES.md'])include(name);
const manifest=JSON.stringify({commit,branch:git('branch','--show-current'),createdUtc:new Date().toISOString(),files},null,2)+'\n';
writeFileSync(join(output,'BUILD_MANIFEST.json'),manifest,{flag:'wx'});zip.file('BUILD_MANIFEST.json',manifest);
const bytes=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE',compressionOptions:{level:6}});
writeFileSync(archive,bytes,{flag:'wx'});
console.log(JSON.stringify({directory:output,archive,commit,sha256:createHash('sha256').update(bytes).digest('hex'),fileCount:files.length+1},null,2));
