import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readAlisModule,writeAlisModule} from '../src/lib/ishar/alis-module.ts';
import {sha256} from '../src/lib/ishar/cont-patch.ts';
import {exportOriginalModCopy} from './original-mod-copy.mjs';
/** Length-preserving decoded-image edit, re-encoded only inside a work copy. */
export async function exportAlisMod(installation,game,resource,editedImage,output){
 if(!['ishar1','ishar2'].includes(game)||!/^[-\w]+\.IO$/i.test(resource))throw Error('Explicit Ishar profile and root IO basename required');
 return exportOriginalModCopy(installation,resource,game,async original=>{
  const module=readAlisModule(original),bytes=writeAlisModule(module,editedImage),back=readAlisModule(bytes);
  if(back.image.length!==editedImage.length||!back.image.every((value,i)=>value===editedImage[i]))throw Error('ALIS resource readback mismatch');
  const changedImageOffsets=[];for(let i=0;i<editedImage.length;i++)if(editedImage[i]!==module.image[i])changedImageOffsets.push(i);
  return {bytes,metadata:{format:'ishar-ck-alis-mod-export',version:1,profileEvidence:'caller-selected; complete installation hash recorded',resource,encoding:module.encoding,sourceSha256:await sha256(original),targetSha256:await sha256(bytes),sourceImageSha256:await sha256(module.image),targetImageSha256:await sha256(editedImage),changedImageOffsets}};
 },output);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [game,installation,resource,image,output]=process.argv.slice(2);
 if(!output)throw Error('Usage: alis-mod.mjs <ishar1|ishar2> <installation> <resource.IO> <edited image.bin> <new copy directory>');
 console.log(JSON.stringify(await exportAlisMod(installation,game,resource,new Uint8Array(await readFile(image)),output),null,2));
}
