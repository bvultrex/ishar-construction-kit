import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareOriginalDosSpriteBlit as prepare} from '../src/lib/ishar/original-dos-sprite-blit.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const type of [0,1,2,16,18,20,22,127,99])for(const mirror of [0,1])for(const high of [0,1,16])for(const position of ['inside','partial','outside']){
 const m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer);m.fill(0,g,g+0x28c0);m.fill(0,0x60000,0x72000);const word=(s,o,value)=>v.setUint16(s*16+o,value,true);
 word(0x7000,0x1008,0x100);word(0x7000,0x100a,0x6000);word(0x7000,0x100c,position==='partial'?65528:position==='outside'?100:10);word(0x7000,0x100e,position==='partial'?65532:20);m[0x71022]=mirror;
 word(0x6000,0x100,0x100);word(0x6000,0x102,high);const segment=0x6000+((high>>>4)|((high&15)<<12))+0x20;m[segment*16]=type;word(segment,2,16);word(segment,4,8);word(0x1c0b,0xc44,39);word(0x1c0b,0xc46,39);
 const registers={ds:0x7000,es:0x5000,si:0x100,bp:0x200,dx:0x1234,cx:0x5678},before=m.slice(),next=prepare(m,0x1c0b,registers,0x1000);if(!m.every((x,i)=>x===before[i]))throw Error('Source mutated');next.memory.fill(0,g+0xfec0,g+0xff10);const {memory,...result}=next;
 cases.push({type,mirror,high,position,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
