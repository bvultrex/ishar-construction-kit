import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fillOriginalDosSolidSprite as fill} from '../src/lib/ishar/original-dos-solid-blit.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const mirror of [0,1])for(const pitch of [0,16,320])for(const offset of [0x20,0xfffc])for(const partial of [false,true])for(const color of [0,173]){
 const m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer);m.fill(0,g,g+0x28c0);m.fill(0,0x60000,0x72000);m.fill(90,0x90000,0xa0000);const word=(s,o,value)=>v.setUint16(s*16+o,value,true);
 m[0x60000]=1;m[0x60001]=color;word(0x6000,2,7);word(0x6000,4,3);word(0x7000,0x100c,2);word(0x7000,0x100e,1);m[0x71022]=mirror;
 for(const [at,value] of [[0x1dd5,pitch],[0x1dbf,offset],[0x1dc1,0x9000],[0xc2c,partial?4:2],[0xc2e,partial?2:1],[0xc30,partial?7:9],[0xc32,partial?3:4]])word(0x1c0b,at,value);
 const registers={ds:0x6000,es:0x7000,si:0,bp:0x200,dx:0x1234,cx:0x5678},before=m.slice(),next=fill(m,0x1c0b,registers,0x1000);if(!m.every((x,i)=>x===before[i]))throw Error('Source mutated');next.memory.fill(0,g+0xfec0,g+0xff10);const {memory,...result}=next;
 cases.push({mirror,pitch,offset,partial,color,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
