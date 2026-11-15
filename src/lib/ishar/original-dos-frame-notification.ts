import type {OriginalRenderedCpu} from './original-dos-rendered-frame-return.ts';
/** 1000:3D55 far1E97:0028/C9B/109F, return3D60. Copies 4000 words
 * from B84/B86 to B88/B8A, then restores the saved rectangle into B8A.
 * DF0; shared physical memory and offset wrapping; bounded transfers.
 */
export function notifyOriginalDosFrameGraphics(source:Uint8Array,ss:number,input:OriginalRenderedCpu){
 if(source.length!==0x100000||ss!==0x1c0b||!Object.values(input).every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid graphics notification state');
 const memory=source.slice(),u=(v:number)=>v&65535;
 const at=(s:number,o:number,wide=false)=>{o=u(o);const a=s*16+o;if(wide&&o===65535||a+(wide?2:1)>memory.length)throw Error('Notification outside bounded memory');return a;};
 const b=(s:number,o:number,value?:number)=>{const a=at(s,o);if(value!==undefined)memory[a]=value&255;return memory[a];};
 const w=(s:number,o:number)=>{const a=at(s,o,true);return memory[a]|memory[a+1]<<8;};
 let di=w(ss,0xb88),si=w(ss,0xb84);const destination=w(ss,0xb8a),from=w(ss,0xb86);
 for(let n=0;n<4000;n++){
  const value=w(from,si),a=at(destination,di,true);memory[a]=value&255;memory[a+1]=value>>>8;si=u(si+2);di=u(di+2);
 }
 const target=w(ss,0xb8a);si=w(ss,0xcaa);di=w(ss,si);si=u(si+2);
 const width=w(ss,si);si=u(si+2);const rawRows=w(ss,si),rows=rawRows||65536;si=u(si+2);
 const stride=u(w(ss,0x1dd5)-width),payload=w(ss,0xcac);
 if(width*rows>0x100000)throw Error('Notification rectangle exceeds host bound');
 for(let row=0;row<rows;row++){
  for(let x=0;x<width;x++){b(target,di,b(payload,si));si=u(si+1);di=u(di+1);}
  di=u(di+stride);
 }
 b(ss,0xc4a,0);
 return {memory,registers:{...input},entry:0x3d60,stackDelta:0,copiedBytes:8000,rectangleBytes:width*rows,width,rows};
}
