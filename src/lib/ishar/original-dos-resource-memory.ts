/** Native 1000:7778..77BB. Header fields are raw words at SS:248A/248C.
 * Establishes lower bound and conditionally moves upper frontier.
 */
export function planOriginalDosResourceMemory(baseSegment:number,sizeLow:number,sizeHigh:number,frontier:number,frontierOffset:number){
 if(![baseSegment,sizeLow,sizeHigh,frontier,frontierOffset].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw new Error('Native resource memory inputs must be words');
 const paragraphs=((sizeHigh&15)<<12)+(sizeLow>>>4),sum=baseSegment+paragraphs,candidate=sum&65535;
 const moved=sum<=65535&&candidate<=frontier;
 return {floor:baseSegment,floorOffset:0,frontier:moved?candidate:frontier,frontierOffset:moved?0:frontierOffset,paragraphs,candidate,moved};
}
/** Native 76D8..77BB: raw 16-byte header at SS:2486, existing base pointer.
 * Deliberately retains low-word multiplication and all intermediate wraps.
 */
export function planOriginalDosResourceTables(header:Uint8Array,baseSegment:number,baseOffset:number,frontier:number,frontierOffset:number){
 if(header.length!==16||![baseSegment,baseOffset,frontier,frontierOffset].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw new Error('Invalid native resource table inputs');
 const v=new DataView(header.buffer,header.byteOffset,16),w=(at:number)=>v.getUint16(at,true),u=(n:number)=>n&65535;
 const firstEnd=u(u(((w(0)>>>2)+1)<<4)+baseOffset),secondEnd=u(u(w(2)*6)+firstEnd);
 const segmentA=u(baseSegment+(w(8)>>>4)+1);
 const pool=u(segmentA+(u(u(w(12)+3)*38)>>>4)+1);
 const bounds=planOriginalDosResourceMemory(pool,w(4),w(6),frontier,frontierOffset);
 const words:Record<number,number>={0xbcc:w(0),0xbc2:baseOffset,0xbd0:baseOffset,0xbd2:firstEnd,0xbda:w(2),0xbd4:secondEnd,0xbd6:baseSegment,0xbd8:secondEnd,0xbe0:0,0xbe2:segmentA,0xbe4:0,0xbe6:pool,0xbc4:0,0xbc6:pool,0xbc8:0,0xbca:pool,0xb94:bounds.frontierOffset,0xb96:bounds.frontier};
 return {words,bounds};
}
