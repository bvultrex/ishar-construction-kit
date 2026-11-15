import {originalActorAiGate} from './original-actor-ai.ts';
import {originalAlisArrayAddress,type AlisArrayDeclaration} from './original-alis-arrays.ts';
/** EATT.IO 0x00339..0x00552 only. Caller must establish the entry gates and
 * facing predicate at 0x00188..0x00206. This is NOT an attack/damage routine.
 * Trace does not spawn scripts or write MAIN/save memory. */
export interface OriginalActorSignal {
 outcome:'suppressed'|'started'|'updated'|'idle';
 operations:({kind:'spawn';moduleId:18;parameterOffset:13;value:number}|{kind:'write';address:number;width:1|2;value:number})[];
}
export function originalActorSignal(main:ReadonlyMap<number,number>,id:number,arrays:ReadonlyMap<number,AlisArrayDeclaration>):OriginalActorSignal {
 if(!Number.isInteger(id)||id<50||id>=110)throw Error('Invalid original actor slot');
 const operations:OriginalActorSignal['operations']=[];
 const byte=(at:number)=>{const n=main.get(at);if(n===undefined||!Number.isInteger(n)||n<0||n>255)throw Error(`Missing/invalid MAIN ${at.toString(16)}`);return n>=128?n-256:n;};
 const word=(at:number)=>{const n=((byte(at)&255)<<8)|(byte(at+1)&255);return n>=32768?n-65536:n;};
 const array=(at:number,index:number,extra:number[],width:1|2)=>{
  const declaration=arrays.get(at);if(!declaration||declaration.address!==at)throw Error(`Missing cdim ${at.toString(16)}`);
  return originalAlisArrayAddress(declaration,index,[...extra],width);
 };
 const write=(at:number,value:number,width:1|2=1)=>operations.push({kind:'write',address:at,width,value});
 const spawn=(value:number)=>operations.push({kind:'spawn',moduleId:18,parameterOffset:13,value:((value&255)^128)-128});
 const state=byte(0x43ba+id);
 const signal=state===99?byte(array(0x426e,0,[id],1)):state;
 if(signal===8){
  for(let party=0;party<=4;party++){
   if(word(0x2d5c+party*2)>0&&word(array(0x2d8e,11,[party],2))!==-80){
    write(0x43ba+id,-2);return {outcome:'suppressed',operations};
   }
  }
 }
 if(byte(0x48f4+id)===0){
  spawn(signal);write(0x48f4+id,1);write(0x442a+id,-1);return {outcome:'started',operations};
 }
 const acknowledgement=byte(0x442a+id);
 if(acknowledgement===1){
  if([1,20,22].includes(state)){
   if(word(0x378a+id*2)>=byte(0x3fce+id)){spawn(-signal);write(0x4964+id,1);}
   else{spawn(-1);write(0x442a+id,-1);}
  }else if(state===2){
   if(word(0x3868+id*2)>=byte(0x3fce+id)||word(0x378a+id*2)>0){
    spawn(-signal);
    if(byte(0x3d2e+id)===61){write(0x442a+id,-1);write(0x4964+id,0);write(0x3868+id*2,0,2);write(0x378a+id*2,0,2);}
    else write(0x4964+id,1);
   }else{spawn(-1);write(0x442a+id,-1);}
  }else{spawn(-signal);write(0x442a+id,-1);}
  return {outcome:'updated',operations};
 }
 if(acknowledgement===state){spawn(-signal);write(0x4964+id,1);return {outcome:'updated',operations};}
 return {outcome:'idle',operations};
}
/** Actual caller at EATT 0x00188..0x00206. Does not take the negative-state
 * combat branch (0x00553), special branches or range-reset/timer branches. */
export function originalActorSignalStep(main:ReadonlyMap<number,number>,id:number,moving:boolean,arrays:ReadonlyMap<number,AlisArrayDeclaration>):OriginalActorSignal|{outcome:'not-entered';reason:string;operations:[]} {
 const gate=originalActorAiGate(main,id,moving);
 const skip=(reason:string)=>({outcome:'not-entered' as const,reason,operations:[] as []});
 if(gate.branch!=='near')return skip(gate.reason);
 const byte=(at:number)=>{const n=main.get(at);if(n===undefined||!Number.isInteger(n)||n<0||n>255)throw Error(`Missing/invalid MAIN ${at.toString(16)}`);return n>=128?n-256:n;};
 const word=(at:number)=>{const n=((byte(at)&255)<<8)|(byte(at+1)&255);return n>=32768?n-65536:n;};
 if(byte(0x4964+id)!==0||byte(0x43ba+id)<=0)return skip('EATT 0x00188 predicate false');
 const dr=word(0x3412+id*2)-byte(0x2ab4),dc=word(0x34f0+id*2)-byte(0x2ab5),facing=byte(0x2ab6);
 if(!((dr>0&&facing===2)||(dr<0&&facing===4)||(dc<0&&facing===1)||(dc>0&&facing===3)||(dr===0&&dc===0&&word(0x35ce+id*2)===facing)))return skip('EATT 0x001a2 facing predicate false');
 return originalActorSignal(main,id,arrays);
}
