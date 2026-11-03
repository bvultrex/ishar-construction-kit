import {createHash} from 'node:crypto';
import {evaluateOriginalDosScriptExpression} from '../src/lib/ishar/original-dos-script-expression.ts';
const cases=[],hash=b=>createHash('sha256').update(b).digest('hex');
for(const tag of [30,32])for(const value of tag===30?Array.from({length:256},(_,i)=>i):[0,1,127,128,255,32767,32768,65535])for(const base of [0,0x200,0xff00])for(const offset of [0,0x1234])for(const form of ['direct','loop','compare']){
 const context=new Uint8Array(65536).fill(0xa5),globals=new Uint8Array(65536).fill(0x5a),script=new Uint8Array(65536),at=(base+offset)&65535;
 globals[0xbf6]=base&255;globals[0xbf7]=base>>>8;context[at]=value&255;if(tag===32)context[at+1]=value>>>8;
 const operand=[tag,offset&255,offset>>>8],tokens=form==='direct'?operand:form==='loop'?[56,...operand,58]:[56,...operand,74,2,value&255,value>>>8,58];script.set([31,...tokens],0x100);
 const next=evaluateOriginalDosScriptExpression(script,context,0x101,0x300,0x3456,65536,globals);
 cases.push({tag,value,base,offset,script:[31,...tokens],expected:{si:next.si,dx:next.dx,cx:next.cx,contextHash:hash(context),globalsHash:hash(globals.subarray(0,0x28c0))}});
}
console.log(JSON.stringify(cases));
