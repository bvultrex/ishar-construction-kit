import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {finishOriginalDosProjectedRecord as finish,retireOriginalDosProjectedRecord as retire} from '../src/lib/ishar/original-dos-projected-record.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
const scenarios=[
 {depth:0,priority:0,group:0,x:100,nodes:[]},
 {depth:32768,priority:128,group:255,x:32768,nodes:[]},
 {depth:65535,priority:255,group:128,x:65535,nodes:[[255,32767,0,0],[0,0,0,0],[0,32768,0,0]]},
 {depth:0,priority:0,group:0,x:100,nodes:[[0,0,0,0],[0,0,0,0]]},
 {depth:0,priority:128,group:0,x:100,nodes:[[0,0,0,0]]},
 {depth:0,priority:0,group:128,x:100,nodes:[[0,0,0,0]]},
 {depth:32767,priority:127,group:127,x:32767,nodes:[[0,32767,0,0],[0,65535,0,0]]},
 {depth:1,priority:1,group:1,x:32768,nodes:[[255,0,0,0],[0,2,0,0],[0,0,0,0]]},
];
for(const ds of [0x7000,0x1c0b])for(const middle of [false,true])for(const status of [255,2])for(const bounded of [false,true])for(const scenario of scenarios)for(const operation of ['commit','retire']){
 const m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer);m.fill(0,g,g+0x28c0);m.fill(0,0x60000,0x61000);m.fill(0,0x70000,0x80000);
 const word=(s,o,value)=>v.setUint16(s*16+(o&65535),value,true),byte=(s,o,value)=>m[s*16+o]=value;
 for(const [at,value] of [[0xc5e,0x100],[0xc60,0x6000],[0xc62,scenario.x],[0xc64,10],[0xc66,scenario.depth],[0xc2c,bounded?65436:32767],[0xc2e,bounded?65516:32767],[0xc30,bounded?200:32768],[0xc32,bounded?100:32768],[0xbec,0x2000]])word(0x1c0b,at,value);byte(0x1c0b,0xc68,1);
 word(0x6000,0x100,0x100);byte(0x6000,0x200,1);word(0x6000,0x202,4);word(0x6000,0x204,6);
 byte(ds,0x1000,status);byte(ds,0x1001,scenario.group);byte(ds,0x1020,scenario.priority);word(ds,0x1008,0x100);word(ds,0x100a,0x6000);word(ds,0x100c,scenario.x);word(ds,0x100e,10);word(ds,0x1010,scenario.depth);
 const nodes=scenario.nodes.map((_,i)=>0x1200+i*0x200),list=middle&&nodes.length?[nodes[0],0x1000,...nodes.slice(1)]:[0x1000,...nodes],previous=middle&&nodes.length?nodes[0]:0x300;word(ds,0x306,list[0]);
 for(let i=0;i<list.length;i++)word(ds,list[i]+6,list[i+1]??0);
 for(let i=0;i<nodes.length;i++){const [flag,depth,priority,group]=scenario.nodes[i],at=nodes[i];byte(ds,at,flag);byte(ds,at+1,group);byte(ds,at+32,priority);word(ds,at+16,depth);}
 const registers={ds,es:0x5000,si:0x100,bp:0x200,dx:0x1234,cx:0x300},before=m.slice(),next=operation==='commit'?finish(m,0x1c0b,registers,previous,0x1000):{...retire(m,0x1c0b,ds,previous,0x1000),registers,bx:previous};
 if(!m.every((x,i)=>x===before[i]))throw Error('Source mutated');next.memory.fill(0,g+0xfec0,g+0xff10);
 cases.push({ds,middle,status,bounded,scenario,operation,previous,registers:next.registers,di:next.di,bx:next.bx,hash:createHash('sha256').update(next.memory).digest('hex')});
}
console.log(JSON.stringify(cases));
