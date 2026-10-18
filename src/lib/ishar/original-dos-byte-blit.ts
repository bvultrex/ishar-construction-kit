import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** Type20:1E97:0482/04BF -> helper02DD, transparent byte pixels and zero
 * run skipping, return430A. Eight-byte header; zero is transparent. DF0.
 */
export function blitOriginalDosByteSprite(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,record:number,graphicsSegment=0x1e97){
 if(source.length!==0x100000||![ss,record,graphicsSegment,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid byte sprite state');
 const memory=source.slice(),u=(v:number)=>v&65535,signed=(v:number)=>v&32768?v-65536:v;
 const at=(s:number,o:number,wide=false)=>{o=u(o);const a=s*16+o;if(wide&&o===65535||a+(wide?2:1)>memory.length)throw Error('Byte sprite outside bounded memory');return a;};
 const b=(s:number,o:number,value?:number)=>{const a=at(s,o);if(value!==undefined)memory[a]=value&255;return memory[a];};
 const w=(s:number,o:number,value?:number)=>{const a=at(s,o,true);if(value!==undefined){memory[a]=value&255;memory[a+1]=value>>>8;}return memory[a]|memory[a+1]<<8;};
 const g=(o:number)=>w(ss,o),ds=input.ds,pool=input.es,original=input.si;
 if(b(ds,original)!==20)throw Error('Expected type20');
 const mirrored=(b(pool,record+34)&1)!==0;
 const sourceStride=u(w(ds,original+2)-g(0xc30)+g(0xc2c)),pitch=g(0x1dd5),stride=u(mirrored?pitch+1+g(0xc30)-g(0xc2c):pitch-1-g(0xc30)+g(0xc2c));
 w(graphicsSegment,0x2c,sourceStride);w(graphicsSegment,0x2e,stride);
 const rawWidth=u(g(0xc30)-g(0xc2c)+1),width=rawWidth||65536,rawRows=u(g(0xc32)-g(0xc2e)+1),rows=rawRows||65536;
 if(width*rows>0x100000)throw Error('Byte sprite exceeds host pixel bound');
 let offset=0,delta=u(g(0xc2e)-w(pool,record+14));
 if(signed(delta)>0)offset=u(delta*u(w(ds,original+2)+1));
 delta=u(g(0xc2c)-w(pool,record+12));if(signed(delta)>0)offset=u(offset+(mirrored?-delta:delta));
 if(mirrored)offset=u(offset+w(ds,original+2)+1-rawWidth);
 let si=u(original+offset+8),di=u(g(0x1dbf)+u(g(0xc2e)*pitch)+g(0xc2c)),bx=pitch,pixelWrites=0;
 const start=di,destinationSegment=g(0x1dc1);
 if(mirrored)di=u(di+rawWidth);
 const write=(o:number,value:number)=>{const a=at(destinationSegment,o);if(a>=graphicsSegment*16&&a<graphicsSegment*16+65536)throw Error('Byte sprite destination aliases executing graphics');memory[a]=value;pixelWrites++;};
 for(let row=0;row<rows;row++){
  let consumed=0;
  while(consumed<width){
   let value=b(ds,si);si=u(si+1);consumed++;
   if(value!==0){if(mirrored)di=u(di-1);write(di,value);if(!mirrored)di=u(di+1);continue;}
   let run=1;
   while(consumed<width){value=b(ds,si);si=u(si+1);consumed++;run++;if(value!==0)break;}
   bx=u(run);di=u(di+(mirrored?-run:run));if(value!==0)write(mirrored?di:u(di-1),value);
  }
  si=u(si+w(graphicsSegment,0x2c));di=u(di+w(graphicsSegment,0x2e));
 }
 return {memory,registers:{...input,es:destinationSegment,si,cx:rawWidth,dx:rawWidth,bp:0},di,bx,entry:0x430a,stackDelta:6,type:20,width,rows,pixelWrites,destination:{segment:destinationSegment,start,pitch}};
}
