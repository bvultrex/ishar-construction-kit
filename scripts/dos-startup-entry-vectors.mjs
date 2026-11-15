import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {enterOriginalDosStartup} from '../src/lib/ishar/original-dos-startup-entry.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
const commands=[[],[83],[115,109,97,106],[83,77,65,74,83],[0x60,0x7f,0x80,0xff,0x73],Array(126).fill(106)];
for(const command of commands)for(const length of [0,1,2,command.length+1,127,128,255])for(const mode of [3,19]){
 const m=source.slice(),g=0x1c0b0,p=0x40000;m.fill(0,p+0x80,p+0x180);m[p+0x80]=length;m[p+0x81]=32;m.set(command,p+0x82);m[0x449]=mode;
 const initial={bx:0xabcd,cx:0x7e12,dx:0x3456,di:0x789a,si:0xbcde,ds:0x4000,es:0x5000,bp:0x1234};
 const {memory,...result}=enterOriginalDosStartup(m,initial);memory.fill(0,g+0x7e8,g+0x7ee);
 cases.push({command,length,mode,initial,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
