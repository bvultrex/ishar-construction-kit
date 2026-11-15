import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareOriginalDosVisibleObject as prepare} from '../src/lib/ishar/original-dos-visible-object.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const es of [0x5000,0x1c0b])for(const base of [0,0x100])for(const dirty of [false,true])for(const force of [0,1])for(const flags of [0,4,16])for(const statuses of [[],[0],[255],[2],[1],[0,255]]){
 const m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer);m.fill(0,g,g+0x28c0);if(es===0x5000)m.fill(0,0x50000,0x60000);m.fill(0,0x70000,0x80000);
 const word=(s,o,value)=>v.setUint16(s*16+(o&65535),value,true);
 word(0x1c0b,0xbea,0x7000);word(0x1c0b,0xbe8,base);word(0x1c0b,0xb18,0x300);m[g+0xc49]=force;m[es*16+0x800]=dirty?128:0;m[es*16+0x801]=flags;
 for(let i=0;i<3;i++){word(es,0x800+22+i*2,100+i);word(es,0x800+42+i*2,[65535,2,32768][i]);}
 word(0x7000,0x306,statuses.length?0x1000:0);word(0x7000,0x306+base,statuses.length?0x1000:0);
 for(let i=0;i<statuses.length;i++){const at=0x1000+i*0x200,next=i+1<statuses.length?at+0x200:0;m[0x70000+at]=statuses[i];word(0x7000,at+6,next);word(0x7000,at+base+6,next);word(0x7000,at+30,i?0x8000:17);}
 const registers={ds:0x4000,es,si:0x100,bp:0x200,dx:0x1234,cx:0x300},before=m.slice(),next=prepare(m,0x1c0b,registers,0x800);if(!m.every((x,i)=>x===before[i]))throw Error('Source mutated');next.memory.fill(0,g+0xfec0,g+0xff10);const {memory,...result}=next;
 cases.push({es,base,dirty,force,flags,statuses,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
