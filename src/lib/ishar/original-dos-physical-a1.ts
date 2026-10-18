import {runOriginalDosFileIo,type OriginalDosIoRequest,type OriginalDosIoResponse} from './original-dos-file-io.ts';
import type {OriginalRenderedCpu} from './original-dos-rendered-frame-return.ts';
/** CALL79E9 ->7B85..7D4C A1 and return. Shared physical payload/buffer;
 * actual 8000-byte DOS reads preserve unread tails. CPU stack scratch/flags
 * excluded; all other memory effects and saved registers are outputs.
 * Only A0 pack family; no old packer or A20/self-modifying-code execution.
 */
export function decodeOriginalDosPhysicalA1(source:Uint8Array,ss:number,input:OriginalRenderedCpu,dos:(request:OriginalDosIoRequest)=>OriginalDosIoResponse,returnEntry=0x795c){
 if(source.length!==0x100000||ss!==0x1c0b||![returnEntry,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid physical A1 state');
 let memory=source.slice();const u=(v:number)=>v&65535,g=ss*16,engine=0x1000;
 const at=(s:number,o:number,wide=false)=>{o=u(o);const a=s*16+o;if(wide&&o===65535||a+(wide?2:1)>memory.length)throw Error('A1 access outside bounded physical window');return a;};
 const b=(s:number,o:number,value?:number)=>{const a=at(s,o);if(value!==undefined)memory[a]=value&255;return memory[a];};
 const w=(s:number,o:number,value?:number)=>{const a=at(s,o,true);if(value!==undefined){memory[a]=value&255;memory[a+1]=value>>>8;}return memory[a]|memory[a+1]<<8;};
 if((b(ss,0xb57)&240)!==160)throw Error('Physical A1 requires original A0 pack family');
 w(ss,0xb3e,input.dx);w(ss,0xb40,input.ds);
 const sum=input.cx+input.dx,low=u(sum),high=u(input.ax+Number(sum>65535)),swapped=((high&255)<<8)|(high>>>8),endSegment=u(input.ds+u(swapped*16)+(low>>>4)),endOffset=low&15;
 w(engine,0x79e7,endSegment);w(ss,0xb1a,endOffset);
 let bufferSegment=w(ss,0xb5c),cursor=w(ss,0xb5a),bitsLeft=0,packed=0,outputSegment=input.ds,outputOffset=input.dx,reads=0,pixelBytes=0,tokens=0;
 const events:OriginalDosIoRequest[]=[];
 const limit=u(cursor+8000);w(ss,0xb3a,limit);
 function refill(ax:number){
  if(++reads>4096)throw Error('A1 read traversal exceeds host bound');
  bufferSegment=w(ss,0xb5c);cursor=w(ss,0xb5a);const base=bufferSegment*16;
  if(base+65536>memory.length||cursor+8000>65536)throw Error('A1 input transfer crosses bounded segment');
  if(bufferSegment!==ss&&base<g+65536&&g<base+65536)throw Error('Partial global/input segment overlap is not reconstructed');
  const globals=memory.slice(g,g+65536),segment=bufferSegment===ss?globals:memory.slice(base,base+65536);
  const read=runOriginalDosFileIo(globals,segment,{ax,bx:input.bx,cx:8000,dx:cursor,ds:bufferSegment},'read',request=>dos(request),bufferSegment===ss);
  if(read.error!==null)throw Error(`Original A1 read reaches error${read.error}`);
  memory.set(read.globals,g);memory.set(read.memory,base);events.push(read.events[0] as OriginalDosIoRequest);
 }
 refill(limit);
 for(let n=0;n<8;n++)b(engine,0x7cb7+n,b(bufferSegment,cursor+n));cursor=u(cursor+8);
 const signed=(v:number)=>v&32768?v-65536:v;
 function field(width:number){
  if(!Number.isInteger(width)||width<0||width>16)throw Error('A1 dictionary width outside reconstructed bound');
  let ax=0,remaining=width;
  const rotate=(count:number)=>{let carry=0;for(let n=0;n<(count||256);n++){const next=packed>>>15;packed=u((packed<<1)|carry);carry=ax>>>15;ax=u((ax<<1)|next);}};
  if(bitsLeft!==0){
   if(remaining<=bitsLeft){bitsLeft-=remaining;rotate(remaining);return ax;}
   remaining-=bitsLeft;rotate(bitsLeft);bitsLeft=0;
  }
  if(signed(cursor)>=signed(w(ss,0xb3a)))refill(ax);
  const value=w(bufferSegment,cursor);packed=((value&255)<<8)|(value>>>8);cursor=u(cursor+2);bitsLeft=16-remaining;rotate(remaining);return ax;
 }
 const ended=()=>{const paragraph=u(outputSegment+(outputOffset>>>4)),end=w(engine,0x79e7);return paragraph>end||(paragraph===end&&(outputOffset&15)>=w(ss,0xb1a));};
 const write=(value:number)=>{if(++pixelBytes>0x100000)throw Error('A1 output traversal exceeds host bound');const address=at(outputSegment,outputOffset);if(address>=0x10000&&address<0x20000)throw Error('A1 destination aliases executing engine');memory[address]=value&255;outputOffset=u(outputOffset+1);};
 while(!ended()){
  if(++tokens>1000000)throw Error('A1 token traversal exceeds host bound');
  if(field(1)!==0){
   let length=0,value=0;do{value=field(2);length=u(length+value);if(++tokens>1000000)throw Error('A1 literal length exceeds host bound');}while(value===3);length=u(length+1);
   if(length+outputOffset>65535){outputSegment=u(outputSegment+(outputOffset>>>4));outputOffset&=15;}
   for(let n=0;n<(length||65536);n++)write(field(8));
   if(ended())break;
  }
  const selector=field(3),width=b(engine,0x7cb7+selector),distanceMinusOne=field(width);let length=selector&3;
  if(length===0){let value=0;do{value=field(3);length=u(length+value);if(++tokens>1000000)throw Error('A1 copy length exceeds host bound');}while(value===7);length=u(length+4);}
  length=u(length+1);const bp=u(-distanceMinusOne);
  if(outputOffset<=distanceMinusOne){const shift=u((u(distanceMinusOne+1)|15)+1);outputOffset=u(outputOffset+shift);outputSegment=u(outputSegment-(shift>>>4));}
  if(length+outputOffset>65535){const shift=u((u(length+outputOffset)|15)+1);outputOffset=u(outputOffset-shift);outputSegment=u(outputSegment+(shift>>>4));}
  for(let n=0;n<(length||65536);n++)write(b(outputSegment,u(bp+outputOffset-1)));
 }
 w(ss,0xb14,w(engine,0x79e7));w(ss,0xb16,w(ss,0xb1a));
 return {memory,registers:{...input,cx:w(ss,0xb16)},events,entry:returnEntry,stackDelta:0,reads,outputWrites:pixelBytes,endSegment:w(ss,0xb14),endOffset:w(ss,0xb16),destination:{segment:input.ds,offset:input.dx},directionFlag:false};
}
