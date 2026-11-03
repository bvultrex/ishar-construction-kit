import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {queryOriginalDosMemoryValue} from '../src/lib/ishar/original-dos-memory-query.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const selector of [0,1,2,3,4,5,65535])for(const seed of [0,1,15,32768,65520,65535])for(const length of [0,1,3,501]){
 const m=source.slice(),v=new DataView(m.buffer),g=0x1c0b0,words={};
 for(const [index,at] of [0xb94,0xb96,0xbca,0xbc8,0xbe0,0xbe2,0xbd6,0xbd8,0xbcc,0xbce,0xbda,0xbdc].entries()){const value=(seed*(index+1)+index*17)&65535;words[at]=value;v.setUint16(g+at,value,true);}
 for(const [at,value] of [[0xbec,length?38:0],[0xbe8,0x100],[0xbea,0x5000]]){words[at]=value;v.setUint16(g+at,value,true);}
 for(let n=0;n<length;n++)v.setUint16(0x50000+0x100+38*(n+1)+4,n+1===length?0:38*(n+2),true);
 const before=m.slice(),dx=queryOriginalDosMemoryValue(m.subarray(g,g+65536),selector,m);if(!m.every((x,i)=>x===before[i]))throw Error('Query mutated memory');m.fill(0,g+0xfec0,g+0xff02);
 cases.push({selector,seed,length,words,dx,hash:createHash('sha256').update(m).digest('hex')});
}
console.log(JSON.stringify(cases));
