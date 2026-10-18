import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareOriginalDosResourceDraw as prepare} from '../src/lib/ishar/original-dos-resource-draw.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const opcode of [72,73])for(const es of [0x5000,0x1c0b])for(const carry of [false])for(const type of [1,255])for(const flip of [0,1])for(const children of type===255?[0,2]:[null])for(const existing of [0,1,2])for(const freeMode of [0,1]){
 const m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer);m.fill(0,g,g+0x28c0);m.fill(0,0x40000,0x50000);if(es===0x5000)m.fill(0,0x50000,0x60000);m.fill(0,0x60000,0x80000);
 const word=(s,o,value)=>v.setUint16(s*16+(o&65535),value,true);
 word(0x1c0b,0xbf6,0x200);word(es,0x800-20,0x100);word(es,0x800-18,0x6000);m[es*16+0x800-3]=flip;
 word(0x6000,0x10e,0x1000);word(0x6000,0x1100,0x100);word(0x6000,0x1208,carry?0xf000:0x80);word(0x6000,0x1204,0x200);
 const sum=0x1208+(carry?0xf000:0x80),root=0x60000+(carry?0x10000:0)+(sum&65535);m[root]=type;
 if(type===255){m[root+1]=children;word(root>>>4,(root&15)+2,0x8001);word(root>>>4,(root&15)+4,5);word(root>>>4,(root&15)+6,65534);word(root>>>4,(root&15)+8,7);word(root>>>4,(root&15)+10,1);word(root>>>4,(root&15)+12,9);word(root>>>4,(root&15)+14,3);word(root>>>4,(root&15)+16,4);m[0x61404]=1;}
 const code=opcode===72?[72,2,2,0]:[73,0,255,2,0x34,0x12,0,128,2,2,0,2,0x45,0x23];m.set(code,0x40100);
 m.fill(0,0x70000,0x80000);word(0x1c0b,0xbea,0x7000);word(0x1c0b,0xbec,0x1000);m[g+0xbf3]=freeMode;
 word(es,0x800-22,0x100);word(es,0x302,0x200);
 for(let i=0;i<8;i++)word(0x7000,0x1000+i*38+4,i===7?0:0x1000+(i+1)*38);
 if(existing){word(es,0x800-24,0x800);word(0x7000,0x206,0x800);m[0x70800]=existing===1?255:0;word(0x7000,0x802,0x100);m[0x70801]=opcode===73?0x45:0;
  if(existing===2){word(0x7000,0x804,0x826);word(0x7000,0x806,0x826);word(0x7000,0x828,0x100);m[0x70827]=opcode===73?0x45:0;}
 }
 const registers={ds:0x4000,es,si:0x101,bp:0x800,dx:0x1234,cx:0x5678},before=m.slice(),next=prepare(m,0x1c0b,registers,opcode,true);
 if(!m.every((x,i)=>x===before[i]))throw Error('Source mutated');next.memory.fill(0,g+0xfec0,g+0xff10);const {memory,...result}=next;
 cases.push({opcode,es,carry,type,flip,children,existing,freeMode,code,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
