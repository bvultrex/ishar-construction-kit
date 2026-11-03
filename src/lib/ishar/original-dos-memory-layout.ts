/** Native startup slice 1000:087D..08EA. BIOS/alternate allocation happens earlier. */
export function planOriginalDosStartupMemory(upperSegment:number,existingScreenSegment:number,graphicsByte:number,performanceByte:number,inputMode:number,existingScreenOffset=0){
 if(![upperSegment,existingScreenSegment,existingScreenOffset].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||![graphicsByte,performanceByte,inputMode].every(v=>Number.isInteger(v)&&v>=0&&v<=255))throw new Error('Invalid native startup memory fields');
 let screenBytes=64000;
 if(graphicsByte===0&&performanceByte===1)screenBytes=inputMode===0?16384:32000;
 const frontier=existingScreenSegment===0?(upperSegment-(screenBytes>>>4))&65535:upperSegment;
 const screenSegment=existingScreenSegment===0?frontier:existingScreenSegment;
 return {frontier,screenSegment,screenBytes,frontierOffset:0,bufferOffset:existingScreenSegment===0?0:existingScreenOffset,mirrors:[screenSegment,screenSegment,screenSegment]};
}
/** Native 0853..08EA composition; INT12 returns KiB, EMS helper returns AX. */
export function planOriginalDosBiosEmsMemory(biosKiB:number,emsAX:number,graphicsByte:number,performanceByte:number,inputMode:number){
 if(!Number.isInteger(biosKiB)||biosKiB<0||biosKiB>65535)throw new Error('BIOS memory result must be a word');
 const upper=((biosKiB*64)-1)&65535;
 return planOriginalDosStartupMemory(upper,emsAX,graphicsByte,performanceByte,inputMode,0);
}

/** Apply087D..08EA on shared memory, preserving every unrelated byte.
 * upperSegment is the explicit result of the earlier BIOS/EMS path.
 */
export function reserveOriginalDosPhysicalFramebuffer(source:Uint8Array,ss:number,upperSegment:number){
 if(source.length!==0x100000||![ss,upperSegment].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||ss*16+65536>source.length)throw Error('Invalid physical framebuffer reservation');
 const memory=source.slice(),base=ss*16,view=new DataView(memory.buffer),word=(at:number,value?:number)=>{if(value!==undefined)view.setUint16(base+at,value,true);return view.getUint16(base+at,true);};
 const existing=word(0xb8a),plan=planOriginalDosStartupMemory(upperSegment,existing,memory[base+0x2898],memory[base+0x2892],memory[base+0x2896],word(0xb88));
 if(existing===0){word(0xb88,0);word(0xb8a,plan.screenSegment);}
 word(0xb94,0);word(0xb96,plan.frontier);for(const [offset,segment] of [[0x1df9,0x1dfb],[0xc24,0xc26],[0xb5a,0xb5c]]){word(offset,0);word(segment,plan.screenSegment);}
 return {memory,...plan,ax:plan.screenSegment,bx:existing===0?plan.screenBytes>>>4:plan.screenBytes};
}
