import {readOriginalDosNumericOperand} from '../src/lib/ishar/original-dos-numeric-operand.ts';
const cases=[];
for(const tag of [0,2,6,8,18,20])for(const value of ([0,6,18].includes(tag)?Array.from({length:256},(_,i)=>i):[0,1,127,128,255,32767,32768,65535]))for(const offset of (tag===18||tag===20?[0,240]:[0,65520])){
 const script=new Uint8Array(65536),context=new Uint8Array(65536).fill(0xa5),raw=tag<6?value:offset;
 script.set([tag,raw&255,raw>>>8],0x101);context[(0x200+offset)&65535]=value&255;context[(0x201+offset)&65535]=value>>>8;
 cases.push({tag,value,offset,expected:readOriginalDosNumericOperand(script,context,0x101,0x200)});
}
console.log(JSON.stringify(cases));
