import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {detectOriginalDosConfigurationDevices as detect} from '../src/lib/ishar/original-dos-configuration-detection.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const countryAL of [0x21,0x31,0x27,0])for(const mouseAX of [0,65535])for(const adlibAfter of [0,0xc0])for(const soundBlasterRead of [0,0xaa]){
 const replies={countryAL,mouseAX,videoAL:0x1a,adlibBefore:0,adlibAfter,speakerRead:255,soundBlasterRead,joystickRead:0},before=source.slice(),{memory,...result}=detect(source,0x23d7,replies);
 if(!source.every((v,i)=>v===before[i]))throw Error('Detection mutated input');
 memory.fill(0,0x1c0b0+0xfec0,0x1c0b0+0xff00);
 cases.push({replies,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
