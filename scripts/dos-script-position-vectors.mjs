import {createHash} from 'node:crypto';
import {writeOriginalDosScriptPosition} from '../src/lib/ishar/original-dos-script-position.ts';
const cases=[];
for(const a of [0,2,6,8])for(const b of [0,2,6,8])for(const c of [0,2,6,8])for(const seed of [0,1,128,255,32768,65535]){
 const tags=[a,b,c],script=new Uint8Array(65536),context=new Uint8Array(65536).fill(0xa5),bp=0x200;
 let si=0x101;for(let i=0;i<3;i++){const tag=tags[i],raw=tag<6?seed:(i===0?4:0);script[si++]=tag;script[si++]=raw&255;if(tag!==0)script[si++]=raw>>>8;}
 const next=writeOriginalDosScriptPosition(script,context,0x101,bp);
 cases.push({tags,seed,script:Array.from(script.slice(0x101,si)),expected:{si:next.si,values:next.values,hash:createHash('sha256').update(next.memory).digest('hex')}});
}
console.log(JSON.stringify(cases));
