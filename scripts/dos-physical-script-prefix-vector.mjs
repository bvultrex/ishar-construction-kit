import {stepOriginalDosPhysicalScript} from '../src/lib/ishar/original-dos-physical-script.ts';
import {createHash} from 'node:crypto';
let input='';for await(const chunk of process.stdin)input+=chunk;
const request=JSON.parse(input);let memory=new Uint8Array(Buffer.from(request.memory,'base64')),registers=request.registers,reason=null;const steps=[],fileEvents=[];let fileIndex=0,joystickIndex=0;
const driveServices=request.currentDrive===undefined?undefined:{currentDrive:()=>request.currentDrive,selectDrive:()=>3,equipmentWord:()=>{if(request.equipmentWord===undefined)throw Error('Explicit BIOS equipment reply required');return request.equipmentWord;},readSector:()=>{throw Error('Explicit BIOS sector reply required');}};
const fileSearch=request.findFirstReplies===undefined?undefined:{findFirst:(pattern,attributes,drive)=>{if(fileIndex>=request.findFirstReplies.length)throw Error('Explicit FindFirst replies exhausted');const carry=request.findFirstReplies[fileIndex++];fileEvents.push({patternSha256:createHash('sha256').update(pattern).digest('hex'),attributes,drive,carry});return carry;}};
for(let index=0;index<5000;index++){
 let next;try{next=stepOriginalDosPhysicalScript(memory,request.ss,registers,request.engineSegment??0x1000,request.joystickReplies===undefined&&request.shiftFlags===undefined&&fileSearch===undefined&&request.palette===undefined&&driveServices===undefined?undefined:{joystickReplies:request.joystickReplies?.slice(joystickIndex),shiftFlags:request.shiftFlags,fileSearch,palette:request.palette,driveServices});}catch(e){reason=String(e);break;}
 joystickIndex+=next.events.filter(e=>e.kind==='in'&&e.port===0x201).length;memory=next.memory;registers=next.registers;const compared=memory.slice();compared.fill(0,request.ss*16+(request.stackMask?.[0]??0xfec0),request.ss*16+(request.stackMask?.[1]??0xff10));
 steps.push({registers,status:next.status,opcode:next.opcode,events:next.events,hash:createHash('sha256').update(compared).digest('hex')});
 if(next.status==='yield')break;
 if(index===4999)reason='Explicit5000-step host limit';
}
console.log(JSON.stringify({fileEvents,steps,nextOpcode:memory[registers.ds*16+registers.si],reason}));
