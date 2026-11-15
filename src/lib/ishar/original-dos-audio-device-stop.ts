import {stopOriginalDosAudioClock} from './original-dos-audio-clock-stop.ts';
/** 1941:019D deviceByte=0, then 0562 and 046E. Tested capture table
 * indices 0..7 only, before any unproven runtime patches to their targets.
 */
export function stopOriginalDosCapturedAudioDevice(index:number,divisor:number,savedOffset:number,savedSegment:number,port21:number,port61:number,interruptsEnabled:boolean){
 if(!Number.isInteger(index)||index<0||index>7||!Number.isInteger(port61)||port61<0||port61>255)throw new Error('Unsupported captured audio stop device');
 const result=stopOriginalDosAudioClock(0,divisor,savedOffset,savedSegment,port21,interruptsEnabled);
 const ports=[...result.ports];
 if(index===1)ports.push({port:0x61,value:port61&252},{port:0x43,value:0xb6},{port:0x42,value:0x33},{port:0x42,value:5});
 return {...result,ports,carry:index===0};
}
