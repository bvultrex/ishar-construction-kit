import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {initializeOriginalDosJoystick} from '../src/lib/ishar/original-dos-joystick-startup.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const high of [0,0x30,0x70,0xf0])for(const failure of [-1,0,1,2,3,4,5,6,7,8]){
 const replies=Array(201).fill(high);
 if(failure===8)replies[4]=high^0x10;
 if(high&0x30)for(let axis=0;axis<4;axis++){
  const mask=1<<axis;
  if(failure===axis*2){replies.push(...Array(65536).fill(mask));if(axis<2)axis=1;else break;continue;}
  replies.push(mask,0);
  if(failure===axis*2+1){replies.push(...Array(65536).fill(mask));if(axis<2)axis=1;else break;continue;}
  replies.push(...Array(axis+1).fill(mask),0);
 }
 const m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer);v.setUint16(g+0xfefe,0x902,true);v.setUint16(g+0xc9d,0x8000,true);m[g+0x288a]=1;m[g+0x288b]=1;
 const {memory,...result}=initializeOriginalDosJoystick(m,0x1c0b,replies,0xabcd);memory.fill(0,g+0xfef4,g+0xff00);
 cases.push({high,failure,replies,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
