import {evaluateOriginalDosScriptExpression} from './original-dos-script-expression.ts';
import {storeOriginalDosScriptResult} from './original-dos-script-result.ts';
/** Opcode30,2915..2932. Literal string4 ->69D0; result34 ->724C.
 * Other supported numeric expressions use the existing direct result handlers.
 * DF0, disjoint segments. Bounds are host safeguards, not original validation.
 */
export function assignOriginalDosScriptValue(script:Uint8Array,context:Uint8Array,globals:Uint8Array,si:number,bp:number,dx:number,sourceLength=65536){
 if([script,context,globals].some(b=>b.length!==65536)||![si,bp,dx].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||!Number.isInteger(sourceLength)||sourceLength<1||sourceLength>65536)throw Error('Invalid assignment inputs');
 const word=(buf:Uint8Array,at:number)=>buf[at]|(buf[at+1]<<8);
 let nextGlobals=globals.slice(),cx=dx;
 if(si>=sourceLength)throw Error('Assignment expression is truncated');
 if(script[si]===4){
  si++;let destination=word(nextGlobals,0xc58);
  while(true){
   if(si>=sourceLength||destination>=65536)throw Error('Literal string crosses host source/buffer window');
   const value=script[si++];nextGlobals[destination++]=value;if(value===0)break;
  }
 }else{const expression=evaluateOriginalDosScriptExpression(script,context,si,bp,dx,sourceLength,globals);si=expression.si;dx=expression.dx;cx=expression.cx;}
 if(si>=sourceLength)throw Error('Assignment result is truncated');
 if(script[si]!==34){
  const tag=script[si],length=[18,20].includes(tag)?2:[6,8].includes(tag)?3:0;
  if(!length||si+length>sourceLength)throw Error('Assignment result tag unsupported or truncated');
  const stored=storeOriginalDosScriptResult(script,context,nextGlobals,si,bp,dx);
  return {...stored,dx,cx};
 }
 if(si+3>sourceLength)throw Error('String result offset is truncated');
 const first=word(nextGlobals,0xc58),second=word(nextGlobals,0xc5c);
 nextGlobals[0xc58]=second&255;nextGlobals[0xc59]=second>>>8;nextGlobals[0xc5c]=first&255;nextGlobals[0xc5d]=first>>>8;
 const offset=word(script,si+1),memory=context.slice();let destination=(word(nextGlobals,0xbf6)+offset)&65535,source=word(nextGlobals,0xc5c);
 while(true){
  if(source>=65536||destination>=65536)throw Error('String result crosses host segment window');
  const value=nextGlobals[source++];memory[destination++]=value;if(value===0)break;
 }
 return {memory,globals:nextGlobals,si:(si+3)&65535,tag:34,offset,dx,cx};
}
