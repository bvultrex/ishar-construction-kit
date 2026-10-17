import assert from 'node:assert/strict';
import {readDosAlisLoop,stepOriginalDosLoop} from '../src/lib/ishar/original-alis-loop.ts';
for(const opcode of [0x2b,0x2c,0x2d])for(const op of [6,8,0x12,0x14]){
 const bytes=new Uint8Array(100),offset=30,width=opcode-0x2b+1,start=offset+1+width;bytes[offset]=opcode;bytes[start]=op;bytes[start+1]=17;
 const loop=readDosAlisLoop(bytes,offset);assert.equal(loop.target,start,'base before counter operand');assert.equal(loop.counterAddress,17);
 assert.deepEqual(stepOriginalDosLoop(loop,1),{value:0,zero:true,next:loop.next});
 assert.deepEqual(stepOriginalDosLoop(loop,0),{value:loop.counterBytes===1?255:65535,zero:false,next:loop.target});assert.equal(stepOriginalDosLoop(loop,-1).value,loop.counterBytes===1?254:65534);
}
assert.throws(()=>readDosAlisLoop(Uint8Array.from([0x2b,0,6,1]),0),/Truncated/);assert.throws(()=>readDosAlisLoop(Uint8Array.from([0x2b,0,0x1e,0,0]),0),/Unsupported/);
console.log('DOS loops: displacement base, four scalar counter forms, all widths, byte/word wrap, zero flag and fallthrough passed.');
if(process.env.ISHAR1_DIR&&process.env.ISHAR2_DIR&&process.env.ISHAR1_LISTINGS&&process.env.ISHAR_ACTOR_LISTINGS){
 const {readFileSync,readdirSync}=await import('node:fs');const {join}=await import('node:path');const {readAlisModule}=await import('../src/lib/ishar/alis-module.ts');
 for(const [game,root,dir] of [['ishar1',process.env.ISHAR1_DIR,process.env.ISHAR1_LISTINGS],['ishar2',process.env.ISHAR2_DIR,process.env.ISHAR_ACTOR_LISTINGS]]){
  let loops=0;const types={};
  for(const file of readdirSync(dir).filter(n=>n.endsWith('.IO.asm'))){const image=readAlisModule(readFileSync(join(root,file.slice(0,-4)))).image;
   for(const line of readFileSync(join(dir,file),'utf8').split(/\r?\n/)){
    const m=line.match(/^\s*([\da-f]{5})\s+[\da-f]+\s+cloop(8|16|24)\s+L_([\da-f]+), \+>(a(?:loc|dir)(?:b|w))\(0x([\da-f]+)\)/);if(!m)continue;
    const loop=readDosAlisLoop(image,parseInt(m[1],16));assert.equal(loop.width,+m[2]/8);assert.equal(loop.target,parseInt(m[3],16));assert.equal(loop.counterAddress&65535,parseInt(m[5],16));assert.equal(loop.counterBytes,m[4].endsWith('b')?1:2);loops++;types[m[4]]=(types[m[4]]??0)+1;
   }
  }
  console.log(`${game}: ${loops} listed original loops verified, counters ${JSON.stringify(types)}. Static/reference evidence, not native execution.`);
 }
}
