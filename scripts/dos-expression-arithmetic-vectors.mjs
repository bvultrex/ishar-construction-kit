import {evaluateOriginalDosScriptExpression} from '../src/lib/ishar/original-dos-script-expression.ts';
const cases=[];
for(const tag of [66,68,70,72,86,88,90,92,94])for(const [left,right] of [[0,0],[7,3],[65529,3],[7,65533],[65529,65533],[32768,1],[32767,65535],[65535,0]]){
 const code=[56,2,left&255,left>>>8,tag,2,right&255,right>>>8,58],script=new Uint8Array(65536);script.set(code);
 const next=evaluateOriginalDosScriptExpression(script,new Uint8Array(65536),0,0x200,0x1234,code.length,new Uint8Array(65536));
 cases.push({tag,left,right,code,si:next.si,dx:next.dx,cx:next.cx});
}
for(const tag of [66,68,70,72,86,88,90,92,94]){
 const code=[56,2,7,0,tag,56,2,3,0,88,2,5,0,58,58],script=new Uint8Array(65536);script.set(code);
 const next=evaluateOriginalDosScriptExpression(script,new Uint8Array(65536),0,0x200,0x1234,code.length,new Uint8Array(65536));
 cases.push({tag,nestedSubtract:true,code,si:next.si,dx:next.dx,cx:next.cx});
}
console.log(JSON.stringify(cases));
