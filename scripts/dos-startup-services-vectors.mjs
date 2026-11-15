import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareOriginalDosStartupServices as prepare} from '../src/lib/ishar/original-dos-startup-services.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const currentDrive of [0,2])for(const driveCount of [2,5])for(const systemId of [0,0xfc,0xfe,0xff])for(const scenario of ['success','chdir-fail','create-fail','second']){
 const m=source.slice();m[0xffffe]=systemId;
 const reply={currentDrive,driveCount,currentDirectory:Uint8Array.of(84,69,83,84,0),handle:42,attempts:Array.from({length:3},(_,i)=>({chdirError:scenario==='chdir-fail'||scenario==='second'&&i===0,createError:scenario==='create-fail'})),vector24:{offset:0x1234,segment:0x7000},vector0:{offset:0x2345,segment:0x7100},diskResetWrites:[[{address:0x475,data:Uint8Array.of(0)}],[{address:0x475,data:Uint8Array.of(1)}]]},before=m.slice(),{memory,...result}=prepare(m,0x1c0b,reply);
 if(!m.every((x,i)=>x===before[i]))throw Error('Services mutated source');memory.fill(0,0x1c0b0+0xfeec,0x1c0b0+0xff00);cases.push({currentDrive,driveCount,systemId,scenario,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
