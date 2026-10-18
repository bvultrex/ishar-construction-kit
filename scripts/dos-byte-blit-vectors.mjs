import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {blitOriginalDosByteSprite} from '../src/lib/ishar/original-dos-byte-blit.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const pattern of [[0,1,16,31,240,255,0x52,0xa0],[0,0,0,7,0,0,0,0]])for(const mirrored of [0,1])for(const type of [20])for(const left of [0,1,3])for(const requestedWidth of [1,4,8])for(const top of [0,1])for(const pitch of [8,13,320])for(const offset of [0x20,0xfffc])for(const base of [0]){
 const m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer);m.fill(0,g,g+0x28c0);m.fill(0,0x60000,0x72000);m.fill(90,0x90000,0xa0000);const word=(s,o,x)=>v.setUint16(s*16+o,x,true),width=Math.min(requestedWidth,8-left);
 m[0x71022]=mirrored;m[0x60000]=type;m[0x60006]=base;m[0x1e970+0x30]=base;word(0x6000,2,7);word(0x6000,4,3);word(0x7000,0x100c,2);word(0x7000,0x100e,1);
 for(let n=0;n<32;n++)m[0x60000+(type===0?6:8)+n]=pattern[n%8];
 for(const [at,value] of [[0x1dd5,pitch],[0x1dbf,offset],[0x1dc1,0x9000],[0xc2c,2+left],[0xc2e,1+top],[0xc30,2+left+width-1],[0xc32,4]])word(0x1c0b,at,value);
 const input={ds:0x6000,es:0x7000,si:0,bp:0x200,dx:0x1234,cx:0x5678},before=m.slice(),{memory,...result}=blitOriginalDosByteSprite(m,0x1c0b,input,0x1000);if(!m.every((x,i)=>x===before[i]))throw Error('Byte source mutated');memory.fill(0,g+0xfec0,g+0xff10);
 cases.push({pattern,mirrored,left,requestedWidth,top,pitch,offset,base,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
