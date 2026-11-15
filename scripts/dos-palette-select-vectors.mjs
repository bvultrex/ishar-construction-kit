import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {selectOriginalDosPalette} from '../src/lib/ishar/original-dos-palette-select.ts';
import {stepOriginalDosPhysicalScript} from '../src/lib/ishar/original-dos-physical-script.ts';
const transition=process.argv.includes('--transition');
const source=new Uint8Array(readFileSync(process.argv[2])),specs=[],cases=[];
for(const value of [-3,-2,-1,0,3])for(const format of ['compact','rgb4','rgb256','other'])for(const speed of [2,1000])for(const inhibit of [0,1])for(const enabled of [0,1])for(const start of format==='rgb4'?[0,7]:[0])specs.push({opcode:104,value,format,speed,inhibit,enabled,start});
for(const value of [-32768,-1,0,1,255,256,32767])specs.push({opcode:106,value,format:'rgb4',speed:2,inhibit:0,enabled:1,start:0});
if(transition){specs.length=0;for(const value of [0,3])for(const duration of [0,1,50,63,126])for(const format of ['compact','rgb4','rgb256','other'])for(const speed of [2,1000])for(const inhibit of [0,1])for(const enabled of [0,1])specs.push({opcode:190,value,duration,format,speed,inhibit,enabled,start:0});}
for(const spec of specs){
 const m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer),word=(s,o,x)=>v.setUint16(s*16+o,x&65535,true);m.fill(0,g,g+0x28c0);m.fill(0,0x50000,0x71000);
 for(const [at,value] of [[0x2898,1],[0x2896,spec.enabled],[0x2894,3],[0xc9f,spec.speed]])word(0x1c0b,at,value);m[g+0xbf4]=spec.inhibit;m[g+0xc69]=1;m[g+0xc99]=155;
 for(let n=0;n<768;n++){m[g+0xe43+n]=(n*3)&63;m[g+0x1143+n]=255;m[g+0x1443+n]=(n*5)&63;m[g+0x1763+n]=(n*7)&63;m[g+0x1a63+n]=(n*11)&63;}
 m[0x60100]=spec.opcode;m[0x60101]=2;word(0x6000,0x102,spec.value);word(0x7000,0x1fec,0x100);word(0x7000,0x1fee,0x5000);word(0x5000,0x10e,0x40);word(0x5000,0x140,0x20);
 if(spec.opcode===190){m[0x60104]=2;word(0x6000,0x105,spec.duration);}
 for(const id of [0,3]){const at=0x160+id*4;word(0x5000,at,0x4000-at);word(0x5000,at+2,0);}
 m[0x54000]=spec.format==='other'?1:254;m[0x54001]=spec.format==='compact'?0:spec.format==='rgb256'?255:3;m[0x54002]=spec.start;m[0x54003]=0x12;
 for(let n=0;n<768;n++)m[0x54004+n]=(n*17)&255;
 const input={ds:0x6000,es:0x7000,si:0x100,bp:0x2000,dx:0x1234,cx:0x5678},before=m.slice();
 const result=spec.opcode!==106?selectOriginalDosPalette(m,0x1c0b,{...input,si:0x101},{interruptFlag:true,retraceReads:[8]},spec.opcode===190):stepOriginalDosPhysicalScript(m,0x1c0b,input);
 if(!m.every((x,i)=>x===before[i]))throw Error('Palette selection mutated source');result.memory.fill(0,g+0xfec0,g+0xff10);const {memory,...expected}=result;
 cases.push({spec,input,expected,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
