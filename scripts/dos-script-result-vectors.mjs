import {createHash} from 'node:crypto';
import {storeOriginalDosScriptResult} from '../src/lib/ishar/original-dos-script-result.ts';
const hash=v=>createHash('sha256').update(v).digest('hex'),cases=[];
for(const tag of [6,8,18,20])for(const value of [0,1,127,128,255,32767,32768,65535])for(const offset of (tag<18?[0,255,65520]:[0,127,255]))for(const bp of [0,0x200]){
 const script=new Uint8Array(65536),context=new Uint8Array(65536).fill(0xa5),globals=new Uint8Array(65536).fill(0xa5);
 globals.set([0x34,0x12],0xc58);globals.set([0x78,0x56],0xc5c);script.set([tag,offset&255,offset>>>8],0x101);
 const result=storeOriginalDosScriptResult(script,context,globals,0x101,bp,value);
 cases.push({tag,value,offset,bp,expected:{si:result.si,contextHash:hash(result.memory),globalsHash:hash(result.globals.subarray(0,0x2200))}});
}
console.log(JSON.stringify(cases));
