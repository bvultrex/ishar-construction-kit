import {writeOriginalDosPhysicalScriptBlock} from '../src/lib/ishar/original-dos-script-block.ts';
import {createHash} from 'node:crypto';
let input='';for await(const chunk of process.stdin)input+=chunk;
const request=JSON.parse(input);let memory=new Uint8Array(Buffer.from(request.memory,'base64')),si=request.si;const steps=[];
while(request.single?steps.length===0:memory[request.ds*16+si]===41){
 if(steps.length>=1000)throw Error('Block prefix host bound exceeded');
 const next=writeOriginalDosPhysicalScriptBlock(memory,request.ds,request.es,(si+1)&65535,request.bp);memory=next.memory;si=next.si;
 const compared=memory.slice();compared.fill(0,request.ss*16+0xfec0,request.ss*16+0xff10);
 steps.push({si,count:next.count,hash:createHash('sha256').update(compared).digest('hex')});
}
console.log(JSON.stringify({steps,nextOpcode:memory[request.ds*16+si],si}));
