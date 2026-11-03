/** Original 1941:0322..03A4. Raw CS fields; naming as envelope is provisional. */
export interface OriginalDosAudioEnvelope {
 base:number;skipFirst:number;first:number;firstDivisor:number;hold:number;
 last:number;lastDivisor:number;value:number;operand:number;
}
/** 1941:01D1..01E1: input AL is halved and copied to value/base/operand.
 * Unlike the envelope tick this setter does not add one to the operand.
 */
export function setOriginalDosAudioLevel(source:OriginalDosAudioEnvelope,inputByte:number){
 if(!Number.isInteger(inputByte)||inputByte<0||inputByte>255)throw new Error('Native audio level must be a byte');
 const value=inputByte>>>1;
 return {...source,value,base:value,operand:value};
}
/** 1941:01E2..01E8: returns twice raw CS:0006, modulo 256. */
export function getOriginalDosAudioLevel(rawValue:number){
 if(!Number.isInteger(rawValue)||rawValue<0||rawValue>255)throw new Error('Native raw audio level must be a byte');
 return (rawValue<<1)&255;
}
export function stepOriginalDosAudioEnvelope(source:OriginalDosAudioEnvelope){
 if(![source.base,source.skipFirst,source.value,source.operand].every(v=>Number.isInteger(v)&&v>=0&&v<=255)||![source.first,source.firstDivisor,source.hold,source.last,source.lastDivisor].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw new Error('Invalid native audio envelope fields');
 const state={...source};
 const divide=(count:number,divisor:number)=>{
  if(divisor===0)throw new Error('Native DIV by zero');
  const quotient=Math.floor(count*state.base/divisor);
  if(quotient>65535)throw new Error('Native DIV quotient overflow');return quotient&255;
 };
 const commit=(value:number)=>{state.value=value;state.operand=(value+1)&255;return {state,stopCall:false};};
 if(state.skipFirst===0){
  if(state.first!==0){state.first=(state.first-1)&65535;return commit((state.base-divide(state.first,state.firstDivisor))&255);}
  if(state.hold!==0){if(state.hold>=32768)return {state,stopCall:false};state.hold--;return commit(state.base);}
 }
 if(state.last!==0){state.last=(state.last-1)&65535;return commit(divide(state.last,state.lastDivisor));}
 return {state,stopCall:true};
}
