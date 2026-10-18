import {queryOriginalDosDrive,type OriginalDosDriveServices} from './original-dos-drive-query.ts';
import {queryOriginalDosMemoryValue} from './original-dos-memory-query.ts';
import {readOriginalDosNumericOperand} from './original-dos-numeric-operand.ts';
import {probeOriginalDosFile,type OriginalDosFileSearch} from './original-dos-file-probe.ts';
import {applyOriginalDosNumericBinary} from './original-dos-numeric-binary.ts';
/** Raw0F49 mapping; the semantic meaning of the2000-based value remains unnamed. */
export function queryOriginalDosModeValue(mode:number){
 if(!Number.isInteger(mode)||mode<0||mode>65535)throw Error('Expected original mode word');
 return 2000+(mode===7?1:mode===3?2:mode===5?4:0);
}
/** Opcode31 ->2937/69A9; numeric0/2/6/8/30/32, indexed14/16,
 * stack54/64, binary66..72/86..94, explicit input106/116, mode120, raw168, strings4/10/34,
 * loop56/end58, comparisons74..84.
 * Shared DX/CX follow native calls, including nested operands; no JavaScript coercion.
 * DF0, bounded source, disjoint context. Limits are host safeguards, not native checks.
 */
function evaluateExpressionCore(script:Uint8Array,context:Uint8Array,si:number,bp:number,initialDx:number,sourceLength=65536,globals?:Uint8Array,fileSearch?:OriginalDosFileSearch,input?:{keyByte?:number;shiftFlags?:number;memoryQuery?:(selector:number)=>number;driveQuery?:(selector:number)=>number},shared=false){
 if(script.length!==65536||context.length!==65536||![si,bp,initialDx].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid native expression inputs');
 if(globals!==undefined&&globals.length!==65536)throw Error('Expected original global segment');
 let dx=initialDx,cx=initialDx,tokens=0,bx=0x277c;const nextGlobals=shared?globals:globals?.slice();
 if(!Number.isInteger(sourceLength)||sourceLength<1||sourceLength>65536)throw Error('Invalid native expression source length');
 const signed=(v:number)=>v>=32768?v-65536:v;
 function operand(call:boolean,depth:number):void{
  if(depth>128||++tokens>4096)throw Error('Native expression exceeds host depth/token bound');
  if(si>=sourceLength)throw Error('Expression operand is truncated');
  if(call)cx=dx;
  const tag=script[si];
  if(tag===160){if(!input?.driveQuery)throw Error('Expression160 requires explicit physical drive services');si++;dx=input.driveQuery(dx);return;}
  if(tag===118){if(!nextGlobals)throw Error('Expression118 requires original globals');si++;dx=input?.memoryQuery?input.memoryQuery(dx):queryOriginalDosMemoryValue(nextGlobals,dx);return;}
  if(tag===116){
   if(input?.shiftFlags===undefined||!Number.isInteger(input.shiftFlags)||input.shiftFlags<0||input.shiftFlags>255)throw Error('Expression116 requires an explicit BIOS INT16 shift-flags reply');
   si++;dx=input.shiftFlags&31;return;
  }
  if(tag===106){
   if(input?.keyByte===undefined||!Number.isInteger(input.keyByte)||input.keyByte<0||input.keyByte>255)throw Error('Expression106 requires an explicit original key-byte snapshot');
   si++;dx=input.keyByte;return;
  }
  if(tag===168){
   if(!nextGlobals)throw Error('Expression168 requires the original global segment');
   // Native6FEC ->0F44: raw word read, no invented timer/device semantics.
   si++;dx=nextGlobals[0xc9d]|nextGlobals[0xc9e]<<8;return;
  }
  if([66,68,70,72,86,88,90,92,94].includes(tag)){
   si++;operand(true,depth+1);const result=applyOriginalDosNumericBinary(tag,cx,dx);cx=result.cx;dx=result.dx;return;
  }
  if(tag===64||tag===54){
   if(!nextGlobals)throw Error('Operand stack requires the original global segment');
   si++;
   if(tag===64){bx=(bx-2)&65535;nextGlobals[bx]=dx&255;nextGlobals[(bx+1)&65535]=dx>>>8;}
   else{dx=cx;cx=nextGlobals[bx]|nextGlobals[(bx+1)&65535]<<8;bx=(bx+2)&65535;}
   return;
  }
  if(tag===14||tag===16){
   if(!nextGlobals)throw Error('Indexed expression requires the original global segment');
   if(si+3>sourceLength)throw Error('Indexed expression offset is truncated');
   let ax=script[si+1]|script[si+2]<<8;si+=3;
   const count=context[(bp+ax-1)&65535];let di=(bp+ax-2)&65535;
   if(tag===16)dx=(dx*2)&65535;ax=(ax+dx)&65535;
   const writeAccumulator=(value:number)=>{nextGlobals[0xb0a]=value&255;nextGlobals[0xb0b]=value>>>8;};
   if(count!==0){
    writeAccumulator(ax);
    for(let n=0;n<count;n++){
     ax=nextGlobals[bx]|nextGlobals[(bx+1)&65535]<<8;bx=(bx+2)&65535;di=(di-2)&65535;
     if(di===65535)throw Error('Indexed stride word straddles segment');
     const product=ax*(context[di]|context[di+1]<<8);ax=product&65535;dx=Math.floor(product/65536);
     writeAccumulator(((nextGlobals[0xb0a]|nextGlobals[0xb0b]<<8)+ax)&65535);
    }
    ax=nextGlobals[0xb0a]|nextGlobals[0xb0b]<<8;
   }
   const at=(bp+ax)&65535;
   if(tag===16&&at===65535)throw Error('Indexed value word straddles segment');
   dx=tag===14?(context[at]&128?context[at]|0xff00:context[at]):context[at]|context[at+1]<<8;return;
  }
  if(tag===120){
   if(!nextGlobals)throw Error('Expression120 requires the original global segment');
   si++;const mode=nextGlobals[0x2894]|nextGlobals[0x2895]<<8;
   // Native6DF8 ->0F49: raw mode-dependent value, no inferred device meaning.
   dx=queryOriginalDosModeValue(mode);return;
  }
  if(tag===156){
   if(!fileSearch||!nextGlobals)throw Error('Expression156 requires an explicit DOS FindFirst service');
   si++;const result=probeOriginalDosFile(nextGlobals,fileSearch);dx=result.dx;cx=result.cx;return;
  }
  if([0,2,6,8,30,32].includes(tag)){if(si+(tag===0?2:3)>sourceLength)throw Error('Expression operand is truncated');const next=readOriginalDosNumericOperand(script,context,si,bp,nextGlobals);si=next.si;dx=next.value;return;}
  if(tag===4||tag===10||tag===34){
   if(nextGlobals?.length!==65536)throw Error('String expression requires the original global segment');
   const word=(at:number)=>nextGlobals[at]|(nextGlobals[at+1]<<8);
   si++;let source=si;
   if(tag!==4){
    if(si+2>sourceLength)throw Error('Context string offset is truncated');
    source=((tag===34?word(0xbf6):bp)+(script[si]|(script[si+1]<<8)))&65535;si+=2;
   }
   let destination=word(0xc58);
   while(true){
    if(source>=(tag===4?sourceLength:65536)||destination>=65536)throw Error('String expression crosses host source/buffer window');
    const value=(tag===4?script:context)[source++];nextGlobals[destination++]=value;if(value===0)break;
   }
   if(tag===4)si=source;
   return;
  }
  if(tag===56){
   si++;if(si>=65536)throw Error('Expression crosses host source window');
   while(true){
    if(si>=sourceLength)throw Error('Expression terminator is truncated');
    if(script[si]===58){si=(si+1)&65535;return;}
    operand(false,depth+1);if(si===0)throw Error('Expression crosses host source window');
   }
  }
  if([74,76,78,80,82,84].includes(tag)){
   si++;if(si>=65536)throw Error('Expression crosses host source window');operand(true,depth+1);
   const a=signed(cx),b=signed(dx),yes=tag===74?dx===cx:tag===76?dx!==cx:tag===78?a<=b:tag===80?a>=b:tag===82?a<b:a>b;
   dx=yes?65535:0;return;
  }
  throw Error(`Native expression tag ${tag} is not reconstructed here`);
 }
 operand(true,0);return {si,dx,cx,tokens,globals:nextGlobals};
}

/** Existing disjoint-segment API; inputs remain immutable. */
export function evaluateOriginalDosScriptExpression(script:Uint8Array,context:Uint8Array,si:number,bp:number,initialDx:number,sourceLength=65536,globals?:Uint8Array,fileSearch?:OriginalDosFileSearch,input?:{keyByte?:number;shiftFlags?:number;memoryQuery?:(selector:number)=>number;driveQuery?:(selector:number)=>number}){
 const result=evaluateExpressionCore(script,context,si,bp,initialDx,sourceLength,globals,fileSearch,input);
 return {...result,globals:result.globals?.slice()};
}
/** Opcode31 expression with shared physical views, on a private transaction.
 * Writes to operand stack/string buffers are immediately visible to aliased
 * context/script reads; errors never mutate the caller image.
 */
export function evaluateOriginalDosPhysicalExpression(source:Uint8Array,ss:number,input:{ds:number;es:number;si:number;bp:number;dx:number},external?:{keyByte?:number;shiftFlags?:number;memoryQuery?:(selector:number)=>number;driveQuery?:(selector:number)=>number;driveServices?:OriginalDosDriveServices;engineSegment?:number},fileSearch?:OriginalDosFileSearch){
 if(source.length!==0x100000||![ss,...Object.values(input)].every(x=>Number.isInteger(x)&&x>=0&&x<=65535)||[ss,input.ds,input.es].some(s=>s*16+65536>source.length))throw Error('Invalid physical expression state');
 const events:Array<{kind:string;port:number;value:number}>=[];const memory=source.slice(),view=(segment:number)=>memory.subarray(segment*16,segment*16+65536);
 const result=evaluateExpressionCore(view(input.ds),view(input.es),input.si,input.bp,input.dx,65536,view(ss),fileSearch,{...external,memoryQuery:selector=>queryOriginalDosMemoryValue(view(ss),selector,memory),driveQuery:selector=>{const next=queryOriginalDosDrive(memory,external?.engineSegment??0x1000,selector,external?.driveServices);memory.set(next.memory);events.push(...next.events);return next.dx;}},true);
 return {memory,si:result.si,dx:result.dx,cx:result.cx,tokens:result.tokens,events};
}
