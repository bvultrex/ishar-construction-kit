import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {checkOriginalDosStartup} from '../src/lib/ishar/original-dos-startup-checks.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
const digest=createHash('sha256').update(source).digest('hex'),profile=digest==='5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7'?'ishar1':digest==='f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'?'ishar2':null;if(!profile)throw Error('Unknown capture');
for(const measurement of [0,150,151,65535])for(const graphics of [0,1])for(const adapter of [0,1,15,16,255])for(const available of [0,0x67bf,0x67c0,0x67c1,0x6f7f,0x6f80,0x6f81,65535]){
 const m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer);v.setUint16(g+0xc9f,measurement,true);m[g+0x2898]=graphics;m[g+0xc69]=adapter;v.setUint16(g+0xb92,0x8000,true);v.setUint16(g+0xb96,(0x8000+available)&65535,true);
 const {memory,...result}=checkOriginalDosStartup(m,0x1c0b,{ax:0x1234,bx:0xabcd,dx:0x5678},profile);memory.fill(0,g+0xfef8,g+0xff00);
 cases.push({measurement,graphics,adapter,available,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
