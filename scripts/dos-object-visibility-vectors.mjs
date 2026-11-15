import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {stepOriginalDosPhysicalScript as step} from '../src/lib/ishar/original-dos-physical-script.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const opcode of [78,79])for(const es of [0x5000,0x1c0b])for(const base of [0x200,0xff00])for(const list of [[],[0x100],[0x200],[0x100,0x200,0x300],[0x200,0x100,0x300],[0x200,0x300,0x100]])for(const flags of [0,0x40,0xffff,0x1234]){
 const m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer);m.fill(0,g,g+0x28c0);m.fill(0,0x40000,0x50000);if(es===0x5000)m.fill(0,0x50000,0x60000);
 const word=(s,o,value)=>v.setUint16(s*16+(o&65535),value,true);
 word(0x1c0b,0xbf6,base);word(0x1c0b,0xc16,list[0]??0);
 for(let i=0;i<list.length;i++)word(es,list[i]+base+4,list[i+1]??0);
 word(es,0x100+base,flags);m.set([opcode,0,1],0x40100);
 const registers={ds:0x4000,es,si:0x100,bp:0x800,dx:0x1234,cx:0x5678},before=m.slice(),next=step(m,0x1c0b,registers);
 if(!m.every((x,i)=>x===before[i]))throw Error('Source mutated');next.memory.fill(0,g+0xfec0,g+0xff10);
 cases.push({opcode,es,base,list,flags,registers:next.registers,hash:createHash('sha256').update(next.memory).digest('hex')});
}
console.log(JSON.stringify(cases));
