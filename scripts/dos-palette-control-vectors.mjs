import {prepareOriginalDosPaletteControl} from '../src/lib/ishar/original-dos-palette-control.ts';
import {createHash} from 'node:crypto';
const cases=[],hash=b=>createHash('sha256').update(b).digest('hex');
for(const [flag,other,control] of [[0,0,0],[0,1,0],[0,1,1],[0,2,0],[1,0,0],[2,0,255]])for(const value of [0,1,62,63,64,16128,32768,65535])for(const [mode,time] of flag===0?[[0,0]]:[[0,0],[2,201],[3,65535],[0,32768]]){
 const memory=new Uint8Array(0x100000),g=0x1c0b0,v=new DataView(memory.buffer);
 for(let n=0;n<0x28c0;n++)memory[g+n]=(n*37+11)&255;
 memory[g+0x2898]=flag;memory[g+0x2897]=other;memory[g+0xbf4]=control;v.setUint16(g+0x2894,mode,true);v.setUint16(g+0xc9f,time,true);
 memory.set([2,value&255,value>>>8],0x40000);const globals=Buffer.from(memory.subarray(g,g+0x28c0)).toString('base64');
 const next=prepareOriginalDosPaletteControl(memory,0x1c0b,{ds:0x4000,es:0x5000,si:0,bp:0x200,dx:0x3456,cx:0x789a});
 cases.push({flag,other,control,value,mode,time,globals,phase:next.phase,entry:next.entry,registers:next.registers,hash:hash(next.memory.subarray(g,g+0x28c0))});
}
console.log(JSON.stringify(cases));
