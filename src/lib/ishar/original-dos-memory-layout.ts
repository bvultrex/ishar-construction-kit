/** Native startup slice 1000:087D..08EA. BIOS/alternate allocation happens earlier. */
export function planOriginalDosStartupMemory(upperSegment:number,existingScreenSegment:number,graphicsByte:number,performanceByte:number,inputMode:number,existingScreenOffset=0){
 if(![upperSegment,existingScreenSegment,existingScreenOffset].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||![graphicsByte,performanceByte,inputMode].every(v=>Number.isInteger(v)&&v>=0&&v<=255))throw new Error('Invalid native startup memory fields');
 let screenBytes=64000;
 if(graphicsByte===0&&performanceByte===1)screenBytes=inputMode===0?16384:32000;
 const frontier=existingScreenSegment===0?(upperSegment-(screenBytes>>>4))&65535:upperSegment;
 const screenSegment=existingScreenSegment===0?frontier:existingScreenSegment;
 return {frontier,screenSegment,screenBytes,frontierOffset:0,bufferOffset:existingScreenSegment===0?0:existingScreenOffset,mirrors:[screenSegment,screenSegment,screenSegment]};
}
