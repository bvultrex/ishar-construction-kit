import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {evaluateOriginalAlisInteger} from '../src/lib/ishar/original-alis-expression.ts';
import {originalGoldSelectionInput} from '../src/lib/ishar/original-gold-selection.ts';
const root=process.env.ISHAR2_DIR,listings=process.env.ISHAR_ACTOR_LISTINGS;if(!root||!listings)throw Error('ISHAR2_DIR and ISHAR_ACTOR_LISTINGS required');
const file=readFileSync(join(root,'FRISE.IO'));assert.equal(createHash('sha256').update(file).digest('hex'),'27117c124caf904a31568f5c58f615946083dd3429c02ade1dc1e17552cc2b64');
const image=readAlisModule(new Uint8Array(file)).image;
const code=readFileSync(join(listings,'FRISE.IO.asm'),'utf8').split(/\r?\n/).flatMap(line=>{const m=line.match(/^\s*([\da-f]{5})\s+([\da-f]+)\s+(\w+)\s*(.*)$/);return m?[{address:parseInt(m[1],16),hex:m[2],op:m[3],args:m[4]}]:[];});
const labels=new Map(code.map((row,index)=>[row.address,index]));let prefixes=0;
for(const row of code)if((row.address>=0x4478&&row.address<=0x46ab)||(row.address>=0x6865&&row.address<=0x693d)){
 const prefix=Buffer.from(row.hex,'hex');assert.deepEqual(Buffer.from(image.slice(row.address,row.address+prefix.length)),prefix,row.address.toString(16));prefixes++;
}
// Execute the ORIGINAL listing's arithmetic branches. Drawing and scheduler UI
// are not emulated: stop at first cstop after a successful selection, or 0x4680.
function reference(state,balance,x){
 const local=new Map([[0x106,state.gold[1]],[0x108,state.gold[0]],[0x10a,state.step],[0x10c,state.repeatCounter],[0x14,0]]),stack=[],calls=[];
 const word=n=>((n&65535)^32768)-32768;
 const main=new Map([[0x76,x],[0x2d68,balance[0]],[0x2d80,balance[1]]]);
 const read=(space,at)=>{const n=(space==='main'?main:local).get(at);if(n===undefined)throw Error('Missing reference input '+at.toString(16));return n;};
 const context={scan:0,read,table:(_space,at,index,_stack,isWord)=>read('main',at+index*(isWord?2:1))};
 let pc=labels.get(0x44cd),condition=0;
 for(let budget=0;budget<200;budget++){
  const row=code[pc++];if(row.address===0x4680||row.op==='cstop')return {gold:[local.get(0x108),local.get(0x106)],step:local.get(0x10a),repeatCounter:local.get(0x10c)};
  const target=()=>{const m=row.args.match(/L_([\da-f]+)/);assert.ok(m);const idx=labels.get(parseInt(m[1],16));assert.notEqual(idx,undefined);return idx;};
  if(row.op==='ceval'){condition=evaluateOriginalAlisInteger(row.args,context,stack);continue;}
  if(row.op.startsWith('cbz')){if(!condition)pc=target();continue;}
  if(row.op.startsWith('cjmp')){pc=target();continue;}
  if(row.op.startsWith('cjsr')){calls.push(pc);pc=target();continue;}
  if(row.op==='cret'){assert.ok(calls.length);pc=calls.pop();continue;}
  if(['cstore','cadd','csub'].includes(row.op)){
   const split=row.args.lastIndexOf(','),destination=row.args.slice(split+1).match(/(?:->s|\+>a)(?:loc|dir)([bw])\(0x([\da-f]+)\)/);assert.ok(destination,row.args);
   const at=parseInt(destination[2],16),value=evaluateOriginalAlisInteger(row.args.slice(0,split),context,stack),old=local.get(at)??0;
   const result=row.op==='cstore'?value:row.op==='cadd'?old+value:old-value;
   local.set(at,destination[1]==='w'?word(result):((result&255)^128)-128);continue;
  }
  throw Error('Unexpected reference opcode '+row.op);
 }
 throw Error('Reference budget');
}
let cases=0;
for(const gold of [[0,0],[0,5],[0,999],[1,0],[4,999]])for(const step of [1,10,100])for(const repeatCounter of [0,24,25])for(const x of [190,225]){
 const state={gold,step,repeatCounter},balance=[5,0];
 assert.deepEqual(originalGoldSelectionInput(state,balance,{button:1,x,y:90}).state,reference(state,balance,x),JSON.stringify({state,x}));cases++;
}
console.log(`${prefixes} original instruction prefixes verified; ${cases} selector cases match execution of original listing arithmetic. Shared operand evaluator; no native DOS input/render/timing equivalence claim.`);
