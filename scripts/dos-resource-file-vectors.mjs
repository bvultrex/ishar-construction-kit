import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {planOriginalDosResourceTables} from '../src/lib/ishar/original-dos-resource-memory.ts';
import {openOriginalDosFile} from '../src/lib/ishar/original-dos-file-open.ts';
import {runOriginalDosFileIo} from '../src/lib/ishar/original-dos-file-io.ts';
import {initializeOriginalDosResourceRuntime} from '../src/lib/ishar/original-dos-resource-initialize.ts';
import {prepareOriginalDosMainDecode} from '../src/lib/ishar/original-dos-main-decode.ts';
const bytes=new Uint8Array(readFileSync(process.argv[2]));
const module=readAlisModule(bytes);
if(!module.isMain||module.envelopeBytes!==22)throw Error('Expected MAIN module with VM specification');
const header=bytes.slice(6,22),cases=[];
const physical=new Uint8Array(readFileSync(process.argv[3]));
for(const segment of [0x3000,0x5000])for(const offset of [0,0xfff0])for(const frontier of [0x6000,0x9000]){
 const initial=new Uint8Array(65536),iv=new DataView(initial.buffer);for(const [at,value] of [[0xb90,offset],[0xb92,segment],[0xb94,0x1234],[0xb96,frontier]])iv.setUint16(at,value,true);
 if(process.argv.includes('--decode'))iv.setUint16(0xb5c,0x9000,true);
 const opened=openOriginalDosFile(initial,{ax:2,bx:0,cx:0,dx:0x100,ds:0x2000},()=>({ax:5,carry:false}));
 const view=new DataView(opened.memory.buffer),words=Object.fromEntries([0xbbe,0x28a4,0x28a6].map(at=>[at,view.getUint16(at,true)]));
 let globals=opened.memory,registers={...opened.registers,ds:0x1c0b,ax:0x1c0b},position=0;const readEvents=[];
 for(const [dx,cx] of [[0x2480,6],[0x2486,16]]){
  const read=runOriginalDosFileIo(globals,globals,{...registers,dx,cx},'read',()=>{const data=bytes.slice(position,position+cx);position+=data.length;return{ax:data.length,carry:false,data};},true);globals=read.globals;registers=read.registers;readEvents.push(...read.events);
 }
 if(position!==22)throw Error('Incomplete MAIN header');
 const expected=planOriginalDosResourceTables(globals.slice(0x2486,0x2496),segment,offset,frontier,0x1234),memory=physical.slice();memory.set(globals.subarray(0,0x28c0),0x1c0b0);memory.set(new TextEncoder().encode('MAIN.IO\0'),0x20100);
 const viewMemory=new DataView(memory.buffer);for(const [at,value] of Object.entries(expected.words))viewMemory.setUint16(0x1c0b0+Number(at),value,true);
 const initialized=initializeOriginalDosResourceRuntime(memory,0x1c0b,segment);initialized.memory.fill(0,0x1c0b0+0xfec0,0x1c0b0+0xff10);
 const preparedDecode=prepareOriginalDosMainDecode(initialized.memory.slice(0x1c0b0,0x2c0b0));
 const end=preparedDecode.registers.ds*16+preparedDecode.registers.dx+module.image.length,closed=runOriginalDosFileIo(preparedDecode.memory,new Uint8Array(65536),{ax:preparedDecode.registers.ax,bx:0,cx:end&15,dx:preparedDecode.registers.dx,ds:preparedDecode.registers.ds},'close',()=>({ax:0,carry:false}));
 cases.push({segment,offset,frontier,opened:{registers:opened.registers,events:opened.events,words},reads:{registers,events:readEvents,globalsHash:createHash('sha256').update(globals.subarray(0,0x28c0)).digest('hex')},expected,initialized:{hash:createHash('sha256').update(initialized.memory).digest('hex'),tableRecords:initialized.tableRecords,links:initialized.links},preparedDecode:{entry:preparedDecode.entry,registers:preparedDecode.registers,pack:preparedDecode.memory[0xb57]},closed:{registers:closed.registers,events:closed.events,carry:closed.carry}});
}
console.log(JSON.stringify({envelopeBytes:module.envelopeBytes,decodedBytes:module.image.length,decodedSha256:createHash('sha256').update(module.image).digest('hex'),cases}));
