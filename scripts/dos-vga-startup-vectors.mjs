import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {initializeOriginalDosVgaStartup as initialize} from '../src/lib/ishar/original-dos-vga-startup.ts';
import {reserveOriginalDosPhysicalFramebuffer as reserve} from '../src/lib/ishar/original-dos-memory-layout.ts';
import {runOriginalDosPhysicalFrame as frame} from '../src/lib/ishar/original-dos-physical-frame.ts';
const withFrame=process.argv.includes('--with-frame');
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const crtPort of [0x3d4,0x3b4])for(const retraceRead of [0,8]){
 let m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer);m.fill(0,g,g+0x28c0);v.setUint16(0x1e970+0x3a,0xa511,true);v.setUint16(0x1e970+0x3c,0x2211,true);v.setUint16(0x28,0x1234,true);v.setUint16(0x2a,0x7000,true);
 const reservation=withFrame?reserve(m,0x1c0b,0x9fff):null;if(reservation)m=reservation.memory;
 const replies={biosWrites:[{address:0x449,data:new Uint8Array([19])},{address:0x463,data:new Uint8Array([crtPort&255,crtPort>>>8])}],vectorOffset:0x1234,vectorSegment:0x7000,crtData:crtPort===0x3d4?255:0x12,picMask:crtPort===0x3d4?255:0,miscRead:crtPort===0x3d4?128:0,retraceRead,irq0A:'none'},before=m.slice(),next=initialize(m,0x1c0b,0x1e97,replies);
 let frameResult=null;if(withFrame){frameResult=frame(next.memory,0x1c0b,{ds:0x4000,es:0x5000,si:0x6789,bp:0x789a,dx:0x4567,cx:0x3456});next.memory=frameResult.memory;}
 if(!m.every((x,i)=>x===before[i]))throw Error('Source mutated');next.memory.fill(0,g+0xfec0,g+0xff10);const {memory,...result}=next;
 cases.push({withFrame,reservation:reservation?{upper:0x9fff,segment:reservation.screenSegment,frontier:reservation.frontier,ax:reservation.ax,bx:reservation.bx}:null,frame:frameResult?{phase:frameResult.phase,entry:frameResult.entry}:null,crtPort,retraceRead,replyFields:{...replies,biosWrites:undefined},...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
