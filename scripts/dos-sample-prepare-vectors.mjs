import {prepareOriginalDosSample} from '../src/lib/ishar/original-dos-sample-prepare.ts';
const vectors=[];
for(let speed=0;speed<256;speed++)for(const total of [0,16,65535]){
 const header=new Uint8Array(16);header[0]=1;header[1]=13;header[2]=total&255;header[3]=total>>>8;
 vectors.push({header:[...header],segment:0x2000,offset:0x100,speed,expected:prepareOriginalDosSample(header,0x2000,0x100,speed)});
}
console.log(JSON.stringify(vectors));
