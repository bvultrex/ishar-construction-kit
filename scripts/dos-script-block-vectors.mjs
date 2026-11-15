import {createHash} from 'node:crypto';
import {writeOriginalDosScriptBlock} from '../src/lib/ishar/original-dos-script-block.ts';
const cases=[];
for(let count=0;count<256;count++)for(const offset of [0,16,65534])for(const bp of [0,0x200]){
 const script=new Uint8Array(65536),context=new Uint8Array(65536).fill(0xa5);script[0x101]=offset&255;script[0x102]=offset>>>8;script[0x103]=count;script[0x104]=0x87;
 for(let i=0;i<count*2;i++)script[0x105+i]=(i*13+count)&255;
 const {memory,...expected}=writeOriginalDosScriptBlock(script,context,0x101,bp);
 cases.push({count,offset,bp,expected:{...expected,memorySha256:createHash('sha256').update(memory).digest('hex')}});
}
console.log(JSON.stringify(cases));
