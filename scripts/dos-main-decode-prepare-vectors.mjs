import {createHash} from 'node:crypto';
import {prepareOriginalDosMainDecode} from '../src/lib/ishar/original-dos-main-decode.ts';
const cases=[];
for(const pack of [0,1,127,128,129,160,161,255])for(const low of [0,21,22,65535])for(const high of [0,1,255])for(const offset of [0,65520]){
 const globals=new Uint8Array(65536).fill(0x5a),v=new DataView(globals.buffer);v.setUint16(0x2480,low,true);v.setUint16(0x2482,(pack<<8)|high,true);v.setUint16(0xbc8,offset,true);v.setUint16(0xbca,0x5000,true);
 const next=prepareOriginalDosMainDecode(globals),{memory,...expected}=next;cases.push({pack,low,high,offset,expected:{...expected,globalsHash:createHash('sha256').update(memory.subarray(0,0x28c0)).digest('hex')}});
}
console.log(JSON.stringify(cases));
