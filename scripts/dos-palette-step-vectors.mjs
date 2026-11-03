import {stepOriginalDosPalette} from '../src/lib/ishar/original-dos-palette-step.ts';
import {createHash} from 'node:crypto';
const cases=[];
for(const step of [0,1,4,63,128,255])for(let start=0;start<65536;start+=768){
 const current=new Uint8Array(768),target=new Uint8Array(768);
 for(let i=0;i<768;i++){const pair=Math.min(start+i,65535);current[i]=pair>>>8;target[i]=pair&255;}
 const result=stepOriginalDosPalette(current,target,step);
 cases.push({step,current:Buffer.from(current).toString('base64'),target:Buffer.from(target).toString('base64'),sha256:createHash('sha256').update(result.bytes).digest('hex'),active:result.active});
}
console.log(JSON.stringify(cases));
