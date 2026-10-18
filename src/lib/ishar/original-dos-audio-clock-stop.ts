/** 1941:0562..059A with 05A1. Distinct from sample timer stop 1000:8E2C. */
export function stopOriginalDosAudioClock(deviceByte:number,divisor:number,savedOffset:number,savedSegment:number,port21:number,interruptsEnabled:boolean){
 if(![deviceByte,port21].every(v=>Number.isInteger(v)&&v>=0&&v<=255)||![divisor,savedOffset,savedSegment].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||typeof interruptsEnabled!=='boolean')throw new Error('Invalid native audio clock state');
 if(deviceByte!==0)return {ports:[] as {port:number;value:number}[],vector:null,interruptsEnabled};
 return {ports:[{port:0x43,value:0x36},{port:0x40,value:divisor&255},{port:0x40,value:divisor>>>8},{port:0x21,value:port21&254}],vector:{offset:savedOffset,segment:savedSegment},interruptsEnabled:true};
}
