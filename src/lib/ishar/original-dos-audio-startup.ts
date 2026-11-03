export interface OriginalDosAudioStartupReplies{vectorOffset:number;vectorSegment:number;soundBlasterRead:number}
/** Engine08EB ->8CB0, with complete no-device fallback/disabled/speaker paths.
 * AdLib and detected Sound Blaster IRQ probing stop at real driver entries.
 * No synthesized hardware success and no interrupt delivery are implied.
 */
export function initializeOriginalDosAudioStartup(source:Uint8Array,ss:number,r:OriginalDosAudioStartupReplies){
 if(source.length!==0x100000||!Number.isInteger(ss)||ss<0||ss>65535||ss*16+65536>source.length||![r.vectorOffset,r.vectorSegment].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||!Number.isInteger(r.soundBlasterRead)||r.soundBlasterRead<0||r.soundBlasterRead>255)throw Error('Invalid audio startup inputs');
 const memory=source.slice(),v=new DataView(memory.buffer),events:Array<Record<string,number|string>>=[],word=(at:number,value:number)=>v.setUint16(at,value&65535,true);
 const result=(phase:'return'|'driver-boundary',segment:number,offset:number)=>({memory,events,phase,boundary:{segment,offset}});
 const mode=memory[0x1e940];if(mode===0)return result('return',0x1000,0x8f0);
 events.push({service:'get-vector',number:15});word(0x186e8,r.vectorOffset);word(0x186ea,r.vectorSegment);
 events.push({service:'set-vector',number:15,segment:0x1000,offset:0x8ca9});word(0x3c,0x8ca9);word(0x3e,0x1000);
 for(const offset of [0x1dfd,0x1e0d,0x1e1d,0x1e2d]){
  const at=ss*16+offset;memory[at]=0;memory[at+2]=0;memory[at+1]=128;word(at+6,0);memory[at+10]=0;
 }
 for(const [at,value] of [[0x186da,0xd98],[0x186dc,0x1000],[0x186de,0x5d2a],[0x18909,0],[0x1890b,0x893d]])word(at,value);
 if(mode===3){
  memory[0x1e93e]=4;
  for(let port=0x216;port<=0x266;port+=16){
   events.push({kind:'out',port,value:1},{kind:'out',port,value:0},{kind:'in',port:port+4,value:r.soundBlasterRead,repeat:r.soundBlasterRead===0xaa?1:100});
   if(r.soundBlasterRead===0xaa){word(0x1bac0+0x8a,port-6);return result('driver-boundary',0x1941,0x196e);}
  }
  word(0x1bac0+0x8a,0);memory[0x1bac0+0x8d]=0;memory[0x1bac0+0x8c]=0;
  memory[0x1e940]=1;memory[0x1e93e]=1;return result('return',0x1000,0x8f0);
 }
 memory[0x1e93e]=1;
 if(mode===1)return result('return',0x1000,0x8f0);
 if(mode===2){
  word(0x1cd4d,v.getUint16(0x1cd4d,true)|0x20);
  // OR forces ZF0: the following JE cannot skip this driver call.
  return result('driver-boundary',0x1941,0x1c31);
 }
 memory[0x1e940]=1;return result('return',0x1000,0x8f0);
}
