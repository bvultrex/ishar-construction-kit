import {createHash} from 'node:crypto';
import {selectOriginalDosScriptWord} from '../src/lib/ishar/original-dos-script-selection.ts';
const cases=[];
for(const value of [0,1,127,128,255,32767,32768,65535])for(const previous of [0,1,65535])for(const bp of [0,0x200,65535])for(const si of [0x101,65534]){
 const script=new Uint8Array(65536),context=new Uint8Array(65536).fill(0xa5),at=(bp-0x16)&65535;
 script[si]=value&255;script[si+1]=value>>>8;context[at]=previous&255;context[at+1]=previous>>>8;
 const next=selectOriginalDosScriptWord(script,context,si,bp);
 cases.push({value,previous,bp,si,expected:{si:next.si,value:next.value,hash:createHash('sha256').update(next.memory).digest('hex')}});
}
console.log(JSON.stringify(cases));
