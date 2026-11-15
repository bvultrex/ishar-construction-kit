import {assignOriginalDosIndexedValue} from '../src/lib/ishar/original-dos-indexed-assignment.ts';
import {createHash} from 'node:crypto';
let input='';for await(const chunk of process.stdin)input+=chunk;
const request=JSON.parse(input);let memory=new Uint8Array(Buffer.from(request.memory,'base64')),registers=request.registers,reason=null;const steps=[];
while([30,32,33].includes(memory[registers.ds*16+registers.si])){
 if(steps.length>=1000)throw Error('Assignment prefix host bound exceeded');
 const opcode=memory[registers.ds*16+registers.si];let next;try{next=assignOriginalDosIndexedValue(memory,request.ss,{...registers,si:(registers.si+1)&65535},opcode===32?'add':opcode===33?'subtract':'store');}catch(e){reason=String(e);break;}
 memory=next.memory;registers=next.registers;const compared=memory.slice();compared.fill(0,request.ss*16+0xfec0,request.ss*16+0xff10);
 steps.push({registers,tag:next.tag,hash:createHash('sha256').update(compared).digest('hex')});
}
console.log(JSON.stringify({steps,nextOpcode:memory[registers.ds*16+registers.si],reason}));
