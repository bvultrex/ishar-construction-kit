import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {stepOriginalDosPhysicalScript} from '../src/lib/ishar/original-dos-physical-script.ts';
import {queryOriginalDosDrive} from '../src/lib/ishar/original-dos-drive-query.ts';
const original=new Uint8Array(readFileSync(process.argv[2])),cases=[];
{
 const memory=original.slice();memory[0x1e940]=1;const before=memory.slice();let rejected=false;
 try{queryOriginalDosDrive(memory,0x1000,63);}catch(e){rejected=String(e).includes('8AE4');}
 if(!rejected||!memory.every((v,i)=>v===before[i]))throw Error('Drive dialog boundary not atomic');
 if(queryOriginalDosDrive(memory,0x1000,0).dx!==0)throw Error('Invalid selector must bypass dialog');
}
for(const selector of [0,63,65,66,67,68,97,98,99,255,65535])for(const current of [0,1,2,3,255])for(const equipment of [0,192])for(const statuses of [[0],[4,0],[4,4]]){
 const memory=original.slice(),events=[];memory[0x1e940]=0;memory.set([31,160],0x60100);
 const input={ds:0x6000,es:0x7000,si:0x100,bp:0x200,dx:selector,cx:0x1234},before=memory.slice();
 const driveServices={currentDrive:()=>{events.push(['current']);return current;},selectDrive:drive=>{events.push(['select',drive]);return 3;},equipmentWord:()=>{events.push(['equipment']);return equipment;},readSector:(drive,attempt)=>{events.push(['sector',drive,attempt]);return {status:statuses[attempt],data:Uint8Array.from({length:512},(_,i)=>(i+drive+attempt*17)&255)};}};
 const next=stepOriginalDosPhysicalScript(memory,0x1c0b,input,0x1000,{driveServices});if(!memory.every((v,i)=>v===before[i]))throw Error('Drive input mutated');next.memory.fill(0,0x1c0b0+0xfec0,0x1c0b0+0xff10);
 cases.push({selector,current,equipment,statuses,input,registers:next.registers,events,hash:createHash('sha256').update(next.memory).digest('hex')});
}
console.log(JSON.stringify(cases));
