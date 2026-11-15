import {evaluateOriginalDosScriptExpression} from '../src/lib/ishar/original-dos-script-expression.ts';
const cases=[];
for(const tag of [106,116])for(const value of tag===106?[0,27,128,255]:Array.from({length:256},(_,i)=>i))for(const initialDx of [0,65535]){
 const script=new Uint8Array(65536);script[0]=tag;
 const result=evaluateOriginalDosScriptExpression(script,new Uint8Array(65536),0,0x200,initialDx,1,new Uint8Array(65536),undefined,tag===106?{keyByte:value}:{shiftFlags:value});
 cases.push({tag,value,initialDx,si:result.si,dx:result.dx,cx:result.cx});
}
console.log(JSON.stringify(cases));
