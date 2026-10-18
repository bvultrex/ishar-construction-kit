export interface OriginalConfigurationPromptReplies{seconds:number[];keys:number[];cursorDX:number}
/** Ishar1 18CC..1932 / Ishar2 19A0..1A06. Text uses local original resources.
 * Explicit finite DOS time/key streams and BIOS cursor reply; no wall clock.
 * BIOS events model calls only, not real video RAM or device side effects.
 */
export function runOriginalDosConfigurationPrompt(source:Uint8Array,segment:number,replies:OriginalConfigurationPromptReplies){
 if(source.length!==0x100000||!Number.isInteger(segment)||segment<0||segment>65535||!Number.isInteger(replies.cursorDX)||replies.cursorDX<0||replies.cursorDX>65535||!replies.seconds.every(v=>Number.isInteger(v)&&v>=0&&v<60)||!replies.keys.every(v=>Number.isInteger(v)&&v>=0&&v<=255))throw Error('Invalid configuration prompt inputs');
 const memory=source.slice(),base=segment*16,events:Array<Record<string,number|string>>=[];
 const byte=(offset:number)=>{const at=base+(offset&65535);if(at>=memory.length)throw Error('Configuration prompt memory boundary');return memory[at];};
 const word=(offset:number)=>{if((offset&65535)===65535)throw Error('Configuration prompt wrapped word boundary');return byte(offset)|byte(offset+1)<<8;};
 const attribute=byte(0xb89),language=word(0xb92);
 events.push({kind:'mode',value:2},{kind:'shape',cx:256},{kind:'cursor',dx:0},{kind:'text',value:0,attribute,count:2000},{kind:'cursor',dx:0xb14},{kind:'read-cursor'});
 let pointer=word((0x1ba+((language*2)&65535))&65535),cursor=replies.cursorDX;
 for(let visits=0;;visits++){
  if(visits>=65536)throw Error('Configuration prompt unterminated string');
  const value=byte(pointer);pointer=(pointer+1)&65535;if(value===36)break;
  events.push({kind:'text',value,attribute,count:1});cursor=(cursor+1)&65535;events.push({kind:'cursor',dx:cursor});
 }
 let times=0,keys=0;
 const clock=()=>{if(times>=replies.seconds.length)throw Error('Configuration prompt requires another clock reply');const value=replies.seconds[times++];events.push({kind:'time',second:value});return value;};
 const key=()=>{if(keys>=replies.keys.length)throw Error('Configuration prompt requires another key reply');const value=replies.keys[keys++];events.push({kind:'key',value});return value;};
 const target=(clock()+4)%60;
 for(;;){
  if(clock()===target)return {memory,events,reason:'timeout',timeReplies:times,keyReplies:keys,directionFlag:false};
  let value=key();if(value===13)continue;if(value===0)value=key();
  if(value===83||value===46){byte(0xb90);memory[base+0xb90]=1;return {memory,events,reason:'configure',timeReplies:times,keyReplies:keys,directionFlag:false};}
 }
}
