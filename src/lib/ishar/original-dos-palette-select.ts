import {readOriginalDosNumericOperand} from './original-dos-numeric-operand.ts';
import {stepOriginalDosPaletteFade} from './original-dos-palette-control.ts';
import {planOriginalDosPaletteUpload} from './original-dos-palette-upload.ts';
import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** Original104:591E..599F and190 positive resources:5B92, plus VGA59F2..5B19/5BD5. DF0.
 * Non-VGA device uploads remain explicit unsupported boundaries.
 */
export function selectOriginalDosPalette(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,replies?:{retraceReads:readonly number[];interruptFlag:boolean},transition=false){
 if(source.length!==0x100000||ss!==0x1c0b||!Object.values(input).every(x=>Number.isInteger(x)&&x>=0&&x<=65535))throw Error('Invalid palette-select state');
 let memory=source.slice();const g=ss*16,u=(x:number)=>x&65535,signed=(x:number)=>x&32768?x-65536:x;
 const addr=(s:number,o:number,wide=false)=>{o=u(o);const at=s*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Palette-select access outside bounded physical window');return at;};
 const b=(s:number,o:number,value?:number)=>{const at=addr(s,o);if(value!==undefined)memory[at]=value&255;return memory[at];};
 const w=(s:number,o:number)=>{const at=addr(s,o,true);return memory[at]|memory[at+1]<<8;};
 memory[g+0xc15]=0;
 const next=readOriginalDosNumericOperand(memory.subarray(input.ds*16,input.ds*16+65536),memory.subarray(input.es*16,input.es*16+65536),input.si,input.bp,memory.subarray(g,g+65536));
 const registers={...input,si:next.si,dx:next.value,cx:input.dx},value=signed(next.value),events:Array<{kind:string;port:number;value:number}>=[];let resource:null|{segment:number;offset:number}=null,retraceReplies=0,interruptFlag=replies?.interruptFlag;
 if(transition){const duration=readOriginalDosNumericOperand(memory.subarray(input.ds*16,input.ds*16+65536),memory.subarray(input.es*16,input.es*16+65536),registers.si,input.bp,memory.subarray(g,g+65536));registers.si=duration.si;registers.cx=duration.value;}
 const upload=()=>{
  if(!replies||typeof replies.interruptFlag!=='boolean'||!replies.retraceReads.every(x=>Number.isInteger(x)&&x>=0&&x<=255))throw Error('Palette selection requires explicit DAC/retrace service');
  if(memory[g+0xc69]===1){for(;;){if(retraceReplies===replies.retraceReads.length)throw Error('Palette selection requires another retrace reply');const value=replies.retraceReads[retraceReplies++];events.push({kind:'in',port:0x3da,value});if(value&8)break;}}
  const uploaded=planOriginalDosPaletteUpload(memory.slice(g+0xe43,g+0x1143),memory.slice(g+0x1143,g+0x1443),memory[g+0xc69],true,replies.interruptFlag);memory.set(uploaded.shadow,g+0x1143);for(const port of uploaded.ports)events.push({kind:'out',...port});interruptFlag=uploaded.interruptsEnabled;
 };
 const finish=()=>{memory[g+0xbf4]=0;return {memory,registers,events,retraceReplies,interruptFlag,resource,entry:0x26f7,stackDelta:0};};
 if(transition&&(memory[g+0x2896]===0||memory[g+0xbf4]!==0))return finish();
 if(transition&&value<0)throw Error('Negative original transition resources are not reconstructed');
 if(value<0){
  if(value<-2)return finish();
  if(transition&&memory[g+0x2898]===0)throw Error('Non-VGA transition is not reconstructed');
  if(memory[g+0x2898]===0){if(w(ss,0x2894)===2)throw Error('Non-VGA palette upload is not reconstructed');return finish();}
  if(!transition){memory[g+0xcbd]=memory[g+0xcbc]=memory[g+0xcbb]=0;registers.cx=0;}
  const from=value===-1?0x1763:0x1a63;for(let n=0;n<768;n+=2){const low=b(ss,from+n),high=b(ss,from+n+1);b(ss,0x1443+n,low);b(ss,0x1443+n+1,high);}
 }else{
  if(memory[g+0x2896]===0||memory[g+0xbf4]!==0)return finish();
  const moduleOffset=w(input.es,input.bp-20),moduleSegment=w(input.es,input.bp-18);let table=u(moduleOffset+w(moduleSegment,moduleOffset+14));table=u(table+w(moduleSegment,table)+registers.dx*4);
  let high=w(moduleSegment,table+2),sum=table+w(moduleSegment,table);if(sum>65535)high=u(high+1);const offset=u(sum),paragraph=u((((high&255)<<8)|(high>>>8))<<4);resource={segment:u(moduleSegment+paragraph+(offset>>>4)),offset:offset&15};if(!transition)registers.cx=offset>>>4;
  if(b(resource.segment,resource.offset)!==254)return finish();
  if(!transition){memory[g+0xcbd]=memory[g+0xcbc]=memory[g+0xcbb]=0;registers.cx=0;}
  if(memory[g+0x2898]===0)throw Error('Non-VGA resource palette is not reconstructed');
 }
 memory[g+0xcb9]=1;memory[g+0xcbe]=1;
 if(transition&&registers.cx!==0){const duration=registers.cx;if(signed(duration)<63){const divisor=duration&255;if(divisor===0)throw Error('Original transition DIV error');memory[g+0xcbe]=Math.floor(63/divisor)+1;memory[g+0xcbb]=divisor;memory[g+0xcbc]=memory[g+0xcbd]=1;}else{const quotient=Math.floor(duration/63);if(quotient>255)throw Error('Original transition DIV overflow');memory[g+0xcbb]=63;memory[g+0xcbc]=memory[g+0xcbd]=(quotient+1)&255;}}
 let compact=false;
 if(resource){
  const {segment,offset}=resource,count=b(segment,offset+1)+1,start=0x1443+b(segment,offset+2)*3;compact=count===1;
  if(compact){for(let n=0;n<16;n++){const packed=w(segment,offset+2+n*2),red=((packed&255)<<3)&255,green=((packed>>>8)&240)>>>1,blue=((packed>>>8)&15)<<3;b(ss,start+n*3,red?red|7:0);b(ss,start+n*3+1,green?green|7:0);b(ss,start+n*3+2,blue?blue|7:0);}}
  else for(let n=0;n<count*3;n++)b(ss,start+n,b(segment,offset+4+n)>>>2);
 }
 const mode=w(ss,0x2894),raw=w(ss,0xc9f),speed=mode===2||mode===7?raw:Math.floor(((raw*2)&65535)/3);
 // RGB resource path sets local DX=CX=0. Saved palette path retains DX=-1/-2.
 if(!compact&&((transition?resource!==null&&registers.cx===0:resource!==null)||speed<=200)){
  memory[g+0xcbd]=memory[g+0xcbc]=memory[g+0xcbb]=0;for(let n=0;n<768;n++){memory[g+0xe43+n]=memory[g+0x1443+n];}
  memory[g+0xcb8]=255;memory[g+0xcb9]=0;upload();
 }else{memory=stepOriginalDosPaletteFade(memory).memory;memory[g+0xcb8]=1;memory[g+0xcb9]=0;}
 if(resource&&!transition)memory[g+0xcb8]=1; //5999, after59A8 returns.
 return finish();
}
