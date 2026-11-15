import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {stepOriginalDosPhysicalScript as step} from '../src/lib/ishar/original-dos-physical-script.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const opcode of [186,191])for(const ds of [0x4000,0x1c0b])for(const es of [0x5000,0x1c0b])for(const value of [0,255,0x8000,65535])for(const tag of [0,2,6,8,30,32]){
 const m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer);m.fill(0,g,g+0x28c0);m.fill(0,0x40000,0x50000);if(es===0x5000)m.fill(0xa5,0x50000,0x60000);
 const targets=opcode===186?[0xba8,0xba0,0xba2,0xba4,0xba6]:[0xc02,0xc04,0xc06,0xc0e];for(const at of targets)v.setUint16(g+at,0xa5a5,true);v.setUint16(g+0xbf6,0x200,true);
 const offset=targets[0]-0x200,second=tag===0?[0,128]:tag===2?[2,127,255]:[tag,offset&255,offset>>>8];
 const code=[opcode,2,value&255,value>>>8,...second];for(let i=2;i<targets.length;i++){const at=targets[i-1]-0x200;code.push(i===3?6:8,at&255,at>>>8);}m.set(code,ds*16+0x100);
 const registers={ds,es,si:0x100,bp:0x200,dx:0x1234,cx:0x5678},before=m.slice(),next=step(m,0x1c0b,registers);
 if(!m.every((x,i)=>x===before[i]))throw Error('Source mutated');next.memory.fill(0,g+0xfec0,g+0xff10);
 cases.push({opcode,ds,es,value,tag,code,registers:next.registers,hash:createHash('sha256').update(next.memory).digest('hex')});
}
console.log(JSON.stringify(cases));
