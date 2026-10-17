import {readFileSync} from 'node:fs';
import {readOriginalDosOpcodeDispatch} from '../src/lib/ishar/original-dos-opcode-dispatch.ts';
const capture=new Uint8Array(readFileSync(process.argv[2])),code=capture.slice(0x10000,0x20000),script=new Uint8Array(65536),cases=[];
for(let opcode=0;opcode<256;opcode++)for(const si of [0,0x1234,65535])for(const df of [false,true]){
 script[si]=opcode;cases.push({opcode,si,df,expected:readOriginalDosOpcodeDispatch(code,script,si,df)});
}
console.log(JSON.stringify(cases));
