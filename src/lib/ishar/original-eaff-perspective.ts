import {evaluateOriginalAlisInteger} from './original-alis-expression.ts';
export interface EaffPerspectiveInput {map:number;distance:number;lateral:number;heightDelta?:number}
/** EAFF 0x37c..0x4c7 plus map-4 height helpers 0x9e9..0xba4.
 * Map/facing and terrain-array gates run before this stage and are caller-owned. */
export function originalEaffPerspective(listing:string,input:EaffPerspectiveInput):{baseX:number;height:number;depth:number;divisor:number}{
 if(![input.map,input.distance,input.lateral].every(Number.isInteger)||input.map<0||input.map>127||input.distance<0||input.distance>5||input.lateral< -128||input.lateral>127)throw Error('Invalid EAFF perspective input');
 if(input.map===4&&(!Number.isInteger(input.heightDelta)||input.heightDelta!< -128||input.heightDelta!>127))throw Error('Map 4 requires original terrain height delta');
 const local=new Map<number,number>([[0x0e,(input.distance+([2,3,4,5,6,7].includes(input.map)?1:0))*99],[0x14,input.distance],[0x15,input.lateral],[0x27,input.heightDelta??0]]),stack:number[]=[],calls:number[]=[];
 const lines=listing.split(/\r?\n/).flatMap(line=>{const m=line.match(/^\s*([\da-f]{5})\s+[\da-f]+\s+(\w+)\s*(.*)$/);return m?[{at:parseInt(m[1]!,16),op:m[2]!,args:m[3]!}]:[];});
 const code=new Map(lines.map((line,i)=>[line.at,{...line,next:lines[i+1]?.at??-1}]));
 const signed=(n:number,bits:number)=>((n&(2**bits-1))^2**(bits-1))-2**(bits-1);
 const read=(at:number,word:boolean)=>{const value=local.get(at);if(value===undefined)throw Error('Uninitialized EAFF perspective local');return signed(value,word?16:8);};
 const expr=(text:string)=>evaluateOriginalAlisInteger(text,{scan:0,read:(space,at,word)=>{if(space==='local')return read(at,word);if(at===0x2d18)return input.map;throw Error('Unexpected EAFF perspective MAIN read');},table:()=>{throw Error('Unexpected EAFF perspective table');}},stack);
 let pc=0x37c,condition=0;
 for(let budget=0;budget<128;budget++){
  if(pc===0x4c8){if(calls.length)throw Error('Unreturned EAFF height helper');return {baseX:read(0x10,true),height:read(0x12,true),depth:read(0x0e,true),divisor:read(0x1e,true)};}
  if(!((pc>=0x37c&&pc<0x4c8)||(pc>=0x9e9&&pc<=0xba4)))throw Error('EAFF perspective escaped block');
  const ins=code.get(pc);if(!ins)throw Error('Missing EAFF perspective instruction');pc=ins.next;
  const jump=()=>{const m=ins.args.match(/L_([\da-f]+)/);if(!m)throw Error('Missing EAFF perspective branch');return parseInt(m[1]!,16);};
  if(ins.op==='ceval'){condition=expr(ins.args);continue;}
  if(/^cjmp\d+$/.test(ins.op)){pc=jump();continue;}
  if(/^cjsr\d+$/.test(ins.op)){calls.push(pc);pc=jump();continue;}
  if(ins.op==='cret'){if(!calls.length)throw Error('Unexpected EAFF return');pc=calls.pop()!;continue;}
  if(/^cb(?:n)?z\d+$/.test(ins.op)){if(ins.op.startsWith('cbnz')?condition!==0:condition===0)pc=jump();continue;}
  if(/^cswitch[12]$/.test(ins.op)){
   const value=expr(ins.args.slice(0,ins.args.indexOf(', {'))),found=[...ins.args.matchAll(/(-?\d+):L_([\da-f]+)/g)].find(m=>+m[1]===value);if(found)pc=parseInt(found[2]!,16);continue;
  }
  if(['cstore','cadd','csub'].includes(ins.op)){
   const split=ins.args.indexOf(', '),dest=ins.args.slice(split+2).match(/^(?:->s|\+>a)dir([bw])\(0x([\da-f]+)\)$/);if(split<0||!dest)throw Error('Unsupported EAFF perspective store');
   const at=parseInt(dest[2]!,16),word=dest[1]==='w',value=expr(ins.args.slice(0,split));local.set(at,signed(ins.op==='cstore'?value:ins.op==='cadd'?read(at,word)+value:read(at,word)-value,word?16:8));continue;
  }
  throw Error(`Unsupported EAFF perspective opcode ${ins.op}`);
 }
 throw Error('EAFF perspective budget exceeded');
}
