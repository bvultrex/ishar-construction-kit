import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {stepOriginalDosPhysicalScript} from '../src/lib/ishar/original-dos-physical-script.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),specs=[],cases=[];
for(const opcode of [98,99,100,101,102,103])for(const es of [0x1c0b,0x1c0c,0x7000])for(const bp of [0x200,0xcba])for(const flag of [0,1,2,3,128,129,130,255])specs.push({opcode,es,bp,flag,tag:2,value:0,bios:0});
for(const [tag,values] of [[0,[-128,-1,0,1,127]],[2,[-32768,-1,0,1,256,32767]]])for(const value of values)for(const bios of [0,0x1234,65535])specs.push({opcode:42,es:0x7000,bp:0x200,flag:130,tag,value,bios});
for(const flag of [0,255])specs.push({opcode:59,es:0x7000,bp:0x200,flag,tag:2,value:0,bios:0});
for(const spec of specs){
 const m=source.slice(),v=new DataView(m.buffer),g=0x1c0b0;v.setUint16(0x46c,spec.bios,true);m[g+0xc96]=0x55;m[spec.es*16+spec.bp-36]=spec.flag;v.setUint16(spec.es*16+spec.bp-28,0x4567,true);v.setUint16(spec.es*16+spec.bp-30,0xabcd,true);
 m[0x60100]=spec.opcode;m[0x60101]=spec.tag;if(spec.tag===0)m[0x60102]=spec.value&255;else v.setUint16(0x60102,spec.value&65535,true);
 const input={ds:0x6000,es:spec.es,si:0x100,bp:spec.bp,dx:0x1234,cx:0x5678},before=m.slice(),{memory,...expected}=stepOriginalDosPhysicalScript(m,0x1c0b,input);if(!m.every((x,i)=>x===before[i]))throw Error('Context/seed source mutated');memory.fill(0,g+0xfec0,g+0xff10);
 cases.push({spec,input,expected,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
