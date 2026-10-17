/** Native 1000:7778..77BB. Header fields are raw words at SS:248A/248C.
 * Establishes lower bound and conditionally moves upper frontier.
 */
export function planOriginalDosResourceMemory(baseSegment:number,sizeLow:number,sizeHigh:number,frontier:number,frontierOffset:number){
 if(![baseSegment,sizeLow,sizeHigh,frontier,frontierOffset].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw new Error('Native resource memory inputs must be words');
 const paragraphs=((sizeHigh&15)<<12)+(sizeLow>>>4),sum=baseSegment+paragraphs,candidate=sum&65535;
 const moved=sum<=65535&&candidate<=frontier;
 return {floor:baseSegment,floorOffset:0,frontier:moved?candidate:frontier,frontierOffset:moved?0:frontierOffset,paragraphs,candidate,moved};
}
