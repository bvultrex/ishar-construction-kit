import {createHash} from 'node:crypto';
import {writeOriginalDosOpcode186} from '../src/lib/ishar/original-dos-script-opcode186.ts';
const hash=b=>createHash('sha256').update(b).digest('hex'),cases=[];
for(let pattern=0;pattern<1024;pattern++)for(const seed of [0,128,32768,65535]){
 const script=new Uint8Array(65536),context=new Uint8Array(65536).fill(0xa5),globals=new Uint8Array(65536).fill(0x5a);let si=0x101;
 for(let i=0;i<5;i++){
  const tag=[0,2,6,8][(pattern>>>(i*2))&3],raw=tag<6?((seed+i)&65535):i*2;
  script[si++]=tag;script[si++]=raw&255;if(tag!==0)script[si++]=raw>>>8;
  context[0x200+i*2]=(seed+i)&255;context[0x201+i*2]=((seed+i)&65535)>>>8;
 }
 const before=hash(globals),next=writeOriginalDosOpcode186(script,context,globals,0x101,0x200,0x3456);
 if(hash(globals)!==before)throw Error('Input globals mutated');
 cases.push({pattern,seed,script:Array.from(script.slice(0x101,si)),expected:{si:next.si,dx:next.dx,cx:next.cx,globalsHash:hash(next.memory.subarray(0,0x28c0))}});
}
console.log(JSON.stringify(cases));
