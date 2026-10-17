import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {createOriginalDosScriptContext} from '../src/lib/ishar/original-dos-script-context.ts';
const cases=[];
if(process.argv[2]){
 for(const name of readdirSync(process.argv[2]).filter(name=>/\.IO$/i.test(name)).sort()){
  const source=new Uint8Array(readFileSync(join(process.argv[2],name))),module=readAlisModule(source),header=module.image.slice(0,24);
  const result=createOriginalDosScriptContext(new Uint8Array(65536).fill(0xa5),header,0x100,0x4000,0x100,6,0x200,0x5000,65535);
  const {memory,...expected}=result;
  cases.push({name,sourceSha256:createHash('sha256').update(source).digest('hex'),header:[...header],pool:0x200,limit:65535,parserEntry:module.header.entry,expected:{...expected,memorySha256:createHash('sha256').update(memory).digest('hex')}});
 }
}else{
for(const prefix of [0,16])for(const length of [0,2,8])for(const extra of [0,10])for(const pool of [0x200,0xfff0])for(const limit of [0,65535]){
 const header=new Uint8Array(24),v=new DataView(header.buffer);v.setUint16(0,123,true);v.setUint16(2,65534,true);header[5]=0x87;v.setUint16(18,prefix,true);v.setUint16(20,length,true);v.setUint16(22,extra,true);
 const result=createOriginalDosScriptContext(new Uint8Array(65536).fill(0xa5),header,0x100,0x4000,0x100,6,pool,0x5000,limit);
 const {memory,...expected}=result;cases.push({header:[...header],pool,limit,expected:{...expected,memorySha256:createHash('sha256').update(memory).digest('hex')}});
}
}
console.log(JSON.stringify(cases));
