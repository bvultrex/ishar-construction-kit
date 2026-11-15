import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {finishOriginalDosPostPaletteIrq} from '../src/lib/ishar/original-dos-post-palette-irq.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),specs=[],cases=[];
for(const counter of [0,1,2,255])for(const reload of [0,3])for(const inhibit of [0,1])for(const mode of [0,2])specs.push({counter,reload,inhibit,mode,branch:'idle'});
for(const branch of ['audio','record0','record1','record2','cursor'])specs.push({counter:2,reload:3,inhibit:0,mode:0,branch});
for(const spec of specs){
 const m=source.slice(),v=new DataView(m.buffer),g=0x1c0b0;m[0x19414]=spec.branch==='audio'?1:0;
 for(const [at,value] of [[0xc97,spec.counter],[0xc98,spec.reload],[0xcd8,spec.inhibit],[0xcc5,spec.mode],[0x2896,1],[0xcb1,spec.branch==='cursor'?0:255],[0x1dfd,spec.branch==='record0'?1:0],[0x1e0d,spec.branch==='record1'?1:0],[0x1e1d,spec.branch==='record2'?1:0],[0x1dfe,128],[0x1e0e,129],[0x1e1e,127]])m[g+at]=value;
 v.setUint16(0x10bf2,0x1234,true);v.setUint16(0x10bf4,0x7000,true);
 for(const [index,value] of [0x1111,0x4000,0x5000,0x2222,0x3333,0x4444,0x5555,0x6666,0x7777,0xe000,0x1000,0x602].entries())v.setUint16(g+0xff00+index*2,value,true);
 const registers={ax:0xabcd,bx:0x1234,cx:0x3456,dx:0x5678,di:0x789a,si:0x9abc,bp:0xbcde,ds:0x1c0b,es:0x6000,sp:0xff00},before=m.slice(),{memory,...expected}=finishOriginalDosPostPaletteIrq(m,0x1c0b,registers);if(!m.every((x,i)=>x===before[i]))throw Error('IRQ tail mutated input');memory.fill(0,g+0xfec0,g+0xff00);
 cases.push({spec,registers,expected,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
