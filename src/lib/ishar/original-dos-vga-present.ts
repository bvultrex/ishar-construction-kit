/** VGA1E97:0010 ->0148..01A6 ->0013 far return, DF0.
 * Original word-copy rectangle; odd final column is not copied.
 * No palette, retrace or device behavior is invented.
 */
export function presentOriginalDosVga(source:Uint8Array,ss:number){
 if(source.length!==0x100000||!Number.isInteger(ss)||ss<0||ss>65535||ss*16+0x1dd7>source.length)throw Error('Invalid VGA present state');
 const memory=source.slice(),g=ss*16,v=new DataView(memory.buffer),u=(x:number)=>x&65535,w=(at:number)=>v.getUint16(g+at,true);
 const sourceSegment=w(0xb8a),destinationSegment=w(0xb86),pitch=w(0x1dd5),left=w(0xc1a),top=w(0xc1c),words=u(w(0xc1e)-left+1)>>>1,rawRows=u(w(0xc20)-top+1),rows=rawRows||65536;
 if(words*rows*2>0x100000)throw Error('VGA present exceeds host traversal bound');
 const sourceOffset=w(0xb88),destinationOffset=w(0xb84),start=u(u(top*pitch)+left),stride=u(pitch-words*2);let si=u(sourceOffset+start),di=u(destinationOffset+start);
 const address=(s:number,o:number)=>{const at=s*16+o;if(o===65535||at+2>memory.length)throw Error('VGA present word outside bounded real-mode window');return at;};
 for(let row=0;row<rows;row++){
  for(let n=0;n<words;n++){const from=address(sourceSegment,si),to=address(destinationSegment,di),low=memory[from],high=memory[from+1];memory[to]=low;memory[to+1]=high;si=u(si+2);di=u(di+2);}
  si=u(si+stride);di=u(di+stride);
 }
 return {memory,sourceSegment,destinationSegment,sourceOffset,destinationOffset,pitch,left,top,words,rows,copiedBytes:words*rows*2,stackDelta:4,entry:0x43d0};
}
