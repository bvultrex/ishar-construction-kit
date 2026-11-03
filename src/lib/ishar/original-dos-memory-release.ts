/** Native 1000:0A50..0A6E. Segment handle, header word, frontier DS:0B96.
 * Only releases the current frontier block; no general free-list/coalescing.
 */
export function releaseOriginalDosMemory(handle:number,frontier:number,headerWord:number){
 if(![handle,frontier,headerWord].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw new Error('Native memory release inputs must be words');
 const headerSegment=(handle-1)&65535,released=headerSegment===frontier;
 const next=released?(headerSegment+headerWord)&65535:frontier;
 return {frontier:next,dx:released?next:headerSegment,released};
}
