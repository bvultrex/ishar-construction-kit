import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {readStartupSettings,writeStartupSettings} from '../src/lib/ishar/startup-settings.ts';
const [command,input,output,...args]=process.argv.slice(2);
try{
 if(!input||!['inspect','patch'].includes(command))throw Error('Usage: startup-settings.mjs inspect INPUT | patch INPUT OUTPUT TAG=BYTE ... (BYTE decimal0..255)');
 const source=new Uint8Array(await readFile(input)),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
 if(command==='inspect'){
  if(output!==undefined)throw Error('inspect accepts only INPUT');
  console.log(JSON.stringify({sha256:hash(source),...readStartupSettings(source)},null,2));
 }else{
  if(!output||!args.length||resolve(input).toLowerCase()===resolve(output).toLowerCase())throw Error('patch needs a separate, new OUTPUT and at least one TAG=BYTE change');
  const changes={};for(const arg of args){const match=/^([RVSPJMK])=(\d{1,3})$/.exec(arg);if(!match||match[1] in changes)throw Error(`Invalid or duplicate setting: ${arg}`);changes[match[1]]=Number(match[2]);}
  const edited=writeStartupSettings(source,changes);await writeFile(output,edited,{flag:'wx'});
  console.log(JSON.stringify({inputSha256:hash(source),outputSha256:hash(edited),changes,byteLength:edited.length},null,2));
 }
}catch(error){console.error(error.message);process.exitCode=1;}
