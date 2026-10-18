import {queryOriginalDosModeValue} from './original-dos-script-expression.ts';
import {applyOriginalDosNumericBinary} from './original-dos-numeric-binary.ts';
/** Opcode30 string operands4/10/34, results10/34 (69D0/69F4/7168/724C),
 * numeric results6/8/18/20 and indexed14/16, including739A,
 * 7150 and6C2E/6C5B.
 * Explicit bounded operand subset; unsupported expressions throw without changing
 * input. DF0, shared physical memory; flags/CPU stack saves are not outputs.
 */
export function assignOriginalDosIndexedValue(source:Uint8Array,ss:number,registers:{ds:number;es:number;si:number;bp:number;dx:number}){
 if(source.length!==0x100000||![ss,...Object.values(registers)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Expected1MiB memory and word registers');
 const memory=source.slice(),u=(n:number)=>n&65535;
 const addr=(s:number,o:number,wide=false)=>{o=u(o);const at=s*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Indexed assignment outside bounded real-mode window');return at;};
 const b=(s:number,o:number,v?:number)=>{const at=addr(s,o);if(v!==undefined)memory[at]=v&255;return memory[at];};
 const w=(s:number,o:number,v?:number)=>{const at=addr(s,o,true);if(v!==undefined){memory[at]=v&255;memory[at+1]=(v>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 const {ds,es,bp}=registers;let si=registers.si,dx=registers.dx,cx=dx,bx=0x277c,tokens=0;
 const nextByte=()=>{const value=b(ds,si);si=u(si+1);return value;};
 const nextWord=()=>{const value=w(ds,si);si=u(si+2);return value;};
 function operand(depth:number):void{
  if(++tokens>4096||depth>128)throw Error('Indexed expression exceeds host bound');
  const tag=nextByte();
  if([66,68,70,72,86,88,90,92,94].includes(tag)){cx=dx;operand(depth+1);const result=applyOriginalDosNumericBinary(tag,cx,dx);cx=result.cx;dx=result.dx;}
  else if(tag===4||tag===10||tag===34){
   let source=si,segment=ds;
   if(tag!==4){source=u((tag===34?w(ss,0xbf6):bp)+nextWord());segment=es;}
   let destination=w(ss,0xc58),terminated=false;
   for(let n=0;n<65536;n++){
    const value=b(segment,source);source=u(source+1);b(ss,destination,value);destination=u(destination+1);
    if(value===0){terminated=true;break;}
   }
   if(!terminated)throw Error('String operand exceeds host traversal bound');
   if(tag===4)si=source;
  }
  else if(tag===0){const value=nextByte();dx=value&128?value|0xff00:value;}
  else if(tag===2)dx=nextWord();
  else if([6,8,30,32].includes(tag)){const offset=nextWord(),base=tag>=30?w(ss,0xbf6):bp;dx=tag===6||tag===30?b(es,base+offset):w(es,base+offset);if((tag===6||tag===30)&&(dx&128))dx|=0xff00;}
  else if(tag===64){bx=u(bx-2);w(ss,bx,dx);}
  else if(tag===54){dx=cx;cx=w(ss,bx);bx=u(bx+2);}
  else if(tag===120)dx=queryOriginalDosModeValue(w(ss,0x2894));
  else if(tag===168)dx=w(ss,0xc9d);
  else if(tag===56){while(b(ds,si)!==58)operand(depth+1);si=u(si+1);}
  else throw Error(`Indexed expression tag${tag} is not reconstructed`);
 }
 operand(0);
 const first=w(ss,0xc58);w(ss,0xc58,w(ss,0xc5c));w(ss,0xc5c,first);bx=0x277c;
 let result=nextByte();
 if(result===10||result===34){
  let destination=u((result===34?w(ss,0xbf6):bp)+nextWord()),source=w(ss,0xc5c),terminated=false;
  for(let n=0;n<65536;n++){
   const value=b(ss,source);source=u(source+1);b(es,destination,value);destination=u(destination+1);
   if(value===0){terminated=true;break;}
  }
  if(!terminated)throw Error('String result exceeds host traversal bound');
  return {memory,registers:{...registers,si,dx,cx,bx,di:result,ax:ss&0xff00},tag:result,tokens};
 }
 if(result===56){bx=u(bx-2);w(ss,bx,dx);while(b(ds,si)!==58)operand(0);si=u(si+1);result=nextByte();}
 if([6,8,18,20].includes(result)){
  const ax=result>=18?nextByte():nextWord(),di=ax;
  if(result===6||result===18)b(es,bp+di,dx);else w(es,bp+di,dx);
  return {memory,registers:{...registers,si,dx,cx,bx,di,ax},tag:result,tokens};
 }
 if(result!==14&&result!==16)throw Error(`Indexed result tag${result} is not reconstructed`);
 let ax=nextWord(),di=u(bp+ax-2);const count=b(es,bp+ax-1);
 if(result===16)dx=u(dx*2);ax=u(ax+dx);
 if(count!==0){
  w(ss,0xb0a,ax);
  for(let n=0;n<count;n++){ax=w(ss,bx);bx=u(bx+2);di=u(di-2);const product=ax*w(es,di);ax=u(product);dx=Math.floor(product/65536);w(ss,0xb0a,u(w(ss,0xb0a)+ax));}
  ax=w(ss,0xb0a);
 }
 di=ax;dx=w(ss,bx);bx=u(bx+2);
 if(result===14)b(es,bp+di,dx);else w(es,bp+di,dx);
 return {memory,registers:{...registers,si,dx,cx,bx,di,ax},tag:result,tokens};
}
