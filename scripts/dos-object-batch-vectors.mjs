import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareOriginalDosObjectBatch as prepare} from '../src/lib/ishar/original-dos-object-batch.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const es of [0x5000,0x1c0b])for(const dirty of [false,true])for(const negative of [false,true])for(const otherGroup of [0,1])for(const tail of [[],[255],[2],[1],[0],[255,2,1,0]]){
 const m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer);m.fill(0,g,g+0x28c0);if(es===0x5000)m.fill(0,0x50000,0x60000);m.fill(0,0x60000,0x61000);m.fill(0,0x70000,0x80000);
 const word=(s,o,value)=>v.setUint16(s*16+(o&65535),value,true),byte=(s,o,value)=>m[s*16+o]=value;
 for(const [at,value] of [[0xbf6,0x200],[0xbea,0x7000],[0xb18,0x200],[0xbec,0x2000]])word(0x1c0b,at,value);byte(es,0x300,dirty?128:0);byte(es,0x31d,255);byte(es,0x324,1);word(es,0x302,0x200);word(0x7000,0x206,0x1000);
 word(0x6000,0x100,0x100);byte(0x6000,0x200,1);word(0x6000,0x202,4);word(0x6000,0x204,6);
 const statuses=[255,...tail];for(let i=0;i<statuses.length;i++){const at=0x1000+i*0x100;byte(0x7000,at,statuses[i]);word(0x7000,at+2,0x100);word(0x7000,at+6,i+1<statuses.length?at+0x100:0);for(const [offset,value] of [[8,0x100],[10,0x6000],[12,10],[14,10],[16,1],[18,0x100],[20,0x6000],[22,100+i],[24,20],[26,5],[30,i?otherGroup:negative?65535:0]])word(0x7000,at+offset,value);}
 const registers={ds:0x4000,es,si:0x100,bp:0x200,dx:0x1234,cx:0x200},before=m.slice(),next=prepare(m,0x1c0b,registers,0x300);if(!m.every((x,i)=>x===before[i]))throw Error('Source mutated');next.memory.fill(0,g+0xfec0,g+0xff10);const {memory,...result}=next;
 cases.push({es,dirty,negative,otherGroup,tail,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
