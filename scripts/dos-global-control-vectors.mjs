import {stepOriginalDosPhysicalScript} from '../src/lib/ishar/original-dos-physical-script.ts';
import {createHash} from 'node:crypto';
const cases=[],hash=b=>createHash('sha256').update(b).digest('hex');
for(const tag of [168,0,2,6,8,30,32])for(const value of [0,1,255,32768,65535]){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),g=0x1c0b0,opcode=tag===168?31:215;
 v.setUint16(g+0xbf6,0x300,true);v.setUint16(g+0xc9d,value,true);memory[g+0xbf4]=0xaa;memory[g+0xbf5]=0xbb;
 const code=tag===168?[31,168]:tag===0?[215,0,value&255]:tag===2?[215,2,value&255,value>>>8]:[215,tag,0,1];memory.set(code,0x40000);
 if([6,8,30,32].includes(tag))v.setUint16(0x50000+(tag>=30?0x300:0x200)+0x100,value,true);
 const registers={ds:0x4000,es:0x5000,si:0,bp:0x200,dx:0x3456,cx:0x789a};
 const next=stepOriginalDosPhysicalScript(memory,0x1c0b,registers);
 cases.push({tag,value,opcode,code,registers:next.registers,globalsHash:hash(next.memory.subarray(g,g+0x28c0)),contextHash:hash(next.memory.subarray(0x50000,0x60000))});
}
console.log(JSON.stringify(cases));
