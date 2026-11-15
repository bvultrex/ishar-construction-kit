import {readFileSync} from 'node:fs';
import {prepareOriginalDosTimerInstall as prepare} from '../src/lib/ishar/original-dos-timer-install.ts';
const memory=readFileSync(process.argv[2]),template=memory.subarray(0x18eb8,0x18f22),cases=[];
for(const speedIndex of [0,9,19])for(const length of [0,1,32767,32768,65535])for(const offset of [0x100,0x9000]){
 const result=prepare(template,0x2000,offset,length,memory[0x18e11+speedIndex],0x4567);
 cases.push({speedIndex,length,offset,expected:{...result,bytes:Buffer.from(result.bytes).toString('base64')}});
}
console.log(JSON.stringify(cases));
