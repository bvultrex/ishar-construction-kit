import {readFileSync} from 'node:fs';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {planOriginalDosResourceTables} from '../src/lib/ishar/original-dos-resource-memory.ts';
const bytes=new Uint8Array(readFileSync(process.argv[2]));
const module=readAlisModule(bytes);
if(!module.isMain||module.envelopeBytes!==22)throw Error('Expected MAIN module with VM specification');
const header=bytes.slice(6,22),cases=[];
for(const segment of [0x3000,0x5000])for(const offset of [0,0xfff0])for(const frontier of [0x6000,0x9000])
 cases.push({segment,offset,frontier,expected:planOriginalDosResourceTables(header,segment,offset,frontier,0x1234)});
console.log(JSON.stringify({envelopeBytes:module.envelopeBytes,decodedBytes:module.image.length,cases}));
