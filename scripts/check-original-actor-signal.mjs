import assert from 'node:assert/strict';
import {readAlisArrayDeclaration,originalAlisArrayAddress} from '../src/lib/ishar/original-alis-arrays.ts';
import {originalActorSignal} from '../src/lib/ishar/original-actor-signal.ts';
const id=53,main=new Map(),arrays=new Map([[0x426e,{address:0x426e,elementBytes:1,strides:[3]}],[0x2d8e,{address:0x2d8e,elementBytes:2,strides:[30]}]]);
const b=(at,v)=>main.set(at,v&255),w=(at,v)=>{b(at,v>>8);b(at+1,v);};
function base(state=3,active=0,ack=-1){main.clear();b(0x43ba+id,state);b(0x48f4+id,active);b(0x442a+id,ack);b(0x4964+id,0);b(0x3fce+id,10);b(0x3d2e+id,9);w(0x378a+id*2,10);w(0x3868+id*2,10);}
const spawn=value=>({kind:'spawn',moduleId:18,parameterOffset:13,value});
const write=(address,value,width=1)=>({kind:'write',address,width,value});
const run=()=>{const before=new Map(main),out=originalActorSignal(main,id,arrays);assert.deepEqual(main,before);return out;};
base();assert.deepEqual(run(),{outcome:'started',operations:[spawn(3),write(0x48f4+id,1),write(0x442a+id,-1)]});
for(const state of [1,20,22]){
 base(state,1,1);assert.deepEqual(run().operations,[spawn(-state),write(0x4964+id,1)]);
 w(0x378a+id*2,9);assert.deepEqual(run().operations,[spawn(-1),write(0x442a+id,-1)]);
 // Comparisons are signed; threshold -1 must not become 255.
 b(0x3fce+id,-1);assert.deepEqual(run().operations,[spawn(-state),write(0x4964+id,1)]);
}
base(2,1,1);b(0x3d2e+id,61);assert.deepEqual(run().operations,[spawn(-2),write(0x442a+id,-1),write(0x4964+id,0),write(0x3868+id*2,0,2),write(0x378a+id*2,0,2)]);
b(0x3d2e+id,60);assert.deepEqual(run().operations,[spawn(-2),write(0x4964+id,1)]);
w(0x3868+id*2,9);w(0x378a+id*2,0);assert.deepEqual(run().operations,[spawn(-1),write(0x442a+id,-1)]);
w(0x378a+id*2,1);assert.deepEqual(run().operations,[spawn(-2),write(0x4964+id,1)]);
base(99);b(0x426e+id*3,7);assert.equal(run().operations[0].value,7,'cdim stride 3 consumes actor index');
base(99,1,99);b(0x426e+id*3,7);assert.deepEqual(run().operations,[spawn(-7),write(0x4964+id,1)]);
base(3,1,1);assert.deepEqual(run().operations,[spawn(-3),write(0x442a+id,-1)]);
base(3,1,3);assert.deepEqual(run().operations,[spawn(-3),write(0x4964+id,1)]);
base(3,1,2);assert.deepEqual(run(),{outcome:'idle',operations:[]});
base(8);for(let party=0;party<=4;party++)w(0x2d5c+party*2,0);
assert.equal(run().outcome,'started');
for(let party=0;party<=4;party++){
 for(let p=0;p<=4;p++)w(0x2d5c+p*2,0);
 w(0x2d5c+party*2,1);w(0x2d8e+party*30+22,-80);assert.equal(run().outcome,'started');
 w(0x2d8e+party*30+22,-79);assert.deepEqual(run(),{outcome:'suppressed',operations:[write(0x43ba+id,-2)]});
}
base(99);assert.throws(()=>originalActorSignal(main,id,new Map()),/Missing cdim/);
assert.throws(()=>originalActorSignal(new Map(),id,arrays),/MAIN/);assert.throws(()=>originalActorSignal(main,49,arrays),/slot/);
const bytes=Uint8Array.from([0x29,0x8e,0x2d,1,2,30,0]);
assert.deepEqual(readAlisArrayDeclaration(bytes,0),arrays.get(0x2d8e));
const stack=[123,4];assert.equal(originalAlisArrayAddress(arrays.get(0x2d8e),11,stack,2),0x2d8e+4*30+22);assert.deepEqual(stack,[123]);
assert.equal(originalAlisArrayAddress({address:100,elementBytes:1,strides:[12,60]},3,[2,4],1),271);
assert.throws(()=>readAlisArrayDeclaration(bytes.slice(0,6),0),/Truncated/);
assert.throws(()=>originalAlisArrayAddress(arrays.get(0x2d8e),11,[],2),/Missing/);
console.log('EATT signal trace: activation, acknowledgements, ordered writes, signed comparisons, type 61, party suppression, multidimensional cdim strides and immutable input passed.');
// Verify the real caller does not turn negative combat state into a signal.
const {originalActorSignalStep}=await import('../src/lib/ishar/original-actor-signal.ts');
function near(){base();b(0x449a+id,1);b(0x4ef2,1);w(0x36ac+id*2,1);for(const at of [0x3946,0x3a24,0x3b02])w(at+id*2,0);b(0x3cbe+id,0);b(0x2d18,1);b(0x2ab4,40);b(0x2ab5,40);}
for(const [dr,dc,facing] of [[1,0,2],[-1,0,4],[0,-1,1],[0,1,3]]){
 near();w(0x3412+id*2,40+dr);w(0x34f0+id*2,40+dc);
 for(let direction=1;direction<=4;direction++){b(0x2ab6,direction);assert.equal(originalActorSignalStep(main,id,false,arrays).outcome,direction===facing?'started':'not-entered');}
 assert.equal(originalActorSignalStep(main,id,true,arrays).outcome,'not-entered');
 b(0x43ba+id,-1);assert.equal(originalActorSignalStep(main,id,false,arrays).outcome,'not-entered');
}
near();w(0x3412+id*2,40);w(0x34f0+id*2,40);w(0x35ce+id*2,3);b(0x2ab6,3);assert.equal(originalActorSignalStep(main,id,false,arrays).outcome,'started');
b(0x2ab6,2);assert.equal(originalActorSignalStep(main,id,false,arrays).outcome,'not-entered');
b(0x2ab6,3);b(0x4964+id,1);assert.equal(originalActorSignalStep(main,id,false,arrays).outcome,'not-entered');
console.log('Original EATT caller: four cardinal facing cases, co-location orientation, movement and activation gates passed.');
