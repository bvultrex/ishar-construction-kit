import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {stepOriginalDosPhysicalScript as step} from '../src/lib/ishar/original-dos-physical-script.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const es of [0x5000,0x1c0b])for(const tag of [4,10,34])for(const base of [0,65535])for(const text of [[],[13,10,32],[65,66],[64,65,66,67,32,13,10],[255,65]]){
 const m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer);m.fill(0,g,g+0x28c0);m.fill(0,0x40000,0x50000);if(es===0x5000)m.fill(0,0x50000,0x60000);m.fill(0,0x60000,0x80000);
 const word=(s,o,value)=>v.setUint16(s*16+(o&65535),value,true);
 for(const [at,value] of [[0xbf6,0x1000],[0xbea,0x7000],[0xbec,0x1000],[0xba0,base],[0xba8,65],[0xba6,2],[0xc02,100],[0xc04,200],[0xc06,300],[0xc0e,18],[0xc58,0x802],[0xc5a,0xa02]])word(0x1c0b,at,value);
 m[g+0xba2]=5;m[g+0xba4]=9;word(es,0xfec,0x100);word(es,0xfee,0x6000);word(es,0x800-22,0x100);word(es,0x1102,0x200);
 word(0x6000,0x10e,0x100);word(0x6000,0x200,0x100);word(0x6000,0x300,0x100);word(0x6000,0x304,0x100);m[0x60400]=1;m[0x60404]=1;
 for(let i=0;i<16;i++)word(0x7000,0x1000+i*38+4,i===15?0:0x1000+(i+1)*38);
 const code=tag===4?[185,4,...text,0]:[185,tag,0,3];m.set(code,0x40100);if(tag!==4)m.set([...text,0],es*16+(tag===10?0xb00:0x1300));
 const registers={ds:0x4000,es,si:0x100,bp:0x800,dx:0x1234,cx:0x5678},before=m.slice(),next=step(m,0x1c0b,registers);
 if(!m.every((x,i)=>x===before[i]))throw Error('Source mutated');next.memory.fill(0,g+0xfec0,g+0xff10);
 cases.push({es,tag,base,text,code,registers:next.registers,hash:createHash('sha256').update(next.memory).digest('hex')});
}
console.log(JSON.stringify(cases));
