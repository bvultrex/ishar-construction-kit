import {createHash} from 'node:crypto';
import {evaluateOriginalDosScriptExpression} from '../src/lib/ishar/original-dos-script-expression.ts';
import {probeOriginalDosFile} from '../src/lib/ishar/original-dos-file-probe.ts';
const cases=[],hash=b=>createHash('sha256').update(b).digest('hex');
for(const flag of [0,1,2,255])for(const first of [false,true])for(const second of flag===1&&first?[false,true]:[null])for(const buffer of [0,0x1000,0x2000])for(const length of [0,1,8,255])for(const form of ['direct','loop','compare','context-probe']){
 const globals=new Uint8Array(65536).fill(0x5a),context=new Uint8Array(65536),script=new Uint8Array(65536),pattern=Array.from({length},(_,i)=>65+i%26);
 globals[0xc58]=buffer&255;globals[0xc59]=buffer>>>8;globals[0xbf6]=0;globals[0xbf7]=4;globals[0x289b]=flag;globals[0x289c]=2;globals[0x289d]=5;globals.set([...pattern,0],buffer);context.set([...pattern,0],0x400);
 const tokens=form==='direct'?[156]:form==='loop'?[56,156,58]:form==='context-probe'?[56,34,0,0,156,58]:[56,0,5,74,156,58];script.set([31,...tokens],0x100);
 const responses=[first,...(second===null?[]:[second])];let index=0;
 const service={findFirst:(name,attributes,drive)=>{if(attributes!==0||JSON.stringify(Array.from(name))!==JSON.stringify(pattern))throw Error('Wrong DOS request');return responses[index++];}};
 const next=evaluateOriginalDosScriptExpression(script,context,0x101,0x200,0x3456,65536,globals,service);if(index!==responses.length)throw Error('Wrong response count');index=0;
 const probe=probeOriginalDosFile(globals,service);
 cases.push({flag,buffer,length,script:[31,...tokens],responses,expected:{si:next.si,dx:next.dx,cx:next.cx,events:probe.events,globalsHash:hash(next.globals.subarray(0,0x28c0))}});
}
console.log(JSON.stringify(cases));
