import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** CALL43FB through4723/4535, stopping BEFORE graphics far calls/banking/present.
 * Entry is4168/40D1 (caller has not pushed CALL43FB yet). No device stubs.
 */
export function prepareOriginalDosPixelBatch(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,inputBx:number,inputDi:number,callerEntry=0x4168){
 if(source.length!==0x100000||![ss,inputBx,inputDi,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||![0x4168,0x40d1].includes(callerEntry))throw Error('Invalid pixel batch inputs');
 const memory=source.slice(),u=(v:number)=>v&65535,s=(v:number)=>v&32768?v-65536:v;
 const address=(segment:number,o:number,wide=false)=>{o=u(o);const at=segment*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Pixel batch access outside bounded real-mode window');return at;};
 const b=(segment:number,o:number,value?:number)=>{const at=address(segment,o);if(value!==undefined)memory[at]=value&255;return memory[at];};
 const w=(segment:number,o:number,value?:number)=>{const at=address(segment,o,true);if(value!==undefined){memory[at]=value&255;memory[at+1]=(value>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 const g=(at:number,value?:number)=>w(ss,at,value),registers={...input};let bx=g(0xb32),es=g(0xb34),di=inputDi,visited=0;
 const result=(phase:string,entry:number,stackDelta:number)=>({memory,registers:phase==='return'?{...input}:{...registers,es},phase,entry:phase==='return'?callerEntry+3:entry,stackDelta,bx:phase==='return'?inputBx:bx,di:phase==='return'?inputDi:di,visited});
 if(b(es,bx)&64)return result('return',0x416b,0);
 b(ss,0xc3f,0);
 //4723 retains BX/CX/DI/SI/ES, but clobbers DX before the later saved frame restores it.
 if(b(ss,0xc18)===0){
  if(s(w(input.ds,u(di+16)))<0)return result('return',0x416b,0);
  let offset=w(input.ds,u(di+8));const segment=w(input.ds,u(di+10));let high=w(segment,u(offset+2)),sum=offset+w(segment,offset);if(sum>65535)high=u(high+1);offset=u(sum);
  const imageSegment=u(segment+u(((high&255)<<8|(high>>>8))<<4)+(offset>>>4)),imageOffset=offset&15;
  const x=w(input.ds,u(di+12)),y=w(input.ds,u(di+14));g(0xc2c,x);g(0xc2e,y);const right=u(x+w(imageSegment,u(imageOffset+2))),bottom=u(y+w(imageSegment,u(imageOffset+4)));g(0xc30,right);g(0xc32,bottom);
 }
 const owner=input.cx,ds=input.ds;
 if(s(g(0xc2c))>s(w(ds,u(owner+22))))return result('return',0x416b,0);
 registers.dx=w(ds,u(owner+24));
 if(s(g(0xc2e))>s(registers.dx)||s(g(0xc30))<s(w(ds,u(owner+12)))||s(g(0xc32))<s(w(ds,u(owner+14))))return result('return',0x416b,0);
 let value=g(0xc2c)&0xfff0;g(0xc1a,value);if(s(value)<s(w(ds,u(owner+12))))g(0xc1a,w(ds,u(owner+12)));
 value=g(0xc2e);g(0xc1c,value);if(s(value)<s(w(ds,u(owner+14))))g(0xc1c,w(ds,u(owner+14)));
 value=g(0xc30)|15;g(0xc1e,value);if(s(value)>s(w(ds,u(owner+22))))g(0xc1e,w(ds,u(owner+22)));
 value=g(0xc32);g(0xc20,value);if(s(value)>s(w(ds,u(owner+24))))g(0xc20,w(ds,u(owner+24)));
 g(0xc22,u(g(0xc1e)-g(0xc1a)+1)>>>3);g(0xc24,0);g(0xc26,g(0x1dfb));
 const seen=new Set<number>();let link=g(0xc16);registers.cx=link;
 while(link!==0){
  if(seen.has(link))throw Error('Pixel batch active-object cycle');seen.add(link);visited++;bx=u(g(0xbf6)+link);registers.cx=link;
  if((b(es,bx)&64)===0){
   di=w(es,u(bx+2));
   if(di!==0){
    b(ss,0xc3e,0);value=w(ds,u(di+12));g(0xb12,value);
    let intersects=s(value)<=s(g(0xc1e));
    if(intersects){value=w(ds,u(di+14));g(0xb14,value);intersects=s(value)<=s(g(0xc20));}
    if(intersects){value=w(ds,u(di+22));g(0xb16,value);intersects=s(value)>=s(g(0xc1a));}
    if(intersects){value=w(ds,u(di+24));g(0xb18,value);intersects=s(value)>=s(g(0xc1c));}
    if(intersects){
     const lower=(value:number,limit:number)=>s(value)<s(limit)?limit:value,upper=(value:number,limit:number)=>s(value)>s(limit)?limit:value;
     g(0xc40,lower(g(0xb12),g(0xc1a)));g(0xc42,lower(g(0xb14),g(0xc1c)));g(0xc44,upper(g(0xb16),g(0xc1e)));registers.dx=upper(g(0xb18),g(0xc20));g(0xc46,registers.dx);b(ss,0xc3e,1);
     if((b(es,u(bx+1))&64)===0){
      const bank=b(ss,0x2898)===0&&b(ss,0x2896)!==0&&b(ss,0xcb1)<128;
      return result(bank?'clear-bank':'clear',bank?0x42e9:0x42db,-22);
     }
     const records=new Set<number>();
     while(true){
      di=w(ds,u(di+6));if(di===0)break;if(records.has(di))throw Error('Pixel batch record cycle');records.add(di);
      if(b(ds,di)>=128||b(ds,u(di+34))>=128||s(w(ds,u(di+16)))<0)continue;
      const bank=b(ss,0x2898)===0&&b(ss,0x2896)!==0&&b(ss,0xcb1)<128;
      return result(bank?'record-bank':'record',bank?0x4313:0x4305,-32);
     }
    }
   }
  }
  link=w(es,u(bx+4));registers.cx=link;
 }
 if(b(ss,0xcb0)!==0)return result('special-record',0x44ab,-20);
 const rootSegment=g(0xb34),root=g(0xb32);
 if(b(rootSegment,u(root+1))&32)return result('return',0x416b,0);
 return result('present',0x431f,-22);
}
