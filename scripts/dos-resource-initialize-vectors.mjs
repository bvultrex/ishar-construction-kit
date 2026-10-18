import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {initializeOriginalDosResourceRuntime} from '../src/lib/ishar/original-dos-resource-initialize.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
const fixtures=[];
for(const count of [0,1,2,3,50,32767,32768,65535])for(const table of [0,0x100,0xff00])fixtures.push({count,table,base:0,ds:0x6000,frontier:0x6200});
for(const base of [0,2,0xff00])for(const ds of [0x5000,0x6000,0x7000])for(const frontier of [ds,ds+1,ds+16,ds+512,65535])fixtures.push({count:5,table:0x100,base,ds,frontier});
for(const fixture of fixtures){
 const memory=source.slice(),ss=0x1c0b,es=0x5000;memory.fill(0x5a,ss*16,ss*16+0x28c0);memory.fill(0xa5,es*16,es*16+65536);memory.fill(0xcc,fixture.ds*16,fixture.ds*16+65536);
 const v=new DataView(memory.buffer);for(const [at,value] of [[0xbd2,fixture.table],[0xbda,fixture.count],[0xbe0,fixture.base],[0xbe2,fixture.ds],[0xbe6,fixture.frontier]])v.setUint16(ss*16+at,value,true);
 const before=createHash('sha256').update(memory).digest('hex'),next=initializeOriginalDosResourceRuntime(memory,ss,es);
 if(createHash('sha256').update(memory).digest('hex')!==before)throw Error('Initialization mutated source memory');
 next.memory.fill(0,ss*16+0x7fc0,ss*16+0x8010); // CPU stack residue excluded; registers/SP checked separately.
 cases.push({...fixture,expected:{hash:createHash('sha256').update(next.memory).digest('hex'),tableRecords:next.tableRecords,links:next.links}});
}
console.log(JSON.stringify(cases));
