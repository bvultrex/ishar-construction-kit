import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** Graphics type1,1E97:06C2 and02DD; complete through far return to430A.
 * Raw indexed RAM bytes; no default viewport/pitch or display device invented.
 * Input is the format boundary, ES=record pool, DS:SI=resolved resource.
 */
export function fillOriginalDosSolidSprite(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,record:number,graphicsSegment=0x1e97){
 if(source.length!==0x100000||![ss,record,graphicsSegment,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid solid sprite inputs');
 const memory=source.slice(),u=(v:number)=>v&65535,s=(v:number)=>v&32768?v-65536:v;
 const address=(segment:number,o:number,wide=false)=>{o=u(o);const at=segment*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Solid sprite access outside bounded real-mode window');return at;};
 const b=(segment:number,o:number,value?:number)=>{const at=address(segment,o);if(value!==undefined)memory[at]=value&255;return memory[at];};
 const w=(segment:number,o:number,value?:number)=>{const at=address(segment,o,true);if(value!==undefined){memory[at]=value&255;memory[at+1]=(value>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 const g=(at:number)=>w(ss,at),ds=input.ds,pool=input.es,si=input.si;
 if(b(ds,si)!==1)throw Error('Solid sprite requires original type1');
 b(graphicsSegment,0x30,b(ds,u(si+1)));w(graphicsSegment,0x2c,u(w(ds,u(si+2))-g(0xc30)+g(0xc2c)));
 const pitch=g(0x1dd5),mirror=b(pool,u(record+34))&1;
 // Type1 explicitly skips the mirrored destination-stride correction.
 w(graphicsSegment,0x2e,u(pitch-1-g(0xc30)+g(0xc2c)));
 const width=u(g(0xc30)-g(0xc2c)+1),rawRows=u(g(0xc32)-g(0xc2e)+1),rows=rawRows===0?65536:rawRows;
 if(width*rows>0x100000)throw Error('Solid sprite exceeds explicit host pixel traversal bound');
 let offset=0,delta=u(g(0xc2e)-w(pool,u(record+14)));
 if(s(delta)>0)offset=u(delta*u(w(ds,u(si+2))+1));
 delta=u(g(0xc2c)-w(pool,u(record+12)));if(s(delta)>0)offset=u(offset+(mirror?u(-delta):delta));
 if(mirror)offset=u(offset+w(ds,u(si+2))+1-width);
 const nextSi=u(si+offset+8),destinationOffset=g(0x1dbf),destinationSegment=g(0x1dc1),start=u(destinationOffset+u(g(0xc2e)*pitch)+g(0xc2c));
 let di=start;const color=b(graphicsSegment,0x30),stride=w(graphicsSegment,0x2e);
 for(let row=0;row<rows;row++){
  for(let column=0;column<width;column++){
   const at=address(destinationSegment,di);
   if(at>=graphicsSegment*16&&at<graphicsSegment*16+65536)throw Error('Solid sprite destination overlaps native graphics code');
   memory[at]=color;di=u(di+1);
  }
  di=u(di+stride);
 }
 return {memory,registers:{...input,es:destinationSegment,si:nextSi,cx:width,dx:width,bp:0},di,bx:stride,entry:0x430a,stackDelta:6,destination:{segment:destinationSegment,offset:destinationOffset,start,pitch},width,rows,color,pixelWrites:width*rows};
}
