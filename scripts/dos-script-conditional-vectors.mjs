import {branchOriginalDosScriptConditional} from '../src/lib/ishar/original-dos-script-conditional.ts';
const cases=[];
for(let opcode=18;opcode<=29;opcode++){
 const kind=(opcode-18)%3;
 for(const raw of (kind===0?Array.from({length:256},(_,i)=>i):[0,1,127,128,255,32767,32768,65535]))for(const [dx,cx] of [[0,0],[0,1],[1,1],[65535,0]])for(const si of [0x101,kind===0?65535:65534]){
  const script=new Uint8Array(65536);script[si]=raw&255;if(kind!==0)script[si+1]=raw>>>8;
  cases.push({opcode,raw,si,dx,cx,expected:branchOriginalDosScriptConditional(script,opcode,si,dx,cx)});
 }
}
console.log(JSON.stringify(cases));
