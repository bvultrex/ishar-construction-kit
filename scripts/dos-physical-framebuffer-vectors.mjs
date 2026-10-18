import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {reserveOriginalDosPhysicalFramebuffer as reserve} from '../src/lib/ishar/original-dos-memory-layout.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const upper of [0,1,40959,65535])for(const existing of [0,16384])for(const graphics of [0,1,255])for(const performance of [0,1,255])for(const mode of [0,1,255]){
 const memory=source.slice(),g=0x1c0b0,v=new DataView(memory.buffer);memory.fill(90,g,g+0x28c0);
 for(const [at,value] of [[0xb8a,existing],[0xb88,0x1234]])v.setUint16(g+at,value,true);for(const [at,value] of [[0x2898,graphics],[0x2892,performance],[0x2896,mode]])memory[g+at]=value;
 const before=memory.slice(),next=reserve(memory,0x1c0b,upper);if(!memory.every((x,i)=>x===before[i]))throw Error('Source mutated');const {memory:result,...layout}=next;
 cases.push({upper,existing,graphics,performance,mode,...layout,hash:createHash('sha256').update(result).digest('hex')});
}
console.log(JSON.stringify(cases));
