import {stepOriginalDosPhysicalScript} from '../src/lib/ishar/original-dos-physical-script.ts';
import {createHash} from 'node:crypto';
let input='';for await(const chunk of process.stdin)input+=chunk;
const request=JSON.parse(input);let memory=new Uint8Array(Buffer.from(request.memory,'base64')),registers=request.registers,reason=null;const steps=[];
for(let index=0;index<5000;index++){
 let next;try{next=stepOriginalDosPhysicalScript(memory,request.ss,registers,request.engineSegment??0x1000,request.shiftFlags===undefined?undefined:{shiftFlags:request.shiftFlags});}catch(e){reason=String(e);break;}
 memory=next.memory;registers=next.registers;const compared=memory.slice();compared.fill(0,request.ss*16+(request.stackMask?.[0]??0xfec0),request.ss*16+(request.stackMask?.[1]??0xff10));
 steps.push({registers,status:next.status,opcode:next.opcode,hash:createHash('sha256').update(compared).digest('hex')});
 if(next.status==='yield')break;
 if(index===4999)reason='Explicit5000-step host limit';
}
console.log(JSON.stringify({steps,nextOpcode:memory[registers.ds*16+registers.si],reason}));
