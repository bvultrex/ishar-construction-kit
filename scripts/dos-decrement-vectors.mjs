import {readFileSync} from 'node:fs';
import {stepOriginalDosPhysicalScript} from '../src/lib/ishar/original-dos-physical-script.ts';
import {createHash} from 'node:crypto';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const alias of [false,true])for(const opcode of [43,44,45])for(const tag of [6,8,18,20])for(const value of [0,1,2,255,256,65535]){
 const memory=source.slice(),g=0x1c0b0,es=alias?0x1c0b:0x5000,bp=alias&&tag>=18?0xbd4:0x200,offset=tag>=18?0x80:alias?0xa54:0x200,width=opcode-42;
 memory.fill(0,g,g+0x28c0);memory.fill(0,0x40000,0x50000);if(!alias)memory.fill(0,0x50000,0x60000);
 const v=new DataView(memory.buffer);v.setUint16(es*16+bp+offset,value,true);v.setUint16(g+0xc58,0x802,true);v.setUint16(g+0xc5c,0xa02,true);
 const delta=value===0?128:value===1?0:65535,code=[opcode,delta&255];if(width>=2)code.push(delta>>>8);if(width===3)code.push(0x7f);code.push(tag,offset&255);if(tag<18)code.push(offset>>>8);memory.set(code,0x40100);
 const registers={ds:0x4000,es,si:0x100,bp,dx:0x1234,cx:0x5678},next=stepOriginalDosPhysicalScript(memory,0x1c0b,registers);
 next.memory.fill(0,g+0xfec0,g+0xff10);
 cases.push({alias,opcode,tag,value,es,bp,offset,code,registers:next.registers,hash:createHash('sha256').update(next.memory).digest('hex')});
}
console.log(JSON.stringify(cases));
