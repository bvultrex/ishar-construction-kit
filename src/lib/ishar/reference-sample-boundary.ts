/** Boundary branch in separate C-reference sys.c sample callback.
 * Excludes FLI queues, resampling, interpolation and output-device timing. */
export function referenceSampleBoundary(index:number,length:number,loops:number){
 if(![index,length].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=0xffffffff)||!Number.isInteger(loops)||loops<0||loops>255)throw Error('Invalid reference sample boundary state');
 if(length===0xffffffff)throw Error('Unsupported wrapped reference length boundary');
 // The reference stops at length+1, not length. Do not clamp this to buffer size.
 if(index<length+1)return {kind:'continue' as const,index,loops};
 if(loops>1)return {kind:'restart' as const,index:0,loops:loops-1,played:0,accumulator:0};
 return {kind:'stop' as const,index,loops,type:'none' as const,priority:-128};
}
