import assert from 'node:assert/strict';
import {stepOriginalBlancpcInterrupt as step} from '../src/lib/ishar/original-blancpc-interrupt.ts';
const input={operandAX:0xaa20,samplePointer:0x8000,counter:1};
const first=step(input,p=>{assert.equal(p,0x8000);return 64;});
assert.deepEqual(first,{state:{operandAX:0x5540,samplePointer:0x8001,counter:1},ports:[{port:66,value:32},{port:32,value:32}],exit:'iret',path:'sample'});
const second=step(first.state,()=>assert.fail('rotate branch must not read sample'));
assert.equal(second.state.operandAX,0xaa40);assert.equal(second.state.samplePointer,0x8001);
assert.deepEqual(input,{operandAX:0xaa20,samplePointer:0x8000,counter:1});
assert.equal(step({...input,samplePointer:65535},()=>2).state.samplePointer,0);
for(let counter=0;counter<=65535;counter++){
 const result=step({...input,counter},()=>0),dec=(counter+65535)%65536;
 assert.equal(result.state.counter,dec>=32768?counter:dec);
 assert.equal(result.exit,counter===1?'far-jump':'iret');
 assert.equal(result.ports.length,counter===1?1:2);
 assert.equal(result.state.operandAX,input.operandAX,'terminator does not commit rotated AH');
}
for(let high=0;high<256;high++){
 let reads=0;const result=step({...input,operandAX:(high<<8)|7},()=>{reads++;return 8;});
 assert.equal(reads,high>=128?1:0);assert.equal(result.state.operandAX>>>8,((high*2)+(high>=128?1:0))%256);
}
assert.throws(()=>step({...input,counter:-1},()=>0),/state/);assert.throws(()=>step(input,()=>256),/byte/);
if(process.env.ISHAR1_DIR&&process.env.ISHAR2_DIR){
 const {readFileSync}=await import('node:fs');const {createHash}=await import('node:crypto');const {readAlisModule}=await import('../src/lib/ishar/alis-module.ts');
 for(const key of ['ISHAR1_DIR','ISHAR2_DIR']){
  const raw=readFileSync(`${process.env[key]}/BLANCPC.IO`);assert.equal(createHash('sha256').update(raw).digest('hex'),'fa35da163339385cc8fb95b5469bc5fb52e8d31a803f84854da5c89d7196c229');
  const image=readAlisModule(raw).image,view=new DataView(image.buffer,image.byteOffset,image.byteLength);
  assert.equal(view.getUint16(66,true),input.operandAX);assert.equal(view.getUint16(76,true),input.samplePointer);assert.equal(view.getUint16(141,true),input.counter);
 }
 console.log('Both original BLANCPC hashes and initial self-modified operands/counter verified.');
}
console.log('Native BLANCPC reconstruction: all 65536 counter states, 256 rotation states, pointer wrap and port/exit traces passed. No CPU/hardware equivalence claimed.');
