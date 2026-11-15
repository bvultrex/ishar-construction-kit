import {evaluateOriginalDosScriptExpression} from '../src/lib/ishar/original-dos-script-expression.ts';
import {createHash} from 'node:crypto';
const cases=[],hash=b=>createHash('sha256').update(b).digest('hex');
for(const tag of [14,16])for(const dimensions of [0,1,2])for(const index of [0,3,65535]){
 const script=new Uint8Array(65536),context=new Uint8Array(65536).fill(0x93),globals=new Uint8Array(65536),code=[56];
 for(let n=0;n<dimensions;n++)code.push(2,n+1,0,64);
 code.push(2,index&255,index>>>8,tag,0,2,58);script.set(code);
 context[0x3ff]=dimensions;for(let n=0;n<dimensions;n++)new DataView(context.buffer).setUint16(0x3fc-n*2,0x17+n*0x123,true);
 const result=evaluateOriginalDosScriptExpression(script,context,0,0x200,0x7654,code.length,globals);
 cases.push({tag,dimensions,index,script:Buffer.from(script).toString('base64'),context:Buffer.from(context).toString('base64'),si:result.si,dx:result.dx,cx:result.cx,globalsHash:hash(result.globals.subarray(0,0x28c0))});
}
console.log(JSON.stringify(cases));
