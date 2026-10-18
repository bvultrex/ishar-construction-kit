import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {projectOriginalDosRecord as project} from '../src/lib/ishar/original-dos-record-projection.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const ds of [0x7000,0x1c0b])for(const es of [0x5000,0x1c0b])for(const mode of ['skip-object','skip-record','perspective','fault'])for(const transform of [false,true])for(const assetType of [1,3])for(const grid of [0,4]){
 const m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer);m.fill(0,g,g+0x28c0);m.fill(0,0x50000,0x61000);m.fill(0,0x70000,0x80000);
 const word=(s,o,value)=>v.setUint16(s*16+(o&65535),value,true),byte=(s,o,value)=>m[s*16+o]=value;
 word(0x1c0b,0xbf6,0x200);word(0x1c0b,0xb18,222);word(0x1c0b,0xb20,123);
 byte(es,0x301,transform?128:0);byte(es,0x31c,1);byte(es,0x31d,mode==='skip-object'?255:1);byte(es,0x31e,2);word(es,0x30a,17);word(es,0x30c,23);
 byte(es,0x324,1);if(transform){byte(es,0x320,1);byte(es,0x328,1);}
 word(ds,0x1002,0x100);word(ds,0x1012,0x100);word(ds,0x1014,0x6000);word(ds,0x1016,mode==='fault'?32767:100);word(ds,0x1018,mode==='fault'?1:20);word(ds,0x101a,mode==='fault'?1:5);byte(ds,0x101c,mode==='skip-record'?255:0);byte(ds,0x1023,1);byte(ds,0x1024,grid);byte(ds,0x1025,1);
 for(let i=0;i<16;i++){const at=0x100+4*i;word(0x6000,at,0x800-at);word(0x6000,at+0x40,0x900-at-0x40);}
 byte(0x6000,0x800,assetType);byte(0x6000,0x801,1);word(0x6000,0x802,assetType===3?16:20);word(0x6000,0x804,assetType===3?3:10);word(0x6000,0x806,65534);byte(0x6000,0x900,1);word(0x6000,0x902,20);word(0x6000,0x904,10);
 const before=m.slice();let result;
 try{const next=project(m,0x1c0b,ds,es,0x1000);next.memory.fill(0,g+0xfec0,g+0xff10);result={resource:next.resource,hash:createHash('sha256').update(next.memory).digest('hex')};}catch(e){if(!String(e).includes('INT0'))throw e;result={error:0};}
 if(!m.every((x,i)=>x===before[i]))throw Error('Source mutated');cases.push({ds,es,mode,transform,assetType,grid,...result});
}
console.log(JSON.stringify(cases));
