import {evaluateOriginalDosScriptExpression} from '../src/lib/ishar/original-dos-script-expression.ts';
import assert from 'node:assert/strict';
const cases=[];
for(const operator of [74,76,78,80,82,84])for(const left of [0,1,127,128,255,32767,32768,65535])for(const right of [0,1,127,128,255,32767,32768,65535])for(const nested of [false,true]){
 const bytes=[56,2,left&255,left>>>8,operator,...(nested?[56]:[]),2,right&255,right>>>8,...(nested?[58]:[]),58],script=new Uint8Array(65536);script.set(bytes,0x101);
 cases.push({bytes,expected:evaluateOriginalDosScriptExpression(script,new Uint8Array(65536),0x101,0x200,0x3456)});
}
const unsupported=new Uint8Array(65536);unsupported[0x100]=4;assert.throws(()=>evaluateOriginalDosScriptExpression(unsupported,new Uint8Array(65536),0x100,0x200,0),/not reconstructed/);
for(const operator of [74,76,78,80,82,84])for(const leftTag of [0,2,6,8])for(const rightTag of [0,2,6,8]){
 const operand=tag=>tag===0?[0,255]:[tag,0,0],bytes=[56,...operand(leftTag),operator,...operand(rightTag),58],script=new Uint8Array(65536);script.set(bytes,0x101);
 cases.push({bytes,expected:evaluateOriginalDosScriptExpression(script,new Uint8Array(65536).fill(0xa5),0x101,0x200,0x3456)});
}
for(const operator of [74,76,78,80,82,84])for(const right of [0,1,127,128,255,32767,32768,65535]){
 const bytes=[56,2,0,128,operator,56,2,right&255,right>>>8,74,0,0,58,58],script=new Uint8Array(65536);script.set(bytes,0x101);
 cases.push({bytes,expected:evaluateOriginalDosScriptExpression(script,new Uint8Array(65536),0x101,0x200,0x3456)});
}
console.log(JSON.stringify(cases));
