import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {planOriginalDosResourceTables} from '../src/lib/ishar/original-dos-resource-memory.ts';
import {openOriginalDosFile} from '../src/lib/ishar/original-dos-file-open.ts';
import {runOriginalDosFileIo} from '../src/lib/ishar/original-dos-file-io.ts';
const bytes=new Uint8Array(readFileSync(process.argv[2]));
const module=readAlisModule(bytes);
if(!module.isMain||module.envelopeBytes!==22)throw Error('Expected MAIN module with VM specification');
const header=bytes.slice(6,22),cases=[];
for(const segment of [0x3000,0x5000])for(const offset of [0,0xfff0])for(const frontier of [0x6000,0x9000]){
 const initial=new Uint8Array(65536),iv=new DataView(initial.buffer);for(const [at,value] of [[0xb90,offset],[0xb92,segment],[0xb94,0x1234],[0xb96,frontier]])iv.setUint16(at,value,true);
 const opened=openOriginalDosFile(initial,{ax:2,bx:0,cx:0,dx:0x100,ds:0x2000},()=>({ax:5,carry:false}));
 const view=new DataView(opened.memory.buffer),words=Object.fromEntries([0xbbe,0x28a4,0x28a6].map(at=>[at,view.getUint16(at,true)]));
 let globals=opened.memory,registers={...opened.registers,ds:0x1c0b,ax:0x1c0b},position=0;const readEvents=[];
 for(const [dx,cx] of [[0x2480,6],[0x2486,16]]){
  const read=runOriginalDosFileIo(globals,globals,{...registers,dx,cx},'read',()=>{const data=bytes.slice(position,position+cx);position+=data.length;return{ax:data.length,carry:false,data};},true);globals=read.globals;registers=read.registers;readEvents.push(...read.events);
 }
 if(position!==22)throw Error('Incomplete MAIN header');
 cases.push({segment,offset,frontier,opened:{registers:opened.registers,events:opened.events,words},reads:{registers,events:readEvents,globalsHash:createHash('sha256').update(globals.subarray(0,0x28c0)).digest('hex')},expected:planOriginalDosResourceTables(globals.slice(0x2486,0x2496),segment,offset,frontier,0x1234)});
}
console.log(JSON.stringify({envelopeBytes:module.envelopeBytes,decodedBytes:module.image.length,cases}));
