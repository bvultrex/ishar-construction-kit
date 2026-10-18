import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {stepOriginalDosVgaPaletteIrq} from '../src/lib/ishar/original-dos-vga-palette-irq.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const blocked of [0,1,2])for(const delay of [0,1,128,255])for(const adapter of [0,1])for(const pattern of [0,1,2])for(const interruptFlag of [false,true]){
 const m=source.slice(),g=0x1c0b0;m[g+0xcb9]=blocked;m[g+0xcbd]=delay;m[g+0xcbc]=2;m[g+0xcbe]=3;m[g+0xc69]=adapter;
 for(let n=0;n<768;n++){m[g+0xe43+n]=(n*7)&63;m[g+0x1143+n]=pattern===0?m[g+0xe43+n]:pattern===1&&n%3!==2?m[g+0xe43+n]:0;m[g+0x1443+n]=(n*11)&63;}
 const replies={ax:0xabcd,interruptFlag,retraceReads:[0,0,8]},before=m.slice(),{memory,...expected}=stepOriginalDosVgaPaletteIrq(m,replies);if(!m.every((x,i)=>x===before[i]))throw Error('Palette callback mutated source');memory.fill(0,g+0xfec0,g+0xff04);
 cases.push({blocked,delay,adapter,pattern,replies,expected,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
