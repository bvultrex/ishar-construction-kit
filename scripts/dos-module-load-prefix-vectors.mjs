import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareOriginalDosModuleLoad} from '../src/lib/ishar/original-dos-module-load-prefix.ts';
import {stepOriginalDosPhysicalScript} from '../src/lib/ishar/original-dos-physical-script.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const alias of [false,true])for(const count of [0,1,2])for(const id of [0,1,16,64,65,65534]){
 const m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer);m.fill(0,g,g+0x28c0);m.fill(0,0x40000,0x80000);m[0x10318]=0;
 const es=alias?0x1c0b:0x6000,table=alias?0xb04:0x1000,word=(at,value)=>v.setUint16(at,value,true);word(g+0xbc2,table);word(g+0xbce,count);
 for(const [i,module] of [[0,16],[1,64]]){word(es*16+table+i*4,0x100+i*0x20);word(es*16+table+i*4+2,0x7000);word(0x70100+i*0x20,module);}
 m.set([69,id&255,id>>>8,...Buffer.from('TEST.IO\0')],0x40100);const input={ds:0x4000,es,si:0x101,bp:0x200,dx:0x1234,cx:0x5678},before=m.slice(),{memory,...expected}=prepareOriginalDosModuleLoad(m,0x1c0b,input);if(!m.every((v,i)=>v===before[i]))throw Error('Module-prefix input mutated');memory.fill(0,g+0xfec0,g+0xff10);
 let step;
 try{step=stepOriginalDosPhysicalScript(m,0x1c0b,{...input,si:0x100});}catch(e){if(expected.phase==='return'||!String(e).includes(`module69 reaches ${expected.phase}`))throw e;}
 if(expected.phase==='return'){
  if(!step||JSON.stringify(step.registers)!==JSON.stringify(expected.registers))throw Error('Cached module step differs from original prefix');
  step.memory.fill(0,g+0xfec0,g+0xff10);if(!step.memory.every((v,i)=>v===memory[i]))throw Error('Cached module step memory differs');
 }
 if(!m.every((v,i)=>v===before[i]))throw Error('Module step or rejected boundary mutated input');
 cases.push({alias,count,id,input,expected,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
