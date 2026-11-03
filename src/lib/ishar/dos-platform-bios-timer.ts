import type {OriginalRenderedCpu} from './original-dos-rendered-frame-return.ts';
/** Explicit platform service, NOT decompiled Ishar or captured BIOS firmware.
 * DOSBox-Staging EGA timer semantics, clock sync disabled, INT1C unhooked.
 * Source/version and boundary limitations: docs/reconstruction/BIOS_TIMER_ADAPTER.md.
 */
export function completeDosPlatformBiosTimer(source:Uint8Array,ss:number,input:OriginalRenderedCpu&{cs:number;ip:number},profile:{kind:'dosbox-ega-unhooked';handlerSegment:number;handlerOffset:number}){
 if(source.length!==0x100000||![ss,...Object.values(input),profile.handlerSegment,profile.handlerOffset].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||profile.kind!=='dosbox-ega-unhooked'||input.cs!==profile.handlerSegment||input.ip!==profile.handlerOffset||ss*16+65536>source.length)throw Error('Invalid registered BIOS timer service');
 if(source.slice(0x70,0x74).some(v=>v!==0))throw Error('BIOS timer adapter requires explicit unhooked INT1C profile');
 const memory=source.slice(),v=new DataView(memory.buffer),r={...input};
 let ticks=(v.getUint32(0x46c,true)+1)>>>0;
 if(ticks>=0x1800b0){ticks=0;memory[0x470]=(memory[0x470]+1)&255;}
 v.setUint32(0x46c,ticks,true);
 const motor=memory[0x440];if(motor!==0)memory[0x440]=motor-1;if(motor===1)memory[0x43f]&=240;
 const pop=()=>{if(r.sp===65535)throw Error('BIOS return frame crosses bounded segment');const value=v.getUint16(ss*16+r.sp,true);r.sp=(r.sp+2)&65535;return value;};
 r.ip=pop();r.cs=pop();const flags=pop();
 return {memory,registers:{...r,flags},events:[{kind:'platform-int1c',profile:profile.kind},{kind:'out',port:0x20,value:32}],ticks,phase:'iret',platform:profile.kind};
}
