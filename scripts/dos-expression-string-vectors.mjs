import {createHash} from 'node:crypto';
import {evaluateOriginalDosScriptExpression} from '../src/lib/ishar/original-dos-script-expression.ts';
const cases=[],hash=b=>createHash('sha256').update(b).digest('hex');
for(const length of [0,1,7,255])for(const buffer of [0,0x1000,0xff00])for(const base of [0,0xff00])for(const offset of [0,0x1234])for(const form of ['direct','loop','mixed']){
 const context=new Uint8Array(65536).fill(0xa5),globals=new Uint8Array(65536).fill(0x5a),script=new Uint8Array(65536),at=(base+offset)&65535;
 globals[0xbf6]=base&255;globals[0xbf7]=base>>>8;globals[0xc58]=buffer&255;globals[0xc59]=buffer>>>8;
 context.set([...Array.from({length},(_,i)=>1+i%255),0],at);
 const operand=[34,offset&255,offset>>>8],tokens=form==='direct'?operand:form==='loop'?[56,...operand,58]:[56,...operand,4,66,0,58];script.set([31,...tokens],0x100);
 const before=hash(globals),next=evaluateOriginalDosScriptExpression(script,context,0x101,0x300,0x3456,65536,globals);
 if(hash(globals)!==before)throw Error('Expression modified input globals');
 cases.push({length,buffer,base,offset,script:[31,...tokens],expected:{si:next.si,dx:next.dx,cx:next.cx,contextHash:hash(context),globalsHash:hash(next.globals.subarray(0,0x28c0)),bufferHash:hash(next.globals.subarray(buffer,buffer+length+1))}});
}
console.log(JSON.stringify(cases));
