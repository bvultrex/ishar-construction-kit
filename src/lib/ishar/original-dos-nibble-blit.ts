import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** VGA type16 normal0553..05A9, helper038B..0481, far return430A.
 * Two4-bit pixels per byte, zero nibble transparent, nonzero plus palette base.
 * DF0 entry; mirrored05AA is explicitly outside this entry contract.
 */
export function blitOriginalDosNibbleSprite(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,record:number,graphicsSegment=0x1e97){
 if(source.length!==0x100000||![ss,record,graphicsSegment,...Object.values(input)].every(x=>Number.isInteger(x)&&x>=0&&x<=65535))throw Error('Invalid nibble sprite inputs');
 const memory=source.slice(),u=(x:number)=>x&65535,signed=(x:number)=>x&32768?x-65536:x;
 const address=(s:number,o:number,wide=false)=>{o=u(o);const at=s*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Nibble sprite outside bounded physical window');return at;};
 const b=(s:number,o:number,value?:number)=>{const at=address(s,o);if(value!==undefined)memory[at]=value&255;return memory[at];};
 const w=(s:number,o:number,value?:number)=>{const at=address(s,o,true);if(value!==undefined){memory[at]=value&255;memory[at+1]=(value>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 const g=(at:number)=>w(ss,at),ds=input.ds,pool=input.es,originalSi=input.si;
 if(b(ds,originalSi)!==16||(b(pool,record+34)&1)!==0)throw Error('Expected normal unmirrored type16');
 b(graphicsSegment,0x30,b(ds,originalSi+6));let sourceStride=u(w(ds,originalSi+2)-g(0xc30)+g(0xc2c))>>>1;
 const pitch=g(0x1dd5),stride=u(pitch-1-g(0xc30)+g(0xc2c)),rawWidth=u(g(0xc30)-g(0xc2c)+1),width=rawWidth||65536,rawRows=u(g(0xc32)-g(0xc2e)+1),rows=rawRows||65536;
 if(width*rows>0x100000)throw Error('Nibble sprite exceeds host pixel bound');
 b(graphicsSegment,0x31,0);let offset=0,delta=u(g(0xc2e)-w(pool,record+14));
 if(signed(delta)>0)offset=u(delta*u(w(ds,originalSi+2)+1))>>>1;
 delta=u(g(0xc2c)-w(pool,record+12));if(signed(delta)>0){if(delta&1){b(graphicsSegment,0x31,1);if((rawWidth&1)===0)sourceStride=u(sourceStride-1);}offset=u(offset+(delta>>>1));}
 w(graphicsSegment,0x2c,sourceStride);w(graphicsSegment,0x2e,stride);
 let si=u(originalSi+8+offset),di=u(g(0x1dbf)+u(g(0xc2e)*pitch)+g(0xc2c));const start=di,destinationSegment=g(0x1dc1);let pixelWrites=0;
 for(let row=0;row<rows;row++){
  let low=b(graphicsSegment,0x31)!==0,packed=0;
  for(let x=0;x<width;x++){
   if(!low||x===0){packed=b(ds,si);si=u(si+1);}
   const color=low?packed&15:packed>>>4;
   if(color!==0){const at=address(destinationSegment,di);if(at>=graphicsSegment*16&&at<graphicsSegment*16+65536)throw Error('Nibble destination aliases graphics code');memory[at]=(color+b(graphicsSegment,0x30))&255;pixelWrites++;}
   di=u(di+1);low=!low;
  }
  si=u(si+w(graphicsSegment,0x2c));di=u(di+w(graphicsSegment,0x2e));
 }
 return {memory,registers:{...input,es:destinationSegment,si,cx:rawWidth,dx:rawWidth,bp:0},di,bx:b(graphicsSegment,0x30)|(b(graphicsSegment,0x31)<<8),entry:0x430a,stackDelta:6,width,rows,pixelWrites,destination:{segment:destinationSegment,start,pitch}};
}
