/** Configuration module Ishar1:1933..1A2D / Ishar2:1A07..1B01.
 * Transfer live selections into shared engine globals; no hardware discovery.
 * The sound-port tail after the unconditional JMP is unreachable from entry.
 */
export function applyOriginalDosStartupConfiguration(source:Uint8Array,segment:number,ss:number){
 if(source.length!==0x100000||![segment,ss].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||segment*16+0x66b>source.length||ss*16+0x289a>source.length)throw Error('Invalid configuration application memory');
 const memory=source.slice(),moduleBase=segment*16,g=ss*16,read=(at:number)=>memory[moduleBase+at],set=(at:number,value:number)=>{memory[g+at]=value;};
 set(0xca3,1);if(read(0x48a)!==0)set(0xca3,0);
 set(0x288a,0);set(0x288b,0);if(read(0x402)!==0){set(0x288a,1);if(read(0x402)!==1)set(0x288b,1);}
 const video=read(0x3a6);set(0x2894,video);set(0x2895,0);
 for(const at of [0x2896,0x2897,0x2898,0x2899])set(at,0);
 if(video!==0){set(0x2899,1);if(video!==3){set(0x2899,0);set(0x2896,1);if(video!==1){set(0x2897,1);set(0x2898,1);}}}
 const keyboard=read(0x574);set(0x2893,keyboard===2?90:keyboard===0?65:81);
 set(0x2890,1);set(0x2891,0);
 const sound=read(0x5fc);if(sound!==0)set(0x2890,sound===1?2:sound===3?0:3);
 return {memory,ax:sound};
}
