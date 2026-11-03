import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {probeOriginalDosConfigurationDrives as probe} from '../src/lib/ishar/original-dos-configuration-drives.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const currentDrive of [0,2,5])for(const driveCount of [2,3,5])for(const scenario of ['success','chdir-fail','create-fail','second']){
 const attempts=Array.from({length:3},(_,i)=>({chdirError:scenario==='chdir-fail'||scenario==='second'&&i===0,createError:scenario==='create-fail'}));
 const reply={currentDrive,driveCount,currentDirectory:Uint8Array.of(84,69,83,84,0),handle:5,attempts},before=source.slice(),{memory,...result}=probe(source,0x23d7,reply);
 if(!source.every((v,i)=>v===before[i]))throw Error('Drive probe mutated source');memory.fill(0,0x1c0b0+0xfeee,0x1c0b0+0xff00);
 cases.push({currentDrive,driveCount,scenario,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
