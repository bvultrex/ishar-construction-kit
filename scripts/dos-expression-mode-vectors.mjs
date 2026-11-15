import {evaluateOriginalDosScriptExpression} from '../src/lib/ishar/original-dos-script-expression.ts';
const script=new Uint8Array(65536);script[0]=120;const context=new Uint8Array(65536),cases=[];
for(const mode of [0,1,2,3,5,7,8,0x8000,0xffff])for(const initialDx of [0,0xffff]){
 const globals=new Uint8Array(65536);new DataView(globals.buffer).setUint16(0x2894,mode,true);
 const next=evaluateOriginalDosScriptExpression(script,context,0,0x200,initialDx,1,globals);
 cases.push({mode,initialDx,si:next.si,dx:next.dx,cx:next.cx});
}
console.log(JSON.stringify(cases));
