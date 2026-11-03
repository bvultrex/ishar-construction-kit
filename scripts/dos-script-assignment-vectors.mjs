import {createHash} from 'node:crypto';
import {assignOriginalDosScriptValue} from '../src/lib/ishar/original-dos-script-assignment.ts';
const cases=[],hash=b=>createHash('sha256').update(b).digest('hex');
const fixtures=[];
for(const length of [0,1,2,7,31,127,255])for(const buffer of [0,0x1000,0xff00])for(const base of [0,0xff00])for(const offset of [0,0x1234])fixtures.push({buffer,base,script:[4,...Array.from({length},(_,i)=>1+(i%255)),0,34,offset&255,offset>>>8]});
for(const tag of [0,2])for(const value of [0,1,127,128,255,32767,32768,65535])for(const target of [6,8,18,20])fixtures.push({buffer:0x1000,base:0,script:[tag,value&255,...(tag===2?[value>>>8]:[]),target,4,...(target<18?[0]:[])]});
for(const fixture of fixtures){
 const script=new Uint8Array(65536),context=new Uint8Array(65536).fill(0xa5),globals=new Uint8Array(65536).fill(0x5a);
 const word=(at,value)=>{globals[at]=value&255;globals[at+1]=value>>>8;};word(0xc58,fixture.buffer);word(0xc5c,0x1200);word(0xbf6,fixture.base);script.set([30,...fixture.script],0x100);
 const before=[context,globals].map(hash),next=assignOriginalDosScriptValue(script,context,globals,0x101,0x200,0x3456);
 if([context,globals].some((v,i)=>hash(v)!==before[i]))throw Error('Assignment mutated an input segment');
 const copiedLength=fixture.script[0]===4?fixture.script.indexOf(0,1):0;
 cases.push({...fixture,copiedLength,expected:{si:next.si,dx:next.dx,cx:next.cx,contextHash:hash(next.memory),globalsHash:hash(next.globals.subarray(0,0x28c0)),bufferHash:hash(next.globals.subarray(fixture.buffer,fixture.buffer+copiedLength))}});
}
console.log(JSON.stringify(cases));
