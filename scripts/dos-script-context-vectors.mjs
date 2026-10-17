import {createHash} from 'node:crypto';
import {createOriginalDosScriptContext} from '../src/lib/ishar/original-dos-script-context.ts';
const cases=[];
for(const prefix of [0,16])for(const length of [0,2,8])for(const extra of [0,10])for(const pool of [0x200,0xfff0])for(const limit of [0,65535]){
 const header=new Uint8Array(24),v=new DataView(header.buffer);v.setUint16(0,123,true);v.setUint16(2,65534,true);header[5]=0x87;v.setUint16(18,prefix,true);v.setUint16(20,length,true);v.setUint16(22,extra,true);
 const result=createOriginalDosScriptContext(new Uint8Array(65536).fill(0xa5),header,0x100,0x4000,0x100,6,pool,0x5000,limit);
 const {memory,...expected}=result;cases.push({header:[...header],pool,limit,expected:{...expected,memorySha256:createHash('sha256').update(memory).digest('hex')}});
}
console.log(JSON.stringify(cases));
