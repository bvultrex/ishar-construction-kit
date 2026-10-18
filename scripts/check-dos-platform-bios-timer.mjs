import assert from 'node:assert/strict';
import {completeDosPlatformBiosTimer as complete} from '../src/lib/ishar/dos-platform-bios-timer.ts';
const r={ax:0x1234,bx:2,cx:3,dx:4,di:5,si:6,bp:7,ds:0x4000,es:0x5000,sp:0x800,cs:0x7000,ip:0x1234},profile={kind:'dosbox-ega-unhooked',handlerSegment:0x7000,handlerOffset:0x1234};let cases=0;
for(const ticks of [0,1,0x1800ae,0x1800af,0x1800b0,0xffffffff])for(const motor of [0,1,2,255])for(const midnight of [0,255]){
 const m=new Uint8Array(0x100000),v=new DataView(m.buffer);v.setUint32(0x46c,ticks,true);m[0x440]=motor;m[0x43f]=0xaf;m[0x470]=midnight;
 for(const [at,value] of [[0x800,0x3d64],[0x802,0x1000],[0x804,0x602]])v.setUint16(0x1c0b0+at,value,true);
 const before=m.slice(),next=complete(m,0x1c0b,r,profile),word=new DataView(next.memory.buffer),increment=(ticks+1)>>>0,roll=increment>=0x1800b0;
 assert.deepEqual(m,before);assert.equal(word.getUint32(0x46c,true),roll?0:increment);assert.equal(next.memory[0x470],(midnight+Number(roll))&255);assert.equal(next.memory[0x440],Math.max(motor-1,0));assert.equal(next.memory[0x43f],motor===1?0xa0:0xaf);
 assert.deepEqual(next.registers,{...r,sp:0x806,cs:0x1000,ip:0x3d64,flags:0x602});
 for(let at=0;at<m.length;at++)if(![0x43f,0x440,0x46c,0x46d,0x46e,0x46f,0x470].includes(at))assert.equal(next.memory[at],m[at]);cases++;
}
const m=new Uint8Array(0x100000);m[0x70]=1;assert.throws(()=>complete(m,0x1c0b,r,profile),/INT1C/);assert.throws(()=>complete(new Uint8Array(0x100000),0x1c0b,{...r,cs:1},profile),/registered/);
console.log(JSON.stringify({cases,platform:'dosbox-ega-unhooked',verified:'Explicit BIOS service contract, rollover/motor fields, preserved memory/registers, IRET-frame restoration and rejected hooks/handler mismatch; no firmware execution claim'}));
