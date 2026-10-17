import {readFile,writeFile,mkdir,realpath} from 'node:fs/promises';
import {dirname} from 'node:path';
import {readAlisModule,writeAlisModule} from '../src/lib/ishar/alis-module.ts';
import {sha256} from '../src/lib/ishar/cont-patch.ts';
import {separateAnalysisOutput} from './inventory-originals.mjs';
const [command,source,arg1,arg2]=process.argv.slice(2);
if(!source||!['inspect','extract','replace-image'].includes(command))throw Error('Usage: alis-module.mjs inspect <original.IO> | extract <original.IO> <new image.bin> | replace-image <original.IO> <edited image.bin> <new output.IO>');
const sourcePhysical=await realpath(source);
const bytes=new Uint8Array(await readFile(sourcePhysical)),module=readAlisModule(bytes);
const metadata={encoding:module.encoding,isMain:module.isMain,sourceSha256:await sha256(bytes),imageSha256:await sha256(module.image),header:module.header};
if(command==='inspect')console.log(JSON.stringify(metadata,null,2));
else{
 const requested=command==='extract'?arg1:arg2;
 if(!requested||(command==='replace-image'&&!arg1))throw Error('New output path required');
 const output=await separateAnalysisOutput([dirname(sourcePhysical)],requested);
 const data=command==='extract'?module.image:writeAlisModule(module,new Uint8Array(await readFile(arg1)));
 // No overwrites, no writes within the source installation directory.
 await mkdir(dirname(output),{recursive:true});await writeFile(output,data,{flag:'wx'});
 const stored=new Uint8Array(await readFile(output));
 if(await sha256(stored)!==await sha256(data))throw Error('Output file readback mismatch');
 console.log(JSON.stringify({...metadata,outputSha256:await sha256(stored),outputBytes:stored.length,verification:'decoded-readback-only; not tested in original execution'},null,2));
}
