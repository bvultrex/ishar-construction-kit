import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {stepOriginalDosPhysicalScript as step} from '../src/lib/ishar/original-dos-physical-script.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const opcode of [71,192,193,194])for(const es of [0x5000,0x1c0b])for(const base of [0x200,0xff00])for(const selected of [0,0x100])for(const tag of [0,2,6,8,30,32]){
 const m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer);m.fill(0,g,g+0x28c0);m.fill(0,0x40000,0x50000);if(es===0x5000)m.fill(0,0x50000,0x60000);
 const word=(s,o,value)=>v.setUint16(s*16+(o&65535),value,true);
 word(0x1c0b,0xbf6,base);word(es,0x800-22,selected);word(es,(tag>=30?base:0x800)+0x90,0x80ff);word(es,base+0x100,0x1240);
 const first=tag===0?[0,255]:tag===2?[2,0,128]:[tag,0x90,0];
 const code=opcode===71?[71,...(tag===0?[selected&255,selected>>>8]:[0x22,2])]:[opcode,...first,2,0xcd,0xab];m.set(code,0x40100);
 const registers={ds:0x4000,es,si:0x100,bp:0x800,dx:0x1234,cx:0x5678},before=m.slice(),next=step(m,0x1c0b,registers);
 if(!m.every((x,i)=>x===before[i]))throw Error('Source mutated');next.memory.fill(0,g+0xfec0,g+0xff10);
 cases.push({opcode,es,base,selected,tag,code,registers:next.registers,hash:createHash('sha256').update(next.memory).digest('hex')});
}
console.log(JSON.stringify(cases));
