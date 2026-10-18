import {readOriginalDosNumericOperand} from './original-dos-numeric-operand.ts';
/** Opcode31 ->2937/69A9; numeric forms0/2/6/8, loop56/end58, comparisons74..84.
 * Shared DX/CX follow native calls, including nested operands; no JavaScript coercion.
 * DF0, bounded source, disjoint context. Limits are host safeguards, not native checks.
 */
export function evaluateOriginalDosScriptExpression(script:Uint8Array,context:Uint8Array,si:number,bp:number,initialDx:number,sourceLength=65536){
 if(script.length!==65536||context.length!==65536||![si,bp,initialDx].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid native expression inputs');
 let dx=initialDx,cx=initialDx,tokens=0;
 if(!Number.isInteger(sourceLength)||sourceLength<1||sourceLength>65536)throw Error('Invalid native expression source length');
 const signed=(v:number)=>v>=32768?v-65536:v;
 function operand(call:boolean,depth:number):void{
  if(depth>128||++tokens>4096)throw Error('Native expression exceeds host depth/token bound');
  if(si>=sourceLength)throw Error('Expression operand is truncated');
  if(call)cx=dx;
  const tag=script[si];
  if([0,2,6,8].includes(tag)){if(si+(tag===0?2:3)>sourceLength)throw Error('Expression operand is truncated');const next=readOriginalDosNumericOperand(script,context,si,bp);si=next.si;dx=next.value;return;}
  if(tag===56){
   si++;if(si>=65536)throw Error('Expression crosses host source window');
   while(true){
    if(si>=sourceLength)throw Error('Expression terminator is truncated');
    if(script[si]===58){si=(si+1)&65535;return;}
    operand(false,depth+1);if(si===0)throw Error('Expression crosses host source window');
   }
  }
  if([74,76,78,80,82,84].includes(tag)){
   si++;if(si>=65536)throw Error('Expression crosses host source window');operand(true,depth+1);
   const a=signed(cx),b=signed(dx),yes=tag===74?dx===cx:tag===76?dx!==cx:tag===78?a<=b:tag===80?a>=b:tag===82?a<b:a>b;
   dx=yes?65535:0;return;
  }
  throw Error(`Native expression tag ${tag} is not reconstructed here`);
 }
 operand(true,0);return {si,dx,cx,tokens};
}
