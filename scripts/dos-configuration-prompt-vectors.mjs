import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runOriginalDosConfigurationPrompt as prompt} from '../src/lib/ishar/original-dos-configuration-prompt.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
const scenarios=[{seconds:[0,4],keys:[]},{seconds:[58,2],keys:[]},{seconds:[0,0],keys:[83]},{seconds:[58,59],keys:[0,46]},{seconds:[0,0,1,4],keys:[13,0,0]},{seconds:[0,0,4],keys:[115]}];
for(const language of [0,1,2])for(const flag of [0,1])for(const replies of scenarios){
 const m=source.slice(),v=new DataView(m.buffer);v.setUint16(0x23d70+0xb92,language,true);m[0x23d70+0xb90]=flag;
 const before=m.slice(),{memory,...result}=prompt(m,0x23d7,{...replies,cursorDX:0xb14});if(!m.every((x,i)=>x===before[i]))throw Error('Prompt mutated source');
 memory.fill(0,0x1c0b0+0xfec0,0x1c0b0+0xff00);cases.push({language,flag,replies:{...replies,cursorDX:0xb14},...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
