import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {presentOriginalDosVga} from '../src/lib/ishar/original-dos-vga-present.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const destination of [0x7000,0x6000])for(const offsets of [[0x20,0x20],[0x20,0x22],[0xfffc,0xfffa]])for(const width of [1,2,7,8,17])for(const rows of [1,3])for(const pitch of [0,16,320]){
 const m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer);m.fill(90,0x70000,0x80000);for(let n=0;n<65536;n++)m[0x60000+n]=(n*17+(n>>>8))&255;
 for(const [at,value] of [[0xb88,offsets[0]],[0xb8a,0x6000],[0xb84,offsets[1]],[0xb86,destination],[0x1dd5,pitch],[0xc1a,2],[0xc1c,1],[0xc1e,width+1],[0xc20,rows]])v.setUint16(g+at,value,true);
 const before=m.slice(),{memory,...expected}=presentOriginalDosVga(m,0x1c0b);if(!m.every((x,i)=>x===before[i]))throw Error('Present mutated input');memory.fill(0,g+0xfec0,g+0xff04);
 cases.push({destination,offsets,width,rows,pitch,expected,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
