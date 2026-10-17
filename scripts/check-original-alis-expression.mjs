import assert from 'node:assert/strict';
import {evaluateOriginalAlisInteger as evaluate} from '../src/lib/ishar/original-alis-expression.ts';
import {originalAlisArrayAddress} from '../src/lib/ishar/original-alis-arrays.ts';
const context={scan:0,read:()=>{throw Error('Unexpected memory read');},table:()=>{throw Error('Unexpected table read');}};
const signed=n=>Number(BigInt.asIntN(16,BigInt(n)));
// Literal arithmetic and saved-left arithmetic must agree, including reversed
// subtraction/comparison and the native true value -1 (not JavaScript true/1).
for(const a of [-32768,-2000,-1,0,1,999,1000,32767])for(const b of [-2000,-1,0,1,999,32767]){
 const checks={oadd:signed(a+b),osub:signed(a-b),omul:signed(a*b),oegal:a===b?-1:0,odiff:a!==b?-1:0,oinf:a<b?-1:0,osup:a>b?-1:0,oinfeg:a<=b?-1:0,osupeg:a>=b?-1:0};
 if(b){checks.odiv=signed(Math.trunc(a/b));checks.omod=signed(a%b);}
 for(const [op,expected] of Object.entries(checks)){
  assert.equal(evaluate(`(oimmw(${a}) ${op}(oimmw(${b})))`,context),expected,`${op} literal`);
  const stack=[];assert.equal(evaluate(`(oimmw(${a}) opushacc oimmw(${b}) ${op}(opile))`,context,stack),expected,`${op} saved left`);assert.deepEqual(stack,[]);
 }
}
assert.equal(evaluate('(oimmw(1000) opushacc oimmw(-17) omod(oimmw(1000)) oabs osub(opile))',context),983,'FRISE 0x068d7 borrowing expression');
assert.equal(evaluate('(oimmb(1) oegal(oimmb(1)) oadd(oimmb(1)))',context),0,'native true is signed -1');
assert.equal(evaluate('(oimmb(2) oinf(oimmb(1)) opushacc oimmb(3) osup(oimmb(1)) oor(opile))',context),-1);
const stack=[17];assert.equal(evaluate('(oimmb(8) opushacc oimmb(3) osub(opile))',context,stack),5);assert.deepEqual(stack,[17]);
const tableContext={...context,table:(_space,at,index,stack,word)=>originalAlisArrayAddress({address:at,elementBytes:word?2:1,strides:[30]},index,stack,word?2:1)};
assert.equal(evaluate('(oimmb(4) opushacc oimmb(11) omainti(0x2d8e))',tableContext),0x2d8e+120+22,'dimension operand consumed by table callback');
for(const text of ['(oimmb(1)','oimmb(1))','(oimmb(1) osub(opile))','(oimmb(1) odiv(oimmb(0)))','(oimmb(1) omod(oimmb(0)))','(oimmb(1) oinvented)'])assert.throws(()=>evaluate(text,context));
assert.throws(()=>evaluate('(oimmb(100) ornd)',context),/random source/);
console.log('DOS operand registers: 48 input pairs, literal/saved-left arithmetic and comparisons, signed16 overflow, native booleans, FRISE borrowing, multidimensional operand consumption and failure cases passed.');
// oprnd uses a stack seed and never consumes the engine's transient RNG.
for(let raw=0;raw<65536;raw++){
 const seed=raw>=32768?raw-65536:raw,rot=BigInt.asUintN(16,(BigInt(raw)<<10n)|(BigInt(raw)>>6n));
 const mixed=BigInt.asUintN(16,rot*0x7ab7n-0x77fn),bound=raw%2?40:50,expected=Number(BigInt(bound)*mixed>>16n);
 const stack=[123,seed];assert.equal(evaluate(`(oimmw(${bound}) oprnd)`,context,stack),expected);assert.deepEqual(stack,[123]);
}
assert.throws(()=>evaluate('(oimmb(40) oprnd)',context),/stack/);
console.log('oprnd: all 65536 seed bit patterns checked against BigInt reference arithmetic; stack seed consumed without engine RNG.');
// Required MAIN declarations: preserve original strides; reject previews and duplicates.
const {readRequiredAlisArrays}=await import('../src/lib/ishar/original-alis-arrays.ts');
assert.deepEqual(readRequiredAlisArrays('  0009b  298e2d01021e00 cdim var=0x2d8e, ndim=1', [0x2d8e]).get(0x2d8e),{address:0x2d8e,elementBytes:2,strides:[30]});
assert.throws(()=>readRequiredAlisArrays('  0009b  298e2d0102 cdim var=0x2d8e, ndim=1',[0x2d8e]),/Truncated/);
assert.throws(()=>readRequiredAlisArrays('',[0x2d8e]),/Missing/);
assert.throws(()=>readRequiredAlisArrays('  0009b  298e2d01021e00 cdim var=0x2d8e\n  000aa  298e2d01021e00 cdim var=0x2d8e',[0x2d8e]),/Ambiguous/);
const regs={d6:123,d7:17};evaluate('(oimmb(5))',context,[],regs);assert.deepEqual(regs,{d6:123,d7:5},'literal preserves prior D6');
for(const [op,expected] of [['osub',3],['odiv',1],['omod',3]]){regs.d6=91;regs.d7=7;evaluate(`(${op}(oimmb(4)))`,context,[],regs);assert.deepEqual(regs,{d6:expected,d7:expected},`${op} updates both registers`);}
regs.d6=91;regs.d7=7;evaluate('(oadd(oimmb(4)))',context,[],regs);assert.deepEqual(regs,{d6:7,d7:11},'addition retains saved left operand in D6');
assert.throws(()=>evaluate('(oimmb(1))',context,[],{d6:65535,d7:0}),/registers/);
console.log('Persistent D6/D7: literals, saved-left arithmetic and both-register sub/div/mod side effects passed.');
