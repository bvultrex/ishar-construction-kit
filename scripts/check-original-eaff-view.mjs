import assert from 'node:assert/strict';
import {originalEaffViewGate} from '../src/lib/ishar/original-eaff-view.ts';
const view={row:20,col:30,facing:1,map:1,scene:5},actor={row:20,col:29,facing:3,scene:5,hp:40};
for(const [facing,row,col,lateral] of [[1,21,28,1],[2,22,31,1],[3,19,32,1],[4,18,29,1]]){
 const result=originalEaffViewGate({...view,facing},{...actor,row,col});assert.equal(result.distance,2);assert.equal(result.lateral,lateral);assert.equal(result.facingWrite,false);
 const indoor=originalEaffViewGate({...view,facing,map:2},{...actor,row,col});assert.equal(indoor.facing,facing);assert.equal(indoor.facingWrite,true);
}
assert.equal(originalEaffViewGate(view,{...actor,col:24}),null);assert.equal(originalEaffViewGate(view,{...actor,row:22}),null);assert.equal(originalEaffViewGate(view,{...actor,hp:-1}),null);assert.equal(originalEaffViewGate(view,{...actor,scene:6}),null);
assert.equal(originalEaffViewGate(view,{...actor,col:285}).distance,1,'relative coordinate stored as signed byte');
assert.equal(originalEaffViewGate({...view,map:2},{...actor,row:20,col:30}).facingWrite,false,'same tile does not write facing');
assert.equal(originalEaffViewGate({...view,map:2},{...actor,row:21,col:29}).facing,1,'diagonal falls back to player facing');
if(process.env.ISHAR2_DIR&&process.env.ISHAR_ACTOR_LISTINGS){
 const {readFileSync}=await import('node:fs');const {readAlisModule}=await import('../src/lib/ishar/alis-module.ts');
 const listing=readFileSync(`${process.env.ISHAR_ACTOR_LISTINGS}/EAFF.IO.asm`,'utf8'),image=readAlisModule(readFileSync(`${process.env.ISHAR2_DIR}/EAFF.IO`)).image;
 let count=0;for(const line of listing.split(/\r?\n/)){const m=line.match(/^\s*([\da-f]{5})\s+([\da-f]+)\s/);if(!m)continue;const at=parseInt(m[1],16);if(!((at>=0x60&&at<=0x2da)||(at>=0xba5&&at<=0xc87)))continue;const p=Buffer.from(m[2],'hex');assert.deepEqual(Buffer.from(image.subarray(at,at+p.length)),p);count++;}
 console.log(`${count} original EAFF geometry/facing instruction prefixes checked; not native execution.`);
}
console.log('EAFF geometry and facing helper: four directions, diagonal, same tile, scene/HP/range and byte truncation passed.');
if(process.env.ISHAR_ACTOR_LISTINGS){
 const {readFileSync}=await import('node:fs');const {evaluateOriginalAlisInteger}=await import('../src/lib/ishar/original-alis-expression.ts');
 const lines=readFileSync(`${process.env.ISHAR_ACTOR_LISTINGS}/EAFF.IO.asm`,'utf8').split(/\r?\n/).flatMap(line=>{const m=line.match(/^\s*([\da-f]{5})\s+[\da-f]+\s+(\w+)\s*(.*)$/);return m?[{at:parseInt(m[1],16),op:m[2],args:m[3]}]:[];});
 const code=new Map(lines.map((line,i)=>[line.at,{...line,next:lines[i+1]?.at}]));
 function executeHelper(v,a){
  const local=new Map([[0x22,53]]),stack=[];let pc=0xba5,condition=0,facing=a.facing,written=false;
  const sb=n=>((n&255)^128)-128;
  const expr=text=>evaluateOriginalAlisInteger(text,{scan:0,read:(space,at)=>{if(space==='local'){assert.ok(local.has(at));return sb(local.get(at));}return new Map([[0x2d18,v.map],[0x2ab4,v.row],[0x2ab5,v.col],[0x2ab6,v.facing]]).get(at);},table:(_space,at,index)=>{assert.equal(index,53);return new Map([[0x3412,a.row],[0x34f0,a.col]]).get(at);}},stack);
  for(let n=0;n<80;n++){
   const ins=code.get(pc);assert.ok(ins);pc=ins.next;const target=()=>parseInt(ins.args.match(/L_([\da-f]+)/)[1],16);
   if(ins.op==='cret')return {facing,written};
   if(ins.op==='ceval'){condition=expr(ins.args);continue;}
   if(ins.op.startsWith('cjmp')){pc=target();continue;}
   if(ins.op.startsWith('cbz')){if(!condition)pc=target();continue;}
   assert.equal(ins.op,'cstore');const split=ins.args.indexOf(', '),value=expr(ins.args.slice(0,split)),dest=ins.args.slice(split+2),direct=dest.match(/sdirb\(0x([\da-f]+)\)/);
   if(direct)local.set(parseInt(direct[1],16),value&255);else{assert.match(dest,/smainti\(0x35ce\)/);facing=value;written=true;}
  }throw Error('helper budget');
 }
 let checked=0;
 for(const map of [1,2,4])for(let facing=1;facing<=4;facing++)for(let dx=-6;dx<=6;dx++)for(let dy=-6;dy<=6;dy++){
  const v={...view,map,facing},a={...actor,row:view.row+dx,col:view.col+dy},gate=originalEaffViewGate(v,a);if(!gate)continue;
  const result=executeHelper(v,a);assert.equal(gate.facing,result.facing);assert.equal(gate.facingWrite,result.written);checked++;
 }
 console.log(`${checked} candidate orientations compared with bounded execution of the actual helper listing (shared operand kernel).`);
}
