import {evaluateOriginalAlisInteger} from './original-alis-expression.ts';
import {originalAlisArrayAddress,type AlisArrayDeclaration} from './original-alis-arrays.ts';
export interface EaffSpawnChoice {moduleId:number|null;lateral:number;mainWrites:{address:number;value:number}[];trace:number[]}
export interface EaffCrowdInput {distance:number;lateral:number;random?:(bound:number)=>number}
/** Bounded execution of Ishar-2 EAFF 0x61d..0x986 only. Records clive intent;
 * does not allocate, execute the child or process subsequent audio/placement. */
export function chooseOriginalEaffSpawn(listing:string,actorId:number,lateral:number,main:ReadonlyMap<number,number>,arrays:ReadonlyMap<number,AlisArrayDeclaration>,crowd?:EaffCrowdInput):EaffSpawnChoice{
 if(!Number.isInteger(actorId)||actorId<0||actorId>127||!Number.isInteger(lateral)||lateral< -32768||lateral>32767)throw Error('Invalid EAFF spawn input');
 const code=new Map<number,{op:string;args:string;next:number}>();
 const lines=listing.split(/\r?\n/).flatMap(line=>{const m=line.match(/^\s*([\da-f]{5})\s+[\da-f]+\s+(\w+)\s*(.*)$/);return m?[{at:parseInt(m[1]!,16),op:m[2]!,args:m[3]!}]:[];});
 lines.forEach((line,i)=>code.set(line.at,{...line,next:lines[i+1]?.at??-1}));
 const local=new Map<number,number>([[0x16,actorId],[0x1a,(lateral>>8)&255],[0x1b,lateral&255]]),overlay=new Map<number,number>(),writes:EaffSpawnChoice['mainWrites']=[],trace:number[]=[],stack:number[]=[];
 if(crowd){
  if(!Number.isInteger(crowd.distance)||crowd.distance<0||crowd.distance>5||!Number.isInteger(crowd.lateral)||Math.abs(crowd.lateral)>crowd.distance)throw Error('Invalid EAFF crowd geometry');
  local.set(0x14,crowd.distance);local.set(0x15,crowd.lateral&255);
 }
 const signed=(n:number,bits:number)=>(n&(2**bits-1))>=2**(bits-1)?(n&(2**bits-1))-2**bits:n&(2**bits-1);
 const read=(memory:ReadonlyMap<number,number>,at:number,word:boolean):number=>{
  const byte=(a:number)=>{const v=memory===main?(overlay.get(a)??memory.get(a)):memory.get(a);if(v===undefined)throw Error(`Missing EAFF memory ${a.toString(16)}`);return v;};
  return word?signed((byte(at)<<8)|byte(at+1),16):signed(byte(at),8);
 };
 const expr=(text:string)=>evaluateOriginalAlisInteger(text,{scan:0,random:crowd?.random,read:(space,at,word)=>read(space==='main'?main:local,at,word),table:(_space,at,index,operandStack,word)=>{
  const declaration=arrays.get(at);if(!declaration)throw Error(`Missing EAFF array ${at.toString(16)}`);
  return read(main,originalAlisArrayAddress(declaration,index,operandStack,word?2:1),word);
 }},stack);
 let pc=crowd?0x4c8:0x61d,condition=0,moduleId:number|null=null;
 for(let budget=0;budget<256;budget++){
  if(pc===0x986)return {moduleId,lateral:read(local,0x1a,true),mainWrites:writes,trace};
  if(pc<(crowd?0x4c8:0x61d)||pc>=0x986)throw Error('EAFF dispatch escaped supported block');
  const ins=code.get(pc);if(!ins)throw Error('Missing EAFF dispatch instruction');trace.push(pc);pc=ins.next;
  const jump=()=>{const m=ins.args.match(/L_([\da-f]+)/);if(!m)throw Error('Missing EAFF branch');return parseInt(m[1]!,16);};
  if(ins.op==='ceval'){condition=expr(ins.args);continue;}
  if(/^cjmp\d+$/.test(ins.op)){pc=jump();continue;}
  if(/^cb(?:n)?z\d+$/.test(ins.op)){if(ins.op.startsWith('cbnz')?condition!==0:condition===0)pc=jump();continue;}
  if(ins.op==='cswitch2'){
   const value=expr(ins.args.slice(0,ins.args.indexOf(', {'))),cases=[...ins.args.matchAll(/(-?\d+):L_([\da-f]+)/g)],found=cases.find(m=>+m[1]===value);if(found)pc=parseInt(found[2]!,16);continue;
  }
  if(ins.op==='clive'){
   const m=ins.args.match(/^0x([\da-f]+), ->sdirw\(0x2c\)$/);if(!m||moduleId!==null)throw Error('Unsupported EAFF spawn');moduleId=parseInt(m[1]!,16);continue;
  }
  if(ins.op==='cstore'||ins.op==='cadd'){
   const split=ins.args.indexOf(', ');if(split<0)throw Error('Invalid EAFF store');
   const value=expr(ins.args.slice(0,split)),target=ins.args.slice(split+2),direct=target.match(/^(?:->s|\+>a)dir([bw])\(0x([\da-f]+)\)$/);
   if(direct){const word=direct[1]==='w',at=parseInt(direct[2]!,16),v=ins.op==='cadd'?read(local,at,word)+value:value;local.set(at,word?(v>>8)&255:v&255);if(word)local.set(at+1,v&255);continue;}
   const scalar=target.match(/^->smainb\(0x([\da-f]+)\)$/),array=target.match(/^->seval\((.*),smaintc\(0x([\da-f]+)\)\)$/);
   let address:number;if(scalar)address=parseInt(scalar[1]!,16);else if(array){const index=expr(array[1]!),at=parseInt(array[2]!,16),declaration=arrays.get(at);if(!declaration)throw Error('Missing EAFF store array');address=originalAlisArrayAddress(declaration,index,stack,1);}else throw Error(`Unsupported EAFF store ${target}`);
   if(ins.op!=='cstore')throw Error('Unsupported EAFF MAIN addition');overlay.set(address,value&255);writes.push({address,value:value&255});continue;
  }
  throw Error(`Unsupported EAFF dispatch opcode ${ins.op}`);
 }
 throw Error('EAFF spawn dispatch budget exceeded');
}
