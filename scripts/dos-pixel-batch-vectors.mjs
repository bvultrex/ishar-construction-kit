import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareOriginalDosPixelBatch as prepare} from '../src/lib/ishar/original-dos-pixel-batch.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
const scenarios=[
 {rect:[10,20,30,40],flags:0,status:0},
 {rect:[10,20,30,40],flags:64,status:0},
 {rect:[10,20,30,40],flags:96,status:255},
 {rect:[10,20,30,40],flags:64,status:0,mirror:128},
 {rect:[10,20,30,40],flags:64,status:0,depth:65535},
 {rect:[400,20,420,40],flags:0,status:0},
 {rect:[65531,65526,30,40],flags:64,status:0},
 {rect:[10,250,30,270],flags:64,status:0},
 {rect:[10,20,30,40],flags:64,status:255,special:1},
 {rect:[10,20,30,40],flags:64,status:0,hidden:64},
];
for(const es of [0x5000,0x1c0b])for(const aggregate of [0,1])for(const mode of [[0,0,255],[1,0,0],[1,1,0]])for(const scenario of scenarios){
 const m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer);m.fill(0,g,g+0x28c0);if(es===0x5000)m.fill(0,0x50000,0x60000);m.fill(0,0x60000,0x61000);m.fill(0,0x70000,0x80000);
 const word=(s,o,value)=>v.setUint16(s*16+(o&65535),value,true),byte=(s,o,value)=>m[s*16+o]=value;
 for(const [at,value] of [[0xb32,0x300],[0xb34,es],[0xc16,0x100],[0xbf6,0x200],[0x1dfb,0x8000]])word(0x1c0b,at,value);for(let i=0;i<4;i++)word(0x1c0b,[0xc2c,0xc2e,0xc30,0xc32][i],scenario.rect[i]);
 byte(0x1c0b,0xc18,aggregate);byte(0x1c0b,0xcb0,scenario.special??0);byte(0x1c0b,0x2896,mode[0]);byte(0x1c0b,0x2898,mode[1]);byte(0x1c0b,0xcb1,mode[2]);byte(es,0x300,scenario.hidden??0);byte(es,0x301,scenario.flags);word(es,0x302,0x200);
 for(const [at,value] of [[0x20c,0],[0x20e,0],[0x216,319],[0x218,199],[0x206,0x1000],[0x1008,0x100],[0x100a,0x6000],[0x100c,scenario.rect[0]],[0x100e,scenario.rect[1]],[0x1010,scenario.depth??0]])word(0x7000,at,value);byte(0x7000,0x1000,scenario.status);byte(0x7000,0x1022,scenario.mirror??0);
 word(0x6000,0x100,0x100);byte(0x6000,0x200,1);word(0x6000,0x202,20);word(0x6000,0x204,10);
 const registers={ds:0x7000,es,si:0x100,bp:0x200,dx:0x1234,cx:0x200},callerEntry=scenario.hidden?0x40d1:0x4168,before=m.slice(),next=prepare(m,0x1c0b,registers,0x200,0x1000,callerEntry);if(!m.every((x,i)=>x===before[i]))throw Error('Source mutated');next.memory.fill(0,g+0xfec0,g+0xff10);const {memory,...result}=next;
 cases.push({es,aggregate,mode,scenario,callerEntry,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
